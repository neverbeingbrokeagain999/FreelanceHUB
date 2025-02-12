import ProjectTemplate from '../models/ProjectTemplate.js';
import { errorResponse } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Create a new project template
 * @route POST /api/project-templates
 * @access Private/Admin
 */
export const createTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.create({
      ...req.body,
      createdBy: req.user.id
    });

    logger.info(`Project template created: ${template._id}`);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error creating project template:', error);
    return errorResponse(res, 500, 'Error creating project template');
  }
};

/**
 * Update a project template
 * @route PUT /api/project-templates/:id
 * @access Private/Admin
 */
export const updateTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!template) {
      return errorResponse(res, 404, 'Template not found');
    }

    logger.info(`Project template updated: ${template._id}`);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error updating project template:', error);
    return errorResponse(res, 500, 'Error updating project template');
  }
};

/**
 * Delete a project template
 * @route DELETE /api/project-templates/:id
 * @access Private/Admin
 */
export const deleteTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);

    if (!template) {
      return errorResponse(res, 404, 'Template not found');
    }

    await template.remove();

    logger.info(`Project template deleted: ${req.params.id}`);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting project template:', error);
    return errorResponse(res, 500, 'Error deleting project template');
  }
};

/**
 * Get a single project template
 * @route GET /api/project-templates/:id
 * @access Public
 */
export const getTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);

    if (!template) {
      return errorResponse(res, 404, 'Template not found');
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error fetching project template:', error);
    return errorResponse(res, 500, 'Error fetching project template');
  }
};

/**
 * List all project templates with filtering
 * @route GET /api/project-templates
 * @access Public
 */
export const listTemplates = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { category, search, skills } = req.query;
    const sort = req.sortOptions || { createdAt: -1 };

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (skills) {
      query.skills = { $in: skills.split(',').map(s => s.trim()) };
    }

    // Execute query
    const total = await ProjectTemplate.countDocuments(query);
    const templates = await ProjectTemplate.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Pagination info
    const pages = Math.ceil(total / limit);
    const hasMore = page < pages;

    res.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore
      }
    });
  } catch (error) {
    logger.error('Error listing project templates:', error);
    return errorResponse(res, 500, 'Error listing project templates');
  }
};

/**
 * Get project template statistics
 * @route GET /api/project-templates/stats
 * @access Public
 */
export const getTemplateStats = async (req, res) => {
  try {
    const stats = await ProjectTemplate.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudgetMin: { $avg: '$budget.min' },
          avgBudgetMax: { $avg: '$budget.max' },
          skills: { $addToSet: '$skills' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          avgBudgetMin: { $round: ['$avgBudgetMin', 2] },
          avgBudgetMax: { $round: ['$avgBudgetMax', 2] },
          uniqueSkills: { $size: { $reduce: {
            input: '$skills',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}}
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting template stats:', error);
    return errorResponse(res, 500, 'Error getting template statistics');
  }
};

export default {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  getTemplateStats
};
