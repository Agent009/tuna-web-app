"use client";

import { TriangleAlert as AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNotes } from '@/hooks/use-notes';
import { Notebook, Note } from '@/lib/types';

interface DeleteNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook | null;
}

export function DeleteNotebookDialog({ open, onOpenChange, notebook }: DeleteNotebookDialogProps) {
  const { deleteNotebook, notes } = useNotes();

  const handleDelete = () => {
    if (!notebook) return;
    
    deleteNotebook(notebook.id);
    onOpenChange(false);
  };

  const notesInNotebook = notes.filter((note: Note) => note.notebookId === notebook?.id && !note.isArchived).length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Notebook
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete "{notebook?.name}"? This action cannot be undone.
            </p>
            {notesInNotebook > 0 && (
              <p className="font-medium text-destructive">
                This will also permanently delete {notesInNotebook} note{notesInNotebook === 1 ? '' : 's'} in this notebook.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Notebook
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}