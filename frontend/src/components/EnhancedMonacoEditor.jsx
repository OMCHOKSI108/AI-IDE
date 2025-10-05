import { useEffect, useRef, useState, useCallback } from 'react';
import monaco from '../monaco-config';
import { useProject } from '../context/ProjectContext';

// Language detection from file extensions
const getLanguageFromExtension = (filename) => {
  const extension = filename?.split('.').pop()?.toLowerCase();
  const languageMap = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Python
    'py': 'python',
    'pyx': 'python',
    'pyi': 'python',
    'pyw': 'python',
    
    // Web technologies
    'html': 'html',
    'htm': 'html',
    'xhtml': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Data formats
    'json': 'json',
    'jsonc': 'json',
    'xml': 'xml',
    'yml': 'yaml',
    'yaml': 'yaml',
    
    // Documentation
    'md': 'markdown',
    'markdown': 'markdown',
    'txt': 'plaintext',
    'text': 'plaintext',
    
    // Shell/Scripts
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'bat': 'bat',
    'cmd': 'bat',
    'ps1': 'powershell',
    
    // C/C++ languages
    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'hpp': 'cpp',
    'hh': 'cpp',
    'hxx': 'cpp',
    
    // Java
    'java': 'java',
    'class': 'java',
    
    // Other popular languages
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'sql': 'sql',
    'r': 'r',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'dart': 'dart',
    
    // Configuration files
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'dockerfile': 'dockerfile',
    'dockerignore': 'dockerfile'
  };
  return languageMap[extension] || 'plaintext';
};

