"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Filter, Import as SortAsc, Dessert as SortDesc, SquareCheck as CheckSquare, Square, Flag, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TaskItem } from './task-item';
import { SortableTaskItem } from './sortable-task-item';
import { useTasks } from '@/hooks/use-tasks';
import { useNotes } from '@/hooks/use-notes';
import { Task, TaskFilters, TaskSortBy, Note } from '@/lib/types';

interface TaskListProps {
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onOpenNote?: (noteId: string) => void;
}

export function TaskList({ onCreateTask, onEditTask, onOpenNote }: TaskListProps) {
  const { tasks, reorderTasks, filterTasks, sortTasks } = useTasks();
  const { notes } = useNotes();
  
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    flagged: null,
    noteId: null
  });
  
  const [sortBy, setSortBy] = useState<TaskSortBy>('dueDate');
  const [sortAscending, setSortAscending] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filters);
    return sortTasks(filtered, sortBy, sortAscending);
  }, [tasks, filters, sortBy, sortAscending, filterTasks, sortTasks]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredAndSortedTasks.findIndex(task => task.id === active.id);
      const newIndex = filteredAndSortedTasks.findIndex(task => task.id === over.id);
      
      const newTasks = arrayMove(filteredAndSortedTasks, oldIndex, newIndex);
      reorderTasks(newTasks);
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (newSortBy: TaskSortBy) => {
    if (sortBy === newSortBy) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(newSortBy);
      setSortAscending(true);
    }
  };

  const getFilteredNoteName = () => {
    if (!filters.noteId) return null;
    const note = notes.find((n: Note) => n.id === filters.noteId);
    return note?.title || 'Unknown Note';
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== null && value !== 'all'
  ).length;

  return (
    <div className="w-96 tuna-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">Tasks</h2>
          <Button size="sm" onClick={onCreateTask} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <Filter className="h-3 w-3 mr-1" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-accent/10 text-accent border-accent/20">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'all')}>
                <Square className="h-4 w-4 mr-2" />
                All Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'pending')}>
                <Square className="h-4 w-4 mr-2" />
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'completed')}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Completed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterChange('flagged', true)}>
                <Flag className="h-4 w-4 mr-2" />
                Flagged Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('flagged', null)}>
                All Flags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterChange('priority', 'high')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('priority', 'medium')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('priority', 'low')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-green-500" />
                Low Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('priority', 'all')}>
                All Priorities
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                {sortAscending ? <SortAsc className="h-3 w-3 mr-1" /> : <SortDesc className="h-3 w-3 mr-1" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleSortChange('dueDate')}>
                <Calendar className="h-4 w-4 mr-2" />
                Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('priority')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('created')}>
                Created Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('updated')}>
                Updated Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('title')}>
                Title
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {filters.status}
              </Badge>
            )}
            {filters.priority !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {filters.priority} priority
              </Badge>
            )}
            {filters.flagged && (
              <Badge variant="secondary" className="text-xs">
                flagged
              </Badge>
            )}
            {getFilteredNoteName() && (
              <Badge variant="secondary" className="text-xs">
                {getFilteredNoteName()}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs hover:bg-muted/10 text-foreground"
              onClick={() => setFilters({
                status: 'all',
                priority: 'all',
                flagged: null,
                noteId: null
              })}
            >
              Clear
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground mt-2">
          {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 tuna-scrollbar">
        <AnimatePresence>
          {filteredAndSortedTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center text-muted-foreground"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <CheckSquare className="h-8 w-8" />
              </div>
              <p className="font-medium">No tasks found</p>
              <p className="text-sm mt-1">
                {activeFiltersCount > 0 
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'
                }
              </p>
              {activeFiltersCount === 0 && (
                <Button onClick={onCreateTask} variant="outline" className="mt-4 border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              )}
            </motion.div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredAndSortedTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-2">
                  {filteredAndSortedTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SortableTaskItem task={task} onEdit={onEditTask} onOpenNote={onOpenNote} />
                    </motion.div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}