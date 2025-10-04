import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import LoginScreen from './components/LoginScreen';
import UserProfile from './components/UserProfile';
import EnhancedMonacoEditor from './components/EnhancedMonacoEditor';
import EnhancedFileTree from './components/EnhancedFileTree';
import ProjectManager from './components/ProjectManager';
import './IDE.css';

function IDEInterface() {
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);

  return (
    <ProjectProvider>
      <div className="ide-container">
        {/* Top Header */}
        <div className="ide-header">
          <div className="ide-header-left">
            <h1>AI-IDE</h1>
            
            <button
              onClick={() => setIsProjectManagerOpen(true)}
              className="ide-button"
            >
              📁 Projects
            </button>
          </div>

          <div className="ide-header-right">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="theme-toggle"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Font Size Controls */}
            <div className="font-controls">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="ide-button ide-button-small"
              >
                A-
              </button>
              <span className="font-size-display">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="ide-button ide-button-small"
              >
                A+
              </button>
            </div>

            <UserProfile />
          </div>
        </div>

        {/* Main IDE Layout */}
        <div className="ide-main">
          {/* Activity Bar */}
          <div className="ide-activity-bar">
            <div className="activity-item active" title="Explorer">
              📁
            </div>
            <div className="activity-item" title="Search">
              🔍
            </div>
            <div className="activity-item" title="Source Control">
              🌿
            </div>
            <div className="activity-item" title="Run and Debug">
              ▶️
            </div>
            <div className="activity-item" title="Extensions">
              📦
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="ide-sidebar">
            <div className="ide-sidebar-header">
              Explorer
            </div>
            
            <div className="ide-sidebar-content">
              <EnhancedFileTree />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="ide-content">
            {/* Tab Bar */}
            <div className="ide-tab-bar">
              <div className="tab active">
                <span className="tab-icon">📄</span>
                <span className="tab-name">Welcome</span>
              </div>
            </div>
            
            {/* Editor Area */}
            <div className={`ide-editor theme-${theme}`}>
              <EnhancedMonacoEditor
                theme={theme}
                fontSize={fontSize}
                autoSave={true}
                autoSaveDelay={2000}
              />
            </div>

            {/* Terminal */}
            <div className="ide-terminal">
              <div className="ide-terminal-header">
                Terminal
              </div>
              
              <div className="ide-terminal-content">
                <div style={{ marginBottom: '8px', color: '#58a6ff' }}>
                  AI-IDE Terminal v1.0.0
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#7c3aed' }}>user@ai-ide</span>
                  <span style={{ color: '#e6edf3' }}>:~/project$ </span>
                  <span style={{ color: '#e6edf3' }}>Ready for code execution...</span>
                </div>
                <div style={{ color: '#7d8590' }}>
                  Terminal integration with xterm.js coming soon!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Manager Modal */}
        <ProjectManager 
          isOpen={isProjectManagerOpen}
          onClose={() => setIsProjectManagerOpen(false)}
        />
      </div>
    </ProjectProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading, setUser, setToken } = useAuth();
  // OAuth callback is now handled by AuthContext

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <div>Loading AI-IDE...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <IDEInterface />;
}

export default App;
