"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, FileText, Filter, Import as SortAsc, Dessert as SortDesc, Calendar, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNotes } from '@/hooks/use-notes';
import { SearchEngine } from '@/lib/search';
import { Note } from '@/lib/types';

interface SearchResultsProps {
  query: string;
  onSelectNote: (note: Note) => void;
  onClose: () => void;
}

type SortOption = 'relevance' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
type FilterOption = 'all' | 'notebooks' | 'notes' | 'content';

const RESULTS_PER_PAGE = 20;

export function SearchResults({ query, onSelectNote, onClose }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { notes, notebooks } = useNotes();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { notebooks: [], notes: [], content: [], total: 0 };

    // Search notebooks
    const matchingNotebooks = notebooks.filter((notebook: any) =>
      notebook.name.toLowerCase().includes(query.toLowerCase()) ||
      notebook.description.toLowerCase().includes(query.toLowerCase())
    );

    // Search notes by title
    const matchingNotesByTitle = notes.filter((note: any) =>
      note.title.toLowerCase().includes(query.toLowerCase()) && !note.isArchived
    );

    // Search notes by content
    const searchEngine = new SearchEngine(notes.filter((note: any) => !note.isArchived));
    const contentResults = searchEngine.search(query);

    // Combine and deduplicate results
    const allNoteResults = [
      ...matchingNotesByTitle.map((note: Note) => ({ ...note, matchType: 'title' as const })),
      ...contentResults.map(result => {
        const note = notes.find((n: Note) => n.id === result.id);
        return note ? { ...note, matchType: 'content' as const, highlights: result.highlights } : null;
      }).filter(Boolean) as Array<Note & { matchType: 'content'; highlights: string[] }>
    ];

    // Remove duplicates (prefer title matches over content matches)
    const uniqueNotes = allNoteResults.reduce((acc, current) => {
      const existing = acc.find((item: any) => item.id === current.id);
      if (!existing || (existing.matchType === 'content' && current.matchType === 'title')) {
        return [...acc.filter((item: any) => item.id !== current.id), current];
      }
      return acc;
    }, [] as typeof allNoteResults);

    return {
      notebooks: matchingNotebooks,
      notes: uniqueNotes,
      content: contentResults,
      total: matchingNotebooks.length + uniqueNotes.length
    };
  }, [query, notes, notebooks]);

  const filteredResults = useMemo(() => {
    let results: Array<{ type: 'notebook' | 'note'; item: any; matchType?: string; highlights?: string[] }> = [];

    if (filterBy === 'all' || filterBy === 'notebooks') {
      results.push(...searchResults.notebooks.map((nb: any) => ({ type: 'notebook' as const, item: nb })));
    }

    if (filterBy === 'all' || filterBy === 'notes' || filterBy === 'content') {
      results.push(...searchResults.notes.map(note => ({ 
        type: 'note' as const, 
        item: note, 
        matchType: note.matchType,
        highlights: 'highlights' in note ? note.highlights : undefined
      })));
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.item.updatedAt || b.item.createdAt).getTime() - 
                 new Date(a.item.updatedAt || a.item.createdAt).getTime();
        case 'date-asc':
          return new Date(a.item.updatedAt || a.item.createdAt).getTime() - 
                 new Date(b.item.updatedAt || b.item.createdAt).getTime();
        case 'title-asc':
          return (a.item.title || a.item.name || '').localeCompare(b.item.title || b.item.name || '');
        case 'title-desc':
          return (b.item.title || b.item.name || '').localeCompare(a.item.title || a.item.name || '');
        case 'relevance':
        default:
          // Notebooks first, then notes by title match, then content matches
          if (a.type !== b.type) {
            return a.type === 'notebook' ? -1 : 1;
          }
          if (a.type === 'note' && b.type === 'note') {
            if (a.matchType !== b.matchType) {
              return a.matchType === 'title' ? -1 : 1;
            }
          }
          return 0;
      }
    });

    return results;
  }, [searchResults, sortBy, filterBy]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getNotebookName = (notebookId: string) => {
    return notebooks.find(nb => nb.id === notebookId)?.name || 'Unknown';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentPreview = (note: Note) => {
    const textBlocks = note.content
      .filter(block => ['paragraph', 'heading1', 'heading2', 'heading3'].includes(block.type))
      .map(block => block.content)
      .join(' ');
    
    return textBlocks.length > 200 
      ? textBlocks.substring(0, 200) + '...'
      : textBlocks || 'No content';
  };

  return (
    <div className="w-96 border-r bg-background/30 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Search Results</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {filteredResults.length} results for "{query}"
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  {filterBy === 'all' ? 'All' : 
                   filterBy === 'notebooks' ? 'Notebooks' :
                   filterBy === 'notes' ? 'Notes' : 'Content'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterBy('all')}>
                  All Results
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterBy('notebooks')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Notebooks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('notes')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {sortBy.includes('desc') ? <SortDesc className="h-3 w-3 mr-1" /> : <SortAsc className="h-3 w-3 mr-1" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                  Relevance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('title-asc')}>
                  Title A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title-desc')}>
                  Title Z-A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {paginatedResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center text-muted-foreground"
            >
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {paginatedResults.map((result, index) => (
                <motion.div
                  key={`${result.type}-${result.item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {result.type === 'notebook' ? (
                    <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: result.item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs">Notebook</Badge>
                          </div>
                          <h3 className="font-medium text-sm">
                            {highlightText(result.item.name, query)}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.item.noteCount} notes
                          </p>
                          {result.item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {highlightText(result.item.description, query)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => onSelectNote(result.item)}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {result.matchType === 'title' ? 'Title Match' : 'Content Match'}
                            </Badge>
                            {result.item.isFavorite && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <h3 className="font-medium text-sm mb-1">
                            {highlightText(result.item.title || 'Untitled', query)}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                            {result.highlights && result.highlights.length > 0 
                              ? highlightText(result.highlights[0], query)
                              : highlightText(getContentPreview(result.item), query)
                            }
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getNotebookName(result.item.notebookId)}</span>
                            <span>•</span>
                            <span>{formatDate(result.item.updatedAt)}</span>
                          </div>
                          {result.item.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {result.item.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {result.item.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{result.item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}