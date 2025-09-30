"use client";

import { useState, useCallback, useRef } from 'react';
import { TextFormatting, TextSelection } from '@/lib/types';

interface UseRichTextOptions {
  initialFormatting?: TextFormatting;
  onFormatChange?: (formatting: TextFormatting) => void;
}

interface HistoryEntry {
  content: string;
  formatting: TextFormatting;
  selection: TextSelection | null;
}

export function useRichText({ initialFormatting = {}, onFormatChange }: UseRichTextOptions = {}) {
  const [currentFormatting, setCurrentFormatting] = useState<TextFormatting>(initialFormatting);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const contentRef = useRef<string>('');

  const saveToHistory = useCallback((content: string, formatting: TextFormatting, selection: TextSelection | null) => {
    const newEntry: HistoryEntry = { content, formatting, selection };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const updateSelection = useCallback((element: HTMLElement) => {
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const text = range.toString();
    
    if (text.length === 0) {
      setSelection(null);
      return;
    }

    // Calculate selection positions relative to the element
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(element);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    setSelection({ start, end, text });
  }, []);

  const applyFormatting = useCallback((element: HTMLElement, formatting: Partial<TextFormatting>) => {
    if (!selection) return;

    const newFormatting = { ...currentFormatting, ...formatting };
    setCurrentFormatting(newFormatting);
    
    // Save current state to history
    saveToHistory(contentRef.current, currentFormatting, selection);

    // Apply formatting to the selected text
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) return;

    const range = windowSelection.getRangeAt(0);
    if (range.collapsed) return;

    // Create a span with the formatting
    const span = document.createElement('span');
    applyStylesToElement(span, newFormatting);

    try {
      // Wrap the selected content
      range.surroundContents(span);
    } catch (e) {
      // If surroundContents fails (e.g., range crosses element boundaries),
      // extract and wrap the content
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }

    // Clear selection
    windowSelection.removeAllRanges();
    setSelection(null);

    // Notify parent of formatting change
    onFormatChange?.(newFormatting);
  }, [selection, currentFormatting, saveToHistory, onFormatChange]);

  const applyStylesToElement = useCallback((element: HTMLElement, formatting: TextFormatting) => {
    if (formatting.bold) element.style.fontWeight = 'bold';
    if (formatting.italic) element.style.fontStyle = 'italic';
    if (formatting.underline) {
      element.style.textDecoration = element.style.textDecoration
        ? `${element.style.textDecoration} underline`
        : 'underline';
    }
    if (formatting.strikethrough) {
      element.style.textDecoration = element.style.textDecoration
        ? `${element.style.textDecoration} line-through`
        : 'line-through';
    }
    if (formatting.color) element.style.color = formatting.color;
    if (formatting.backgroundColor) element.style.backgroundColor = formatting.backgroundColor;
    if (formatting.fontSize) element.style.fontSize = formatting.fontSize;
    if (formatting.fontFamily) element.style.fontFamily = formatting.fontFamily;
    if (formatting.align) element.style.textAlign = formatting.align;
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      setCurrentFormatting(prevEntry.formatting);
      setSelection(prevEntry.selection);
      setHistoryIndex(historyIndex - 1);
      onFormatChange?.(prevEntry.formatting);
    }
  }, [history, historyIndex, onFormatChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      setCurrentFormatting(nextEntry.formatting);
      setSelection(nextEntry.selection);
      setHistoryIndex(historyIndex + 1);
      onFormatChange?.(nextEntry.formatting);
    }
  }, [history, historyIndex, onFormatChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent, element?: HTMLElement) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          if (selection && element && selection.text.length > 0) {
            applyFormatting(element, { bold: !currentFormatting.bold });
          }
          break;
        case 'i':
          e.preventDefault();
          if (selection && element && selection.text.length > 0) {
            applyFormatting(element, { italic: !currentFormatting.italic });
          }
          break;
        case 'u':
          e.preventDefault();
          if (selection && element && selection.text.length > 0) {
            applyFormatting(element, { underline: !currentFormatting.underline });
          }
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
      }
    }
  }, [selection, currentFormatting, applyFormatting, undo, redo]);

  const getFormattingAtCursor = useCallback((element: HTMLElement) => {
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) return {};

    const range = windowSelection.getRangeAt(0);
    let node = range.startContainer;

    // If text node, get parent element
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode!;
    }

    const elementNode = node as HTMLElement;
    const computedStyle = window.getComputedStyle(elementNode);

    const formatting: TextFormatting = {
      bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
      italic: computedStyle.fontStyle === 'italic',
      underline: computedStyle.textDecoration.includes('underline'),
      strikethrough: computedStyle.textDecoration.includes('line-through'),
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      align: computedStyle.textAlign as 'left' | 'center' | 'right' | 'justify',
    };

    return formatting;
  }, []);

  return {
    selection,
    currentFormatting,
    updateSelection,
    applyFormatting,
    applyStylesToElement,
    handleKeyDown,
    getFormattingAtCursor,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setCurrentFormatting,
  };
}