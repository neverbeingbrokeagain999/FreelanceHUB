import express from 'express';
import * as codeSnippetController from '../controllers/codeSnippetController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validation/validator.js';
import * as codeSnippetValidation from '../middleware/validation/schemas/codeSnippetValidation.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', validate(codeSnippetValidation.searchSnippets), codeSnippetController.getSnippets);

// Protected routes (authentication required)
router.use(auth);

// Snippet CRUD operations
router.post(
  '/',
  validate(codeSnippetValidation.createSnippet),
  codeSnippetController.createSnippet
);

router.get(
  '/',
  validate(codeSnippetValidation.searchSnippets),
  codeSnippetController.getSnippets
);

router.get(
  '/:id',
  validate(codeSnippetValidation.getSnippet),
  codeSnippetController.getSnippetById
);

router.patch(
  '/:id',
  validate(codeSnippetValidation.updateSnippet),
  codeSnippetController.updateSnippet
);

router.delete(
  '/:id',
  validate(codeSnippetValidation.deleteSnippet),
  codeSnippetController.deleteSnippet
);

// Code execution
router.post(
  '/:id/execute',
  validate(codeSnippetValidation.executeSnippet),
  codeSnippetController.executeSnippet
);

// Version control
router.post(
  '/:id/versions',
  validate(codeSnippetValidation.createVersion),
  codeSnippetController.createVersion
);

// Fork snippet
router.post(
  '/:id/fork',
  validate(codeSnippetValidation.forkSnippet),
  codeSnippetController.forkSnippet
);

// Collaborator management
router.post(
  '/:id/collaborators',
  validate(codeSnippetValidation.manageCollaborators),
  codeSnippetController.manageCollaborators
);

router.patch(
  '/:id/collaborators/:collaboratorId',
  validate(codeSnippetValidation.manageCollaborators),
  codeSnippetController.manageCollaborators
);

router.delete(
  '/:id/collaborators/:collaboratorId',
  validate(codeSnippetValidation.manageCollaborators),
  codeSnippetController.manageCollaborators
);

// Analytics
router.get(
  '/:id/stats',
  validate(codeSnippetValidation.getSnippetStats),
  async (req, res) => {
    try {
      const stats = {
        views: await getSnippetViews(req.params.id),
        executions: await getSnippetExecutions(req.params.id),
        forks: await getSnippetForks(req.params.id),
        collaborators: await getSnippetCollaborators(req.params.id)
      };
      res.json({ success: true, data: stats });
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

// Batch operations
router.post(
  '/batch/delete',
  validate(codeSnippetValidation.batchDelete),
  async (req, res) => {
    try {
      const { snippetIds } = req.body;
      await Promise.all(
        snippetIds.map(async id => {
          const snippet = await CodeSnippet.findById(id);
          if (snippet && snippet.canEdit(req.user._id)) {
            await snippet.remove();
          }
        })
      );
      res.json({ success: true });
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

router.post(
  '/batch/update-visibility',
  validate(codeSnippetValidation.batchUpdateVisibility),
  async (req, res) => {
    try {
      const { snippetIds, visibility } = req.body;
      await Promise.all(
        snippetIds.map(async id => {
          const snippet = await CodeSnippet.findById(id);
          if (snippet && snippet.canEdit(req.user._id)) {
            snippet.visibility = visibility;
            await snippet.save();
          }
        })
      );
      res.json({ success: true });
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

// Search and filters
router.get(
  '/search',
  validate(codeSnippetValidation.searchSnippets),
  async (req, res) => {
    try {
      const {
        query,
        language,
        visibility,
        createdBy,
        collaborator,
        tags,
        sort = 'updatedAt',
        order = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      const searchQuery = {
        $or: [
          { visibility: 'public' },
          { creator: req.user._id },
          { 'collaborators.user': req.user._id }
        ]
      };

      if (query) {
        searchQuery.$text = { $search: query };
      }

      if (language) {
        searchQuery.language = language;
      }

      if (visibility) {
        searchQuery.visibility = visibility;
      }

      if (createdBy) {
        searchQuery.creator = createdBy;
      }

      if (collaborator) {
        searchQuery['collaborators.user'] = collaborator;
      }

      if (tags) {
        searchQuery.tags = { $all: tags.split(',') };
      }

      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [snippets, total] = await Promise.all([
        CodeSnippet.find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('creator', 'name email')
          .populate('collaborators.user', 'name email')
          .lean(),
        CodeSnippet.countDocuments(searchQuery)
      ]);

      res.json({
        success: true,
        data: snippets,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

export default router;
