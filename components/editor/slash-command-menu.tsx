"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus
} from 'lucide-react';

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onSelect: (command: string) => void;
  onClose: () => void;
}

const commands = [
  { id: 'h1', label: 'Heading 1', icon: Heading1, description: 'Large heading' },
  { id: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium heading' },
  { id: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small heading' },
  { id: 'bullet', label: 'Bullet List', icon: List, description: 'Unordered list' },
  { id: 'number', label: 'Numbered List', icon: ListOrdered, description: 'Ordered list' },
  { id: 'todo', label: 'To-do', icon: CheckSquare, description: 'Task with checkbox' },
  { id: 'task', label: 'Task', icon: CheckSquare, description: 'Advanced task with due date' },
  { id: 'code', label: 'Code', icon: Code, description: 'Code snippet' },
  { id: 'quote', label: 'Quote', icon: Quote, description: 'Block quote' },
  { id: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal line' },
];

export function SlashCommandMenu({ position, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => Math.min(prev + 1, commands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
          onSelect(commands[selectedIndex].id);
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
          onClose();
          break;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-slash-menu]')) {
        setIsVisible(false);
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIndex, onSelect, onClose, isVisible]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        data-slash-menu
        className="fixed z-50 w-72 bg-popover border rounded-lg shadow-lg p-2 tuna-card"
        style={{
          left: position.x,
          top: position.y + 10,
        }}
      >
        <div className="space-y-1">
          {commands.map((command, index) => (
            <motion.button
              key={command.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors tuna-interactive ${
                index === selectedIndex 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent/50'
              }`}
              data-command-index={index}
              onClick={() => onSelect(command.id)}
              whileHover={{ x: 2 }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <command.icon className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{command.label}</div>
                <div className="text-xs text-muted-foreground">{command.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}