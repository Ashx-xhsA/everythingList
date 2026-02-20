import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { HomeScreen } from './pages/HomeScreen';
import { LogPage } from './pages/LogPage';
import { SettingsScreen } from './pages/SettingsScreen';
import './index.css';

function App() {
  return (
    <TaskProvider>
      <Router>
        <div className="app-container">
          <header className="app-main-header">
            <h1>Autofocus</h1>
          </header>
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/log" element={<LogPage />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </main>
          
          <nav className="bottom-nav">
            <Link to="/log" className="nav-btn circle-btn">○</Link>
            <Link to="/" className="nav-btn">TASKS</Link>
            <Link to="/settings" className="nav-btn square-btn">□</Link>
          </nav>
        </div>
      </Router>
    </TaskProvider>
  );
}

export default App;
