"use client";

import { motion } from 'framer-motion';
import { BookOpen, MoreHorizontal, Plus, Edit, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Notebook } from '@/lib/types';
import { useNotes } from '@/hooks/use-notes';

interface NotebookItemProps {
  notebook: Notebook;
  isSelected: boolean;
  isCollapsed: boolean;
  noteCount?: number;
  onClick: () => void;
  onEdit: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
  onCreateNote?: (notebook: Notebook) => void;
}

export function NotebookItem({ 
  notebook, 
  isSelected, 
  isCollapsed, 
  noteCount, 
  onClick, 
  onEdit, 
  onDelete,
  onCreateNote
}: NotebookItemProps) {
  const { duplicateNotebook } = useNotes();

  const handleCreateNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateNote) {
      onCreateNote(notebook);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(notebook);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNotebook(notebook.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notebook);
  };

  return (
    <motion.div 
      className="group"
      whileHover={{ x: 2 }}
    >
      <div
        className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-muted/10 text-foreground'
      }`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: notebook.color }}
          />
          {!isCollapsed && (
            <>
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-inherit">{notebook.name}</p>
                <p className="text-xs text-muted-foreground">
                  {noteCount !== undefined ? noteCount : notebook.noteCount} notes
                </p>
              </div>
            </>
          )}
        </div>

        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-muted/10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCreateNote && (
                <DropdownMenuItem onClick={handleCreateNote}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}