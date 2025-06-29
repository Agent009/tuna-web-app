"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchPopup } from './search-popup';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectNote: (noteId: string) => void;
  onSelectNotebook: (notebookId: string) => void;
  className?: string;
}

export function SearchBar({ onSearch, onSelectNote, onSelectNotebook, className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setIsPopupOpen(true);
    } else {
      setIsPopupOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (query.trim()) {
      setIsPopupOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      onSearch(query);
      setIsPopupOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsPopupOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsPopupOpen(false);
    inputRef.current?.focus();
  };

  const handleNoteSelect = (noteId: string) => {
    onSelectNote(noteId);
    setIsPopupOpen(false);
    inputRef.current?.blur();
  };

  const handleNotebookSelect = (notebookId: string) => {
    onSelectNotebook(notebookId);
    setIsPopupOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused
            ? '0 4px 20px rgba(1, 35, 64, 0.15)'
            : '0 1px 3px rgba(1, 35, 64, 0.05)'
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search notes..."
          className="pl-10 pr-10 h-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all tuna-focus"
        />
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted/50 tuna-interactive"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isPopupOpen && query.trim() && (
          <SearchPopup
            query={query}
            onSelectNote={handleNoteSelect}
            onSelectNotebook={handleNotebookSelect}
            onViewAllResults={() => onSearch(query)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}