import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import { promises as fs } from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure local storage
const localStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    public_id: (req, file) => {
      const hash = crypto.createHash('md5')
        .update(file.originalname + Date.now())
        .digest('hex');
      return `${file.fieldname}-${hash}`;
    }
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

// Create upload instances
const localUpload = multer({
  storage: localStorageConfig,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files
  }
});

const cloudinaryUpload = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files
  }
});

/**
 * Helper function to check file type using magic numbers
 */
const isValidFileType = (file) => {
  // This is a basic implementation
  // In production, you might want to use a library like 'file-type'
  const validSignatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  };

  // Get file signature
  const buffer = file.buffer;
  if (!buffer) return true; // Skip check if buffer is not available

  const signature = Array.from(buffer.slice(0, 4));
  const mimeType = file.mimetype;

  if (validSignatures[mimeType]) {
    return validSignatures[mimeType].every((byte, i) => signature[i] === byte);
  }

  return true; // Allow if we don't have a signature check for this type
};

/**
 * Middleware to handle single file upload
 * @param {string} fieldName - Form field name
 * @param {boolean} useCloudinary - Whether to use Cloudinary storage
 */
const uploadSingle = (fieldName, useCloudinary = true) => {
  const upload = useCloudinary ? cloudinaryUpload : localUpload;

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
 * @param {boolean} useCloudinary - Whether to use Cloudinary storage
 */
const uploadMultiple = (fieldName, maxCount = 5, useCloudinary = true) => {
  const upload = useCloudinary ? cloudinaryUpload : localUpload;

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
 * @param {boolean} useCloudinary - Whether to use Cloudinary storage
 */
const deleteFile = (useCloudinary = true) => {
  return async (req, res, next) => {
    try {
      const { fileId } = req.params;

      if (useCloudinary) {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(fileId);
      } else {
        // Delete from local storage
        await fs.unlink(path.join('server/uploads/', fileId));
      }

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
const validateFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (!files.length) {
    return errorResponse(res, 400, 'No files uploaded');
  }

  // Validate each file
  for (const file of files) {
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return errorResponse(res, 400, 'File size too large');
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
    if (!allowedExtensions.includes(ext)) {
      return errorResponse(res, 400, 'Invalid file type');
    }

    // Scan file content (you might want to implement virus scanning here)
    // For now, we'll just check the magic numbers of the file
    if (!isValidFileType(file)) {
      return errorResponse(res, 400, 'Invalid file content');
    }
  }

  next();
};

// Export a basic upload middleware for common use
export const upload = localUpload;

// Export all utilities
export {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  validateFiles
};
