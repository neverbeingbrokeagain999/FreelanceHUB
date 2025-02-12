# Freelance Platform

A full-featured freelance marketplace platform built with the MERN stack.

## Features

- User authentication with JWT and roles (client, freelancer, admin)
- Job posting and bidding system
- Real-time chat and notifications
- Payment integration with Stripe
- File upload and sharing
- Video meetings
- Code collaboration
- Whiteboard sharing
- Document collaboration
- Review and rating system
- Admin dashboard
- Analytics and reporting
- Email notifications
- Two-factor authentication

## Prerequisites

- Node.js >= 18
- MongoDB
- Redis
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd freelance-platform
```

2. Install dependencies for both client and server:
```bash
npm run install:all
```

3. Set up environment variables:

Create `.env` files in both root and server directories using the templates provided.

4. Start development servers:
```bash
npm run start:dev
```

This will start both the frontend and backend servers in development mode.

## Database Seeding

To populate the database with sample data:

1. Make sure MongoDB is running and properly configured in .env
2. Navigate to the server directory:
```bash
cd server
```

3. Run the seed command:
```bash
npm run seed
```
cd server; $env:NODE_ENV="development"; nodemon index.js

This will add sample data including:
- Project templates for common job types
- Sample categories and skills
- Test data for development

The seeded templates include:
- Website Development
- Mobile App Development
- UI/UX Design
- WordPress Website
- E-commerce Store

Each template comes with predefined skills, budgets, and descriptions to help clients create standardized job postings.

## Testing

Run tests with:
```bash
npm test
```

For code coverage:
```bash
npm run test:coverage
```

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
