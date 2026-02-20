import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus } from '../types';

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
  firstActivePageIndex: number;
  lastActivePageIndex: number;
  pageSize: number;
  fontSize: number;
  setPageSize: (size: number) => void;
  setFontSize: (size: number) => void;
  resetData: () => void;
  isPageFull: (pageIndex: number) => boolean;
  exportData: () => object;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [pageCapacities, setPageCapacities] = useState<Record<number, number>>({});
  const [closedPages, setClosedPages] = useState<number[]>([]);
  
  const [actionTakenOnCurrentPage, setActionTakenOnCurrentPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to get max page index
  const maxPageIndex = tasks.length > 0 
    ? Math.max(...tasks.map(t => t.pageIndex)) 
    : 0;

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      const storedPageIndex = await AsyncStorage.getItem('currentPageIndex');
      const storedPageSize = await AsyncStorage.getItem('pageSize');
      const storedFontSize = await AsyncStorage.getItem('fontSize');
      const storedCapacities = await AsyncStorage.getItem('pageCapacities');
      const storedClosedPages = await AsyncStorage.getItem('closedPages');

      let parsedTasks: Task[] = [];
      if (storedTasks) {
        parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
      }
      
      if (storedPageIndex) setCurrentPageIndex(parseInt(storedPageIndex, 10));
      if (storedPageSize) setPageSizeState(parseInt(storedPageSize, 10));
      if (storedFontSize) setFontSize(parseInt(storedFontSize, 10));
      if (storedCapacities) setPageCapacities(JSON.parse(storedCapacities));
      if (storedClosedPages) setClosedPages(JSON.parse(storedClosedPages));

      // Migration: If we have tasks but no capacities, implies legacy (size 5).
      // Snapshot all used pages to 5.
      if (parsedTasks.length > 0 && (!storedCapacities || Object.keys(JSON.parse(storedCapacities)).length === 0)) {
          const distinctPages = Array.from(new Set(parsedTasks.map(t => t.pageIndex)));
          const migrationCaps: Record<number, number> = {};
          distinctPages.forEach(p => {
              migrationCaps[p] = 5; // Legacy default
          });
          setPageCapacities(migrationCaps);
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      await AsyncStorage.setItem('currentPageIndex', currentPageIndex.toString());
      await AsyncStorage.setItem('pageSize', pageSize.toString());
      await AsyncStorage.setItem('fontSize', fontSize.toString());
      await AsyncStorage.setItem('pageCapacities', JSON.stringify(pageCapacities));
      await AsyncStorage.setItem('closedPages', JSON.stringify(closedPages));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  };

  const addTask = (text: string, details?: string) => {
    console.log("addTask called with:", text);
    // Determine page for new task
    // It should go to the last page. If last page is full, increment max page.
    // Important: we calculate fullness based on *all* tasks ever assigned to that page, 
    // not just active ones, to maintain the "notebook page" metaphor.
    
    let targetPageIndex = 0;
    if (tasks.length > 0) {
      const lastPage = maxPageIndex;
      
      // Check if last page is strictly closed or full
      // Logic for new implementation: 
      // If page is in `closedPages`, it's closed (from decreasing size).
      // If pageItems >= capacity, it's full.
      
      const isClosed = closedPages.includes(lastPage);
      const capacity = pageCapacities[lastPage] || pageSize;
      const count = tasks.filter(t => t.pageIndex === lastPage).length;
      const isFull = count >= capacity;

      if (!isClosed && !isFull) {
        targetPageIndex = lastPage;
      } else {
        targetPageIndex = lastPage + 1;
      }
    }

    try {
        const newTask: Task = {
          id: uuidv4(),
          text,
          details,
          status: 'active',
          pageIndex: targetPageIndex,
          createdAt: Date.now(),
        };

        console.log("Creating new task:", newTask);
        setTasks(prev => [...prev, newTask]);
        
        // If we created a new page, record its capacity
        if (targetPageIndex > maxPageIndex) {
             setPageCapacities(prev => ({
                 ...prev,
                 [targetPageIndex]: pageSize
             }));
        } else if (!pageCapacities[targetPageIndex]) {
            // First time logic fallback
             setPageCapacities(prev => ({
                 ...prev,
                 [targetPageIndex]: pageSize
             }));
        }
        
        // Always switch to the page where the task was added
        if (targetPageIndex !== currentPageIndex) {
            setCurrentPageIndex(targetPageIndex);
        } else if (tasks.length === 0) {
            // If we were on an empty list, ensure we are on the right page (0)
            setCurrentPageIndex(0);
        }
    } catch (e) {
        console.error("Error creating task:", e);
    }
  };
  


  const updateTask = (id: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  
  const deleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completeTask = (id: string) => {
    setActionTakenOnCurrentPage(true);
    
    // 1. Mark as completed
    const taskToComplete = tasks.find(t => t.id === id);
    if (!taskToComplete) return;

    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'completed' as TaskStatus, completedAt: Date.now() } : t
    ));
  };

  const firePage = (pageIndex: number) => {
    // Dismiss all ACTIVE tasks on this page
    setTasks(prev => prev.map(t => 
      (t.pageIndex === pageIndex && t.status === 'active')
        ? { ...t, status: 'dismissed' as TaskStatus, dismissedAt: Date.now() }
        : t
    ));
  };

  const getSuggestions = (text: string): string[] => {
    if (!text || text.length < 2) return [];
    const lowerText = text.toLowerCase();
    
    // Suggest from: Completed tasks (Recurring) AND Dismissed tasks (Restoring)
    // Filter duplicates
    const candidates = tasks.filter(t => 
      (t.status === 'completed' || t.status === 'dismissed') &&
      t.text.toLowerCase().includes(lowerText)
    );
    
    // Return unique texts, max 5
    const uniqueTexts = Array.from(new Set(candidates.map(t => t.text)));
    return uniqueTexts.slice(0, 5);
  };

  const checkDismissedWarning = (text: string): boolean => {
    // Check if this text matches any dismissed task
    // Exact match or fuzzy? Let's do exact match (case insensitive) for now
    const lowerText = text.toLowerCase().trim();
    return tasks.some(t => 
      t.status === 'dismissed' && 
      t.text.toLowerCase().trim() === lowerText
    );
  };

  const markActionTaken = () => {
    setActionTakenOnCurrentPage(true);
  };

  const nextPage = () => {
    // Logic:
    // If NOT actionTakenOnCurrentPage AND NOT (currentPage === maxPageIndex)
    // Then dismiss all ACTIVE items on currentPageIndex.
    
    const isLastPage = currentPageIndex === maxPageIndex;
    
    if (!actionTakenOnCurrentPage && !isLastPage) {
      // Dismiss active items on this page
      setTasks(prev => prev.map(t => 
        (t.pageIndex === currentPageIndex && t.status === 'active')
          ? { ...t, status: 'dismissed' as TaskStatus }
          : t
      ));
    }

    // Find next page
    // "Once you’ve finished with the final page, re-start at the first page that is still active."
    let nextIndex = currentPageIndex;
    
    if (isLastPage) {
      // Loop back to start, find first active page
      // We search from 0 up to maxPageIndex
      // A page is "active" if it has at least one 'active' task.
      let foundActive = false;
      for (let i = 0; i <= maxPageIndex; i++) {
        const hasActive = tasks.some(t => t.pageIndex === i && t.status === 'active');
        if (hasActive) {
          nextIndex = i;
          foundActive = true;
          break;
        }
      }
      // If no active pages found (everything done/dismissed), we stay on last page (or new page?)
      // Logic implies if everything is done, we are just waiting on the last page for new input.
      if (!foundActive) {
        nextIndex = maxPageIndex;
      }
    } else {
      // Just go to next linear page
      nextIndex = currentPageIndex + 1;
    }

    setCurrentPageIndex(nextIndex);
    setActionTakenOnCurrentPage(false);
  };

    const isPageFull = (pageIndex: number) => {
        const count = tasks.filter(t => t.pageIndex === pageIndex).length;
        const capacity = pageCapacities[pageIndex] || pageSize;
        return count >= capacity;
    };

    const setPageSize = (newSize: number) => {
        setPageSizeState(newSize);
        // Logic: 
        // 1. All existing pages keep their capacity -> Handled by `pageCapacities` being stored.
        // 2. The *current last page* might need handling.
        // "If new size < items on last page: Immediately close it..."
        // "If new size >= items: Adopt new capacity."
        
        const lastPage = maxPageIndex;
        const count = tasks.filter(t => t.pageIndex === lastPage).length;
        
        if (newSize < count) {
            // Close it. It becomes "History". Its capacity is already fixed in `pageCapacities` or we set it now.
            // Since we lazily set capacities, we should ensure it's set.
            // Actually, if we close it, we should snapshot its current capacity (which might be the OLD pageSize).
            // But wait, if we are reducing size, and it hasMORE items than new size, we "close" it.
            // It effectively retains its current items.
            if (!closedPages.includes(lastPage)) {
                setClosedPages(prev => [...prev, lastPage]);
            }
        } else {
            // New size >= count.
            // "Current last page adopts new capacity".
            // So we update `pageCapacities[lastPage]` to `newSize`.
            setPageCapacities(prev => ({
                ...prev,
                [lastPage]: newSize
            }));
            
            // Also ensure it's NOT closed
            setClosedPages(prev => prev.filter(p => p !== lastPage));
        }
    };
    
    const setFontSizeAction = (newSize: number) => {
        setFontSize(newSize);
    };

    const resetData = async () => {
        try {
            await AsyncStorage.clear();
            setTasks([]);
            setCurrentPageIndex(0);
            setPageSizeState(25); // Default per request
            setFontSize(18); // Default
            setPageCapacities({});
            setClosedPages([]);
            setActionTakenOnCurrentPage(false);
        } catch(e) {
            console.error("Failed to reset", e);
        }
    };

    const exportData = () => {
        return {
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
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            currentPageIndex,
            maxPageIndex,
            pageSize,
            fontSize,
            addTask,
            updateTask,
            completeTask,
            deleteTask,
            nextPage,
            goToPage: (index: number) => setCurrentPageIndex(index),
            firePage,
            getSuggestions,
            checkDismissedWarning,
            actionTakenOnCurrentPage,
            markActionTaken,
            isLoading,
            firstActivePageIndex: (() => {
                for (let i = 0; i <= maxPageIndex; i++) {
                    if (tasks.some(t => t.pageIndex === i && t.status === 'active')) {
                        return i;
                    }
                }
                return 0; 
            })(),
            lastActivePageIndex: maxPageIndex,
            setPageSize,
            setFontSize: setFontSizeAction,
            resetData,
            isPageFull,
            exportData
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
