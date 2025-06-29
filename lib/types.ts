export interface Note {
  id: string;
  title: string;
  content: Block[];
  notebookId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  isArchived: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  noteCount: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: Record<string, any>;
  children?: Block[];
}

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted-list'
  | 'numbered-list'
  | 'todo'
  | 'task'
  | 'code'
  | 'quote'
  | 'divider'
  | 'table'
  | 'image'
  | 'embed';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  notebookName: string;
  tags: string[];
  updatedAt: Date;
  highlights: string[];
}

export interface SearchFilters {
  notebooks: string[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  favorites: boolean;
  archived: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  reminder?: Date;
  priority: 'low' | 'medium' | 'high';
  flagged: boolean;
  noteId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface TaskFilters {
  status: 'all' | 'pending' | 'completed';
  priority: 'all' | 'low' | 'medium' | 'high';
  flagged: boolean | null;
  noteId: string | null;
}

export type TaskSortBy = 'dueDate' | 'priority' | 'created' | 'updated' | 'title';
export interface NoteFilters {
  search: string;
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  createdDateRange: {
    start: Date | null;
    end: Date | null;
  };
  favorites: boolean | null;
  notebooks: string[];
}

export type NoteSortBy = 'updated' | 'created' | 'title' | 'alphabetical';

export interface SavedFilter {
  id: string;
  name: string;
  filters: NoteFilters;
  sortBy: NoteSortBy;
  sortAscending: boolean;
  createdAt: Date;
}