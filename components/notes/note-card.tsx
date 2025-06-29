"use client";

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Star, Archive, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Note } from '@/lib/types';
import { useNotes } from '@/hooks/use-notes';

interface NoteCardProps {
  note: Note;
  notebookName: string;
  isSelected: boolean;
  onClick: () => void;
}

export function NoteCard({ note, notebookName, isSelected, onClick }: NoteCardProps) {
  const { updateNote, deleteNote } = useNotes();

  const getContentPreview = () => {
    const textBlocks = note.content
      .filter(block => ['paragraph', 'heading1', 'heading2', 'heading3'].includes(block.type))
      .map(block => block.content)
      .join(' ');
    
    return textBlocks.length > 150 
      ? textBlocks.substring(0, 150) + '...'
      : textBlocks || 'No content';
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote({ id: note.id, updates: { isFavorite: !note.isFavorite } });
  };

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote({ id: note.id, updates: { isArchived: !note.isArchived } });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(note.id);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className={`group p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-accent border-2 bg-accent/5 shadow-md bg-card text-foreground' 
          : 'border-border hover:border-primary/20 hover:shadow-sm bg-card text-card-foreground hover:bg-muted/10'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-medium text-sm truncate flex-1 mr-2 ${
          isSelected ? 'text-accent font-semibold' : 'text-inherit'
        }`}>
          {note.title || 'Untitled'}
        </h3>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-muted/10 ${
              note.isFavorite ? 'text-yellow-500' : 
              isSelected ? 'text-accent' : 'text-foreground'
            }`}
            onClick={handleToggleFavorite}
          >
            <Star className={`h-3 w-3 ${note.isFavorite ? 'fill-current' : ''}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 hover:bg-muted/10 ${
                  isSelected ? 'text-accent' : 'text-foreground'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleFavorite}>
                {note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleArchive}>
                {note.isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className={`text-xs mb-3 line-clamp-3 ${
        isSelected ? 'text-accent/80' : 'text-muted-foreground'
      }`}>
        {getContentPreview()}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
            {notebookName}
          </Badge>
          {note.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className={`text-xs ${
              isSelected 
                ? 'border-accent/40 text-accent bg-accent/10' 
                : 'border-border text-foreground'
            }`}>
              {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className={`text-xs ${
              isSelected ? 'text-accent/80' : 'text-muted-foreground'
            }`}>
              +{note.tags.length - 2}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {note.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
          {note.isArchived && <Archive className="h-3 w-3 text-muted-foreground" />}
          <span className={`text-xs ${
            isSelected ? 'text-accent/80' : 'text-muted-foreground'
          }`}>
            {format(note.updatedAt, 'MMM d')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}