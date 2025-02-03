import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export async function connectTestDb() {
  try {
    if (!mongod) {
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'jest-test',
          port: 27017,
        },
      });
    }

    const uri = mongod.getUri();

    // Close any existing connections
    await mongoose.disconnect();

    // Connect with shorter timeouts for testing
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    return mongod;
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
}

export async function closeTestDb() {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
  } catch (error) {
    console.error('Test database cleanup failed:', error);
    throw error;
  }
}

export async function clearTestDb() {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  } catch (error) {
    console.error('Test database clear failed:', error);
    throw error;
  }
}