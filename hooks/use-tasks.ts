"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db';
import { Task, TaskFilters, TaskSortBy } from '@/lib/types';
import { toast } from 'sonner';

export function useTasks() {
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.tasks.orderBy('order').toArray();
    },
    enabled: isClient
  });

  // Computed task counts
  const totalTasksCount = tasksQuery.data?.length || 0;
  const pendingTasksCount = tasksQuery.data?.filter(task => !task.completed).length || 0;
  const completedTasksCount = tasksQuery.data?.filter(task => task.completed).length || 0;
  const flaggedTasksCount = tasksQuery.data?.filter(task => task.flagged).length || 0;
  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get the highest order number for the note
      const existingTasks = await db.tasks.where('noteId').equals(task.noteId).toArray();
      const maxOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map((t: Task) => t.order)) : 0;
      
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        order: maxOrder + 1
      };
      await db.tasks.add(newTask);
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Don't show toast for task creation to avoid noise
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.tasks.update(id, { ...updates, updatedAt: new Date() });
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Only invalidate notes if necessary to prevent circular updates
      if (updates.title || updates.description) {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get the task before deleting to find associated note blocks
      const taskToDelete = await db.tasks.get(taskId);
      if (!taskToDelete) throw new Error('Task not found');

      await db.tasks.delete(taskId);
      return { taskId, noteId: taskToDelete.noteId };
    },
    onSuccess: ({ taskId, noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Find and update the note to remove the task block
      const notes = queryClient.getQueryData(['notes']) as any[];
      if (notes) {
        const noteToUpdate = notes.find(note => note.id === noteId);
        if (noteToUpdate) {
          const updatedContent = noteToUpdate.content.filter((block: any) =>
            !(block.type === 'task' && block.properties?.taskId === taskId)
          );

          // Only update if content actually changed
          if (updatedContent.length !== noteToUpdate.content.length) {
            // Update the note in the database
            getDb().then(db => {
              if (db) {
                db.notes.update(noteId, {
                  content: updatedContent,
                  updatedAt: new Date()
                });
              }
            });

            // Update the query cache
            queryClient.setQueryData(['notes'], (oldNotes: any[]) =>
              oldNotes.map(note =>
                note.id === noteId
                  ? { ...note, content: updatedContent, updatedAt: new Date() }
                  : note
              )
            );
          }
        }
      }

      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    }
  });

  const bulkUpdateTasksMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; updates: Partial<Task> }>) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await Promise.all(
        updates.map(({ id, updates }) => 
          db.tasks.update(id, { ...updates, updatedAt: new Date() })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tasks updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tasks');
    }
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async (tasks: Task[]) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await Promise.all(
        tasks.map((task, index) => 
          db.tasks.update(task.id, { order: index + 1, updatedAt: new Date() })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast.error('Failed to reorder tasks');
    }
  });

  const filterTasks = (tasks: Task[], filters: TaskFilters) => {
    return tasks.filter(task => {
      if (filters.status === 'pending' && task.completed) return false;
      if (filters.status === 'completed' && !task.completed) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.flagged !== null && task.flagged !== filters.flagged) return false;
      if (filters.noteId && task.noteId !== filters.noteId) return false;
      return true;
    });
  };

  const sortTasks = (tasks: Task[], sortBy: TaskSortBy, ascending = true) => {
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = a.order - b.order;
      }
      
      return ascending ? comparison : -comparison;
    });
    
    return sorted;
  };

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    createTaskAsync: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    bulkUpdateTasks: bulkUpdateTasksMutation.mutate,
    reorderTasks: reorderTasksMutation.mutate,
    isCreatingTask: createTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
    isDeletingTask: deleteTaskMutation.isPending,
    filterTasks,
    sortTasks,
    // Computed counts
    totalTasksCount,
    pendingTasksCount,
    completedTasksCount,
    flaggedTasksCount
  };
}