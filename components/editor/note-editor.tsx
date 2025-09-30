"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Star, Archive, MoveHorizontal as MoreHorizontal, Share, Download, AlignLeft, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Note, Block, Notebook } from '@/lib/types';
import { BlockEditor } from './block-editor';
import { useNotes } from '@/hooks/use-notes';
import { useAutosave } from '@/hooks/use-autosave';
import { useRouter } from 'next/navigation';

interface NoteEditorProps {
  note: Note | null;
  onClose: () => void;
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');
  const { updateNote, deleteNote, notebooks } = useNotes();

  // Initialize editor state
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      // Ensure there's always at least one block for editing
      const noteBlocks = note.content && note.content.length > 0 
        ? note.content 
        : [{
            id: crypto.randomUUID(),
            type: 'paragraph' as const,
            content: '',
            properties: {},
            children: []
          }];
      setBlocks(noteBlocks);
      setTags(note.tags);
      // Reset text direction for each note
      setTextDirection('ltr');
    } else {
      // New note
      setTitle('');
      setBlocks([{
        id: crypto.randomUUID(),
        type: 'paragraph' as const,
        content: '',
        properties: {},
        children: []
      }]);
      setTags([]);
      setTextDirection('ltr');
    }
  }, [note]);

  // Autosave functionality
  useAutosave({
    noteId: note?.id || '',
    title,
    blocks,
    onSave: ({ title: savedTitle, blocks: savedBlocks }) => {
      if (note) {
        updateNote({
          id: note.id,
          updates: {
            title: savedTitle,
            content: savedBlocks,
            tags
          }
        });
      }
    }
  });

  const handleToggleFavorite = () => {
    if (note) {
      updateNote({
        id: note.id,
        updates: { isFavorite: !note.isFavorite }
      });
    }
  };

  const handleToggleArchive = () => {
    if (note) {
      updateNote({
        id: note.id,
        updates: { isArchived: !note.isArchived }
      });
    }
  };

  const handleDelete = () => {
    if (note && confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      deleteNote(note.id);
      onClose(); // Close the editor after deletion
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      const trimmedTag = newTag.trim();
      if (!tags.includes(trimmedTag)) {
        const newTags = [...tags, trimmedTag];
        setTags(newTags);
        if (note) {
          updateNote({
            id: note.id,
            updates: { tags: newTags }
          });
        }
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (note) {
      updateNote({
        id: note.id,
        updates: { tags: newTags }
      });
    }
  };

  const getNotebookName = () => {
    if (!note) return '';
    return notebooks.find((nb: Notebook) => nb.id === note.notebookId)?.name || 'Unknown';
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              📝
            </motion.div>
          </div>
          <h3 className="text-lg font-medium mb-2">Select a note to start editing</h3>
          <p className="text-muted-foreground">
            Choose a note from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">{getNotebookName()}</Badge>
            <span className="text-sm text-muted-foreground">
              Last edited {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`hover:bg-muted/10 ${note.isFavorite ? 'text-yellow-500' : 'text-foreground'}`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-4 w-4 ${note.isFavorite ? 'fill-current' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-muted/10 text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  {note.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTextDirection(textDirection === 'ltr' ? 'rtl' : 'ltr')}>
                  {textDirection === 'ltr' ? <AlignRight className="h-4 w-4 mr-2" /> : <AlignLeft className="h-4 w-4 mr-2" />}
                  {textDirection === 'ltr' ? 'Right to Left' : 'Left to Right'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          dir={textDirection}
          className="text-2xl font-bold border-none bg-transparent px-0 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ 
            direction: textDirection, 
            textAlign: textDirection === 'ltr' ? 'left' : 'right',
            unicodeBidi: 'plaintext'
          }}
        />

        {/* Tags */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground border-border text-foreground"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag..."
            dir={textDirection}
            className="w-24 h-6 text-xs border-none bg-transparent px-2 text-foreground focus:outline-none"
            style={{ 
              direction: textDirection, 
              textAlign: textDirection === 'ltr' ? 'left' : 'right',
              unicodeBidi: 'plaintext'
            }}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 bg-background">
          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
            textDirection={textDirection}
            className="min-h-[calc(100vh-300px)]"
          />
        </div>
      </div>
    </div>
  );
}