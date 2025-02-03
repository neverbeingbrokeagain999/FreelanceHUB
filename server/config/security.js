import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import cors from 'cors';
import hpp from 'hpp';
import express from 'express';
import AuditLog from '../models/AuditLog.js';

const configSecurity = (app) => {
  // Security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', process.env.API_URL],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS configuration
  const whitelist = (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'])
    .map(origin => origin.trim());
  
  const corsOptions = {
    origin: whitelist,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  
  // Handle preflight requests
  app.options('*', cors(corsOptions));
  
  // Enable CORS for all routes
  app.use(cors(corsOptions));

  // Configure rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for trusted IPs (e.g., internal services)
      const trustedIps = process.env.TRUSTED_IPS?.split(',') || [];
      return trustedIps.includes(req.ip);
    }
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 requests per hour
    message: 'Too many authentication attempts, please try again later'
  });

  const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // higher limit for profile endpoints
    skipFailedRequests: true // don't count failed requests
  });

  // Apply rate limiters
  app.use('/api/auth/', authLimiter);
  app.use('/api/users/*/profile', profileLimiter);
  app.use('/api/', apiLimiter); // default limiter for all other routes

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Attempted NoSQL injection: ${key}`);
    }
  }));

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: [
      'sort',
      'page',
      'limit',
      'fields',
      'price',
      'rating',
      'category'
    ]
  }));

  // Request size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Security middleware for file uploads
  const fileTypeCheck = (req, res, next) => {
    if (!req.files) return next();

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const files = Array.isArray(req.files) ? req.files : [req.files];

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(415).json({
          success: false,
          message: 'Invalid file type. Only images, PDFs and documents are allowed.'
        });
      }
    }

    next();
  };

  // Custom security middleware
  const securityHeaders = (req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };

  app.use(securityHeaders);

  // Error handling for security violations
  app.use((err, req, res, next) => {
    if (err.name === 'SecurityError') {
      return res.status(403).json({
        success: false,
        message: 'Security violation detected'
      });
    }
    next(err);
  });

  // Security monitoring and logging
  if (process.env.NODE_ENV === 'production') {

    app.use(async (req, res, next) => {
      // Log suspicious activities
      const suspiciousPatterns = [
        /\.\.[\/\\]/,          // Directory traversal
        /<script\b[^>]*>/i,    // XSS attempts
        /\$where\b/,           // NoSQL injection
        /\b(admin|root)\b/i    // Privilege escalation attempts
      ];

      const requestData = {
        query: JSON.stringify(req.query),
        body: JSON.stringify(req.body),
        params: JSON.stringify(req.params)
      };

      for (const pattern of suspiciousPatterns) {
        for (const [key, value] of Object.entries(requestData)) {
          if (pattern.test(value)) {
            await AuditLog.logUserAction({
              event: 'security-violation',
              severity: 'high',
              actor: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
              },
              metadata: {
                type: 'suspicious-pattern',
                pattern: pattern.toString(),
                location: key
              }
            });
            break;
          }
        }
      }

      next();
    });
  }

  return {
    fileTypeCheck
  };
};

export default configSecurity;
