"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, Square } from 'lucide-react';
import { Block, BlockType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SlashCommandMenu } from './slash-command-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flag, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '@/hooks/use-tasks';
import { useNotes } from '@/hooks/use-notes';

interface EditableBlockProps {
  block: Block;
  isFocused: boolean;
  textDirection?: 'ltr' | 'rtl';
  onFocus: () => void;
  onChange: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSlashCommand: (command: string) => void;
}

export function EditableBlock({
  block,
  isFocused,
  textDirection = 'ltr',
  onFocus,
  onChange,
  onKeyDown,
  onSlashCommand
}: EditableBlockProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const lastCursorPositionRef = useRef<number | null>(null);
  const { tasks, updateTask, createTaskAsync } = useTasks();
  const { notes, updateNote } = useNotes();

  // Extract task properties at component level to avoid conditional hook calls
  const taskProps = block.properties || {};
  const isCompleted = taskProps.completed || false;
  const priority = taskProps.priority || 'medium';
  const dueDate = taskProps.dueDate ? new Date(taskProps.dueDate) : null;
  const flagged = taskProps.flagged || false;
  const description = taskProps.description || '';
  const taskId = taskProps.taskId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  // Make sure textDirection is consistently applied
  useEffect(() => {
    if (contentRef.current) {
      // Set direction attributes
      contentRef.current.dir = textDirection;
      contentRef.current.style.direction = textDirection;
      contentRef.current.style.textAlign = textDirection === 'ltr' ? 'left' : 'right';
    }
  }, [textDirection]);

  // Handle task creation at component level to avoid conditional hook calls
  useEffect(() => {
    if (block.type === 'task' && !taskId && block.content.trim()) {
      // Find the note this block belongs to
      const currentNote = notes.find(note =>
        note.content.some(b => b.id === block.id)
      );

      if (currentNote) {
        // Create a task in the task system
        createTaskAsync({
          title: block.content,
          description: description,
          completed: isCompleted,
          dueDate: dueDate,
          priority: priority,
          flagged: flagged,
          noteId: currentNote.id
        }).then((createdTask) => {
          // Update the block to include the taskId
          onChange({
            properties: {
              ...taskProps,
              taskId: createdTask.id
            }
          });
        }).catch((error) => {
          console.error('Failed to create task:', error);
        });
      }
    }
  }, [block.type, taskId, block.content, block.id, notes, createTaskAsync, onChange, taskProps, description, isCompleted, dueDate, priority, flagged]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Get the current content
    const content = e.currentTarget.textContent || '';

    // Check for slash command
    if (content.endsWith('/')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      if (range) {
        const rects = range.getClientRects();
        if (rects.length > 0) {
          const lastRect = rects[rects.length - 1];
          setSlashPosition({ x: lastRect.right, y: lastRect.bottom });
        } else {
          setSlashPosition({ x: rect.left, y: rect.bottom });
        }
      } else {
        setSlashPosition({ x: rect.left, y: rect.bottom });
      }
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }

    // Store current selection before React updates
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        lastCursorPositionRef.current = range.startOffset;
      }
    }

    // Update the block content
    onChange({ content });
  };

  const handleSlashSelect = (command: string) => {
    setShowSlashMenu(false);

    // Store current cursor position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorPosition = range?.startOffset || 0;

    // Remove the slash from content
    const currentContent = contentRef.current?.textContent || '';
    const contentWithoutSlash = currentContent.slice(0, -1); // Remove last character (slash)

    // Update content without slash
    onChange({ content: contentWithoutSlash });
    onSlashCommand(command);

    // Restore focus and cursor position after command selection
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();

        // Set cursor position at the end of content (where slash was)
        const range = document.createRange();
        const selection = window.getSelection();

        if (contentRef.current.firstChild) {
          const textNode = contentRef.current.firstChild;
          const newPosition = Math.min(cursorPosition - 1, textNode.textContent?.length || 0);
          range.setStart(textNode, Math.max(0, newPosition));
          range.setEnd(textNode, Math.max(0, newPosition));
        } else {
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const handleTodoToggle = () => {
    const isChecked = block.properties?.checked || false;
    onChange({
      properties: { ...block.properties, checked: !isChecked }
    });
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'bulleted-list': return 'List item';
      case 'numbered-list': return 'Numbered item';
      case 'todo': return 'To-do';
      case 'task': return 'Task';
      case 'code': return 'Code';
      case 'quote': return 'Quote';
      default: return "Type '/' for commands";
    }
  };

  const getClassName = () => {
    const base = 'outline-none bg-transparent w-full';
    switch (block.type) {
      case 'heading1': return `${base} text-3xl font-bold`;
      case 'heading2': return `${base} text-2xl font-bold`;
      case 'heading3': return `${base} text-xl font-bold`;
      case 'code': return `${base} font-mono bg-muted px-3 py-2 rounded text-sm`;
      case 'quote': return `${base} border-l-4 border-primary pl-4 italic`;
      default: return base;
    }
  };

  const renderBlockContent = () => {
    if (block.type === 'divider') {
      return <hr className="border-t border-border my-4" />;
    }

    if (block.type === 'todo') {
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={block.properties?.checked || false}
            onCheckedChange={handleTodoToggle}
          />
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir={textDirection}
            className={`${getClassName()} ${
              block.properties?.checked ? 'line-through text-muted-foreground' : ''
            }`}
            onInput={handleInput}
            onFocus={onFocus}
            onKeyDown={(e) => {
              handleKeyDown(e);
              onKeyDown(e);
            }}
            data-placeholder={getPlaceholder()}
            style={{
              direction: textDirection,
              textAlign: textDirection === 'ltr' ? 'left' : 'right',
            }}
          >
            {block.content}
          </div>
        </div>
      );
    }

    if (block.type === 'task') {
      // Find the actual task from the database
      const actualTask = taskId ? tasks.find(t => t.id === taskId) : null;

      // Use actual task data if available, otherwise fall back to block properties
      const displayCompleted = actualTask ? actualTask.completed : isCompleted;
      const displayPriority = actualTask ? actualTask.priority : priority;
      const displayDueDate = actualTask ? actualTask.dueDate : dueDate;
      const displayFlagged = actualTask ? actualTask.flagged : flagged;
      const displayDescription = actualTask ? actualTask.description : description;

      return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
          <Checkbox
            checked={displayCompleted}
            onCheckedChange={(checked) => {
              // Update both the task and the block
              if (actualTask) {
                updateTask({
                  id: actualTask.id,
                  updates: { completed: checked }
                });
              }
              // Update block properties for immediate UI feedback
              const updatedProperties = { ...taskProps, completed: checked };
              onChange({
                properties: updatedProperties
              });
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              dir={textDirection}
              className={`${getClassName()} ${
                displayCompleted ? 'line-through text-muted-foreground' : ''
              }`}
              onInput={handleInput}
              onFocus={onFocus}
              onKeyDown={(e) => {
                handleKeyDown(e);
                onKeyDown(e);
              }}
              data-placeholder="Task title"
              style={{ 
                direction: textDirection,
                textAlign: textDirection === 'ltr' ? 'left' : 'right'
              }}
            >
              {block.content}
            </div>
            {displayDescription && (
              <p className={`text-xs mt-1 ${
                displayCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'
              }`}>
                {displayDescription}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${
                displayPriority === 'high' ? 'text-red-500' :
                displayPriority === 'medium' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {displayPriority}
              </Badge>
              {displayDueDate && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(displayDueDate, 'MMM d')}
                </Badge>
              )}
              {displayFlagged && (
                <Badge variant="outline" className="text-xs">
                  <Flag className="h-3 w-3 text-yellow-500 fill-current" />
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'bulleted-list') {
      return (
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-foreground rounded-full mt-2 flex-shrink-0" />
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir={textDirection}
            className={getClassName()}
            onInput={handleInput}
            onFocus={onFocus}
            onKeyDown={(e) => {
              handleKeyDown(e);
              onKeyDown(e);
            }}
            data-placeholder={getPlaceholder()}
            style={{ 
              direction: textDirection, 
              textAlign: textDirection === 'ltr' ? 'left' : 'right',
            }}
          >
            {block.content}
          </div>
        </div>
      );
    }

    if (block.type === 'numbered-list') {
      return (
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground mt-0.5 flex-shrink-0">1.</div>
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir={textDirection}
            className={getClassName()}
            onInput={handleInput}
            onFocus={onFocus}
            onKeyDown={(e) => {
              handleKeyDown(e);
              onKeyDown(e);
            }}
            data-placeholder={getPlaceholder()}
            style={{ 
              direction: textDirection, 
              textAlign: textDirection === 'ltr' ? 'left' : 'right',
            }}
          >
            {block.content}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        dir={textDirection}
        className={getClassName()}
        onInput={handleInput}
        onFocus={onFocus}
        onKeyDown={(e) => {
          handleKeyDown(e);
          onKeyDown(e);
        }}
        data-placeholder={getPlaceholder()}
        style={{ 
          direction: textDirection, 
          textAlign: textDirection === 'ltr' ? 'left' : 'right',
        }}
      >
        {block.content}
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Store cursor position after key press
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      if (range && contentRef.current) {
        // Find the text node
        let textNode: Node | null = null;
        
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          textNode = range.startContainer;
        } else {
          // Try to find the first text node
          const walker = document.createTreeWalker(
            contentRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          textNode = walker.nextNode();
        }
        
        if (textNode) {
          lastCursorPositionRef.current = range.startOffset;
        }
      }
    }, 0);
  };

  useEffect(() => {
    if (contentRef.current && lastCursorPositionRef.current !== null && isFocused) {
      const textNode = contentRef.current.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const textLength = textNode.textContent?.length || 0;
        
        // Ensure cursor position is valid
        const position = Math.min(lastCursorPositionRef.current, textLength);
        
        // Set cursor position
        const selection = window.getSelection();
        const range = document.createRange();
        
        range.setStart(textNode, position);
        range.setEnd(textNode, position);
        
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [block.content, isFocused]);

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-lg transition-all tuna-interactive ${
          isFocused ? 'bg-muted/30' : 'hover:bg-muted/20'
        } ${isDragging ? 'opacity-50' : ''}`}
        whileHover={{ x: 2 }}
      >
        <div className="flex items-start gap-2 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 cursor-grab active:cursor-grabbing tuna-interactive"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex-1 min-w-0">
            {renderBlockContent()}
          </div>
        </div>
      </motion.div>

      {showSlashMenu && (
        <SlashCommandMenu
          position={slashPosition}
          onSelect={handleSlashSelect}
          onClose={() => setShowSlashMenu(false)}
        />
      )}
    </>
  );
}