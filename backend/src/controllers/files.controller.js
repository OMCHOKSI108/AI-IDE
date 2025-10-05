import express from 'express';
import { logger } from '../utils/logger.js';
import { Project } from '../models/Project.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { driveFileService } from '../services/driveFile.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * @route   GET /api/v1/files/:projectId/files
 * @desc    List project files (file tree)
 * @access  Private
 */
router.get('/:projectId/files', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path } = req.query;

    logger.info('File list requested', { projectId, path, userId: req.user.id });

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get file tree structure
    const fileTree = await File.getFileTree(projectId);

    // Update project last accessed time
    await project.updateLastAccessed();

    res.json({
      success: true,
      message: 'Files retrieved successfully',
      projectId,
      fileTree,
      path: path || '/'
    });
  } catch (error) {
    logger.error('Failed to list files', {
      error: error.message,
      projectId: req.params.projectId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/files/:projectId/content
 * @desc    Read file content
 * @access  Private
 * @query   path - File path to read or fileId
 */
router.get('/:projectId/content', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, fileId } = req.query;

    logger.info('File content requested', { projectId, filePath, fileId, userId: req.user.id });

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find file by ID or path
    let file;
    if (fileId) {
      file = await File.findOne({
        _id: fileId,
        project: projectId
      });
    } else if (filePath) {
      file = await File.findOne({
        path: filePath,
        project: projectId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'File path or fileId is required'
      });
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (file.type === 'folder') {
      return res.status(400).json({
        success: false,
        message: 'Cannot read content of a folder'
      });
    }

    // Try to get latest content from Google Drive
    let content = file.content;
    try {
      // Get user with drive tokens
      const userWithTokens = await User.findById(req.user._id).select('+driveAccessToken +driveRefreshToken');
      
      if (userWithTokens && userWithTokens.driveAccessToken && !userWithTokens.isTokenExpired()) {
        driveFileService.initialize(userWithTokens.driveAccessToken);
        const driveContent = await driveFileService.getFileContent(file.driveId);
        if (driveContent !== file.content) {
          // Update local content if Drive version is different
          file.content = driveContent;
          file.syncStatus = 'synced';
          await file.save();
          content = driveContent;
        }
      } else {
        logger.warn('No drive access token available or token expired', { 
          userId: req.user._id,
          hasToken: !!userWithTokens?.driveAccessToken,
          isExpired: userWithTokens?.isTokenExpired()
        });
      }
    } catch (error) {
      logger.warn('Failed to sync file content from Drive, using local version', {
        error: error.message,
        fileId: file._id
      });
    }

    res.json({
      success: true,
      message: 'File content retrieved successfully',
      content,
      metadata: {
        id: file._id,
        name: file.name,
        path: file.path,
        size: file.size,
        extension: file.extension,
        language: file.metadata.language,
        syncStatus: file.syncStatus,
        lastModified: file.updatedAt,
        encoding: file.encoding
      }
    });
  } catch (error) {
    logger.error('Failed to read file content', {
      error: error.message,
      projectId: req.params.projectId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to read file content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/v1/files/:projectId/content
 * @desc    Write file content
 * @access  Private
 * @query   path - File path to write or fileId
 */
router.put('/:projectId/content', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, fileId } = req.query;
    const { content } = req.body;

    logger.info('File write requested', { 
      projectId, 
      filePath, 
      fileId,
      contentLength: content?.length,
      userId: req.user.id 
    });

    if (content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find file by ID or path
    let file;
    if (fileId) {
      file = await File.findOne({
        _id: fileId,
        project: projectId
      });
    } else if (filePath) {
      file = await File.findOne({
        path: filePath,
        project: projectId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'File path or fileId is required'
      });
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (file.type === 'folder') {
      return res.status(400).json({
        success: false,
        message: 'Cannot write content to a folder'
      });
    }

    if (file.isReadonly) {
      return res.status(403).json({
        success: false,
        message: 'File is read-only'
      });
    }

    // Calculate content hash for sync tracking
    const contentHash = crypto.createHash('md5').update(content).digest('hex');

    // Update file content locally first (local-first approach)
    file.content = content;
    file.localHash = contentHash;
    file.syncStatus = 'syncing';
    file.metadata.lastEditedBy = req.user.id;
    file.metadata.version += 1;
    await file.save();

    // Background sync to Google Drive
    try {
      driveFileService.initialize(req.user.accessToken);
      await driveFileService.updateFile(file.driveId, content, file.mimeType);
      
      file.driveHash = contentHash;
      file.syncStatus = 'synced';
      file.lastSyncedAt = new Date();
      await file.save();
    } catch (error) {
      logger.error('Failed to sync file to Drive', {
        error: error.message,
        fileId: file._id
      });
      
      file.syncStatus = 'error';
      await file.save();
    }

    res.json({
      success: true,
      message: 'File content updated successfully',
      metadata: {
        id: file._id,
        name: file.name,
        path: file.path,
        size: file.size,
        syncStatus: file.syncStatus,
        lastModified: file.updatedAt,
        version: file.metadata.version
      }
    });
  } catch (error) {
    logger.error('Failed to write file content', {
      error: error.message,
      projectId: req.params.projectId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to write file content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/v1/files/:projectId/create
 * @desc    Create new file or folder
 * @access  Private
 */
router.post('/:projectId/create', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, type, path, parentId, content = '' } = req.body;

    logger.info('File creation requested', { 
      projectId, 
      name, 
      type, 
      path,
      userId: req.user.id 
    });

    if (!name || !type || !path) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and path are required'
      });
    }

    if (!['file', 'folder'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "file" or "folder"'
      });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if file/folder already exists
    const existingFile = await File.findOne({
      project: projectId,
      path: path
    });

    if (existingFile) {
      return res.status(409).json({
        success: false,
        message: 'File or folder already exists at this path'
      });
    }

    // Verify parent folder exists if parentId is provided
    let parentFolder = null;
    if (parentId) {
      parentFolder = await File.findOne({
        _id: parentId,
        project: projectId,
        type: 'folder'
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    // Get user with drive tokens
    const userWithTokens = await User.findById(req.user._id).select('+driveAccessToken +driveRefreshToken +driveTokenExpiresAt');
    
    logger.info('User tokens check for file creation', {
      userId: req.user._id,
      hasAccessToken: !!userWithTokens?.driveAccessToken,
      hasRefreshToken: !!userWithTokens?.driveRefreshToken,
      tokenExpiresAt: userWithTokens?.driveTokenExpiresAt,
      isExpired: userWithTokens?.isTokenExpired()
    });
    
    if (!userWithTokens || !userWithTokens.driveAccessToken) {
      return res.status(401).json({
        success: false,
        message: 'Google Drive access token not found. Please re-authenticate.',
        code: 'DRIVE_AUTH_REQUIRED',
        requiresReauth: true
      });
    }

    // Check if token is expired and try to refresh
    if (userWithTokens.isTokenExpired()) {
      logger.info('Drive access token expired, attempting refresh', { userId: req.user._id });
      
      if (!userWithTokens.driveRefreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Drive access token expired and no refresh token available. Please re-authenticate.',
          code: 'DRIVE_AUTH_EXPIRED',
          requiresReauth: true
        });
      }

      try {
        // Import here to avoid circular dependency
        const { googleDriveService } = await import('../services/googleDrive.service.js');
        const newTokens = await googleDriveService.refreshAccessToken(userWithTokens.driveRefreshToken);
        await userWithTokens.updateDriveTokens(newTokens);
        
        logger.info('Successfully refreshed drive tokens', { userId: req.user._id });
      } catch (refreshError) {
        logger.error('Failed to refresh drive tokens', {
          userId: req.user._id,
          error: refreshError.message
        });
        
        return res.status(401).json({
          success: false,
          message: 'Failed to refresh expired Drive token. Please re-authenticate.',
          code: 'DRIVE_REFRESH_FAILED',
          requiresReauth: true
        });
      }
    }

    driveFileService.initialize(userWithTokens.driveAccessToken);

    let driveFile;
    if (type === 'folder') {
      // Create folder in Google Drive
      driveFile = await driveFileService.createFolder(
        name,
        parentFolder ? parentFolder.driveId : project.driveFolderId
      );
    } else {
      // Create file in Google Drive
      driveFile = await driveFileService.createFile(
        name,
        content,
        parentFolder ? parentFolder.driveId : project.driveFolderId,
        'text/plain'
      );
    }

    // Create file record in database
    const file = new File({
      name,
      path,
      type,
      content: type === 'file' ? content : undefined,
      project: projectId,
      parent: parentId || null,
      driveId: driveFile.id,
      mimeType: type === 'folder' ? 'application/vnd.google-apps.folder' : 'text/plain',
      metadata: {
        lastEditedBy: req.user.id
      }
    });

    await file.save();

    // Update project file count
    if (type === 'file') {
      await Project.findByIdAndUpdate(projectId, {
        $inc: { fileCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      message: `${type === 'file' ? 'File' : 'Folder'} created successfully`,
      file: {
        id: file._id,
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        extension: file.extension,
        syncStatus: file.syncStatus,
        createdAt: file.createdAt,
        metadata: file.metadata
      }
    });
  } catch (error) {
    logger.error('Failed to create file/folder', {
      error: error.message,
      projectId: req.params.projectId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create file/folder',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/v1/files/:projectId/:fileId
 * @desc    Delete file or folder
 * @access  Private
 */
router.delete('/:projectId/:fileId', authenticateToken, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    logger.info('File deletion requested', { projectId, fileId, userId: req.user.id });

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find the file/folder
    const file = await File.findOne({
      _id: fileId,
      project: projectId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // If it's a folder, delete all children recursively
    if (file.type === 'folder') {
      await deleteFolder(file._id, req.user.accessToken);
    } else {
      // Delete single file from Drive
      try {
        driveFileService.initialize(req.user.accessToken);
        await driveFileService.deleteFile(file.driveId);
      } catch (error) {
        logger.warn('Failed to delete file from Drive', {
          error: error.message,
          fileId: file._id
        });
      }

      // Update project file count
      await Project.findByIdAndUpdate(projectId, {
        $inc: { fileCount: -1 }
      });
    }

    // Delete file record from database
    await File.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: `${file.type === 'file' ? 'File' : 'Folder'} deleted successfully`,
      deletedFile: {
        id: file._id,
        name: file.name,
        type: file.type
      }
    });
  } catch (error) {
    logger.error('Failed to delete file', {
      error: error.message,
      projectId: req.params.projectId,
      fileId: req.params.fileId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to recursively delete folder and its contents
async function deleteFolder(folderId, accessToken) {
  try {
    // Find all children of this folder
    const children = await File.find({ parent: folderId });

    for (const child of children) {
      if (child.type === 'folder') {
        // Recursively delete subfolders
        await deleteFolder(child._id, accessToken);
      } else {
        // Delete file from Drive
        try {
          driveFileService.initialize(accessToken);
          await driveFileService.deleteFile(child.driveId);
        } catch (error) {
          logger.warn('Failed to delete child file from Drive', {
            error: error.message,
            fileId: child._id
          });
        }
      }
      
      // Delete child from database
      await File.findByIdAndDelete(child._id);
    }

    // Delete the folder itself from Drive
    const folder = await File.findById(folderId);
    if (folder) {
      try {
        driveFileService.initialize(accessToken);
        await driveFileService.deleteFile(folder.driveId);
      } catch (error) {
        logger.warn('Failed to delete folder from Drive', {
          error: error.message,
          folderId: folder._id
        });
      }
    }
  } catch (error) {
    logger.error('Failed to delete folder recursively', {
      error: error.message,
      folderId
    });
    throw error;
  }
}

export default router;
