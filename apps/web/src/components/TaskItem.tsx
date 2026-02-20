import React, { useState } from 'react';
import type { Task } from 'shared';
import { useTasks } from '../context/TaskContext';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<Props> = ({ task, onEdit }) => {
  const { completeTask } = useTasks();
  const [expanded, setExpanded] = useState(false);

  const isCompleted = task.status === 'completed';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'active') {
      completeTask(task.id);
    }
  };

  return (
    <div 
      className={`task-item ${task.status}`} 
      onClick={() => setExpanded(!expanded)}
      onDoubleClick={() => onEdit(task)}
    >
      <div className="task-header">
        <button className="checkbox" onClick={handleToggle} disabled={task.status !== 'active'}>
          {isCompleted ? '☑' : '☐'}
        </button>
        <span className="task-text">{task.text}</span>
      </div>
      {expanded && (
        <div className="task-details">
          {task.details && <p>{task.details}</p>}
          <button className="edit-task-btn" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            EDIT DETAILS
          </button>
        </div>
      )}
    </div>
  );
};
