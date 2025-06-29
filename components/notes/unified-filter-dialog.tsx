"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Search,
  Calendar,
  Tag,
  Star,
  BookOpen,
  X,
  Plus,
  Save,
  SortAsc,
  SortDesc,
  Clock,
  CalendarDays,
  Check,
  Trash2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNoteFilters } from '@/hooks/use-note-filters';
import { useNotes } from '@/hooks/use-notes';
import { NoteFilters, NoteSortBy } from '@/lib/types';

interface UnifiedFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFilter?: string;
}

export function UnifiedFilterDialog({ open, onOpenChange, selectedFilter }: UnifiedFilterDialogProps) {
  const {
    filters,
    savedFilters,
    availableTags,
    updateFilter,
    clearFilters,
    saveCurrentFilter,
    applySavedFilter,
    deleteSavedFilter,
    hasActiveFilters
  } = useNoteFilters();

  const { notebooks } = useNotes();

  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveSection, setShowSaveSection] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [createdDateRangeOpen, setCreatedDateRangeOpen] = useState(false);

  // Reset save section when dialog closes
  useEffect(() => {
    if (!open) {
      setShowSaveSection(false);
      setSaveFilterName('');
    }
  }, [open]);

  const handleSearchChange = (value: string) => {
    updateFilter('search', value);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags);
  };

  const handleNotebookToggle = (notebookId: string) => {
    const currentNotebooks = filters.notebooks;
    const newNotebooks = currentNotebooks.includes(notebookId)
      ? currentNotebooks.filter(id => id !== notebookId)
      : [...currentNotebooks, notebookId];
    updateFilter('notebooks', newNotebooks);
  };

  const handleFavoritesToggle = (checked: boolean) => {
    updateFilter('favorites', checked ? true : null);
  };

  const handleQuickDateRange = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'today':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case 'week':
        start = startOfDay(subDays(today, 7));
        end = endOfDay(today);
        break;
      case 'month':
        start = startOfDay(subDays(today, 30));
        end = endOfDay(today);
        break;
    }

    updateFilter('dateRange', { start, end });
    setDateRangeOpen(false);
  };

  const handleCustomDateRange = (range: { from?: Date; to?: Date }) => {
    updateFilter('dateRange', {
      start: range.from || null,
      end: range.to || null
    });
  };

  const handleCreatedDateRange = (range: { from?: Date; to?: Date }) => {
    updateFilter('createdDateRange', {
      start: range.from || null,
      end: range.to || null
    });
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      saveCurrentFilter(saveFilterName.trim());
      setSaveFilterName('');
      setShowSaveSection(false);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    onOpenChange(false);
  };

  const getNotebookName = (notebookId: string) => {
    return notebooks.find(nb => nb.id === notebookId)?.name || 'Unknown';
  };

  const getNotebookColor = (notebookId: string) => {
    return notebooks.find(nb => nb.id === notebookId)?.color || '#6B7280';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Notes
          </DialogTitle>
          <DialogDescription>
            Customize how your notes are filtered. Changes are applied immediately.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
          <div className="space-y-6">
            {/* Search Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by title, content, or tags..."
                  className="pl-10 bg-input text-foreground border-border"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => updateFilter('search', '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Tags Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    {filters.tags.length} selected
                  </Badge>
                )}
              </Label>
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className={filters.tags.includes(tag)
                        ? "bg-accent text-accent-foreground"
                        : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      {filters.tags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Notebooks Section */}
            {/* Only show Notebooks filter when viewing "All Notes" */}
            {(!selectedFilter || selectedFilter === 'all') && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Notebooks
                  {filters.notebooks.length > 0 && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      {filters.notebooks.length} selected
                    </Badge>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {notebooks.map((notebook) => (
                    <Button
                      key={notebook.id}
                      variant={filters.notebooks.includes(notebook.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNotebookToggle(notebook.id)}
                      className={filters.notebooks.includes(notebook.id)
                        ? "bg-accent text-accent-foreground"
                        : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      <div className="flex items-center gap-2">
                        {filters.notebooks.includes(notebook.id) && <Check className="h-3 w-3" />}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: notebook.color }}
                        />
                        {notebook.name}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Favorites Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favorites
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="favorites-filter"
                  checked={filters.favorites === true}
                  onCheckedChange={handleFavoritesToggle}
                />
                <Label htmlFor="favorites-filter" className="text-sm">
                  Show only favorite notes
                </Label>
              </div>
            </div>

            <Separator />

            {/* Date Filters Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Filters
              </Label>

              {/* Last Modified */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Modified
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('today')}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('yesterday')}>
                    Yesterday
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('week')}>
                    Last 7 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('month')}>
                    Last 30 days
                  </Button>
                  <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        Custom Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <CalendarComponent
                          mode="range"
                          selected={{
                            from: filters.dateRange.start || undefined,
                            to: filters.dateRange.end || undefined
                          }}
                          onSelect={handleCustomDateRange}
                          numberOfMonths={1}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <div className="flex items-center justify-between p-2 bg-accent/10 rounded border border-accent/20">
                    <span className="text-sm text-accent">
                      {filters.dateRange.start ? format(filters.dateRange.start, 'MMM d, yyyy') : '...'} - {filters.dateRange.end ? format(filters.dateRange.end, 'MMM d, yyyy') : '...'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateFilter('dateRange', { start: null, end: null })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Created Date */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Created Date
                </Label>
                <Popover open={createdDateRangeOpen} onOpenChange={setCreatedDateRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Select Date Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <CalendarComponent
                        mode="range"
                        selected={{
                          from: filters.createdDateRange.start || undefined,
                          to: filters.createdDateRange.end || undefined
                        }}
                        onSelect={handleCreatedDateRange}
                        numberOfMonths={1}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {(filters.createdDateRange.start || filters.createdDateRange.end) && (
                  <div className="flex items-center justify-between p-2 bg-accent/10 rounded border border-accent/20">
                    <span className="text-sm text-accent">
                      {filters.createdDateRange.start ? format(filters.createdDateRange.start, 'MMM d, yyyy') : '...'} - {filters.createdDateRange.end ? format(filters.createdDateRange.end, 'MMM d, yyyy') : '...'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateFilter('createdDateRange', { start: null, end: null })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Filters Section */}
            {savedFilters.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Saved Filter Combinations
                  </Label>
                  <div className="space-y-2">
                    {savedFilters.map((savedFilter) => (
                      <div
                        key={savedFilter.id}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded border"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{savedFilter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Saved {format(savedFilter.createdAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              applySavedFilter(savedFilter);
                              onOpenChange(false);
                            }}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteSavedFilter(savedFilter.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Save Current Filter Section */}
            {hasActiveFilters && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Save Current Filter</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSaveSection(!showSaveSection)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                  <AnimatePresence>
                    {showSaveSection && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Input
                          value={saveFilterName}
                          onChange={(e) => setSaveFilterName(e.target.value)}
                          placeholder="Enter filter name..."
                          className="bg-input text-foreground border-border"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveFilter}
                            disabled={!saveFilterName.trim()}
                          >
                            Save Filter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSaveSection(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? 'Filters are active' : 'No filters applied'}
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}