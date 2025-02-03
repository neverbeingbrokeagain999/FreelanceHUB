import express from 'express';
import { connectTestDb, closeTestDb, clearTestDb } from '../server/config/testDb.js';
import app from '../server/index.js';

let server;

// Set timeout for tests
jest.setTimeout(30000);

// Connect to test database and start server before all tests
beforeAll(async () => {
  try {
    // Connect to test database
    await connectTestDb();
    console.log('Connected to test database');

    // Start server
    server = await new Promise((resolve, reject) => {
      const server = app.listen(5001, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('Test server started on port 5001');
        resolve(server);
      });
    });
  } catch (error) {
    console.error('Test setup failed:', error);
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await closeTestDb();
    throw error;
  }
});

// Clear test data between each test
beforeEach(async () => {
  try {
    await clearTestDb();
    console.log('Test database cleared');
  } catch (error) {
    console.error('Failed to clear test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Allow time for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Test server closed');
    }

    // Close database connection
    await closeTestDb();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test cleanup failed:', error);
    throw error;
  }
});
