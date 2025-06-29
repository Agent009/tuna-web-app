"use client";

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Block } from '@/lib/types';
import { EditableBlock } from './editable-block';
import { SlashCommandMenu } from './slash-command-menu';
import { useEditor } from '@/hooks/use-editor';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  textDirection?: 'ltr' | 'rtl';
  className?: string;
}

export function BlockEditor({ blocks, onChange, textDirection = 'ltr', className }: BlockEditorProps) {
  const {
    blocks: editorBlocks,
    focusedBlockId,
    setFocusedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    handleSlashCommand,
    setBlocks
  } = useEditor(blocks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Sync blocks with parent
  useEffect(() => {
    onChange(editorBlocks);
  }, [editorBlocks, onChange]);

  // Update internal blocks when props change
  useEffect(() => {
    // Only update if blocks actually changed (deep comparison)
    const blocksChanged = JSON.stringify(blocks) !== JSON.stringify(editorBlocks);

    if (blocksChanged) {
      // Ensure blocks are never empty
      const blocksToSet = blocks.length === 0 ? [{
        id: crypto.randomUUID(),
        type: 'paragraph' as const,
        content: '',
        properties: {},
        children: []
      }] : blocks;

      setBlocks(blocksToSet);
    }
  }, [blocks]); // Only depend on blocks prop, not internal state

  // Separate effect for auto-focusing
  useEffect(() => {
    if (editorBlocks.length === 1 && !editorBlocks[0].content.trim() && !focusedBlockId) {
      setFocusedBlockId(editorBlocks[0].id);
    }
  }, [editorBlocks, focusedBlockId, setFocusedBlockId]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = editorBlocks.findIndex(block => block.id === active.id);
      const newIndex = editorBlocks.findIndex(block => block.id === over.id);
      
      const newBlocks = arrayMove(editorBlocks, oldIndex, newIndex);
      setBlocks(newBlocks);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    // Don't handle keyboard events if slash menu is open
    const slashMenu = document.querySelector('[data-slash-menu]');
    if (slashMenu) {
      return; // Let the slash menu handle the keyboard events
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(blockId);
    } else if (e.key === 'Backspace') {
      const block = editorBlocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        const currentIndex = editorBlocks.findIndex(b => b.id === blockId);
        
        // Only delete if there's more than one block
        if (editorBlocks.length > 1) {
          deleteBlock(blockId);
          
          // Focus the previous block if it exists
          if (currentIndex > 0) {
            const prevBlock = editorBlocks[currentIndex - 1];
            setTimeout(() => {
              setFocusedBlockId(prevBlock.id);
              // Find the content element and place cursor at the very end
              const prevElement = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable]`) as HTMLElement;
              if (prevElement) {
                prevElement.focus();
                
                // Ensure cursor is placed at the very end of the content
                const range = document.createRange();
                const selection = window.getSelection();
                
                if (prevElement.lastChild && prevElement.lastChild.nodeType === Node.TEXT_NODE) {
                  // If there's text content, place cursor at the end of the text
                  const textNode = prevElement.lastChild;
                  range.setStart(textNode, textNode.textContent?.length || 0);
                  range.setEnd(textNode, textNode.textContent?.length || 0);
                } else if (prevElement.childNodes.length > 0) {
                  // If there are child nodes but no text, place cursor after the last child
                  range.setStartAfter(prevElement.lastChild!);
                  range.setEndAfter(prevElement.lastChild!);
                } else {
                  // If element is empty, place cursor inside the element
                  range.setStart(prevElement, 0);
                  range.setEnd(prevElement, 0);
                }
                
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }, 0);
          }
        }
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Check if cursor is at the beginning/end of the current block
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const element = e.currentTarget as HTMLElement;
      
      if (range && element) {
        const isAtStart = range.startOffset === 0 && range.startContainer === element.firstChild;
        const isAtEnd = range.endOffset === (range.endContainer.textContent?.length || 0) && 
                       range.endContainer === element.lastChild;
        
        const currentIndex = editorBlocks.findIndex(b => b.id === blockId);
        
        if (e.key === 'ArrowUp' && isAtStart && currentIndex > 0) {
          e.preventDefault();
          const prevBlock = editorBlocks[currentIndex - 1];
          setFocusedBlockId(prevBlock.id);
          
          // Focus the previous block and place cursor at the end
          setTimeout(() => {
            const prevElement = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable]`) as HTMLElement;
            if (prevElement) {
              prevElement.focus();
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(prevElement);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }, 0);
        } else if (e.key === 'ArrowDown' && isAtEnd && currentIndex < editorBlocks.length - 1) {
          e.preventDefault();
          const nextBlock = editorBlocks[currentIndex + 1];
          setFocusedBlockId(nextBlock.id);
          
          // Focus the next block and place cursor at the beginning
          setTimeout(() => {
            const nextElement = document.querySelector(`[data-block-id="${nextBlock.id}"] [contenteditable]`) as HTMLElement;
            if (nextElement) {
              nextElement.focus();
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(nextElement);
              range.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }, 0);
        }
      }
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={editorBlocks.map(block => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {editorBlocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.02 }}
                data-block-id={block.id}
              >
                <EditableBlock
                  block={block}
                  isFocused={focusedBlockId === block.id}
                  onFocus={() => setFocusedBlockId(block.id)}
                  onChange={(updates) => updateBlock(block.id, updates)}
                  textDirection={textDirection}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  onSlashCommand={(command) => handleSlashCommand(command, block.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  );
}