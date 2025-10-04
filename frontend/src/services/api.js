const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class APIService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    // Always get the latest token from localStorage
    this.token = localStorage.getItem('accessToken');
    
    console.log('API Request - Token status:', {
      endpoint,
      hasToken: !!this.token,
      tokenLength: this.token ? this.token.length : 0,
      firstChars: this.token ? this.token.substring(0, 10) + '...' : 'none'
    });
    
    // Check if this endpoint requires authentication
    const requiresAuth = options.requiresAuth !== false; // Default to true unless explicitly set to false
    
    if (requiresAuth && !this.token) {
      throw new Error('Access token required. Please log in.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Check for Drive authentication errors
        if (data.requiresReauth || data.code === 'DRIVE_AUTH_REQUIRED' || data.code === 'DRIVE_AUTH_EXPIRED' || data.code === 'DRIVE_REFRESH_FAILED') {
          // Show user-friendly message and redirect to re-authenticate
          const shouldReauth = confirm(
            `Google Drive access has expired. Would you like to re-authenticate?\n\n${data.message}`
          );
          
          if (shouldReauth) {
            // Redirect to Google OAuth
            window.location.href = `${API_BASE_URL}/auth/google`;
            return;
          }
        }
        
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication Methods
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return result;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Project Methods
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(projectId, projectData) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // File Methods
  async getProjectFiles(projectId) {
    return this.request(`/files/${projectId}/files`);
  }

  async getFileContent(projectId, fileId) {
    return this.request(`/files/${projectId}/content?fileId=${fileId}`);
  }

  async updateFileContent(projectId, fileId, content) {
    return this.request(`/files/${projectId}/content?fileId=${fileId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async createFile(projectId, fileData) {
    return this.request(`/files/${projectId}/create`, {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  async deleteFile(projectId, fileId) {
    return this.request(`/files/${projectId}/${fileId}`, {
      method: 'DELETE'
    });
  }

  // Code Execution Methods
  async executeCode(projectId, executionData) {
    return this.request(`/execution/${projectId}/run`, {
      method: 'POST',
      body: JSON.stringify(executionData)
    });
  }

  async getExecutionStatus(projectId, executionId) {
    return this.request(`/execution/${projectId}/${executionId}/status`);
  }

  // Drive Re-authentication Methods
  async reAuthenticateDrive() {
    // Redirect to Drive re-auth endpoint
    window.location.href = `${API_BASE_URL}/auth/google/reauth`;
  }

  async checkDriveStatus() {
    return this.request('/auth/drive-status');
  }
}

export const apiService = new APIService();