"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TaskList } from './task-list';
import { TaskDialog } from './task-dialog';
import { Task } from '@/lib/types';
import { useNotes } from '@/hooks/use-notes';

export function TaskView() {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { notes, updateNote } = useNotes();

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleOpenNote = (noteId: string) => {
    // Find the note and trigger the parent component to open it
    const note = notes.find((n: Note) => n.id === noteId);
    if (note) {
      // Communicate to parent component to open the note and switch views
      window.dispatchEvent(new CustomEvent('openNote', { detail: { note } }));
    }
  };

  const handleCloseDialog = () => {
    setShowTaskDialog(false);
    setEditingTask(null);
  };

  // Get default note ID (Things to do)
  const getDefaultNoteId = () => {
    const thingsToDoNote = notes.find((note: Note) => note.title === 'Things to do');
    return thingsToDoNote?.id || notes[0]?.id || '';
  };

  return (
    <>
      <TaskList
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onOpenNote={handleOpenNote}
      />

      <TaskDialog
        open={showTaskDialog}
        onOpenChange={handleCloseDialog}
        task={editingTask}
        defaultNoteId={getDefaultNoteId()}
      />
    </>
  );
}