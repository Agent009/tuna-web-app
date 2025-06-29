"use client";

import { useState, useCallback, useEffect } from 'react';
import { Block, BlockType } from '@/lib/types';

export function useEditor(initialBlocks: Block[] = []) {
  // Ensure there's always at least one block
  const ensureMinimumBlocks = (blocks: Block[]): Block[] => {
    if (blocks.length === 0) {
      return [{
        id: crypto.randomUUID(),
        type: 'paragraph',
        content: '',
        properties: {},
        children: []
      }];
    }
    return blocks;
  };

  const [blocks, setBlocks] = useState<Block[]>(() => ensureMinimumBlocks(initialBlocks));
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Update blocks when initialBlocks change, ensuring minimum blocks
  useEffect(() => {
    // Only update if initialBlocks actually changed
    const blocksChanged = JSON.stringify(initialBlocks) !== JSON.stringify(blocks);

    if (blocksChanged) {
      const newBlocks = ensureMinimumBlocks(initialBlocks);
      setBlocks(newBlocks);
    }
  }, [initialBlocks]); // Remove blocks from dependency array to prevent circular updates

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
      // Always ensure at least one block exists
      return ensureMinimumBlocks(filteredBlocks);
    });
  }, [createBlock]);

  // Custom setBlocks that ensures minimum blocks
  const setBlocksWithMinimum = useCallback((newBlocks: Block[] | ((prev: Block[]) => Block[])) => {
    if (typeof newBlocks === 'function') {
      setBlocks(prev => ensureMinimumBlocks(newBlocks(prev)));
    } else {
      setBlocks(ensureMinimumBlocks(newBlocks));
    }
  }, []);

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
      const updates: Partial<Block> = { type: blockType, content: '' };

      // If creating a task block, add default properties
      if (blockType === 'task') {
        updates.properties = {
          completed: false,
          priority: 'medium',
          flagged: false,
          // taskId will be created when content is added
        };
      }

      updateBlock(blockId, updates);
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
    setBlocks: setBlocksWithMinimum
  };
}