export default function EnhancedMonacoEditor({ 
  height = '100%',
  theme = 'vs-dark',
  fontSize = 14,
  autoSave = true,
  autoSaveDelay = 2000
}) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const modelRef = useRef(null);
  const isInitializedRef = useRef(false);
  const disposalTracker = useRef(new Set());
  const isDisposingRef = useRef(false);
  const currentFileRef = useRef(null);
  
  const { 
    currentFile, 
    saveFileContent, 
    syncStatus, 
    currentProject,
    setError,
    setUnsavedChanges 
  } = useProject();

  const [editorState, setEditorState] = useState({
    isLoading: false,
    hasUnsavedChanges: false,
    language: 'javascript'
  });

  // Enhanced safe disposal helper with tracking
  const safeDispose = useCallback((resource, resourceId = null) => {
    if (!resource || isDisposingRef.current) return;
    
    // Generate a unique ID for tracking if not provided
    const id = resourceId || `resource_${Date.now()}_${Math.random()}`;
    
    // Skip if already disposed
    if (disposalTracker.current.has(id)) return;
    
    try {
      // Check various disposal states
      if (resource.isDisposed === true || resource._isDisposed === true) {
        disposalTracker.current.add(id);
        return;
      }
      
      if (typeof resource.dispose === 'function') {
        disposalTracker.current.add(id);
        
        // Get container before disposal for Monaco editors
        let container = null;
        if (resource.getDomNode && typeof resource.getDomNode === 'function') {
          try {
            container = resource.getDomNode()?.parentElement;
          } catch (e) {
            // Ignore errors getting DOM node
          }
        }
        
        resource.dispose();
        
        // Clean up container after disposal for Monaco editors
        if (container) {
          try {
            container.removeAttribute('data-keybinding-context');
            container.removeAttribute('data-mode-id');
            container.innerHTML = '';
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    } catch (error) {
      // Completely silence disposal errors in development
      // These are expected in React Strict Mode
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((content) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (currentFileRef.current && autoSave) {
        try {
          await saveFileContent(currentFileRef.current.id, content);
          setEditorState(prev => ({ ...prev, hasUnsavedChanges: false }));
          setUnsavedChanges(currentFileRef.current.id, false);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setError && setError('Auto-save failed: ' + error.message);
        }
      }
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, saveFileContent, setError, setUnsavedChanges]);

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!currentFileRef.current || !editorRef.current) return;
    
    try {
      const content = editorRef.current.getValue();
      await saveFileContent(currentFileRef.current.id, content);
      setEditorState(prev => ({ ...prev, hasUnsavedChanges: false }));
      setUnsavedChanges(currentFileRef.current.id, false);
    } catch (error) {
      setError && setError('Save failed: ' + error.message);
    }
  }, [saveFileContent, setError, setUnsavedChanges]);

  // Initialize Monaco Editor - only once
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    try {
      // Configure Monaco themes - VS Code Dark Theme
      monaco.editor.defineTheme('ai-ide-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'identifier', foreground: '9CDCFE' },
          { token: 'delimiter', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': '#D4D4D4',
          'editorCursor.foreground': '#AEAFAD',
          'editor.lineHighlightBackground': '#2A2D2E',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#C6C6C6',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorIndentGuide.background': '#404040',
          'editorIndentGuide.activeBackground': '#707070',
          'editorWhitespace.foreground': '#404040'
        }
      });

      monaco.editor.defineTheme('ai-ide-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000' },
          { token: 'keyword', foreground: '0000FF' },
          { token: 'string', foreground: 'A31515' },
          { token: 'number', foreground: '098658' },
          { token: 'type', foreground: '267F99' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#24292f',
        }
      });

      // Clean up any existing Monaco elements to prevent context conflicts
      if (containerRef.current) {
        // Remove all Monaco-related attributes that could cause conflicts
        const attributesToRemove = [
          'data-keybinding-context',
          'data-mode-id',
          'data-editor-id',
          'data-uri',
          'monaco-aria-container',
          'role',
          'aria-label',
          'aria-describedby'
        ];
        
        attributesToRemove.forEach(attr => {
          try {
            containerRef.current.removeAttribute(attr);
          } catch (e) {
            // Ignore attribute removal errors
          }
        });
        
        // Clear any existing content and nested elements
        try {
          containerRef.current.innerHTML = '';
          // Also remove any Monaco-specific classes
          containerRef.current.className = containerRef.current.className
            .split(' ')
            .filter(cls => !cls.includes('monaco') && !cls.includes('editor'))
            .join(' ');
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Validate container before creating editor
      if (!containerRef.current || !containerRef.current.isConnected) {
        console.warn('Container not ready for Monaco editor creation');
        return;
      }

      // Create the editor
      const editor = monaco.editor.create(containerRef.current, {
        value: '',
        language: 'javascript',
        theme: theme === 'light' ? 'ai-ide-light' : 'ai-ide-dark',
        fontSize: fontSize,
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: true },
        wordWrap: 'on',
        
        // Code folding and bracket matching
        folding: true,
        foldingHighlight: true,
        foldingImportsByDefault: false,
        matchBrackets: 'always',
        bracketPairColorization: { enabled: true },
        
        // Auto-indentation
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        insertSpaces: true,
        tabSize: 2,
        detectIndentation: true,
        
        // Find and replace with regex support
        find: {
          addExtraSpaceOnTop: false,
          autoFindInSelection: 'never',
          seedSearchStringFromSelection: 'always'
        },
        
        // Multiple file support and VS Code features
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        glyphMargin: false,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: 'ctrlCmd',
        selectionClipboard: false,
        
        // Language features
        codeLens: true,
        colorDecorators: true,
        links: true,
        
        // Suggestions and IntelliSense
        suggest: {
          showIcons: true,
          showSnippets: true,
          showWords: true,
          showMethods: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showKeywords: true,
          showText: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          filterGraceful: true,
          snippetsPreventQuickSuggestions: false
        },
        
        // Quick suggestions
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        quickSuggestionsDelay: 100,
        
        // Parameter hints
        parameterHints: { enabled: true },
        
        // Hover
        hover: { enabled: true },
        
        // Additional VS Code-like features
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'on',
        accessibilitySupport: 'auto',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
        dragAndDrop: true,
        emptySelectionClipboard: true,
        copyWithSyntaxHighlighting: true
      });

      editorRef.current = editor;

      // Add VS Code keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
      
      // Find and replace shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
        editor.getAction('actions.find').run();
      });
      
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
        editor.getAction('editor.action.startFindReplaceAction').run();
      });
      
      // Go to line
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
        editor.getAction('editor.action.gotoLine').run();
      });
      
      // Format document
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        editor.getAction('editor.action.formatDocument').run();
      });
      
      // Toggle comment
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        editor.getAction('editor.action.commentLine').run();
      });
      
      // Duplicate line
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.getAction('editor.action.copyLinesDownAction').run();
      });
      
      // Move line up/down
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        editor.getAction('editor.action.moveLinesUpAction').run();
      });
      
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.getAction('editor.action.moveLinesDownAction').run();
      });
      
      // Select all occurrences
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
        editor.getAction('editor.action.selectHighlights').run();
      });
      
      // Multi-cursor shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        editor.getAction('editor.action.addSelectionToNextFindMatch').run();
      });
      
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.getAction('editor.action.insertCursorBelow').run();
      });
      
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        editor.getAction('editor.action.insertCursorAbove').run();
      });
      
      // Add content change listener for auto-save
      const changeDisposable = editor.onDidChangeModelContent(() => {
        setEditorState(prev => ({ ...prev, hasUnsavedChanges: true }));
        
        // Mark file as having unsaved changes in the context
        // Use ref to get current file and avoid stale closure
        if (currentFileRef.current) {
          setUnsavedChanges(currentFileRef.current.id, true);
        }
        
        if (autoSave && editorRef.current) {
          const content = editorRef.current.getValue();
          debouncedSave(content);
        }
      });

      // Add event listener for external save requests (from tab close)
      const handleExternalSave = (event) => {
        if (event.detail && currentFileRef.current && event.detail.fileId === currentFileRef.current.id) {
          handleSave();
        }
      };
      
      window.addEventListener('monaco-save-file', handleExternalSave);

      // Cleanup function
      return () => {
        if (isDisposingRef.current) return;
        isDisposingRef.current = true;
        
        try {
          safeDispose(changeDisposable, 'main-change-disposable');
          safeDispose(editor, 'main-editor-instance');
          
          // Remove external save event listener
          window.removeEventListener('monaco-save-file', handleExternalSave);
          
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }
          
          editorRef.current = null;
          isInitializedRef.current = false;
          disposalTracker.current.clear();
        } catch (error) {
          // Completely silent - React Strict Mode disposal
        } finally {
          isDisposingRef.current = false;
        }
      };
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      setError && setError('Failed to initialize editor: ' + error.message);
    }
  }, []); // Empty dependencies array - only initialize once

  // Load file content when currentFile changes
  useEffect(() => {
    // Update the ref to avoid stale closure in event handlers
    currentFileRef.current = currentFile;
    
    if (!editorRef.current || !currentFile) {
      // Clear editor if no file is selected
      if (editorRef.current && !currentFile) {
        try {
          editorRef.current.setValue('');
          setEditorState(prev => ({ ...prev, language: 'javascript' }));
        } catch (error) {
          // Ignore errors when clearing
        }
      }
      return;
    }

    setEditorState(prev => ({ ...prev, isLoading: true }));

    try {
      const language = getLanguageFromExtension(currentFile.metadata?.name);
      
      // Dispose previous model if exists
      if (modelRef.current) {
        safeDispose(modelRef.current, 'file-load-model-disposal');
        modelRef.current = null;
      }

      // Create new model with proper language
      const model = monaco.editor.createModel(
        currentFile.content || '',
        language
      );
      
      modelRef.current = model;
      
      if (editorRef.current && !editorRef.current._isDisposed) {
        editorRef.current.setModel(model);
        editorRef.current.focus();
      }
      
      setEditorState(prev => ({ 
        ...prev, 
        isLoading: false, 
        language,
        hasUnsavedChanges: false 
      }));
      
      // Clear unsaved changes when loading a new file
      if (currentFile) {
        setUnsavedChanges(currentFile.id, false);
      }
      
    } catch (error) {
      console.error('Failed to load file content:', error);
      setError && setError('Failed to load file: ' + error.message);
      setEditorState(prev => ({ ...prev, isLoading: false }));
    }
  }, [currentFile, setError, safeDispose]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current && !editorRef.current._isDisposed) {
      try {
        monaco.editor.setTheme(theme === 'light' ? 'ai-ide-light' : 'ai-ide-dark');
      } catch (error) {
        // Ignore theme update errors
      }
    }
  }, [theme]);

  // Update font size when it changes
  useEffect(() => {
    if (editorRef.current && !editorRef.current._isDisposed) {
      try {
        editorRef.current.updateOptions({ fontSize });
      } catch (error) {
        // Ignore font size update errors
      }
    }
  }, [fontSize]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDisposingRef.current) return;
      
      try {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (modelRef.current) {
          safeDispose(modelRef.current, 'final-model-cleanup');
          modelRef.current = null;
        }
      } catch (error) {
        // Silent cleanup
      }
    };
  }, [safeDispose]);

  return (
    <div className="monaco-editor-container" style={{ height }}>
      {/* Main Editor Area */}
      <div className="monaco-main-area">
        {/* Loading overlay */}
        {editorState.isLoading && (
          <div className="monaco-loading-overlay">
            Loading file...
          </div>
        )}
        
        {/* Welcome message when no file is selected */}
        {!currentFile && !editorState.isLoading && (
          <div className="monaco-welcome-overlay">
            <div className="welcome-content">
              <h2>Welcome to AI-IDE</h2>
              <p>Open a file to get started</p>
              <div className="welcome-shortcuts">
                <div className="shortcut-item">
                  <kbd>Ctrl+O</kbd> Open File
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+N</kbd> New File
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+S</kbd> Save File
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Monaco Editor Container - always present but may be empty */}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%',
            height: '100%',
            visibility: currentFile ? 'visible' : 'hidden'
          }} 
        />
      </div>
      
      {/* Status bar */}
      <div className={`monaco-status-bar ${theme === 'light' ? 'theme-light' : ''}`}>
        <div className="monaco-status-bar-left">
          <span>{editorState.language}</span>
          {currentFile && (
            <span>{currentFile.metadata?.name || 'Untitled'}</span>
          )}
        </div>
        
        <div className="monaco-status-bar-right">
          {editorState.hasUnsavedChanges && (
            <span className="monaco-status-indicator unsaved">●</span>
          )}
          
          {syncStatus === 'syncing' && (
            <span className="monaco-status-indicator syncing">Syncing...</span>
          )}
          
          {syncStatus === 'synced' && (
            <span className="monaco-status-indicator synced">✓ Synced</span>
          )}
          
          {syncStatus === 'error' && (
            <span className="monaco-status-indicator error">✗ Sync Error</span>
          )}
          
          <span>Project: {currentProject?.name || 'No Project'}</span>
        </div>
      </div>
    </div>
  );
}