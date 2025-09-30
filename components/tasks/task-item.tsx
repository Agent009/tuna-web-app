"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, Flag, MoveHorizontal as MoreHorizontal, Clock, TriangleAlert as AlertTriangle, CreditCard as Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Task } from '@/lib/types';
import { useTasks } from '@/hooks/use-tasks';
import { useNotes } from '@/hooks/use-notes';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onOpenNote?: (noteId: string) => void;
  isDragging?: boolean;
}

export function TaskItem({ task, onEdit, onOpenNote, isDragging }: TaskItemProps) {
  const { updateTask, deleteTask } = useTasks();
  const { notes } = useNotes();
  const [isHovered, setIsHovered] = useState(false);

  const handleToggleComplete = () => {
    updateTask({
      id: task.id,
      updates: { completed: !task.completed }
    });
  };

  const handleToggleFlag = () => {
    updateTask({
      id: task.id,
      updates: { flagged: !task.flagged }
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const handleOpenNote = () => {
    if (onOpenNote) {
      onOpenNote(task.noteId);
    }
  };

  const getNoteName = () => {
    const note = notes.find((n: Note) => n.id === task.noteId);
    return note?.title || 'Unknown Note';
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = () => {
    if (task.priority === 'high') {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return null;
  };

  const isOverdue = task.dueDate && task.dueDate < new Date() && !task.completed;
  const isDueToday = task.dueDate && 
    format(task.dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <motion.div
      layout
      className={`group p-4 rounded-lg border transition-all cursor-pointer ${
        isDragging ? 'opacity-50 rotate-2' : ''
      } ${
        task.completed 
          ? 'bg-muted/10 border-border bg-card text-card-foreground' 
          : 'bg-card border-border hover:border-primary/20 hover:shadow-sm text-card-foreground hover:bg-muted/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -1 }}
      onClick={handleOpenNote}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`text-xs mt-1 ${
                  task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {task.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {task.flagged && (
                <Flag className="h-3 w-3 text-yellow-500 fill-current" />
              )}
              
              {getPriorityIcon() && (
                <div className={getPriorityColor()}>
                  {getPriorityIcon()}
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 transition-opacity ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleFlag}>
                    <Flag className="h-4 w-4 mr-2" />
                    {task.flagged ? 'Remove flag' : 'Add flag'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground border-border text-foreground" onClick={handleOpenNote}>
              {getNoteName()}
            </Badge>
            
            <Badge variant="outline" className={`text-xs ${getPriorityColor()} border-border`}>
              {task.priority}
            </Badge>
            
            {task.dueDate && (
              <Badge 
                variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"}
                className={`text-xs ${
                  isOverdue ? "bg-destructive/10 text-destructive border-destructive/20" : 
                  isDueToday ? "bg-accent/10 text-accent border-accent/20" : 
                  "border-border text-foreground"
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {format(task.dueDate, 'MMM d')}
              </Badge>
            )}
            
            {task.reminder && (
              <Badge variant="outline" className="text-xs border-border text-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {format(task.reminder, 'HH:mm')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}