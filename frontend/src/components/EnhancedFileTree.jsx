import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

const FileIcon = ({ file, isOpen }) => {
  const getIcon = () => {
    if (file.type === 'folder') {
      return isOpen ? '📂' : '📁';
    }
    
    const extension = file.extension || file.name?.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'py': '🐍',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'xml': '📃',
      'yml': '⚙️',
      'yaml': '⚙️',
      'sh': '🖥️',
      'sql': '🗃️',
      'php': '🐘',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'go': '🐹',
      'rs': '🦀',
      'rb': '💎'
    };
    
    return iconMap[extension] || '📄';
  };

  return <span style={{ marginRight: '6px', fontSize: '14px' }}>{getIcon()}</span>;
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
          userSelect: 'none'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          {isFolder && (
            <>
              <button
                onClick={handleCreateFile}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#f0f6fc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📄 New File
              </button>
              <button
                onClick={handleCreateFolder}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#f0f6fc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📁 New Folder
              </button>
              <hr style={{ margin: '4px 0', border: '1px solid #30363d' }} />
            </>
          )}
          
          <button
            onClick={handleRename}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f0f6fc',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✏️ Rename
          </button>
          
          <button
            onClick={handleDelete}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f85149',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Delete
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
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '4px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              minWidth: '150px'
            }}
          >
            <button
              onClick={handleCreateRootFile}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: '#f0f6fc',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📄 New File
            </button>
            <button
              onClick={handleCreateRootFolder}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: '#f0f6fc',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📁 New Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}