import { useEffect } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Note, NoteFilters, NoteSortBy, SavedFilter } from '@/lib/types';
import { useNotes } from './use-notes';

const DEFAULT_FILTERS: NoteFilters = {
  search: '',
  tags: [],
  dateRange: { start: null, end: null },
  createdDateRange: { start: null, end: null },
  favorites: null,
  notebooks: []
};

export function useNoteFilters() {
  const { notes, notebooks } = useNotes();
  const [filters, setFilters] = useState<NoteFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<NoteSortBy>('updated');
  const [sortAscending, setSortAscending] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('noteflow-saved-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed.map((filter: any) => ({
          ...filter,
          createdAt: new Date(filter.createdAt),
          filters: {
            ...filter.filters,
            dateRange: {
              start: filter.filters.dateRange.start ? new Date(filter.filters.dateRange.start) : null,
              end: filter.filters.dateRange.end ? new Date(filter.filters.dateRange.end) : null
            },
            createdDateRange: {
              start: filter.filters.createdDateRange.start ? new Date(filter.filters.createdDateRange.start) : null,
              end: filter.filters.createdDateRange.end ? new Date(filter.filters.createdDateRange.end) : null
            }
          }
        })));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('noteflow-saved-filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  // Load filter state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('noteflow-filter-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setFilters({
          ...parsed.filters,
          dateRange: {
            start: parsed.filters.dateRange.start ? new Date(parsed.filters.dateRange.start) : null,
            end: parsed.filters.dateRange.end ? new Date(parsed.filters.dateRange.end) : null
          },
          createdDateRange: {
            start: parsed.filters.createdDateRange.start ? new Date(parsed.filters.createdDateRange.start) : null,
            end: parsed.filters.createdDateRange.end ? new Date(parsed.filters.createdDateRange.end) : null
          }
        });
        setSortBy(parsed.sortBy || 'updated');
        setSortAscending(parsed.sortAscending !== undefined ? parsed.sortAscending : false);
      } catch (error) {
        console.error('Failed to load filter state:', error);
      }
    }
  }, []);

  // Save filter state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      filters,
      sortBy,
      sortAscending
    };
    localStorage.setItem('noteflow-filter-state', JSON.stringify(state));
  }, [filters, sortBy, sortAscending]);

  // Filter notes based on current filters
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Search filter
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(searchTerm);
        const contentMatch = note.content.some(block =>
          block.content.toLowerCase().includes(searchTerm)
        );
        const tagMatch = note.tags.some(tag =>
          tag.toLowerCase().includes(searchTerm)
        );

        if (!titleMatch && !contentMatch && !tagMatch) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          note.tags.includes(filterTag)
        );
        if (!hasMatchingTag) return false;
      }

      // Notebooks filter
      if (filters.notebooks.length > 0) {
        if (!filters.notebooks.includes(note.notebookId)) {
          return false;
        }
      }

      // Favorites filter
      if (filters.favorites !== null) {
        if (note.isFavorite !== filters.favorites) {
          return false;
        }
      }

      // Updated date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const noteDate = note.updatedAt;
        if (filters.dateRange.start && noteDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && noteDate > filters.dateRange.end) {
          return false;
        }
      }

      // Created date range filter
      if (filters.createdDateRange.start || filters.createdDateRange.end) {
        const noteDate = note.createdAt;
        if (filters.createdDateRange.start && noteDate < filters.createdDateRange.start) {
          return false;
        }
        if (filters.createdDateRange.end && noteDate > filters.createdDateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [notes, filters]);

  // Sort filtered notes
  const sortedNotes = useMemo(() => {
    const sorted = [...filteredNotes].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'title':
        case 'alphabetical':
          comparison = (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
          break;
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      }

      return sortAscending ? comparison : -comparison;
    });

    return sorted;
  }, [filteredNotes, sortBy, sortAscending]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof NoteFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSortBy('updated');
    setSortAscending(false);
  }, []);

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortAscending(prev => !prev);
  }, []);

  // Change sort by
  const changeSortBy = useCallback((newSortBy: NoteSortBy) => {
    if (sortBy === newSortBy) {
      setSortAscending(prev => !prev);
    } else {
      setSortBy(newSortBy);
      setSortAscending(false);
    }
  }, [sortBy]);

  // Save current filter combination
  const saveCurrentFilter = useCallback((name: string) => {
    const newSavedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters },
      sortBy,
      sortAscending,
      createdAt: new Date()
    };

    setSavedFilters(prev => [...prev, newSavedFilter]);
    return newSavedFilter;
  }, [filters, sortBy, sortAscending]);

  // Apply saved filter
  const applySavedFilter = useCallback((savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    setSortBy(savedFilter.sortBy);
    setSortAscending(savedFilter.sortAscending);
  }, []);

  // Delete saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Get all unique tags from notes
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.tags.length > 0) count++;
    if (filters.notebooks.length > 0) count++;
    if (filters.favorites !== null) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.createdDateRange.start || filters.createdDateRange.end) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0;
  }, [activeFiltersCount]);

  return {
    // Data
    filteredNotes: sortedNotes,
    filters,
    sortBy,
    sortAscending,
    savedFilters,
    availableTags,
    activeFiltersCount,

    // Actions
    updateFilter,
    clearFilters,
    changeSortBy,
    toggleSortDirection,
    saveCurrentFilter,
    applySavedFilter,
    deleteSavedFilter,

    // Computed
    totalFilteredCount: sortedNotes.length,
    hasActiveFilters
  };
}