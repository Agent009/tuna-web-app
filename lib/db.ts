import { Note, Notebook, Task } from './types';

let dbInstance: any | null = null;

// Lazy initialization function that only runs on client-side
export async function getDb(): Promise<any | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!dbInstance) {
    // Dynamically import Dexie only on client-side
    const { default: Dexie } = await import('dexie');
    
    // Define the database class inside the client-side block to avoid SSR issues
    class NotesDatabase extends Dexie {
      notes!: any;
      notebooks!: any;
      tasks!: any;

      constructor() {
        super('NotesDatabase');
        this.version(2).stores({
          notes: 'id, title, notebookId, tags, createdAt, updatedAt, isFavorite, isArchived',
          notebooks: 'id, name, createdAt, updatedAt',
          tasks: 'id, title, noteId, completed, dueDate, priority, flagged, createdAt, updatedAt, order'
        });
      }
    }

    dbInstance = new NotesDatabase();
    
    // Explicitly open the database and wait for it to be ready
    await dbInstance.open();
    
    // Initialize with default notebook
    const notebookCount = await dbInstance.notebooks.count();
    if (notebookCount === 0) {
      await dbInstance.notebooks.add({
        id: 'default',
        name: 'Quick Notes',
        description: 'Your default notebook for quick thoughts',
        color: '#4F46E5',
        icon: 'BookOpen',
        createdAt: new Date(),
        updatedAt: new Date(),
        noteCount: 0
      });
    }

    // Initialize with default "Things to do" note if no tasks note exists
    const tasksNote = await dbInstance.notes.where('title').equals('Things to do').first();
    if (!tasksNote) {
      await dbInstance.notes.add({
        id: 'tasks-default',
        title: 'Things to do',
        content: [{
          id: crypto.randomUUID(),
          type: 'paragraph' as const,
          content: 'Your default task list',
          properties: {},
          children: []
        }],
        notebookId: 'default',
        tags: ['tasks'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
        isArchived: false
      });
    }
    
    // Remove the automatic sync to prevent circular updates
    // Task blocks will be synced through the UI components instead
  }

  return dbInstance;
}