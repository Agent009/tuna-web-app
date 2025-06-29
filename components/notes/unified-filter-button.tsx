"use client";

import { useState } from 'react';
import { Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { UnifiedFilterDialog } from './unified-filter-dialog';
import { useNoteFilters } from '@/hooks/use-note-filters';

interface UnifiedFilterButtonProps {
  className?: string;
  selectedFilter?: string;
}

export function UnifiedFilterButton({ className, selectedFilter }: UnifiedFilterButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    activeFiltersCount,
    sortBy,
    sortAscending,
    changeSortBy,
    toggleSortDirection
  } = useNoteFilters();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className={`relative border-border text-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFiltersCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 h-5 w-5 p-0 text-xs bg-accent text-accent-foreground rounded-full flex items-center justify-center"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Sort Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
            {sortAscending ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => changeSortBy('updated')}>
            Last Modified {sortBy === 'updated' && (sortAscending ? '↑' : '↓')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeSortBy('created')}>
            Created Date {sortBy === 'created' && (sortAscending ? '↑' : '↓')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeSortBy('title')}>
            Title {sortBy === 'title' && (sortAscending ? '↑' : '↓')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleSortDirection}>
            {sortAscending ? 'Sort Descending' : 'Sort Ascending'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UnifiedFilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedFilter={selectedFilter}
      />
    </div>
  );
}