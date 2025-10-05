import { createContext, useContext, useReducer, useCallback } from 'react';
import { apiService } from '../services/api.js';

// Initial state
const initialState = {
  projects: [],
  currentProject: null,
  fileTree: [],
  currentFile: null,
  openTabs: [], // Array of open file tabs
  unsavedChanges: new Map(), // Map of fileId -> boolean for tracking unsaved changes
  loading: false, // For projects and major operations
  fileTreeLoading: false, // For file tree operations
  fileLoading: false, // Separate loading state for file content
  error: null,
  syncStatus: 'idle' // idle, syncing, synced, error
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_FILE_TREE_LOADING: 'SET_FILE_TREE_LOADING',
  SET_FILE_LOADING: 'SET_FILE_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
  SET_FILE_TREE: 'SET_FILE_TREE',
  SET_CURRENT_FILE: 'SET_CURRENT_FILE',
  UPDATE_FILE_CONTENT: 'UPDATE_FILE_CONTENT',
  ADD_FILE: 'ADD_FILE',
  REMOVE_FILE: 'REMOVE_FILE',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  CLEAR_STATE: 'CLEAR_STATE',
  // Tab management actions
  ADD_TAB: 'ADD_TAB',
  CLOSE_TAB: 'CLOSE_TAB',
  MOVE_TAB: 'MOVE_TAB',
  SET_UNSAVED_CHANGES: 'SET_UNSAVED_CHANGES'
};

// Reducer function
function projectReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_FILE_TREE_LOADING:
      return { ...state, fileTreeLoading: action.payload };
    
    case ActionTypes.SET_FILE_LOADING:
      return { ...state, fileLoading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false, fileTreeLoading: false, fileLoading: false };
    
    case ActionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload, loading: false };
    
    case ActionTypes.SET_CURRENT_PROJECT:
      return { 
        ...state, 
        currentProject: action.payload, 
        fileTree: action.payload?.fileTree || [],
        loading: false 
      };
    
    case ActionTypes.SET_FILE_TREE:
      return { ...state, fileTree: action.payload };
    
    case ActionTypes.SET_CURRENT_FILE:
      return { 
        ...state, 
        currentFile: action.payload,
        // Add to tabs if not already open and file exists
        openTabs: action.payload && !state.openTabs.find(tab => tab.id === action.payload.id)
          ? [...state.openTabs, action.payload]
          : state.openTabs
      };
    
    case ActionTypes.UPDATE_FILE_CONTENT:
      return {
        ...state,
        currentFile: state.currentFile?.id === action.payload.id 
          ? { ...state.currentFile, content: action.payload.content }
          : state.currentFile
      };
    
    case ActionTypes.ADD_FILE:
      // Instead of manually adding to fileTree, trigger a refresh
      return {
        ...state,
        fileTree: action.payload || state.fileTree
      };
    
    case ActionTypes.REMOVE_FILE:
      return {
        ...state,
        fileTree: state.fileTree.filter(file => file.id !== action.payload),
        currentFile: state.currentFile?.id === action.payload ? null : state.currentFile
      };
    
    case ActionTypes.SET_SYNC_STATUS:
      return { ...state, syncStatus: action.payload };
    
    case ActionTypes.ADD_TAB:
      return {
        ...state,
        openTabs: state.openTabs.find(tab => tab.id === action.payload.id)
          ? state.openTabs
          : [...state.openTabs, action.payload]
      };
    
    case ActionTypes.CLOSE_TAB:
      const updatedTabs = state.openTabs.filter(tab => tab.id !== action.payload);
      const newUnsavedChanges = new Map(state.unsavedChanges);
      newUnsavedChanges.delete(action.payload);
      
      return {
        ...state,
        openTabs: updatedTabs,
        unsavedChanges: newUnsavedChanges,
        // If closing current file, switch to next available tab
        currentFile: state.currentFile?.id === action.payload 
          ? (updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null)
          : state.currentFile
      };
    
    case ActionTypes.MOVE_TAB:
      const { fromIndex, toIndex } = action.payload;
      const newOpenTabs = [...state.openTabs];
      const [movedTab] = newOpenTabs.splice(fromIndex, 1);
      newOpenTabs.splice(toIndex, 0, movedTab);
      
      return {
        ...state,
        openTabs: newOpenTabs
      };
    
    case ActionTypes.SET_UNSAVED_CHANGES:
      const newUnsavedMap = new Map(state.unsavedChanges);
      if (action.payload.hasChanges) {
        newUnsavedMap.set(action.payload.fileId, true);
      } else {
        newUnsavedMap.delete(action.payload.fileId);
      }
      
      return {
        ...state,
        unsavedChanges: newUnsavedMap
      };
    
    case ActionTypes.CLEAR_STATE:
      return {
        ...initialState,
        unsavedChanges: new Map() // Ensure Map is properly reinitialized
      };
    
    default:
      return state;
  }
}

// Create context
const ProjectContext = createContext();

