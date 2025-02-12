import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

// Create uploads directory if it doesn't exist
const uploadDir = 'server/uploads/';
try {
  await fs.access(uploadDir);
} catch {
  await fs.mkdir(uploadDir, { recursive: true });
}

// Configure local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Create upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files
  }
});

/**
 * Middleware to handle single file upload
 * @param {string} fieldName - Form field name
 */
export const uploadSingle = (fieldName) => {
  return async (req, res, next) => {
    try {
      await new Promise((resolve, reject) => {
        upload.single(fieldName)(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              reject({
                status: 400,
                message: 'File upload error',
                details: err.message
              });
            } else {
              reject(err);
            }
          }
          resolve();
        });
      });

      // Log successful upload
      if (req.file) {
        logger.info('File uploaded successfully', {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      }

      next();
    } catch (error) {
      logger.error('Upload error:', error);
      return errorResponse(res, error.status || 500, error.message);
    }
  };
};

/**
 * Middleware to handle multiple file upload
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return async (req, res, next) => {
    try {
      await new Promise((resolve, reject) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              reject({
                status: 400,
                message: 'File upload error',
                details: err.message
              });
            } else {
              reject(err);
            }
          }
          resolve();
        });
      });

      // Log successful uploads
      if (req.files?.length) {
        logger.info('Files uploaded successfully', {
          count: req.files.length,
          files: req.files.map(f => ({
            filename: f.filename,
            size: f.size,
            mimetype: f.mimetype
          }))
        });
      }

      next();
    } catch (error) {
      logger.error('Upload error:', error);
      return errorResponse(res, error.status || 500, error.message);
    }
  };
};

/**
 * Middleware to handle file deletion
 */
export const deleteFile = () => {
  return async (req, res, next) => {
    try {
      const { fileId } = req.params;
      await fs.unlink(path.join(uploadDir, fileId));
      logger.info('File deleted successfully', { fileId });
      next();
    } catch (error) {
      logger.error('File deletion error:', error);
      return errorResponse(res, 500, 'Error deleting file');
    }
  };
};

/**
 * Middleware to validate uploaded files
 */
export const validateFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (!files.length) {
    return errorResponse(res, 400, 'No files uploaded');
  }

  // Validate each file
  for (const file of files) {
    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return errorResponse(res, 400, 'File size too large');
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
    if (!allowedExtensions.includes(ext)) {
      return errorResponse(res, 400, 'Invalid file type');
    }
  }

  next();
};

// Export the basic multer instance for simpler uses
export { upload };
