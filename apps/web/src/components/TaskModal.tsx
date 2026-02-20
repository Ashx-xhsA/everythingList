import React, { useState, useEffect } from 'react';
import type { Task } from 'shared';
import { useTasks } from '../context/TaskContext';
import './TaskModal.css';

interface Props {
  task: Task;
  onClose: () => void;
  isNew?: boolean;
}

export const TaskModal: React.FC<Props> = ({ task, onClose, isNew }) => {
  const { updateTask, getSuggestions, deleteTask, addTask } = useTasks();
  
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [text, setText] = useState(task.text);
  const [details, setDetails] = useState(task.details || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'edit' && text.length > 1) {
      setSuggestions(getSuggestions(text));
    } else {
      setSuggestions([]);
    }
  }, [text, mode, getSuggestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSaveAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSaveAndClose = () => {
    if (text.trim() === '') {
      if (task.text === '' && !isNew) {
        deleteTask(task.id);
      }
    } else {
      if (isNew) {
        addTask(text, details);
      } else {
        updateTask(task.id, { text, details });
      }
    }
    onClose();
  };

  const handleDone = () => {
    if (text.trim() === '') return;
    setMode('preview');
  };

  return (
    <div className="modal-overlay" onClick={handleSaveAndClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'edit' ? (text ? text : 'NEW TASK') : 'PREVIEW'}</h2>
        </div>

        {mode === 'edit' ? (
          <div className="edit-mode">
            <input 
              autoFocus
              className="task-title-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Task name..."
              onKeyDown={e => {
                if(e.key === 'Enter') handleDone();
              }}
            />
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(s => (
                  <div key={s} className="suggestion-item" onClick={() => setText(s)}>
                    {s}
                  </div>
                ))}
              </div>
            )}
            <textarea 
              className="task-details-input"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Add details... (optional)"
              rows={8}
            />
            <div className="modal-actions">
              <button className="done-btn" onClick={handleDone}>| DONE |</button>
            </div>
          </div>
        ) : (
          <div className="preview-mode" onClick={() => setMode('edit')}>
            <h3 className="preview-title">{text}</h3>
            {details ? (
              <p className="preview-details">{details}</p>
            ) : (
              <p className="empty-details">No details provided.</p>
            )}
            <p className="preview-hint">(Click anywhere to edit)</p>
          </div>
        )}
      </div>
    </div>
  );
};
