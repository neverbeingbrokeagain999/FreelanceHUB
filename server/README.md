# Server Setup

## Security Updates Required

Due to exposed credentials, please take the following actions before running the server:

1. MongoDB Configuration
   - Create a new MongoDB Atlas cluster or use your existing one
   - Create a new database user with appropriate permissions
   - Update the `MONGO_URI` in your `.env` file with the new connection string

2. Generate New Secrets
   Run these commands to generate secure random strings:
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate session secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update these in your `.env` file

## Setup Instructions

1. Environment Setup
   ```bash
   # Copy environment template
   cp .env.template .env
   
   # Install dependencies
   npm install
   ```

2. Configure Environment Variables
   - Update all values in `.env` file
   - Ensure all secrets are secure and unique per environment

3. Start the Server
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Files

- `.env.template` - Template with placeholder values
- `.env` - Local development configuration (not committed)
- `.env.test` - Test environment configuration (not committed)
- `.env.production` - Production configuration (not committed)

## Security Features

- Environment variable validation
- Secure logging with sensitive data masking
- Rate limiting on sensitive endpoints
- CORS configuration
- XSS protection via Helmet
- Input validation
- JWT-based authentication
- Role-based access control

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run test suite
- `npm run lint` - Run code linting

## Project Structure

```
server/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Utility functions
└── tests/         # Test files
```

## API Documentation

Detailed API documentation can be found in `/docs/api.md`

## Security Considerations

See `SECURITY.md` for important security information and best practices.
