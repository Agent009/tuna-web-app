import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TextFormatting, TextSelection } from '@/lib/types';

interface RichTextToolbarProps {
  selection: TextSelection | null;
  currentFormatting: TextFormatting;
  onFormat: (formatting: Partial<TextFormatting>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

const fontFamilies = [
  { name: 'Default', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

const fontSizes = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '14px' },
  { name: 'Medium', value: '16px' },
  { name: 'Large', value: '18px' },
  { name: 'Extra Large', value: '24px' },
];

const colors = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#0066FF', '#6600FF',
  '#FF0066', '#FF3366', '#FF6699', '#66FF99', '#6699FF', '#9966FF',
];

export function RichTextToolbar({
  selection,
  currentFormatting,
  onFormat,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className = ''
}: RichTextToolbarProps) {
  const isVisible = !!selection && selection.text.length > 0;

  const handleFormatToggle = (property: keyof TextFormatting) => {
    onFormat({ [property]: !currentFormatting[property] });
  };

  const handleColorChange = (color: string, isBackground = false) => {
    onFormat({ [isBackground ? 'backgroundColor' : 'color']: color });
  };

  const handleFontChange = (property: 'fontSize' | 'fontFamily', value: string) => {
    onFormat({ [property]: value });
  };

  const handleAlignmentChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    onFormat({ align });
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={`fixed z-50 bg-popover border rounded-lg shadow-lg p-2 flex items-center gap-1 ${className}`}
        style={{
          left: '50%',
          top: '20px',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Basic Formatting */}
        <Button
          variant={currentFormatting.bold ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFormatToggle('bold')}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.italic ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFormatToggle('italic')}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.underline ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFormatToggle('underline')}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.strikethrough ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFormatToggle('strikethrough')}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Font Family */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Font Family">
              <Type className="h-4 w-4 mr-1" />
              <span className="text-xs">Font</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontFamilies.map((font) => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => handleFontChange('fontFamily', font.value)}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Font Size">
              <span className="text-xs">Size</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontSizes.map((size) => (
              <DropdownMenuItem
                key={size.value}
                onClick={() => handleFontChange('fontSize', size.value)}
              >
                {size.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Background Color">
              <div className="w-4 h-4 border rounded" style={{ backgroundColor: currentFormatting.backgroundColor || 'transparent' }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              <button
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white"
                onClick={() => handleColorChange('', true)}
                title="No background"
              >
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-500 opacity-50" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
              </button>
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color, true)}
                  title={color}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Alignment */}
        <Button
          variant={currentFormatting.align === 'left' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('left')}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.align === 'center' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('center')}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.align === 'right' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('right')}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormatting.align === 'justify' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('justify')}
          className="h-8 w-8 p-0"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}