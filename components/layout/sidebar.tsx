"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Star, 
  Archive, 
  CheckSquare,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useNotes } from '@/hooks/use-notes';
import { useTasks } from '@/hooks/use-tasks';
import { NotebookItem } from './notebook-item';
import { CreateNotebookDialog } from './create-notebook-dialog';
import { EditNotebookDialog } from './edit-notebook-dialog';
import { DeleteNotebookDialog } from './delete-notebook-dialog';
import { SearchBar } from '../search/search-bar';
import { Note, Notebook } from '@/lib/types';

interface SidebarProps {
  onSelectNotebook: (notebookId: string) => void;
  onSelectFilter: (filter: 'all' | 'favorites' | 'archived') => void;
  onSearch: (query: string) => void;
  onSelectNote: (note: Note) => void;
  selectedNotebook: string | null;
  selectedFilter: string;
  selectedNoteId: string | null;
}

export function Sidebar({ 
  onSelectNotebook, 
  onSelectFilter, 
  onSearch,
  onSelectNote,
  selectedNotebook,
  selectedFilter,
  selectedNoteId
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dialogSelectedNotebook, setDialogSelectedNotebook] = useState<Notebook | null>(null);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());
  const [newNoteInputs, setNewNoteInputs] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [creatingNote, setCreatingNote] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { notebooks, notes, totalNotesCount, favoritesCount, archivedCount, createNoteAsync } = useNotes();
  const { pendingTasksCount, totalTasksCount } = useTasks();

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-expand notebooks that have notes on initial load
  useEffect(() => {
    const notebooksWithNotes = notebooks.filter(nb => 
      notes.some(note => note.notebookId === nb.id && !note.isArchived)
    );
    if (notebooksWithNotes.length > 0) {
      setExpandedNotebooks(new Set(notebooksWithNotes.map(nb => nb.id)));
    }
  }, [notebooks, notes]);

  const menuItems = [
    { id: 'all', label: 'All Notes', icon: BookOpen, filter: 'all' as const, count: totalNotesCount },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, filter: 'tasks' as const, count: pendingTasksCount, totalCount: totalTasksCount },
    { id: 'favorites', label: 'Favorites', icon: Star, filter: 'favorites' as const, count: favoritesCount },
    { id: 'archived', label: 'Archived', icon: Archive, filter: 'archived' as const, count: archivedCount },
  ];

  const toggleNotebookExpansion = (notebookId: string) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
      // Clear input when collapsing
      setNewNoteInputs(prev => ({ ...prev, [notebookId]: '' }));
      setFocusedInput(null);
    } else {
      newExpanded.add(notebookId);
      // Focus input when expanding
      setTimeout(() => {
        setFocusedInput(notebookId);
      }, 100);
    }
    setExpandedNotebooks(newExpanded);

    // Select the notebook when expanding to update the note list
    if (newExpanded.has(notebookId)) {
      onSelectNotebook(notebookId);
    }
  };

  const handleCreateNoteInNotebook = async (notebookId: string) => {
    if (typeof notebookId === 'object') {
      // Handle case where notebook object is passed instead of ID
      notebookId = notebookId.id;
    }

    setCreatingNote(notebookId);
    try {
      const newNoteData = {
        title: '',
        content: [{
          id: crypto.randomUUID(),
          type: 'paragraph',
          content: '',
          properties: {},
          children: []
        }],
        notebookId,
        tags: [],
        isFavorite: false,
        isArchived: false
      };

      const newNote = await createNoteAsync(newNoteData);
      onSelectNote(newNote);
      onSelectNotebook(notebookId);

      // Focus the editor after note creation
      setTimeout(() => {
        const firstBlock = document.querySelector('[data-block-id] [contenteditable]') as HTMLElement;
        if (firstBlock) {
          firstBlock.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setCreatingNote(null);
    }
  };

  const handleNewNoteInputChange = (notebookId: string, value: string) => {
    if (value.length <= 100) {
      setNewNoteInputs(prev => ({ ...prev, [notebookId]: value }));
    }
  };

  const handleNewNoteSubmit = async (notebookId: string) => {
    const title = newNoteInputs[notebookId]?.trim();
    if (!title) return;

    setCreatingNote(notebookId);
    try {
      const newNoteData = {
        title,
        content: [{
          id: crypto.randomUUID(),
          type: 'paragraph',
          content: '',
          properties: {},
          children: []
        }],
        notebookId,
        tags: [],
        isFavorite: false,
        isArchived: false
      };

      const newNote = await createNoteAsync(newNoteData);

      // Clear input and navigate to new note
      setNewNoteInputs(prev => ({ ...prev, [notebookId]: '' }));
      setFocusedInput(null);
      onSelectNote(newNote);
      onSelectNotebook(notebookId);

      // Focus the editor after note creation
      setTimeout(() => {
        const firstBlock = document.querySelector('[data-block-id] [contenteditable]') as HTMLElement;
        if (firstBlock) {
          firstBlock.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setCreatingNote(null);
    }
  };

  const handleNewNoteKeyDown = (e: React.KeyboardEvent, notebookId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewNoteSubmit(notebookId);
    } else if (e.key === 'Escape') {
      setNewNoteInputs(prev => ({ ...prev, [notebookId]: '' }));
      setFocusedInput(null);
    }
  };
  const handleEditNotebook = (notebook: Notebook) => {
    setDialogSelectedNotebook(notebook);
    setShowEditDialog(true);
  };

  const handleDeleteNotebook = (notebook: Notebook) => {
    setDialogSelectedNotebook(notebook);
    setShowDeleteDialog(true);
  };

  const getNotesForNotebook = (notebookId: string) => {
    return notes.filter(note => note.notebookId === notebookId && !note.isArchived);
  };

  const formatNoteTitle = (note: Note) => {
    return note.title.trim() || 'Untitled';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 320 }}
        className="flex flex-col tuna-sidebar"
      >
        <div className="flex items-center justify-between p-4 tuna-header bg-card">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold text-primary"
              >
                TUNA
              </motion.h1>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted/10"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 tuna-scrollbar">
          <div className="space-y-2 py-4">
            {!isCollapsed && (
              <SearchBar
                onSearch={onSearch}
                onSelectNote={onSelectNote}
                onSelectNotebook={onSelectNotebook}
                className="mb-4"
              />
            )}

            <Separator className="my-4" />

            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-between text-foreground ${
                  selectedFilter === item.filter 
                    ? 'bg-primary hover:bg-accent/90' 
                    : 'hover:bg-muted/10'
                }`}
                onClick={() => onSelectFilter(item.filter)}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">{item.label}</span>}
                </div>
                {!isCollapsed && (
                  (item.id === 'archived' && item.count > 0) ||
                  (item.id === 'tasks' && 'totalCount' in item && item.totalCount > 0) ||
                  (item.id !== 'archived' && item.id !== 'tasks' && item.count > 0)
                ) && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedFilter === item.filter
                      ? 'bg-accent/70 text-foreground'
                      : 'bg-muted/20 text-muted-foreground'
                  }`}>
                    {item.id === 'tasks' && 'totalCount' in item 
                      ? `${item.count}/${item.totalCount}`
                      : item.count
                    }
                  </span>
                )}
              </Button>
            ))}

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              {!isCollapsed && <span className="text-sm font-medium text-foreground">Notebooks</span>}
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted/10"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1 pb-4">
              {notebooks.map((notebook) => {
                const notebookNotes = getNotesForNotebook(notebook.id);
                const isExpanded = expandedNotebooks.has(notebook.id);
                
                return (
                  <div key={notebook.id} className="space-y-1">
                    <div className="flex items-center">
                      {!isCollapsed && notebookNotes.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mr-1"
                          onClick={() => toggleNotebookExpansion(notebook.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <NotebookItem
                              notebook={notebook}
                              isSelected={selectedNotebook === notebook.id}
                              isCollapsed={isCollapsed}
                              onClick={() => onSelectNotebook(notebook.id)}
                              onEdit={handleEditNotebook}
                              onDelete={handleDeleteNotebook}
                              noteCount={notebookNotes.length}
                              onCreateNote={handleCreateNoteInNotebook}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!isCollapsed && isExpanded && notebookNotes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 space-y-1"
                      >
                        {notebookNotes.slice(0, 10).map((note) => (
                          <motion.div
                            key={note.id}
                            whileHover={{ x: 2 }}
                            className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition-colors text-sm ${
                              selectedNoteId === note.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/10 text-foreground'
                            }`}
                            onClick={() => onSelectNote(note)}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-inherit">
                                  {formatNoteTitle(note)}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {note.isFavorite && (
                                    <Star className="h-2.5 w-2.5 text-yellow-500 fill-current" />
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(note.updatedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {notebookNotes.length > 10 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            +{notebookNotes.length - 10} more notes
                          </div>
                        )}
                        
                        {/* New note input */}
                        <div className="ml-6 mt-1">
                          <Input
                            value={newNoteInputs[notebook.id] || ''}
                            onChange={(e) => handleNewNoteInputChange(notebook.id, e.target.value)}
                            onKeyDown={(e) => handleNewNoteKeyDown(e, notebook.id)}
                            placeholder="New note"
                            className="h-7 text-xs border-dashed bg-input text-foreground border-border"
                            disabled={creatingNote === notebook.id}
                            autoFocus={focusedInput === notebook.id}
                            maxLength={100}
                          />
                          {creatingNote === notebook.id && (
                            <div className="text-xs text-muted-foreground mt-1 px-2">
                              Creating note...
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {notebooks.length === 0 && !isCollapsed && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No notebooks yet</p>
                <p className="text-xs mt-1 text-muted-foreground">Create your first notebook to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t tuna-header bg-card">
          <div className="flex items-center justify-between">
            {mounted ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted/10"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {!isCollapsed && <span className="ml-2">Theme</span>}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                <Moon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2 text-muted-foreground">Theme</span>}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted/10">
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2 text-foreground">Settings</span>}
            </Button>
          </div>
        </div>
      </motion.div>

      <CreateNotebookDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditNotebookDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        notebook={dialogSelectedNotebook}
      />

      <DeleteNotebookDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        notebook={dialogSelectedNotebook}
      />
    </>
  );
}