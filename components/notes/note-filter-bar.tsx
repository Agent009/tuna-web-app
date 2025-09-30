"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, Calendar, Tag, Star, BookOpen, X, Plus, Save, ChevronDown, Import as SortAsc, Dessert as SortDesc, Clock, CalendarDays } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNoteFilters } from '@/hooks/use-note-filters';
import { useNotes } from '@/hooks/use-notes';
import { NoteFilters, NoteSortBy, Notebook } from '@/lib/types';

interface NoteFilterBarProps {
  className?: string;
}

export function NoteFilterBar({ className }: NoteFilterBarProps) {
  const {
    filters,
    sortBy,
    sortAscending,
    savedFilters,
    availableTags,
    activeFiltersCount,
    updateFilter,
    clearFilters,
    changeSortBy,
    saveCurrentFilter,
    applySavedFilter,
    deleteSavedFilter,
    hasActiveFilters
  } = useNoteFilters();
  
  const { notebooks } = useNotes();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [createdDateRangeOpen, setCreatedDateRangeOpen] = useState(false);

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

  const handleFavoritesToggle = () => {
    const newValue = filters.favorites === true ? null : true;
    updateFilter('favorites', newValue);
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

  const handleCustomDateRange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      updateFilter('dateRange', { start: null, end: null });
      return;
    }
    updateFilter('dateRange', {
      start: range.from || null,
      end: range.to || null
    });
  };

  const handleCreatedDateRange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    updateFilter('createdDateRange', {
      start: range.from || null,
      end: range.to || null
    });
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      saveCurrentFilter(saveFilterName.trim());
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const removeFilter = (type: keyof NoteFilters, value?: any) => {
    switch (type) {
      case 'search':
        updateFilter('search', '');
        break;
      case 'tags':
        if (value) {
          updateFilter('tags', filters.tags.filter(t => t !== value));
        } else {
          updateFilter('tags', []);
        }
        break;
      case 'notebooks':
        if (value) {
          updateFilter('notebooks', filters.notebooks.filter(id => id !== value));
        } else {
          updateFilter('notebooks', []);
        }
        break;
      case 'favorites':
        updateFilter('favorites', null);
        break;
      case 'dateRange':
        updateFilter('dateRange', { start: null, end: null });
        break;
      case 'createdDateRange':
        updateFilter('createdDateRange', { start: null, end: null });
        break;
    }
  };

  const getNotebookName = (notebookId: string) => {
    return notebooks.find((nb: Notebook) => nb.id === notebookId)?.name || 'Unknown';
  };

  const getNotebookColor = (notebookId: string) => {
    return notebooks.find((nb: Notebook) => nb.id === notebookId)?.color || '#6B7280';
  };

  return (
    <>
      <div className={`space-y-4 p-4 bg-card border-b border-border ${className}`}>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="pl-10 bg-input text-foreground border-border"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => removeFilter('search')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tags Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <Tag className="h-3 w-3 mr-1" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-accent/10 text-accent">
                    {filters.tags.length}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.length === 0 ? (
                <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
              ) : (
                availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={filters.tags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notebooks Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <BookOpen className="h-3 w-3 mr-1" />
                Notebooks
                {filters.notebooks.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-accent/10 text-accent">
                    {filters.notebooks.length}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by Notebooks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notebooks.map((notebook: Notebook) => (
                <DropdownMenuCheckboxItem
                  key={notebook.id}
                  checked={filters.notebooks.includes(notebook.id)}
                  onCheckedChange={() => handleNotebookToggle(notebook.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: notebook.color }}
                    />
                    {notebook.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last Modified Date Filter */}
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Last Modified
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-accent/10 text-accent">
                    1
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2">
                <div className="text-sm font-medium">Quick Ranges</div>
                <div className="grid grid-cols-2 gap-2">
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
                </div>
                <Separator />
                <div className="text-sm font-medium">Custom Range</div>
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

          {/* Created Date Filter */}
          <Popover open={createdDateRangeOpen} onOpenChange={setCreatedDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="h-3 w-3 mr-1" />
                Created
                {(filters.createdDateRange.start || filters.createdDateRange.end) && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-accent/10 text-accent">
                    1
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <div className="text-sm font-medium mb-2">Created Date Range</div>
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

          {/* Favorites Filter */}
          <Button
            variant={filters.favorites ? "default" : "outline"}
            size="sm"
            onClick={handleFavoritesToggle}
            className={filters.favorites 
              ? "bg-accent text-accent-foreground" 
              : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            <Star className={`h-3 w-3 mr-1 ${filters.favorites ? 'fill-current' : ''}`} />
            Favorites
          </Button>

          {/* Sort Controls */}
          <Separator orientation="vertical" className="h-6" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                {sortAscending ? <SortAsc className="h-3 w-3 mr-1" /> : <SortDesc className="h-3 w-3 mr-1" />}
                Sort: {sortBy === 'updated' ? 'Last Modified' : 
                       sortBy === 'created' ? 'Created' : 
                       sortBy === 'title' ? 'Title' : 'Alphabetical'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => changeSortBy('updated')}>
                <Clock className="h-4 w-4 mr-2" />
                Last Modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeSortBy('created')}>
                <Calendar className="h-4 w-4 mr-2" />
                Created Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeSortBy('title')}>
                Title
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Filter className="h-3 w-3 mr-1" />
                  Saved Filters
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Saved Filter Combinations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedFilters.map((savedFilter) => (
                  <DropdownMenuItem
                    key={savedFilter.id}
                    onClick={() => applySavedFilter(savedFilter)}
                    className="flex items-center justify-between"
                  >
                    <span>{savedFilter.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedFilter(savedFilter.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save Current Filter */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Save className="h-3 w-3 mr-1" />
              Save Filter
            </Button>
          )}

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-foreground hover:bg-muted/10"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {filters.search && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  Search: "{filters.search}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('search')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  Tag: {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('tags', tag)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {filters.notebooks.map(notebookId => (
                <Badge key={notebookId} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: getNotebookColor(notebookId) }}
                  />
                  {getNotebookName(notebookId)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('notebooks', notebookId)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {filters.favorites && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  <Star className="h-2 w-2 mr-1 fill-current" />
                  Favorites
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('favorites')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {(filters.dateRange.start || filters.dateRange.end) && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  Modified: {filters.dateRange.start ? format(filters.dateRange.start, 'MMM d') : '...'} - {filters.dateRange.end ? format(filters.dateRange.end, 'MMM d') : '...'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('dateRange')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {(filters.createdDateRange.start || filters.createdDateRange.end) && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  Created: {filters.createdDateRange.start ? format(filters.createdDateRange.start, 'MMM d') : '...'} - {filters.createdDateRange.end ? format(filters.createdDateRange.end, 'MMM d') : '...'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => removeFilter('createdDateRange')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Filter Combination</DialogTitle>
            <DialogDescription>
              Give your current filter and sort settings a name to save them for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="bg-input text-foreground border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}