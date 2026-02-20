import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TaskProvider, useTasks } from './context/TaskContext';
import { HomeScreen } from './pages/HomeScreen';
import { LogPage } from './pages/LogPage';
import { SettingsScreen } from './pages/SettingsScreen';
import { AuthScreen } from './pages/AuthScreen';
import './index.css';

const MainApp = () => {
  const { isAuthenticated, isAuthLoading } = useTasks();

  if (isAuthLoading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
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
  );
};

function App() {
  return (
    <TaskProvider>
      <MainApp />
    </TaskProvider>
  );
}

export default App;
