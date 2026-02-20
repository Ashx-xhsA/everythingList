import React from 'react';
import { useTasks } from '../context/TaskContext';
import './SettingsScreen.css';

export const SettingsScreen: React.FC = () => {
  const { pageSize, setPageSize, fontSize, setFontSize, resetData, exportData, importData } = useTasks();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all tasks and reset settings? This cannot be undone.')) {
      resetData();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        importData(data);
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="settings-screen">
      <header className="page-header">
        <h2>SETTINGS</h2>
      </header>

      <div className="settings-content">
        <div className="setting-item">
          <label>Items Per Page</label>
          <div className="setting-controls">
            <button onClick={() => setPageSize(Math.max(1, pageSize - 1))}>-</button>
            <span className="setting-value">{pageSize}</span>
            <button onClick={() => setPageSize(pageSize + 1)}>+</button>
          </div>
        </div>

        <div className="setting-item">
          <label>Font Size</label>
          <div className="setting-controls">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 1))}>-</button>
            <span className="setting-value">{fontSize}px</span>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 1))}>+</button>
          </div>
        </div>

        <div className="setting-item">
          <label>Data Management</label>
          <div className="data-controls">
            <button className="settings-btn" onClick={exportData}>Export JSON</button>
            <button className="settings-btn" onClick={handleImportClick}>Import JSON</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="setting-item reset-section">
          <button className="reset-btn" onClick={handleReset}>Reset All Data</button>
        </div>
      </div>
    </div>
  );
};
