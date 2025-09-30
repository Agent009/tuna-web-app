"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { NoteList } from '@/components/notes/note-list';
import { NoteEditor } from '@/components/editor/note-editor';
import { SearchResults } from '@/components/search/search-results';
import { TaskView } from '@/components/tasks/task-view';
import { useNotes } from '@/hooks/use-notes';
import { Note } from '@/lib/types';

export default function Home() {
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { createNoteAsync, notebooks } = useNotes();

  // Listen for note opening events from task view
  useEffect(() => {
    const handleOpenNote = (event: CustomEvent) => {
      const { note } = event.detail;
      setSelectedNote(note);
      // Don't change the filter if we're in tasks view - keep tasks visible
      if (selectedFilter !== 'tasks') {
        setSelectedFilter('all'); // Switch back to notes view
        setSelectedNotebook(note.notebookId); // Select the correct notebook
      }
    };

    window.addEventListener('openNote', handleOpenNote as EventListener);
    return () => {
      window.removeEventListener('openNote', handleOpenNote as EventListener);
    };
  }, [selectedFilter]);

  // Set default notebook on first load
  useEffect(() => {
    if (notebooks.length > 0 && !selectedNotebook) {
      setSelectedNotebook(notebooks[0].id);
    }
  }, [notebooks, selectedNotebook]);

  const handleCreateNote = () => {
    const notebookId = selectedNotebook || notebooks[0]?.id || 'default';
    
    const newNoteData = {
      title: '',
      content: [{
        id: crypto.randomUUID(),
        type: 'paragraph' as const,
        content: '',
        properties: {},
        children: []
      }],
      notebookId,
      tags: [],
      isFavorite: false,
      isArchived: false
    };

    // Create note and immediately select it
    createNoteAsync(newNoteData)
      .then((newNote) => {
        setSelectedNote(newNote);
        // Small delay to ensure the editor is ready
        setTimeout(() => {
          // Focus the first block in the editor
          const firstBlock = document.querySelector('[data-block-id] [contenteditable]') as HTMLElement;
          if (firstBlock) {
            firstBlock.focus();
          }
        }, 100);
      })
      .catch((error) => {
        console.error('Failed to create note:', error);
      });
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
  };

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter(filter);
    // Clear notebook selection when selecting a filter to show all notes  
    if (filter !== 'tasks') {
      setSelectedNotebook(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(true);
    // Clear other selections when searching
    setSelectedNotebook(null);
    setSelectedFilter('all');
  };

  const handleCloseSearch = () => {
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <div className="flex h-screen bg-background tuna-main-layout">
      <Sidebar
        onSelectNotebook={setSelectedNotebook}
        onSelectFilter={handleSelectFilter}
        onSearch={handleSearch}
        onSelectNote={handleSelectNote}
        selectedNotebook={selectedNotebook}
        selectedFilter={selectedFilter}
        selectedNoteId={selectedNote?.id || null}
      />
      
      {showSearchResults ? (
        <SearchResults
          query={searchQuery}
          onSelectNote={handleSelectNote}
          onClose={handleCloseSearch}
        />
      ) : selectedFilter === 'tasks' ? (
        <>
          <TaskView />
          <NoteEditor
            note={selectedNote}
            onClose={handleCloseEditor}
          />
        </>
      ) : (
        <>
          <NoteList
            selectedNotebook={selectedNotebook}
            selectedFilter={selectedFilter}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            selectedNoteId={selectedNote?.id || null}
          />
          <NoteEditor
            note={selectedNote}
            onClose={handleCloseEditor}
          />
        </>
      )
      }
    </div>
  );
}