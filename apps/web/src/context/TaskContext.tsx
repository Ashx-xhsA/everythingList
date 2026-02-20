import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Settings } from 'shared';
import { completeTaskState, dismissPageTasks, getSuggestions, checkDismissedWarning, onAuthChange, loginWithEmail, registerWithEmail, logout, subscribeToTasks, syncTaskToFirestore, syncTasksToFirestore, deleteTaskFromFirestore, subscribeToSettings, syncSettingsToFirestore } from 'shared';

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
  importData: (jsonData: any) => void;
  
  // Auth additions
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginUser: (email: string, pass: string) => Promise<void>;
  registerUser: (email: string, pass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE);
  const [pageCapacities, setPageCapacities] = useState<Record<number, number>>({});
  const [closedPages, setClosedPages] = useState<number[]>([]);
  const [actionTakenOnCurrentPage, setActionTakenOnCurrentPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const maxPageIndex = tasks.length > 0 ? Math.max(...tasks.map(t => t.pageIndex)) : 0;

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthChange((user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setIsAuthenticated(false);
        setTasks([]); // Clear local tasks on logout
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync data when userId is present
  useEffect(() => {
    let unsubscribeTasks: () => void;
    let unsubscribeSettings: () => void;

    if (userId) {
      const storedPageIndex = localStorage.getItem('currentPageIndex');
      if (storedPageIndex) setCurrentPageIndex(parseInt(storedPageIndex, 10));

      unsubscribeTasks = subscribeToTasks(userId, (fetchedTasks) => {
        setTasks(fetchedTasks);
        setIsLoading(false);
      });

      unsubscribeSettings = subscribeToSettings(userId, (settings) => {
        if (settings) {
          if (settings.pageSize) setPageSizeState(settings.pageSize);
          if (settings.fontSize) setFontSizeState(settings.fontSize);
          if (settings.pageCapacities) setPageCapacities(settings.pageCapacities);
          if (settings.closedPages) setClosedPages(settings.closedPages);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [userId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-content-size', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentPageIndex', currentPageIndex.toString());
    }
  }, [currentPageIndex, isAuthenticated]);

  const loginUser = async (email: string, pass: string) => {
    await loginWithEmail(email, pass);
  };

  const registerUser = async (email: string, pass: string) => {
    await registerWithEmail(email, pass);
  };

  const logoutUser = async () => {
    await logout();
  };

  const syncSettings = (updates: Partial<Settings>) => {
    if (!userId) return;
    const newSettings = {
      pageSize, fontSize, pageCapacities, closedPages, updatedAt: Date.now(), ...updates
    };
    syncSettingsToFirestore(userId, newSettings);
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
    if (userId) syncTaskToFirestore(userId, newTask);
    
    if (targetPageIndex > maxPageIndex || !pageCapacities[targetPageIndex]) {
      const newPageCapacities = { ...pageCapacities, [targetPageIndex]: pageSize };
      setPageCapacities(newPageCapacities);
      syncSettings({ pageCapacities: newPageCapacities });
    }
    
    if (targetPageIndex !== currentPageIndex) {
      setCurrentPageIndex(targetPageIndex);
    } else if (tasks.length === 0) {
      setCurrentPageIndex(0);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t);
    setTasks(updatedTasks);
    const changedTask = updatedTasks.find(t => t.id === id);
    if (userId && changedTask) syncTaskToFirestore(userId, changedTask);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (userId) deleteTaskFromFirestore(userId, id);
  };

  const completeTask = (id: string) => {
    setActionTakenOnCurrentPage(true);
    const newTasks = completeTaskState(id, tasks);
    setTasks(newTasks);
    const changedTask = newTasks.find(t => t.id === id);
    if (userId && changedTask) syncTaskToFirestore(userId, changedTask);
  };

  const firePage = (pageIndex: number) => {
    const newTasks = dismissPageTasks(pageIndex, tasks);
    setTasks(newTasks);
    if (userId) {
      const dismissed = newTasks.filter(t => t.pageIndex === pageIndex && t.status === 'dismissed');
      syncTasksToFirestore(userId, dismissed);
    }
  };

  const markActionTaken = () => setActionTakenOnCurrentPage(true);

  const nextPage = () => {
    const isLastPage = currentPageIndex === maxPageIndex;
    
    let newTasks = tasks;
    if (!actionTakenOnCurrentPage && !isLastPage) {
      newTasks = dismissPageTasks(currentPageIndex, tasks);
      setTasks(newTasks);
      if (userId) {
        const dismissed = newTasks.filter(t => t.pageIndex === currentPageIndex && t.status === 'dismissed');
        syncTasksToFirestore(userId, dismissed);
      }
    }

    let nextIndex = currentPageIndex;
    
    if (isLastPage) {
      let foundActive = false;
      for (let i = 0; i <= maxPageIndex; i++) {
        const hasActive = newTasks.some(t => t.pageIndex === i && t.status === 'active');
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
    let newClosedPages = [...closedPages];
    let newPageCapacities = { ...pageCapacities };
    
    if (newSize < count) {
      if (!newClosedPages.includes(lastPage)) {
        newClosedPages.push(lastPage);
        setClosedPages(newClosedPages);
      }
    } else {
      newPageCapacities[lastPage] = newSize;
      setPageCapacities(newPageCapacities);
      newClosedPages = newClosedPages.filter(p => p !== lastPage);
      setClosedPages(newClosedPages);
    }
    syncSettings({ pageSize: newSize, pageCapacities: newPageCapacities, closedPages: newClosedPages });
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    syncSettings({ fontSize: size });
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
    
    if (userId) {
      tasks.forEach(t => deleteTaskFromFirestore(userId, t.id));
      syncSettings({ pageSize: 5, fontSize: 18, pageCapacities: {}, closedPages: [] });
    }
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

  const importData = (jsonData: any) => {
    try {
      if (!jsonData || typeof jsonData !== 'object') throw new Error('Invalid JSON data');

      let newTasks = tasks;
      if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
        newTasks = jsonData.tasks;
        setTasks(newTasks);
        if (userId) syncTasksToFirestore(userId, newTasks);
      }

      let newSettings: Partial<Settings> = {};
      if (jsonData.settings) {
        if (jsonData.settings.pageSize) {
          setPageSizeState(jsonData.settings.pageSize);
          newSettings.pageSize = jsonData.settings.pageSize;
        }
        if (jsonData.settings.fontSize) {
          setFontSizeState(jsonData.settings.fontSize);
          newSettings.fontSize = jsonData.settings.fontSize;
        }
      }

      if (jsonData.pageCapacities) {
        setPageCapacities(jsonData.pageCapacities);
        newSettings.pageCapacities = jsonData.pageCapacities;
      }

      if (jsonData.closedPages) {
        setClosedPages(jsonData.closedPages);
        newSettings.closedPages = jsonData.closedPages;
      }

      if (userId && Object.keys(newSettings).length > 0) {
        syncSettings(newSettings);
      }

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
      exportData, importData,
      isAuthenticated, isAuthLoading, loginUser, registerUser, logoutUser
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
