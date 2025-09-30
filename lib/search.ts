import Fuse from 'fuse.js';
import { Note, SearchResult, SearchFilters } from './types';

export class SearchEngine {
  private fuse: Fuse<Note>;

  constructor(notes: Note[]) {
    this.fuse = new Fuse(notes, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'content', weight: 0.3 },
        { name: 'tags', weight: 0.5 }
      ],
      threshold: 0.4,
      includeMatches: true,
      includeScore: true
    });
  }

  search(query: string, filters?: SearchFilters): SearchResult[] {
    if (!query.trim()) return [];

    const results = this.fuse.search(query);
    
    return results
      .map(result => {
        const note = result.item;
        const highlights = this.extractHighlights([...(result.matches || [])]);
        
        return {
          id: note.id,
          title: note.title,
          content: this.getContentPreview(note.content),
          notebookName: '', // Will be populated by the component
          tags: note.tags,
          updatedAt: note.updatedAt,
          highlights
        };
      })
      .filter(result => this.applyFilters(result, filters));
  }

  private extractHighlights(matches: Array<{ value?: string }>): string[] {
    return [...(matches || [] as any[])]
      .map(match => match.value || '')
      .filter(value => value.length > 0)
      .slice(0, 3);
  }

  private getContentPreview(blocks: any[]): string {
    const textBlocks = blocks
      .filter(block => ['paragraph', 'heading1', 'heading2', 'heading3'].includes(block.type))
      .map(block => block.content)
      .join(' ');
    
    return textBlocks.length > 200 
      ? textBlocks.substring(0, 200) + '...'
      : textBlocks;
  }

  private applyFilters(result: SearchResult, filters?: SearchFilters): boolean {
    if (!filters) return true;

    // Apply tag filters
    if (filters.tags.length > 0) {
      const hasMatchingTag = result.tags.some(tag => 
        filters.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Apply date range filters
    if (filters.dateRange.start && result.updatedAt < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && result.updatedAt > filters.dateRange.end) {
      return false;
    }

    return true;
  }
}