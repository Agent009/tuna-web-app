"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotes } from '@/hooks/use-notes';
import { Note } from '@/lib/types';
import { NoteCard } from './note-card';
import { SearchEngine } from '@/lib/search';

interface NoteListProps {
  selectedNotebook: string | null;
  selectedFilter: string;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  selectedNoteId: string | null;
}

export function NoteList({ 
  selectedNotebook, 
  selectedFilter, 
  onSelectNote, 
  onCreateNote,
  selectedNoteId 
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { notes, notebooks } = useNotes();

  const filteredNotes = notes.filter(note => {
    // Filter by notebook only if a specific notebook is selected AND we're viewing 'all' notes for that notebook
    if (selectedNotebook && note.notebookId !== selectedNotebook) {
      return false;
    }

    // Filter by type
    if (selectedFilter === 'favorites' && !note.isFavorite) {
      return false;
    }
    if (selectedFilter === 'archived' && !note.isArchived) {
      return false;
    }
    // For 'all' filter, always exclude archived notes
    if (selectedFilter === 'all' && note.isArchived) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const searchEngine = new SearchEngine([note]);
      const results = searchEngine.search(searchQuery);
      return results.length > 0;
    }

    return true;
  });

  const getNotebookName = (notebookId: string) => {
    return notebooks.find(nb => nb.id === notebookId)?.name || 'Unknown';
  };

  return (
    <div className="w-80 tuna-sidebar flex flex-col">
      <div className="p-4 border-b tuna-header bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">
            {selectedNotebook 
              ? getNotebookName(selectedNotebook)
              : selectedFilter === 'favorites' 
                ? 'Favorites' 
                : selectedFilter === 'archived'
                  ? 'Archived'
                  : 'All Notes'
            }
          </h2>
          <Button size="sm" onClick={onCreateNote} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-input text-foreground border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 tuna-scrollbar">
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center text-muted-foreground"
            >
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Search className="h-8 w-8" />
                </div>
                <p className="font-medium">No notes found</p>
                <p className="text-sm mt-1">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first note to get started'
                  }
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={onCreateNote} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NoteCard
                    note={note}
                    notebookName={getNotebookName(note.notebookId)}
                    isSelected={selectedNoteId === note.id}
                    onClick={() => onSelectNote(note)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}