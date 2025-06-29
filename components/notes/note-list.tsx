"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotes } from '@/hooks/use-notes';
import { Note } from '@/lib/types';
import { NoteCard } from './note-card';
import { NoteFilterBar } from './note-filter-bar';
import { useNoteFilters } from '@/hooks/use-note-filters';

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
  const { notebooks } = useNotes();
  const { filteredNotes, totalFilteredCount } = useNoteFilters();

  // Apply additional filters based on sidebar selection
  const displayNotes = filteredNotes.filter(note => {
    // Filter by notebook only if a specific notebook is selected AND we're viewing 'all' notes for that notebook
    if (selectedNotebook && selectedFilter !== 'archived' && note.notebookId !== selectedNotebook) {
      return false;
    }

    // Filter by type
    if (selectedFilter === 'favorites' && !note.isFavorite) {
      return false;
    }
    if (selectedFilter === 'archived') {
      // For archived filter, only show archived notes
      return note.isArchived;
    }
    // For all other filters, exclude archived notes
    if (note.isArchived) {
      return false;
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
            <div className="flex items-center gap-2">
              {selectedNotebook
                ? getNotebookName(selectedNotebook)
                : selectedFilter === 'favorites'
                  ? 'Favorites'
                  : selectedFilter === 'archived'
                    ? 'Archived'
                    : 'All Notes'
              }
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                {displayNotes.length}
              </Badge>
            </div>
          </h2>
          <Button size="sm" onClick={onCreateNote} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <NoteFilterBar />

      <ScrollArea className="flex-1 tuna-scrollbar">
        <AnimatePresence>
          {displayNotes.length === 0 ? (
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
                  {totalFilteredCount === 0
                    ? 'Try adjusting your filters'
                    : 'Create your first note to get started'
                  }
                </p>
              </div>
              {totalFilteredCount === 0 && (
                <Button onClick={onCreateNote} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {displayNotes.map((note, index) => (
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