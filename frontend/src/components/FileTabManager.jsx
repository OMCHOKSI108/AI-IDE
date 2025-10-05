import { useState, useEffect, useCallback, useRef } from 'react';
import { useProject } from '../context/ProjectContext';

const FileTabManager = ({ theme = 'dark' }) => {
  const { openTabs, currentFile, setCurrentFile, closeTab, moveTab, hasUnsavedChanges, saveFileContent } = useProject();
  const [draggedTab, setDraggedTab] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const tabsRef = useRef([]);

  // Handle tab click
  const handleTabClick = useCallback((file) => {
    setCurrentFile(file);
  }, [setCurrentFile]);

  // Handle tab close
  const handleTabClose = useCallback(async (e, file) => {
    e.stopPropagation();
    
    // Check for unsaved changes
    if (hasUnsavedChanges(file.id)) {
      const result = window.confirm(
        `The file "${file.metadata?.name || 'Untitled'}" has unsaved changes. Do you want to save before closing?\n\nClick OK to save and close, Cancel to close without saving.`
      );
      
      if (result) {
        // Save the file before closing
        try {
          // For the current file, get content from the editor
          // For other files, use the stored content (this is a simplification)
          let contentToSave = file.content;
          if (currentFile && currentFile.id === file.id) {
            // If this is the currently active file, we need to get the content from the editor
            // This is handled by the editor's save functionality, so we'll dispatch a save event
            const saveEvent = new CustomEvent('monaco-save-file', { detail: { fileId: file.id } });
            window.dispatchEvent(saveEvent);
            // Wait a moment for the save to complete
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            // For non-current files, save the stored content
            await saveFileContent(file.id, contentToSave);
          }
        } catch (error) {
          console.error('Failed to save file:', error);
          // Still close the tab even if save fails, but show error
          alert(`Failed to save file: ${error.message}`);
        }
      }
    }
    
    closeTab(file.id);
  }, [closeTab, hasUnsavedChanges, saveFileContent]);

  // Handle middle-click to close tab
  const handleTabMouseDown = useCallback((e, file) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      handleTabClose(e, file);
    }
  }, [handleTabClose]);

  // Drag and drop functionality
  const handleDragStart = useCallback((e, index) => {
    setDraggedTab(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear drag over if we're leaving the tab area entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (draggedTab !== null && draggedTab !== dropIndex) {
      moveTab(draggedTab, dropIndex);
    }
    
    setDraggedTab(null);
    setDragOverIndex(null);
  }, [draggedTab, moveTab]);

  const handleDragEnd = useCallback(() => {
    setDraggedTab(null);
    setDragOverIndex(null);
  }, []);

  // Handle Ctrl+Tab cycling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        
        if (!openTabs || openTabs.length === 0) return;
        
        const currentIndex = openTabs.findIndex(tab => tab.id === currentFile?.id);
        let nextIndex;
        
        if (e.shiftKey) {
          // Ctrl+Shift+Tab - previous tab
          nextIndex = currentIndex <= 0 ? openTabs.length - 1 : currentIndex - 1;
        } else {
          // Ctrl+Tab - next tab
          nextIndex = currentIndex >= openTabs.length - 1 ? 0 : currentIndex + 1;
        }
        
        setCurrentFile(openTabs[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTabs, currentFile, setCurrentFile]);

  // Get file icon based on extension
  const getFileIcon = useCallback((filename) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    const iconMap = {
      // JavaScript/TypeScript
      'js': '📄',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️',
      'mjs': '📄',
      
      // Python
      'py': '🐍',
      'pyx': '🐍',
      'pyi': '🐍',
      
      // Web
      'html': '🌐',
      'htm': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'sass': '🎨',
      'less': '🎨',
      
      // Data
      'json': '📋',
      'jsonc': '📋',
      'xml': '📄',
      'yml': '⚙️',
      'yaml': '⚙️',
      
      // Documentation
      'md': '📝',
      'markdown': '📝',
      'txt': '📄',
      
      // C/C++
      'c': '🔧',
      'h': '🔧',
      'cpp': '🔧',
      'cc': '🔧',
      'cxx': '🔧',
      'hpp': '🔧',
      
      // Java
      'java': '☕',
      'class': '☕',
      
      // Other languages
      'cs': '💎',
      'go': '🐹',
      'rs': '🦀',
      'rb': '💎',
      'php': '🐘',
      'sql': '🗃️',
      'r': '📊',
      'swift': '🍎',
      'kt': '📱',
      'scala': '⚖️',
      'dart': '🎯',
      
      // Shell
      'sh': '💻',
      'bash': '💻',
      'bat': '💻',
      'ps1': '💻',
      
      // Config
      'dockerfile': '🐳',
      'ini': '⚙️',
      'cfg': '⚙️',
      'conf': '⚙️'
    };
    return iconMap[extension] || '📄';
  }, []);

  if (!openTabs || openTabs.length === 0) {
    return <div className={`ide-tab-bar ${theme === 'light' ? 'theme-light' : ''}`}></div>;
  }

  return (
    <div className={`ide-tab-bar ${theme === 'light' ? 'theme-light' : ''}`}>
      {openTabs.map((file, index) => (
        <div
          key={file.id}
          ref={el => tabsRef.current[index] = el}
          className={`tab ${currentFile?.id === file.id ? 'active' : ''} ${
            dragOverIndex === index ? 'drag-over' : ''
          }`}
          onClick={() => handleTabClick(file)}
          onMouseDown={(e) => handleTabMouseDown(e, file)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <span className="tab-icon">
            {getFileIcon(file.metadata?.name)}
          </span>
          <span className="tab-name">
            {file.metadata?.name || 'Untitled'}
          </span>
          {hasUnsavedChanges(file.id) && (
            <span className="tab-unsaved-indicator">●</span>
          )}
          <button
            className="tab-close-button"
            onClick={(e) => handleTabClose(e, file)}
            title="Close tab"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default FileTabManager;