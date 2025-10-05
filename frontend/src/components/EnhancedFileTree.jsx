import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

const FileIcon = ({ file, isOpen }) => {
  const getIcon = () => {
    if (file.type === 'folder') {
      return {
        icon: isOpen ? '▼' : '▶',
        color: '#cccccc',
        background: isOpen ? '#dcb67a' : '#dcb67a',
        emoji: isOpen ? '📂' : '📁'
      };
    }
    
    const extension = file.extension || file.name?.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': { icon: 'JS', color: '#000', background: '#f7df1e' },
      'jsx': { icon: 'JSX', color: '#000', background: '#61dafb' },
      'ts': { icon: 'TS', color: '#fff', background: '#3178c6' },
      'tsx': { icon: 'TSX', color: '#000', background: '#61dafb' },
      'py': { icon: 'PY', color: '#fff', background: '#3776ab' },
      'html': { icon: 'HTML', color: '#fff', background: '#e34c26', fontSize: '9px' },
      'css': { icon: 'CSS', color: '#fff', background: '#1572b6' },
      'scss': { icon: 'SCSS', color: '#fff', background: '#cf649a', fontSize: '8px' },
      'sass': { icon: 'SASS', color: '#fff', background: '#cf649a', fontSize: '8px' },
      'json': { icon: '{}', color: '#000', background: '#cbcb41' },
      'md': { icon: 'MD', color: '#fff', background: '#519aba' },
      'txt': { icon: 'TXT', color: '#000', background: '#a8a8a8', fontSize: '9px' },
      'xml': { icon: 'XML', color: '#000', background: '#f69220', fontSize: '9px' },
      'yml': { icon: 'YML', color: '#fff', background: '#cb171e', fontSize: '9px' },
      'yaml': { icon: 'YAML', color: '#fff', background: '#cb171e', fontSize: '8px' },
      'sh': { icon: 'SH', color: '#fff', background: '#4eaa25' },
      'bash': { icon: 'BASH', color: '#fff', background: '#4eaa25', fontSize: '8px' },
      'sql': { icon: 'SQL', color: '#fff', background: '#c178b3', fontSize: '9px' },
      'php': { icon: 'PHP', color: '#fff', background: '#777bb4', fontSize: '9px' },
      'java': { icon: 'JAVA', color: '#000', background: '#ed8b00', fontSize: '8px' },
      'cpp': { icon: 'C++', color: '#fff', background: '#00599c', fontSize: '9px' },
      'c': { icon: 'C', color: '#000', background: '#a8b9cc' },
      'h': { icon: 'H', color: '#000', background: '#a8b9cc' },
      'go': { icon: 'GO', color: '#fff', background: '#00add8' },
      'rs': { icon: 'RS', color: '#000', background: '#dea584' },
      'rb': { icon: 'RB', color: '#fff', background: '#cc342d' },
      'vue': { icon: 'VUE', color: '#fff', background: '#4fc08d', fontSize: '9px' },
      'dockerfile': { icon: '🐳', color: '#2496ed', background: 'transparent' },
      'gitignore': { icon: 'GIT', color: '#fff', background: '#f05032', fontSize: '9px' },
      'env': { icon: 'ENV', color: '#000', background: '#ecd53f', fontSize: '9px' },
      'lock': { icon: '🔒', color: '#a8a8a8', background: 'transparent' },
      'log': { icon: 'LOG', color: '#fff', background: '#a8a8a8', fontSize: '9px' },
      'pdf': { icon: 'PDF', color: '#fff', background: '#f40f02', fontSize: '9px' },
      'zip': { icon: 'ZIP', color: '#fff', background: '#a8a8a8', fontSize: '9px' },
      'tar': { icon: 'TAR', color: '#fff', background: '#a8a8a8', fontSize: '9px' },
      'gz': { icon: 'GZ', color: '#fff', background: '#a8a8a8' },
      'png': { icon: '🖼️', color: '#a8a8a8', background: 'transparent' },
      'jpg': { icon: '🖼️', color: '#a8a8a8', background: 'transparent' },
      'jpeg': { icon: '🖼️', color: '#a8a8a8', background: 'transparent' },
      'gif': { icon: '🖼️', color: '#a8a8a8', background: 'transparent' },
      'svg': { icon: 'SVG', color: '#000', background: '#ffb13b', fontSize: '9px' },
      'ico': { icon: '🖼️', color: '#a8a8a8', background: 'transparent' },
    };
    
    // Special filename handling
    const fileName = file.name.toLowerCase();
    if (fileName === 'package.json') return { icon: '📦', color: '#e8274b', background: 'transparent' };
    if (fileName === 'tsconfig.json') return { icon: 'TS', color: '#fff', background: '#3178c6' };
    if (fileName === 'webpack.config.js') return { icon: '⚙️', color: '#8dd6f9', background: 'transparent' };
    if (fileName === 'vite.config.js') return { icon: '⚡', color: '#646cff', background: 'transparent' };
    if (fileName === 'dockerfile') return { icon: '🐳', color: '#2496ed', background: 'transparent' };
    if (fileName === '.gitignore') return { icon: 'GIT', color: '#fff', background: '#f05032', fontSize: '9px' };
    if (fileName === 'readme.md') return { icon: '📖', color: '#519aba', background: 'transparent' };
    if (fileName.startsWith('.env')) return { icon: 'ENV', color: '#000', background: '#ecd53f', fontSize: '9px' };
    
    return iconMap[extension] || { icon: '📄', color: '#a8a8a8', background: 'transparent' };
  };

  const iconData = getIcon();

  // Special handling for folders
  if (file.type === 'folder') {
    return (
      <span 
        style={{ 
          marginRight: '6px', 
          fontSize: '14px', 
          color: iconData.background,
          display: 'inline-flex',
          alignItems: 'center',
          width: '16px',
          justifyContent: 'center'
        }}
      >
        {iconData.emoji}
      </span>
    );
  }

  // For files with background (badge-style)
  if (iconData.background && iconData.background !== 'transparent') {
    return (
      <span 
        style={{ 
          marginRight: '6px', 
          fontSize: iconData.fontSize || '10px', 
          color: iconData.color,
          backgroundColor: iconData.background,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '2px',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}
      >
        {iconData.icon}
      </span>
    );
  }

  // For files with emoji or no background
  return (
    <span 
      style={{ 
        marginRight: '6px', 
        fontSize: '14px', 
        color: iconData.color,
        display: 'inline-flex',
        alignItems: 'center',
        width: '16px',
        justifyContent: 'center'
      }}
    >
      {iconData.icon}
    </span>
  );
};

