import express from 'express';
import { logger } from '../utils/logger.js';
import { Project } from '../models/Project.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { driveFileService } from '../services/driveFile.service.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/projects
 * @desc    Get all user projects
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    logger.info('Get all projects requested', { userId: req.user.id });

    const projects = await Project.findByUser(req.user.id, {
      limit: 50,
      sort: { lastAccessed: -1 }
    }).populate('files');

    // Update last accessed time for active projects
    const now = new Date();
    await Project.updateMany(
      { owner: req.user.id },
      { lastAccessed: now }
    );

    res.json({
      success: true,
      message: 'Projects retrieved successfully',
      projects: projects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description,
        language: project.programmingLanguage,
        framework: project.framework,
        lastAccessed: project.lastAccessed,
        syncStatus: project.syncStatus,
        fileCount: project.fileCount,
        size: project.size,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        settings: project.settings,
        metadata: project.metadata
      }))
    });
  } catch (error) {
    logger.error('Failed to get projects', {
      error: error.message,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, language, framework, template } = req.body;

    logger.info('Create project requested', {
      name,
      language,
      userId: req.user.id
    });

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Check if project name already exists for this user
    const existingProject = await Project.findOne({
      owner: req.user.id,
      name: name.trim()
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: 'A project with this name already exists'
      });
    }

    // Get user with Drive tokens
    const user = await User.findById(req.user.id).select('+driveAccessToken +driveRefreshToken');
    if (!user || !user.driveAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive access token not found. Please re-authenticate.'
      });
    }

    // Initialize Drive service with user's access token
    driveFileService.initialize(user.driveAccessToken);

    // Get or create the main projects folder
    const projectsFolder = await driveFileService.getOrCreateProjectsFolder();

    // Create project folder in Google Drive
    const projectFolder = await driveFileService.createProjectFolder(
      name.trim(),
      projectsFolder.id
    );

    // Create project in database (temporarily without language field)
    const projectData = {
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user.id,
      programmingLanguage: language || 'javascript',
      framework: framework || null,
      driveId: projectFolder.id,
      driveFolderId: projectFolder.id,
      metadata: {
        createdFrom: template ? 'template' : 'scratch',
        template: template || null,
        version: '1.0.0'
      }
    };

    logger.info('Creating project with data (without language):', projectData);

    const project = new Project(projectData);
    
    // Set programmingLanguage after creation to avoid validation issues
    project.programmingLanguage = language || 'javascript';
    
    logger.info('Set programmingLanguage after creation:', project.programmingLanguage);

    await project.save();

    // Try to save project first to isolate the issue
    await project.save();
    
    // Create initial files based on template or language
    let initialFiles = [];
    try {
      initialFiles = await createInitialFiles(project, language, template, user.driveAccessToken);
      
      // Update project file count
      project.fileCount = initialFiles.length;
      await project.save();
    } catch (error) {
      logger.error('Failed to create initial files, but project was saved', {
        error: error.message,
        projectId: project._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        language: project.programmingLanguage,
        framework: project.framework,
        driveId: project.driveId,
        syncStatus: project.syncStatus,
        fileCount: project.fileCount,
        createdAt: project.createdAt,
        settings: project.settings,
        metadata: project.metadata
      },
      files: initialFiles
    });
  } catch (error) {
    logger.error('Failed to create project', {
      error: error.message,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to create initial files
async function createInitialFiles(project, language, template, accessToken) {
  const files = [];

  try {
    driveFileService.initialize(accessToken);

    const templates = {
      javascript: [
        { name: 'index.js', content: '// Welcome to your new JavaScript project!\nconsole.log("Hello, World!");\n' },
        { name: 'package.json', content: `{\n  "name": "${project.name.toLowerCase().replace(/\\s+/g, '-')}",\n  "version": "1.0.0",\n  "description": "${project.description}",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js"\n  }\n}\n` },
        { name: 'README.md', content: `# ${project.name}\n\n${project.description}\n\n## Getting Started\n\nRun \`npm start\` to start the project.\n` }
      ],
      python: [
        { name: 'main.py', content: '# Welcome to your new Python project!\nprint("Hello, World!")\n' },
        { name: 'requirements.txt', content: '# Add your Python dependencies here\n' },
        { name: 'README.md', content: `# ${project.name}\n\n${project.description}\n\n## Getting Started\n\nRun \`python main.py\` to start the project.\n` }
      ],
      html: [
        { name: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${project.name}</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Welcome to ${project.name}!</h1>\n    <p>${project.description}</p>\n    <script src="script.js"></script>\n</body>\n</html>\n` },
        { name: 'style.css', content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    line-height: 1.6;\n}\n\nh1 {\n    color: #333;\n}\n' },
        { name: 'script.js', content: '// Add your JavaScript code here\nconsole.log("Project loaded successfully!");\n' }
      ]
    };

    const fileTemplates = templates[language] || templates.javascript;

    for (const fileTemplate of fileTemplates) {
      // Create file in Google Drive
      const driveFile = await driveFileService.createFile(
        fileTemplate.name,
        fileTemplate.content,
        project.driveFolderId,
        'text/plain'
      );

      // Create file in database
      const file = new File({
        name: fileTemplate.name,
        path: `/${fileTemplate.name}`,
        type: 'file',
        content: fileTemplate.content,
        project: project._id,
        driveId: driveFile.id,
        mimeType: 'text/plain',
        size: Buffer.byteLength(fileTemplate.content, 'utf8'),
        metadata: {
          lastEditedBy: project.owner
        }
      });

      await file.save();
      files.push({
        id: file._id,
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        extension: file.extension,
        metadata: file.metadata,
        syncStatus: file.syncStatus
      });
    }

    return files;
  } catch (error) {
    logger.error('Failed to create initial files', {
      error: error.message,
      projectId: project._id
    });
    return [];
  }
}

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get a specific project
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Get project requested', { projectId: id, userId: req.user.id });

    const project = await Project.findOne({
      _id: id,
      owner: req.user.id
    }).populate('files');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update last accessed time
    await project.updateLastAccessed();

    // Get file tree
    const fileTree = await File.getFileTree(project._id);

    res.json({
      success: true,
      message: 'Project retrieved successfully',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        language: project.programmingLanguage,
        framework: project.framework,
        lastAccessed: project.lastAccessed,
        syncStatus: project.syncStatus,
        fileCount: project.fileCount,
        size: project.size,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        settings: project.settings,
        metadata: project.metadata,
        fileTree
      }
    });
  } catch (error) {
    logger.error('Failed to get project', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update a project
 * @access  Private
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, language, framework, settings } = req.body;

    logger.info('Update project requested', { projectId: id, userId: req.user.id });

    const project = await Project.findOne({
      _id: id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if new name conflicts with existing projects
    if (name && name !== project.name) {
      const existingProject = await Project.findOne({
        owner: req.user.id,
        name: name.trim(),
        _id: { $ne: id }
      });

      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: 'A project with this name already exists'
        });
      }

      // Update folder name in Google Drive
      try {
        const user = await User.findById(req.user.id).select('+driveAccessToken');
        if (user && user.driveAccessToken) {
          driveFileService.initialize(user.driveAccessToken);
          await driveFileService.renameFile(project.driveId, name.trim());
        }
      } catch (error) {
        logger.warn('Failed to update project folder name in Drive', {
          error: error.message,
          projectId: id
        });
      }
    }

    // Update project fields
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (language) project.language = language;
    if (framework !== undefined) project.framework = framework;
    if (settings) {
      project.settings = { ...project.settings, ...settings };
    }

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        language: project.programmingLanguage,
        framework: project.framework,
        settings: project.settings,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    logger.error('Failed to update project', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Project deletion requested', { projectId: id, userId: req.user.id });

    const project = await Project.findOne({
      _id: id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete project folder from Google Drive
    try {
      const user = await User.findById(req.user.id).select('+driveAccessToken');
      if (user && user.driveAccessToken) {
        driveFileService.initialize(user.driveAccessToken);
        await driveFileService.deleteFile(project.driveId);
      }
    } catch (error) {
      logger.warn('Failed to delete project folder from Drive', {
        error: error.message,
        projectId: id
      });
    }

    // Delete all files associated with the project from database
    await File.deleteMany({ project: id });

    // Delete the project from database
    await Project.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
      deletedProject: {
        id,
        name: project.name
      }
    });
  } catch (error) {
    logger.error('Failed to delete project', {
      error: error.message,
      projectId: req.params.id,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
