"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskItem } from './task-item';
import { Task } from '@/lib/types';

interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onOpenNote?: (noteId: string) => void;
}

export function SortableTaskItem({ task, onEdit, onOpenNote }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="flex-1">
          <TaskItem task={task} onEdit={onEdit} onOpenNote={onOpenNote} isDragging={isDragging} />
        </div>
      </div>
    </div>
  );
}