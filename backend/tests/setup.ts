import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key_12345';
  process.env.ALLOW_DEV_MOCK_OTP = 'false'; // Test real OTP logic by default
  process.env.MAX_OTP_ATTEMPTS = '3';
  process.env.OTP_EXPIRY_MINUTES = '5';

  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.14',
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
