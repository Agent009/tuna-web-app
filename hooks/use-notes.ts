"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db';
import { Note, Notebook } from '@/lib/types';
import { toast } from 'sonner';

export function useNotes() {
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.notes.orderBy('updatedAt').reverse().toArray();
    },
    enabled: isClient
  });

  const notebooksQuery = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const db = await getDb();
      if (!db) return [];
      const notebooks = await db.notebooks.toArray();
      
      // Update note counts for each notebook
      const notesCount = await db.notes.toArray();
      return notebooks.map((notebook: Notebook) => ({
        ...notebook,
        noteCount: notesCount.filter((note: Note) => note.notebookId === notebook.id && !note.isArchived).length
      }));
    },
    enabled: isClient
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const newNote: Note = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.notes.add(newNote);
      return newNote;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      // Don't show toast for note creation to avoid noise
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.notes.update(id, { ...updates, updatedAt: new Date() });
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      // Only invalidate tasks if content was actually updated
      if (updates.content) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
    onError: () => {
      toast.error('Failed to update note');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.notes.delete(noteId);
      return noteId;
    },
    onSuccess: (deletedNoteId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Note deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete note');
    }
  });

  const createNotebookMutation = useMutation({
    mutationFn: async (notebook: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'noteCount'>) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const newNotebook: Notebook = {
        ...notebook,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        noteCount: 0
      };
      await db.notebooks.add(newNotebook);
      return newNotebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Notebook created successfully');
    },
    onError: () => {
      toast.error('Failed to create notebook');
    }
  });

  const updateNotebookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Notebook> }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.notebooks.update(id, { ...updates, updatedAt: new Date() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Notebook updated successfully');
    },
    onError: () => {
      toast.error('Failed to update notebook');
    }
  });

  const duplicateNotebookMutation = useMutation({
    mutationFn: async (notebookId: string) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const originalNotebook = await db.notebooks.get(notebookId);
      if (!originalNotebook) throw new Error('Notebook not found');
      
      const newNotebook: Notebook = {
        ...originalNotebook,
        id: crypto.randomUUID(),
        name: `${originalNotebook.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        noteCount: 0
      };
      
      await db.notebooks.add(newNotebook);
      return newNotebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Notebook duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate notebook');
    }
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: async (notebookId: string) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // First, delete all notes in this notebook
      const notesToDelete = await db.notes.where('notebookId').equals(notebookId).toArray();
      await db.notes.where('notebookId').equals(notebookId).delete();
      
      // Then delete the notebook
      await db.notebooks.delete(notebookId);
      
      return { notebookId, deletedNotesCount: notesToDelete.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success(`Notebook and ${result.deletedNotesCount} notes deleted successfully`);
    },
    onError: () => {
      toast.error('Failed to delete notebook');
    }
  });

  return {
    notes: notesQuery.data || [],
    notebooks: notebooksQuery.data || [],
    isLoading: notesQuery.isLoading || notebooksQuery.isLoading,
    createNote: createNoteMutation.mutate,
    createNoteAsync: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    createNotebook: createNotebookMutation.mutate,
    updateNotebook: updateNotebookMutation.mutate,
    duplicateNotebook: duplicateNotebookMutation.mutate,
    deleteNotebook: deleteNotebookMutation.mutate,
    isCreatingNote: createNoteMutation.isPending,
    isUpdatingNote: updateNoteMutation.isPending,
    isUpdatingNotebook: updateNotebookMutation.isPending,
    isDuplicatingNotebook: duplicateNotebookMutation.isPending,
    isDeletingNotebook: deleteNotebookMutation.isPending,
    // Computed counts for sidebar
    totalNotesCount: notesQuery.data?.filter((note: Note) => !note.isArchived).length || 0,
    favoritesCount: notesQuery.data?.filter((note: Note) => note.isFavorite && !note.isArchived).length || 0,
    archivedCount: notesQuery.data?.filter((note: Note) => note.isArchived).length || 0,
    // Debug info
    allNotes: notesQuery.data || []
  };
}