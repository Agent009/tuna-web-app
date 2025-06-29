"use client";

import { useEffect, useRef } from 'react';
import { Block } from '@/lib/types';

interface UseAutosaveOptions {
  noteId: string;
  title: string;
  blocks: Block[];
  onSave: (data: { title: string; blocks: Block[] }) => void;
  delay?: number;
}

export function useAutosave({ noteId, title, blocks, onSave, delay = 1000 }: UseAutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<{ title: string; blocks: Block[] }>({ title: '', blocks: [] });

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if content has changed
    const hasChanged = 
      title !== lastSavedRef.current.title ||
      JSON.stringify(blocks) !== JSON.stringify(lastSavedRef.current.blocks);

    if (hasChanged && (title.trim() || blocks.some(block => block.content.trim()))) {
      timeoutRef.current = setTimeout(() => {
        onSave({ title, blocks });
        lastSavedRef.current = { title, blocks };
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [title, blocks, onSave, delay]);

  // Force save on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        const hasUnsavedChanges = 
          title !== lastSavedRef.current.title ||
          JSON.stringify(blocks) !== JSON.stringify(lastSavedRef.current.blocks);
        
        if (hasUnsavedChanges) {
          onSave({ title, blocks });
        }
      }
    };
  }, []);
}