// Provider component
export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Action creators
  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setFileTreeLoading = useCallback((fileTreeLoading) => {
    dispatch({ type: ActionTypes.SET_FILE_TREE_LOADING, payload: fileTreeLoading });
  }, []);

  const setFileLoading = useCallback((fileLoading) => {
    dispatch({ type: ActionTypes.SET_FILE_LOADING, payload: fileLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const setSyncStatus = useCallback((status) => {
    dispatch({ type: ActionTypes.SET_SYNC_STATUS, payload: status });
  }, []);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getProjects();
      dispatch({ type: ActionTypes.SET_PROJECTS, payload: response.projects });
    } catch (error) {
      setError(error.message);
    }
  }, []);

  // Load specific project
  const loadProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await apiService.getProject(projectId);
      dispatch({ type: ActionTypes.SET_CURRENT_PROJECT, payload: response.project });
    } catch (error) {
      setError(error.message);
    }
  }, []);

  // Refresh file tree
  const refreshFileTree = useCallback(async () => {
    try {
      if (!state.currentProject) return;
      
      setFileTreeLoading(true);
      const response = await apiService.getProjectFiles(state.currentProject.id);
      dispatch({ type: ActionTypes.SET_FILE_TREE, payload: response.fileTree });
      setFileTreeLoading(false);
    } catch (error) {
      setError(error.message);
      setFileTreeLoading(false);
    }
  }, [state.currentProject, setFileTreeLoading, setError]);

  // Create new project
  const createProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      const response = await apiService.createProject(projectData);
      
      // Add to projects list
      dispatch({ type: ActionTypes.SET_PROJECTS, payload: [...state.projects, response.project] });
      
      // Set as current project
      dispatch({ type: ActionTypes.SET_CURRENT_PROJECT, payload: response.project });
      
      return response.project;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [state.projects]);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      await apiService.deleteProject(projectId);
      
      // Remove from projects list
      const updatedProjects = state.projects.filter(p => p.id !== projectId);
      dispatch({ type: ActionTypes.SET_PROJECTS, payload: updatedProjects });
      
      // Clear current project if it was deleted
      if (state.currentProject?.id === projectId) {
        dispatch({ type: ActionTypes.SET_CURRENT_PROJECT, payload: null });
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [state.projects, state.currentProject]);

  // Load file content
  const loadFileContent = useCallback(async (fileId) => {
    try {
      if (!state.currentProject) return;
      
      setFileLoading(true);
      const response = await apiService.getFileContent(state.currentProject.id, fileId);
      
      const fileWithContent = {
        id: fileId,
        content: response.content,
        metadata: response.metadata
      };
      
      dispatch({ type: ActionTypes.SET_CURRENT_FILE, payload: fileWithContent });
      setFileLoading(false);
      return fileWithContent;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [state.currentProject]);

  // Save file content
  const saveFileContent = useCallback(async (fileId, content) => {
    try {
      if (!state.currentProject) return;
      
      setSyncStatus('syncing');
      
      await apiService.updateFileContent(state.currentProject.id, fileId, content);
      
      dispatch({ 
        type: ActionTypes.UPDATE_FILE_CONTENT, 
        payload: { id: fileId, content } 
      });
      
      setSyncStatus('synced');
      
      // Auto-clear sync status after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);
      
    } catch (error) {
      setSyncStatus('error');
      setError(error.message);
      throw error;
    }
  }, [state.currentProject]);

  // Create new file
  const createFile = useCallback(async (fileData) => {
    try {
      if (!state.currentProject) return;
      
      const response = await apiService.createFile(state.currentProject.id, fileData);
      
      // Refresh the entire file tree to get proper structure
      await refreshFileTree();
      
      return response.file;
    } catch (error) {
      // Check if this is a Drive authentication error
      if (error.message.includes('re-authenticate') || error.message.includes('Drive access')) {
        setError('Google Drive authentication required. Please check the popup or refresh the page to re-authenticate.');
      } else {
        setError(error.message);
      }
      throw error;
    }
  }, [state.currentProject, refreshFileTree, setError]);

  // Delete file
  const deleteFile = useCallback(async (fileId) => {
    try {
      if (!state.currentProject) return;
      
      await apiService.deleteFile(state.currentProject.id, fileId);
      
      // Refresh the entire file tree to get proper structure
      await refreshFileTree();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [state.currentProject, refreshFileTree, setError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set current file (for tab switching)
  const setCurrentFile = useCallback((file) => {
    dispatch({ type: ActionTypes.SET_CURRENT_FILE, payload: file });
  }, []);

  // Clear all state (for logout)
  const clearState = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_STATE });
  }, []);

  // Tab management functions
  const addTab = useCallback((file) => {
    dispatch({ type: ActionTypes.ADD_TAB, payload: file });
  }, []);

  const closeTab = useCallback((fileId) => {
    dispatch({ type: ActionTypes.CLOSE_TAB, payload: fileId });
  }, []);

  const moveTab = useCallback((fromIndex, toIndex) => {
    dispatch({ type: ActionTypes.MOVE_TAB, payload: { fromIndex, toIndex } });
  }, []);

  const setUnsavedChanges = useCallback((fileId, hasChanges) => {
    dispatch({ type: ActionTypes.SET_UNSAVED_CHANGES, payload: { fileId, hasChanges } });
  }, []);

  const hasUnsavedChanges = useCallback((fileId) => {
    return state.unsavedChanges.has(fileId);
  }, [state.unsavedChanges]);

  const value = {
    // State
    ...state,
    
    // Actions
    loadProjects,
    loadProject,
    createProject,
    deleteProject,
    loadFileContent,
    saveFileContent,
    createFile,
    deleteFile,
    refreshFileTree,
    clearError,
    clearState,
    setLoading,
    setFileTreeLoading,
    setFileLoading,
    setError,
    setSyncStatus,
    
    // File navigation
    setCurrentFile,
    
    // Tab management
    addTab,
    closeTab,
    moveTab,
    setUnsavedChanges,
    hasUnsavedChanges
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook to use the project context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}