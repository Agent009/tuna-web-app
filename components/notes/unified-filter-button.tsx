"use client";

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnifiedFilterDialog } from './unified-filter-dialog';
import { useNoteFilters } from '@/hooks/use-note-filters';

interface UnifiedFilterButtonProps {
  className?: string;
}

export function UnifiedFilterButton({ className }: UnifiedFilterButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { activeFiltersCount } = useNoteFilters();

  return (
    <>
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

      <UnifiedFilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}