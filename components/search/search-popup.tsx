"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotes } from '@/hooks/use-notes';
import { SearchEngine } from '@/lib/search';
import { Note, Notebook } from '@/lib/types';

interface SearchPopupProps {
  query: string;
  onSelectNote: (noteId: string) => void;
  onSelectNotebook: (notebookId: string) => void;
  onViewAllResults: () => void;
}

export function SearchPopup({ query, onSelectNote, onSelectNotebook, onViewAllResults }: SearchPopupProps) {
  const { notes, notebooks } = useNotes();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { notebooks: [], notes: [], content: [] };

    // Search notebooks
    const matchingNotebooks = notebooks.filter((notebook: Notebook) =>
      notebook.name.toLowerCase().includes(query.toLowerCase()) ||
      notebook.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    // Search notes by title
    const matchingNotesByTitle = notes.filter((note: Note) =>
      note.title.toLowerCase().includes(query.toLowerCase()) && !note.isArchived
    ).slice(0, 5);

    // Search notes by content
    const searchEngine = new SearchEngine(notes.filter((note: Note) => !note.isArchived));
    const contentResults = searchEngine.search(query).slice(0, 5);

    return {
      notebooks: matchingNotebooks,
      notes: matchingNotesByTitle,
      content: contentResults
    };
  }, [query, notes, notebooks]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getNotebookName = (notebookId: string) => {
    return notebooks.find((nb: Notebook) => nb.id === notebookId)?.name || 'Unknown';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const totalResults = searchResults.notebooks.length + searchResults.notes.length + searchResults.content.length;

  if (totalResults === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg p-4 z-50 tuna-card"
      >
        <div className="text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results found for &quot;{query}&quot;</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto tuna-card"
    >
      {/* Notebooks Section */}
      {searchResults.notebooks.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Notebooks</span>
          </div>
          <div className="space-y-1">
            {searchResults.notebooks.map((notebook: any) => (
              <motion.button
                key={notebook.id}
                whileHover={{ x: 2 }}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left transition-colors tuna-interactive"
                onClick={() => onSelectNotebook(notebook.id)}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: notebook.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {highlightText(notebook.name, query)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notebook.noteCount} notes
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Notes by Title Section */}
      {searchResults.notes.length > 0 && (
        <>
          {searchResults.notebooks.length > 0 && <Separator />}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Note Titles</span>
            </div>
            <div className="space-y-1">
              {searchResults.notes.map((note: Note) => (
                <motion.button
                  key={note.id}
                  whileHover={{ x: 2 }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left transition-colors tuna-interactive"
                  onClick={() => onSelectNote(note.id)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {highlightText(note.title || 'Untitled', query)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getNotebookName(note.notebookId)}</span>
                      <span>•</span>
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Content Search Section */}
      {searchResults.content.length > 0 && (
        <>
          {(searchResults.notebooks.length > 0 || searchResults.notes.length > 0) && <Separator />}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Note Contents</span>
            </div>
            <div className="space-y-1">
              {searchResults.content.map((result) => (
                <motion.button
                  key={result.id}
                  whileHover={{ x: 2 }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left transition-colors tuna-interactive"
                  onClick={() => onSelectNote(result.id)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText(result.content, query)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{getNotebookName(notes.find((n: Note) => n.id === result.id)?.notebookId || '')}</span>
                      <span>•</span>
                      <span>{formatDate(result.updatedAt)}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* View All Results Button */}
      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-between tuna-interactive"
          onClick={onViewAllResults}
        >
          <span className="text-sm">View all results for &quot;{query}&quot;</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}