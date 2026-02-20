import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import './LogPage.css';

export const LogPage: React.FC = () => {
  const { tasks } = useTasks();
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'dismissed');
  
  const filteredTasks = completedTasks.filter(t => {
    const d = new Date(t.completedAt || t.dismissedAt || t.createdAt);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  filteredTasks.sort((a, b) => {
    const timeA = a.completedAt || a.dismissedAt || a.createdAt;
    const timeB = b.completedAt || b.dismissedAt || b.createdAt;
    return timeB - timeA;
  });

  return (
    <div className="log-page">
      <header className="page-header">
        <h2>LOG</h2>
      </header>

      <div className="filters">
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
          <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
      </div>

      <div className="timeline">
        {filteredTasks.length === 0 ? (
          <p className="empty-msg">No entries for this month.</p>
        ) : (
          filteredTasks.map(task => {
            const d = new Date(task.completedAt || task.dismissedAt || task.createdAt);
            return (
              <div key={task.id} className="timeline-item">
                <div className="timeline-date">
                  {d.getDate()} {d.toLocaleString('default', { weekday: 'short' })} / {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`timeline-content ${task.status}`}>
                   <span className="timeline-text">{task.text}</span>
                   {task.status === 'dismissed' && <span className="dismissed-badge">(dismissed)</span>}
                   {task.details && <p className="timeline-details">{task.details}</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