const SyncStatusIcon = ({ status }) => {
  const iconMap = {
    'synced': { icon: '✓', color: '#238636' },
    'syncing': { icon: '⟳', color: '#1f6feb' },
    'conflict': { icon: '⚠', color: '#fb8500' },
    'error': { icon: '✗', color: '#f85149' },
    'offline': { icon: '○', color: '#656d76' }
  };
  
  const { icon, color } = iconMap[status] || { icon: '', color: '#656d76' };
  
  return icon ? (
    <span 
      style={{ 
        marginLeft: '4px', 
        color, 
        fontSize: '10px',
        fontWeight: 'bold'
      }}
      title={`Sync status: ${status}`}
    >
      {icon}
    </span>
  ) : null;
};

const FileTreeItem = ({ 
  file, 
  level = 0, 
  onSelect, 
  onToggle, 
  onRename, 
  onDelete,
  onCreateFile,
  onCreateFolder,
  selectedFileId,
  expandedFolders 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const isFolder = file.type === 'folder';
  const isExpanded = expandedFolders.has(file.id);
  const isSelected = selectedFileId === file.id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isFolder) {
      onToggle(file.id);
    } else {
      onSelect(file);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setIsEditing(true);
    setShowContextMenu(false);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (editName.trim() && editName !== file.name) {
      onRename(file.id, editName.trim());
    }
    setIsEditing(false);
    setEditName(file.name);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      onDelete(file.id);
    }
    setShowContextMenu(false);
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName && fileName.trim()) {
      onCreateFile(file.id, fileName.trim());
    }
    setShowContextMenu(false);
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      onCreateFolder(file.id, folderName.trim());
    }
    setShowContextMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${8 + level * 16}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#264f78' : 'transparent',
          borderRadius: '3px',
          margin: '1px 4px',
          fontSize: '14px',
          color: '#f0f6fc',
          userSelect: 'none',
          transition: 'background-color 0.1s ease',
          border: isSelected ? '1px solid #005fb8' : '1px solid transparent'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#2a2d2e';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {isFolder && (
          <span 
            style={{ 
              marginRight: '4px',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s ease'
            }}
          >
            ▶
          </span>
        )}
        
        <FileIcon file={file} isOpen={isExpanded} />
        
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} style={{ flex: 1 }}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              autoFocus
              style={{
                background: 'transparent',
                border: '1px solid #58a6ff',
                borderRadius: '2px',
                color: '#f0f6fc',
                fontSize: '14px',
                padding: '0 2px',
                outline: 'none',
                width: '100%'
              }}
            />
          </form>
        ) : (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {file.name}
          </span>
        )}
        
        <SyncStatusIcon status={file.syncStatus} />
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            background: '#252526',
            border: '1px solid #454545',
            borderRadius: '5px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
            zIndex: 1000,
            minWidth: '180px',
            padding: '4px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
          }}
        >
          {isFolder && (
            <>
              <button
                onClick={handleCreateFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#cccccc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2d2e'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <span>📄</span>
                <span>New File</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>Ctrl+N</span>
              </button>
              <button
                onClick={handleCreateFolder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#cccccc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2d2e'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <span>📁</span>
                <span>New Folder</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>Ctrl+Shift+N</span>
              </button>
              <div style={{ 
                height: '1px', 
                backgroundColor: '#454545', 
                margin: '4px 8px' 
              }} />
            </>
          )}
          
          <button
            onClick={handleRename}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              background: 'transparent',
              color: '#cccccc',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2d2e'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>✏️</span>
            <span>Rename</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>F2</span>
          </button>
          
          <div style={{ 
            height: '1px', 
            backgroundColor: '#454545', 
            margin: '4px 8px' 
          }} />
          
          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f85149',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2a2d2e';
              e.target.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#f85149';
            }}
          >
            <span>🗑️</span>
            <span>Delete</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>Del</span>
          </button>
        </div>
      )}

      {/* Children (for expanded folders) */}
      {isFolder && isExpanded && file.children && (
        <div>
          {file.children.map((childFile) => (
            <FileTreeItem
              key={childFile.id}
              file={childFile}
              level={level + 1}
              onSelect={onSelect}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              selectedFileId={selectedFileId}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function EnhancedFileTree() {
  const { 
    currentProject, 
    fileTree, 
    loadFileContent, 
    createFile, 
    deleteFile,
    currentFile,
    fileTreeLoading,
    error 
  } = useProject();
  
  const { user } = useAuth();

  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [showRootContextMenu, setShowRootContextMenu] = useState(false);
  const [rootContextMenuPos, setRootContextMenuPos] = useState({ x: 0, y: 0 });

  const handleToggleFolder = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const handleSelectFile = useCallback(async (file) => {
    if (file.type === 'file') {
      setSelectedFileId(file.id);
      try {
        await loadFileContent(file.id);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  }, [loadFileContent]);

  const handleCreateFile = useCallback(async (parentId, fileName) => {
    try {
      let parentPath = '/';
      if (parentId) {
        const parentFile = findFileById(fileTree, parentId);
        parentPath = parentFile ? parentFile.path : '/';
      }
      
      const filePath = parentPath === '/' ? `/${fileName}` : `${parentPath}/${fileName}`;
      
      await createFile({
        name: fileName,
        type: 'file',
        path: filePath,
        parentId: parentId,
        content: ''
      });
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }, [createFile, fileTree]);

  const handleCreateFolder = useCallback(async (parentId, folderName) => {
    try {
      let parentPath = '/';
      if (parentId) {
        const parentFile = findFileById(fileTree, parentId);
        parentPath = parentFile ? parentFile.path : '/';
      }
      
      const folderPath = parentPath === '/' ? `/${folderName}` : `${parentPath}/${folderName}`;
      
      await createFile({
        name: folderName,
        type: 'folder',
        path: folderPath,
        parentId: parentId
      });
      
      // Auto-expand the parent folder if it exists
      if (parentId) {
        setExpandedFolders(prev => new Set([...prev, parentId]));
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [createFile, fileTree]);

  const handleRename = useCallback(async (fileId, newName) => {
    // TODO: Implement rename functionality
    console.log('Rename file:', fileId, 'to:', newName);
  }, []);

  const handleDelete = useCallback(async (fileId) => {
    try {
      await deleteFile(fileId);
      
      // Clear selection if deleted file was selected
      if (selectedFileId === fileId) {
        setSelectedFileId(null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }, [deleteFile, selectedFileId]);

  // Helper function to find file by ID recursively
  const findFileById = (files, id) => {
    for (const file of files) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Root-level context menu handlers
  const handleRootContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't show context menu if Drive auth is required
    if (user?.driveAuthStatus?.requiresReauth) {
      alert('Please re-authenticate with Google Drive first to create files and folders.');
      return;
    }
    
    setRootContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowRootContextMenu(true);
  };

  const handleCreateRootFile = () => {
    // Check Drive auth before creating
    if (user?.driveAuthStatus?.requiresReauth) {
      alert('Please re-authenticate with Google Drive first.');
      setShowRootContextMenu(false);
      return;
    }
    
    const fileName = prompt('Enter file name:');
    if (fileName && fileName.trim()) {
      handleCreateFile(null, fileName.trim()); // null for root level
    }
    setShowRootContextMenu(false);
  };

  const handleCreateRootFolder = () => {
    // Check Drive auth before creating
    if (user?.driveAuthStatus?.requiresReauth) {
      alert('Please re-authenticate with Google Drive first.');
      setShowRootContextMenu(false);
      return;
    }
    
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      handleCreateFolder(null, folderName.trim()); // null for root level
    }
    setShowRootContextMenu(false);
  };

  // Update selected file when currentFile changes
  useEffect(() => {
    if (currentFile) {
      setSelectedFileId(currentFile.id);
    }
  }, [currentFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when file tree has focus or no specific input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      if (isInputFocused) return;

      // Ctrl+N: New File
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (user?.driveAuthStatus?.requiresReauth) {
          alert('Please re-authenticate with Google Drive first.');
          return;
        }
        const fileName = prompt('Enter file name:');
        if (fileName && fileName.trim()) {
          handleCreateFile(null, fileName.trim());
        }
      }
      
      // Ctrl+Shift+N: New Folder
      else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (user?.driveAuthStatus?.requiresReauth) {
          alert('Please re-authenticate with Google Drive first.');
          return;
        }
        const folderName = prompt('Enter folder name:');
        if (folderName && folderName.trim()) {
          handleCreateFolder(null, folderName.trim());
        }
      }
      
      // F2: Rename selected file
      else if (e.key === 'F2') {
        e.preventDefault();
        if (!selectedFileId) {
          alert('Please select a file or folder first.');
          return;
        }
        const selectedFile = findFileById(fileTree, selectedFileId);
        if (!selectedFile) return;
        
        const newName = prompt(`Rename ${selectedFile.name} to:`, selectedFile.name);
        if (newName && newName.trim() && newName !== selectedFile.name) {
          handleRename(selectedFileId, newName.trim());
        }
      }
      
      // Delete: Delete selected file
      else if (e.key === 'Delete') {
        e.preventDefault();
        if (!selectedFileId) return;
        
        const selectedFile = findFileById(fileTree, selectedFileId);
        if (!selectedFile) return;
        
        if (window.confirm(`Are you sure you want to delete ${selectedFile.name}?`)) {
          handleDelete(selectedFileId);
        }
      }
      
      // F5: Refresh
      else if (e.key === 'F5') {
        e.preventDefault();
        window.location.reload();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileId, user, handleCreateFile, handleCreateFolder, handleRename, handleDelete, findFileById, fileTree]);

  // Close root context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowRootContextMenu(false);
    if (showRootContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showRootContextMenu]);

  if (!currentProject) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#656d76',
        fontSize: '14px'
      }}>
        <p>📁</p>
        <p>No project selected</p>
        <p>Select or create a project to view files</p>
      </div>
    );
  }

  if (fileTreeLoading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#656d76',
        fontSize: '14px'
      }}>
        Loading files...
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('re-authenticate') || error.includes('Drive access') || error.includes('authentication');
    
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#f85149',
        fontSize: '14px'
      }}>
        <p>Error loading files:</p>
        <p>{error}</p>
        {isAuthError && (
          <button
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/google`;
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#238636',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Re-authenticate with Google Drive
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '8px 0'
    }}>
      {/* Drive Authentication Warning */}
      {user?.driveAuthStatus?.requiresReauth && (
        <div style={{
          margin: '8px 12px',
          padding: '8px 12px',
          backgroundColor: '#fb8500',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#000',
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ Google Drive Access Required
          </div>
          <div style={{ marginBottom: '6px' }}>
            Re-authenticate to create files and folders
          </div>
          <button
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/google/reauth`;
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#000',
              color: '#fb8500',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Re-authenticate Now
          </button>
        </div>
      )}

      {/* Project header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #30363d',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#f0f6fc',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <span>📁</span>
          <span>{currentProject.name}</span>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#656d76',
          marginTop: '2px'
        }}>
          {fileTree.length} items
        </div>
      </div>

      {/* VS Code-style toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderBottom: '1px solid #30363d',
        marginBottom: '4px'
      }}>
        <button
          onClick={() => {
            if (user?.driveAuthStatus?.requiresReauth) {
              alert('Please re-authenticate with Google Drive first.');
              return;
            }
            const fileName = prompt('Enter file name:');
            if (fileName && fileName.trim()) {
              handleCreateFile(null, fileName.trim());
            }
          }}
          title="New File (Ctrl+N)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: '#f0f6fc',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#30363d'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ＋
        </button>
        
        <button
          onClick={() => {
            if (user?.driveAuthStatus?.requiresReauth) {
              alert('Please re-authenticate with Google Drive first.');
              return;
            }
            const folderName = prompt('Enter folder name:');
            if (folderName && folderName.trim()) {
              handleCreateFolder(null, folderName.trim());
            }
          }}
          title="New Folder"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: '#dcb67a',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#30363d'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          📁
        </button>

        <div style={{ 
          width: '1px', 
          height: '16px', 
          backgroundColor: '#30363d',
          margin: '0 4px'
        }} />

        <button
          onClick={() => {
            if (!selectedFileId) {
              alert('Please select a file or folder first.');
              return;
            }
            const selectedFile = findFileById(fileTree, selectedFileId);
            if (!selectedFile) return;
            
            const newName = prompt(`Rename ${selectedFile.name} to:`, selectedFile.name);
            if (newName && newName.trim() && newName !== selectedFile.name) {
              handleRename(selectedFileId, newName.trim());
            }
          }}
          title="Rename (F2)"
          disabled={!selectedFileId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: selectedFileId ? '#f0f6fc' : '#656d76',
            cursor: selectedFileId ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => {
            if (selectedFileId) e.target.style.backgroundColor = '#30363d';
          }}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✎
          </button>        <button
          onClick={() => {
            if (!selectedFileId) {
              alert('Please select a file or folder first.');
              return;
            }
            const selectedFile = findFileById(fileTree, selectedFileId);
            if (!selectedFile) return;
            
            if (window.confirm(`Are you sure you want to delete ${selectedFile.name}?`)) {
              handleDelete(selectedFileId);
            }
          }}
          title="Delete (Delete)"
          disabled={!selectedFileId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: selectedFileId ? '#f85149' : '#656d76',
            cursor: selectedFileId ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => {
            if (selectedFileId) e.target.style.backgroundColor = '#30363d';
          }}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          🗑️
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => {
            // Refresh file tree
            window.location.reload(); // Simple refresh for now
          }}
          title="Refresh Explorer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: '#f0f6fc',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#30363d'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          🔄
        </button>

        <button
          onClick={() => {
            // Collapse all folders
            setExpandedFolders(new Set());
          }}
          title="Collapse All"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: '#f0f6fc',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#30363d'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          📂
        </button>
      </div>

      {/* File tree */}
      <div 
        style={{ minHeight: '200px', position: 'relative' }}
        onContextMenu={handleRootContextMenu}
      >
        {fileTree.length === 0 ? (
          <div 
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#656d76',
              fontSize: '14px'
            }}
            onContextMenu={handleRootContextMenu}
          >
            <p>No files in this project</p>
            {user?.driveAuthStatus?.requiresReauth ? (
              <p>Please re-authenticate with Google Drive to create files</p>
            ) : (
              <p>Right-click here to create new files</p>
            )}
          </div>
        ) : (
          fileTree.map((file) => (
            <FileTreeItem
              key={file.id}
              file={file}
              onSelect={handleSelectFile}
              onToggle={handleToggleFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              selectedFileId={selectedFileId}
              expandedFolders={expandedFolders}
            />
          ))
        )}

        {/* Root Context Menu */}
        {showRootContextMenu && (
          <div
            style={{
              position: 'fixed',
              left: rootContextMenuPos.x,
              top: rootContextMenuPos.y,
              background: '#252526',
              border: '1px solid #454545',
              borderRadius: '5px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
              zIndex: 1000,
              minWidth: '180px',
              padding: '4px 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
            }}
          >
            <button
              onClick={handleCreateRootFile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: 'transparent',
                color: '#cccccc',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background-color 0.1s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2d2e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <span>📄</span>
              <span>New File</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>Ctrl+N</span>
            </button>
            <button
              onClick={handleCreateRootFolder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: 'transparent',
                color: '#cccccc',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background-color 0.1s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2d2e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <span>📁</span>
              <span>New Folder</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#858585' }}>Ctrl+Shift+N</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}