import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from 'shared';
import { completeTaskState, dismissPageTasks, getSuggestions, checkDismissedWarning } from 'shared';

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_FONT_SIZE = 18;

interface TaskContextType {
  tasks: Task[];
  currentPageIndex: number;
  maxPageIndex: number;
  addTask: (text: string, details?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  nextPage: () => void;
  goToPage: (index: number) => void;
  firePage: (pageIndex: number) => void;
  getSuggestions: (text: string) => string[];
  checkDismissedWarning: (text: string) => boolean;
  actionTakenOnCurrentPage: boolean;
  markActionTaken: () => void;
  isLoading: boolean;
  pageSize: number;
  fontSize: number;
  setPageSize: (size: number) => void;
  setFontSize: (size: number) => void;
  isPageFull: (pageIndex: number) => boolean;
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: {
    tasks?: Task[];
    settings?: { pageSize?: number; fontSize?: number };
    pageCapacities?: Record<number, number>;
    closedPages?: number[];
  }) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE);
  const [pageCapacities, setPageCapacities] = useState<Record<number, number>>({});
  const [closedPages, setClosedPages] = useState<number[]>([]);
  const [actionTakenOnCurrentPage, setActionTakenOnCurrentPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const maxPageIndex = tasks.length > 0 ? Math.max(...tasks.map(t => t.pageIndex)) : 0;

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-content-size', `${fontSize}px`);
  }, [fontSize]);

  const saveTasks = React.useCallback(() => {
    if (isLoading) return;
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('currentPageIndex', currentPageIndex.toString());
      localStorage.setItem('pageSize', pageSize.toString());
      localStorage.setItem('fontSize', fontSize.toString());
      localStorage.setItem('pageCapacities', JSON.stringify(pageCapacities));
      localStorage.setItem('closedPages', JSON.stringify(closedPages));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  }, [isLoading, tasks, currentPageIndex, pageSize, fontSize, pageCapacities, closedPages]);

  useEffect(() => {
    saveTasks();
  }, [saveTasks]);

  const loadTasks = () => {
    try {
      const storedTasks = localStorage.getItem('tasks');
      const storedPageIndex = localStorage.getItem('currentPageIndex');
      const storedPageSize = localStorage.getItem('pageSize');
      const storedFontSize = localStorage.getItem('fontSize');
      const storedCapacities = localStorage.getItem('pageCapacities');
      const storedClosedPages = localStorage.getItem('closedPages');

      let parsedTasks: Task[] = [];
      if (storedTasks) {
        parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
      }
      
      if (storedPageIndex) setCurrentPageIndex(parseInt(storedPageIndex, 10));
      if (storedPageSize) setPageSizeState(parseInt(storedPageSize, 10));
      if (storedFontSize) setFontSizeState(parseInt(storedFontSize, 10));
      if (storedCapacities) setPageCapacities(JSON.parse(storedCapacities));
      if (storedClosedPages) setClosedPages(JSON.parse(storedClosedPages));

      if (parsedTasks.length > 0 && (!storedCapacities || Object.keys(JSON.parse(storedCapacities)).length === 0)) {
          const distinctPages = Array.from(new Set(parsedTasks.map(t => t.pageIndex)));
          const migrationCaps: Record<number, number> = {};
          distinctPages.forEach(p => {
              migrationCaps[p] = 5;
          });
          setPageCapacities(migrationCaps);
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoading(false);
    }
  };


  const isPageFull = (pageIndex: number) => {
    const count = tasks.filter(t => t.pageIndex === pageIndex).length;
    const capacity = pageCapacities[pageIndex] || pageSize;
    return count >= capacity;
  };

  const addTask = (text: string, details?: string) => {
    let targetPageIndex = 0;
    if (tasks.length > 0) {
      const lastPage = maxPageIndex;
      const isClosed = closedPages.includes(lastPage);
      
      if (!isClosed && !isPageFull(lastPage)) {
        targetPageIndex = lastPage;
      } else {
        targetPageIndex = lastPage + 1;
      }
    }

    const newTask: Task = {
      id: uuidv4(),
      text,
      details,
      status: 'active',
      pageIndex: targetPageIndex,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setTasks(prev => [...prev, newTask]);
    
    if (targetPageIndex > maxPageIndex || !pageCapacities[targetPageIndex]) {
      setPageCapacities(prev => ({ ...prev, [targetPageIndex]: pageSize }));
    }
    
    if (targetPageIndex !== currentPageIndex) {
      setCurrentPageIndex(targetPageIndex);
    } else if (tasks.length === 0) {
      setCurrentPageIndex(0);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completeTask = (id: string) => {
    setActionTakenOnCurrentPage(true);
    setTasks(prev => completeTaskState(id, prev));
  };

  const firePage = (pageIndex: number) => {
    setTasks(prev => dismissPageTasks(pageIndex, prev));
  };

  const markActionTaken = () => setActionTakenOnCurrentPage(true);

  const nextPage = () => {
    const isLastPage = currentPageIndex === maxPageIndex;
    
    if (!actionTakenOnCurrentPage && !isLastPage) {
      setTasks(prev => dismissPageTasks(currentPageIndex, prev));
    }

    let nextIndex = currentPageIndex;
    
    if (isLastPage) {
      let foundActive = false;
      for (let i = 0; i <= maxPageIndex; i++) {
        const hasActive = tasks.some(t => t.pageIndex === i && t.status === 'active');
        if (hasActive) {
          nextIndex = i;
          foundActive = true;
          break;
        }
      }
      if (!foundActive) {
        nextIndex = maxPageIndex;
      }
    } else {
      nextIndex = currentPageIndex + 1;
    }

    setCurrentPageIndex(nextIndex);
    setActionTakenOnCurrentPage(false);
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
    const lastPage = maxPageIndex;
    const count = tasks.filter(t => t.pageIndex === lastPage).length;
    
    if (newSize < count) {
      if (!closedPages.includes(lastPage)) {
        setClosedPages(prev => [...prev, lastPage]);
      }
    } else {
      setPageCapacities(prev => ({ ...prev, [lastPage]: newSize }));
      setClosedPages(prev => prev.filter(p => p !== lastPage));
    }
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
  };

  const resetData = () => {
    localStorage.clear();
    setTasks([]);
    setCurrentPageIndex(0);
    setPageSizeState(5);
    setFontSizeState(18);
    setPageCapacities({});
    setClosedPages([]);
    setActionTakenOnCurrentPage(false);
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings: {
        pageSize,
        fontSize,
      },
      pageCapacities,
      closedPages,
      tasks,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `autofocus-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData: {
    tasks?: Task[];
    settings?: { pageSize?: number; fontSize?: number };
    pageCapacities?: Record<number, number>;
    closedPages?: number[];
  }) => {
    try {
      if (!jsonData || typeof jsonData !== 'object') throw new Error('Invalid JSON data');

      if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
        setTasks(jsonData.tasks);
      }

      if (jsonData.settings) {
        if (jsonData.settings.pageSize) setPageSizeState(jsonData.settings.pageSize);
        if (jsonData.settings.fontSize) setFontSize(jsonData.settings.fontSize);
      }

      if (jsonData.pageCapacities) {
        setPageCapacities(jsonData.pageCapacities);
      }

      if (jsonData.closedPages) {
        setClosedPages(jsonData.closedPages);
      }

      // Reset to first active page or page 0
      setCurrentPageIndex(0);
      setActionTakenOnCurrentPage(false);
      
      alert('Data imported successfully!');
    } catch (e) {
      console.error('Failed to import data', e);
      alert('Failed to import data. Please check the file format.');
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks, currentPageIndex, maxPageIndex,
      addTask, updateTask, completeTask, deleteTask,
      nextPage, goToPage: setCurrentPageIndex, firePage,
      getSuggestions: (text) => getSuggestions(text, tasks),
      checkDismissedWarning: (text) => checkDismissedWarning(text, tasks),
      actionTakenOnCurrentPage, markActionTaken,
      isLoading, pageSize, fontSize, setPageSize, setFontSize, isPageFull, resetData,
      exportData, importData
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};
