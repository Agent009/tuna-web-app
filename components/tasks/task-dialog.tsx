"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, addHours } from 'date-fns';
import { SquareCheck as CheckSquare, Calendar, Clock, TriangleAlert as AlertTriangle, Flag, FileText, CalendarDays, Search, Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useTasks } from '@/hooks/use-tasks';
import { useNotes } from '@/hooks/use-notes';
import { Task, Note } from '@/lib/types';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  flagged: z.boolean(),
  noteId: z.string().min(1, 'Note selection is required'),
  dueDate: z.date().optional(),
  reminder: z.date().optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultNoteId?: string;
}

export function TaskDialog({ open, onOpenChange, task, defaultNoteId }: TaskDialogProps) {
  const [dueDateCalendarOpen, setDueDateCalendarOpen] = useState(false);
  const [reminderCalendarOpen, setReminderCalendarOpen] = useState(false);
  const [noteSelectOpen, setNoteSelectOpen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const { createTask, updateTask, createTaskAsync } = useTasks();
  const { notes, updateNote, notebooks } = useNotes();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      flagged: false,
      noteId: defaultNoteId || '',
      dueDate: undefined,
      reminder: undefined
    }
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        flagged: task.flagged,
        noteId: task.noteId,
        dueDate: task.dueDate,
        reminder: task.reminder
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        flagged: false,
        noteId: defaultNoteId || '',
        dueDate: undefined,
        reminder: undefined
      });
    }
  }, [task, defaultNoteId, form]);

  // Filter notes based on search query
  const filteredNotes = notes.filter((note: any) => {
    if (!noteSearchQuery.trim()) return true;
    
    const query = noteSearchQuery.toLowerCase();
    const noteTitle = (note.title || 'Untitled').toLowerCase();
    const notebook = notebooks.find((nb: any) => nb.id === note.notebookId);
    const notebookName = notebook?.name.toLowerCase() || '';
    
    return noteTitle.includes(query) || notebookName.includes(query);
  });

  // Get notebook for a note
  const getNotebookForNote = (noteId: string) => {
    const note = notes.find((n: any) => n.id === noteId);
    if (!note) return null;
    return notebooks.find((nb: any) => nb.id === note.notebookId) || null;
  };

  // Get selected note display value
  const getSelectedNoteDisplay = () => {
    const selectedNote = notes.find((n: any) => n.id === form.watch('noteId'));
    if (!selectedNote) return 'Select a note...';
    
    const notebook = getNotebookForNote(selectedNote.id);
    return selectedNote.title || 'Untitled';
  };
  const onSubmit = (data: TaskFormData) => {
    if (task) {
      updateTask({
        id: task.id,
        updates: data
      });
    } else {
      // Create the task and add it to the note
      const newTaskData = {
        ...data,
        completed: false
      };
      
      // Use async creation to get the task ID and then add block to note
      createTaskAsync(newTaskData)
        .then((createdTask) => {
          // Add task block to the selected note
          const selectedNote = notes.find((note: any) => note.id === data.noteId);
          if (selectedNote) {
            const taskBlock = {
              id: crypto.randomUUID(),
              type: 'task' as const,
              content: data.title,
              properties: {
                taskId: createdTask.id,
                completed: false,
                priority: data.priority,
                dueDate: data.dueDate?.toISOString(),
                flagged: data.flagged,
                description: data.description
              },
              children: []
            };
            
            updateNote({
              id: selectedNote.id,
              updates: {
                content: [...selectedNote.content, taskBlock]
              }
            });
          }
        })
        .catch((error) => {
          console.error('Failed to create task:', error);
        });
    }
    
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    setNoteSearchQuery('');
    onOpenChange(false);
  };

  const setQuickDueDate = (type: 'today' | 'tomorrow' | 'week') => {
    const today = new Date();
    let date: Date;
    
    switch (type) {
      case 'today':
        date = today;
        break;
      case 'tomorrow':
        date = addDays(today, 1);
        break;
      case 'week':
        date = addDays(today, 7);
        break;
    }
    
    form.setValue('dueDate', date);
    setDueDateCalendarOpen(false);
  };

  const setQuickReminder = (type: '1hour' | '4hours' | 'custom') => {
    const dueDate = form.getValues('dueDate');
    if (!dueDate) return;
    
    let reminderDate: Date;
    
    switch (type) {
      case '1hour':
        reminderDate = addHours(dueDate, -1);
        break;
      case '4hours':
        reminderDate = addHours(dueDate, -4);
        break;
      default:
        return;
    }
    
    form.setValue('reminder', reminderDate);
    setReminderCalendarOpen(false);
  };

  // Get default note (Things to do) if no notes exist
  const getDefaultNoteId = () => {
    const thingsToDoNote = notes.find((note: Note) => note.title === 'Things to do');
    return thingsToDoNote?.id || notes[0]?.id || '';
  };

  // Set default note if none selected
  useEffect(() => {
    if (!form.getValues('noteId') && notes.length > 0) {
      form.setValue('noteId', getDefaultNoteId());
    }
  }, [notes, form]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {task ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'Create a new task to stay organized.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Note Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Note
            </Label>
            <Popover open={noteSelectOpen} onOpenChange={setNoteSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={noteSelectOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    {form.watch('noteId') && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ 
                          backgroundColor: getNotebookForNote(form.watch('noteId'))?.color || '#6B7280' 
                        }}
                      />
                    )}
                    <span className="truncate">{getSelectedNoteDisplay()}</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput
                      placeholder="Search notes and notebooks..."
                      value={noteSearchQuery}
                      onValueChange={setNoteSearchQuery}
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <CommandEmpty>No notes found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredNotes.map((note) => {
                        const notebook = getNotebookForNote(note.id);
                        return (
                          <CommandItem
                            key={note.id}
                            value={note.id}
                            onSelect={() => {
                              form.setValue('noteId', note.id);
                              setNoteSelectOpen(false);
                              setNoteSearchQuery('');
                            }}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: notebook?.color || '#6B7280' }}
                            />
                            <span className="flex-1 truncate">
                              {note.title || 'Untitled'}
                            </span>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                form.watch('noteId') === note.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.noteId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.noteId.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this task about?"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDueDate('today')}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDueDate('tomorrow')}
              >
                Tomorrow
              </Button>
              <Popover open={dueDateCalendarOpen} onOpenChange={setDueDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.watch('dueDate')}
                    onSelect={(date) => {
                      form.setValue('dueDate', date);
                      setDueDateCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {form.watch('dueDate') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Due: {format(form.watch('dueDate')!, 'PPP')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue('dueDate', undefined)}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Reminder */}
          {form.watch('dueDate') && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reminder
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickReminder('1hour')}
                >
                  1 hour before
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickReminder('4hours')}
                >
                  4 hours before
                </Button>
                <Popover open={reminderCalendarOpen} onOpenChange={setReminderCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Custom
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.watch('reminder')}
                      onSelect={(date) => {
                        form.setValue('reminder', date);
                        setReminderCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {form.watch('reminder') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reminder: {format(form.watch('reminder')!, 'PPP p')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setValue('reminder', undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority
            </Label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={form.watch('priority') === priority ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => form.setValue('priority', priority)}
                  className={
                    priority === 'high' ? 'border-red-200 text-red-700 hover:bg-red-50' :
                    priority === 'medium' ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' :
                    'border-green-200 text-green-700 hover:bg-green-50'
                  }
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Flag */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Flag
            </Label>
            <Switch
              checked={form.watch('flagged')}
              onCheckedChange={(checked) => form.setValue('flagged', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}