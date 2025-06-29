"use client";

import { useState, useCallback, useEffect } from 'react';
import { Block, BlockType } from '@/lib/types';

export function useEditor(initialBlocks: Block[] = []) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const createBlock = useCallback((type: BlockType = 'paragraph', content: string = ''): Block => {
    return {
      id: crypto.randomUUID(),
      type,
      content,
      properties: {},
      children: []
    };
  }, []);

  const addBlock = useCallback((afterBlockId?: string, type: BlockType = 'paragraph') => {
    const newBlock = createBlock(type);
    
    setBlocks(currentBlocks => {
      if (!afterBlockId) {
        return [...currentBlocks, newBlock];
      }
      
      const index = currentBlocks.findIndex(block => block.id === afterBlockId);
      const newBlocks = [...currentBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    
    setFocusedBlockId(newBlock.id);
    return newBlock.id;
  }, [createBlock]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(currentBlocks => {
      const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);
      if (filteredBlocks.length === 0) {
        const newBlock = createBlock();
        setFocusedBlockId(newBlock.id);
        return [newBlock];
      }
      return filteredBlocks;
    });
  }, [createBlock]);

  const moveBlock = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
    setBlocks(currentBlocks => {
      const draggedIndex = currentBlocks.findIndex(block => block.id === draggedId);
      const targetIndex = currentBlocks.findIndex(block => block.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return currentBlocks;
      
      const newBlocks = [...currentBlocks];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      newBlocks.splice(insertIndex, 0, draggedBlock);
      
      return newBlocks;
    });
  }, []);

  const handleSlashCommand = useCallback((command: string, blockId: string) => {
    const commands: Record<string, BlockType> = {
      'h1': 'heading1',
      'h2': 'heading2',
      'h3': 'heading3',
      'todo': 'todo',
      'bullet': 'bulleted-list',
      'number': 'numbered-list',
      'code': 'code',
      'task': 'task',
      'quote': 'quote',
      'divider': 'divider'
    };

    const blockType = commands[command];
    if (blockType) {
      updateBlock(blockId, { type: blockType, content: '' });
      // Maintain focus on the block after command selection
      setTimeout(() => {
        setFocusedBlockId(blockId);
      }, 0);
    }
  }, [updateBlock]);

  return {
    blocks,
    focusedBlockId,
    setFocusedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    handleSlashCommand,
    setBlocks
  };
}