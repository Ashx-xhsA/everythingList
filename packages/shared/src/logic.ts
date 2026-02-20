import { Task, TaskStatus } from './types';

export const getSuggestions = (text: string, tasks: Task[]): string[] => {
  if (!text || text.length < 2) return [];
  const lowerText = text.toLowerCase();
  
  const candidates = tasks.filter(t => 
    (t.status === 'completed' || t.status === 'dismissed') &&
    t.text.toLowerCase().includes(lowerText)
  );
  
  const uniqueTexts = Array.from(new Set(candidates.map(t => t.text)));
  return uniqueTexts.slice(0, 5);
};

export const checkDismissedWarning = (text: string, tasks: Task[]): boolean => {
  const lowerText = text.toLowerCase().trim();
  return tasks.some(t => 
    t.status === 'dismissed' && 
    t.text.toLowerCase().trim() === lowerText
  );
};

export const dismissPageTasks = (pageIndex: number, tasks: Task[]): Task[] => {
  return tasks.map(t => 
    (t.pageIndex === pageIndex && t.status === 'active')
      ? { ...t, status: 'dismissed' as TaskStatus, dismissedAt: Date.now(), updatedAt: Date.now() }
      : t
  );
};

export const completeTaskState = (id: string, tasks: Task[]): Task[] => {
  return tasks.map(t => 
    t.id === id ? { ...t, status: 'completed' as TaskStatus, completedAt: Date.now(), updatedAt: Date.now() } : t
  );
};
