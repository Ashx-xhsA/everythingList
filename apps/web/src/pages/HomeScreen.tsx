import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from '../components/TaskItem';
import { TaskModal } from '../components/TaskModal';
import type { Task } from 'shared';
import { v4 as uuidv4 } from 'uuid';
import '../HomeScreen.css';

export const HomeScreen: React.FC = () => {
  const { 
    tasks, currentPageIndex, maxPageIndex, 
    nextPage, goToPage, addTask, isLoading,
    firePage, isPageFull
  } = useTasks();

  const [newTaskText, setNewTaskText] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateWithDetails = () => {
    const newTask: Task = {
      id: uuidv4(),
      text: newTaskText,
      status: 'active',
      pageIndex: currentPageIndex,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setEditingTask(newTask);
    setNewTaskText('');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        if (currentPageIndex > 0) goToPage(currentPageIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, goToPage, currentPageIndex]);

  if (isLoading) return <div className="loading">Loading...</div>;

  const currentTasks = tasks.filter(t => t.pageIndex === currentPageIndex);
  const activeTasksCount = currentTasks.filter(t => t.status === 'active').length;
  const showFireButton = activeTasksCount > 0 && isPageFull(currentPageIndex);

  const handleFire = () => {
    if (window.confirm('Dismiss all tasks on this page?')) {
      firePage(currentPageIndex);
    }
  };

  return (
    <div className="home-screen">
      <header className="page-header">
        <h2>PAGE {currentPageIndex + 1}</h2>
        {showFireButton && (
          <button className="fire-btn" onClick={handleFire} title="Dismiss remaining tasks">✕</button>
        )}
      </header>

      <div className="task-list">
        {currentTasks.length === 0 ? (
          <p className="empty-msg">No tasks on this page.</p>
        ) : (
          currentTasks.map(task => (
             <TaskItem key={task.id} task={task} onEdit={(t) => setEditingTask(t)} />
          ))
        )}
      </div>

      {editingTask && (
        <TaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
          isNew={!tasks.find(t => t.id === editingTask.id)}
        />
      )}

      <div className="input-area">
        <input 
          type="text" 
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          placeholder="New task... (Enter to save)"
          onKeyDown={e => {
            if (e.key === 'Enter' && newTaskText.trim()) {
              addTask(newTaskText.trim());
              setNewTaskText('');
            }
          }}
        />
        <button className="add-details-btn" onClick={handleCreateWithDetails} title="Add with details">+</button>
      </div>

      <nav className="pagination-nav">
        <button onClick={() => goToPage(0)} disabled={currentPageIndex === 0}>{'<<'}</button>
        <button onClick={() => { if(currentPageIndex > 0) goToPage(currentPageIndex - 1); }} disabled={currentPageIndex === 0}>{'<'}</button>
        <span className="page-indicator">{currentPageIndex + 1} / {maxPageIndex + 1}</span>
        <button onClick={nextPage}>{'>'}</button>
        <button onClick={() => goToPage(maxPageIndex)} disabled={currentPageIndex === maxPageIndex}>{'>>'}</button>
      </nav>
    </div>
  );
};
