import mongoose from 'mongoose';
import net from 'net';
import { config } from '../src/config/env';
import { connectDB, disconnectDB } from '../src/config/db';

async function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function runCheck() {
  console.log('======================================================');
  console.log('🔍 MiniLedger Database Diagnostic Tool');
  console.log('======================================================');
  console.log(`Configured MONGODB_URI in .env: ${config.mongoUri}`);

  // Step 1: Check if port 27017 is reachable
  const isPortOpen = await checkPort('127.0.0.1', 27017);
  console.log(`\n1. Local MongoDB Port 27017 Status: ${isPortOpen ? '🟢 OPEN (Service running)' : '🔴 CLOSED (No local service on 27017)'}`);

  // Step 2: Test connection using the backend's connectDB()
  console.log('\n2. Testing Application Database Connection...');
  try {
    const conn = await connectDB();
    console.log(`   Connection Established! Host: ${conn.connection.host}, Port: ${conn.connection.port}`);
    console.log(`   Database Name: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState} (1 = Connected)`);

    // Step 3: Test Write, Read, and Delete (CRUD)
    console.log('\n3. Verifying Database Operations (CRUD test)...');
    const collection = conn.connection.db?.collection('diagnostic_check');
    if (!collection) {
      throw new Error('Database handle is undefined');
    }

    const testDoc = { testKey: 'diagnostic_' + Date.now(), timestamp: new Date() };
    const insertRes = await collection.insertOne(testDoc);
    console.log(`   ✅ Insert operation succeeded! Inserted ID: ${insertRes.insertedId}`);

    const foundDoc = await collection.findOne({ _id: insertRes.insertedId });
    console.log(`   ✅ Query operation succeeded! Found document:`, JSON.stringify(foundDoc));

    await collection.deleteOne({ _id: insertRes.insertedId });
    console.log(`   ✅ Delete operation succeeded! Cleaned up test record.`);

    console.log('\n======================================================');
    console.log('🎉 RESULT: Database is working completely fine!');
    if (!isPortOpen) {
      console.log('ℹ️  NOTE: You are currently running on the automatic');
      console.log('   embedded development MongoDB. Data will reset on server restart.');
      console.log('   To persist data permanently, either:');
      console.log('   a) Install/start MongoDB locally on port 27017');
      console.log('   b) Put a free MongoDB Atlas connection string in backend/.env');
    } else {
      console.log('ℹ️  Local MongoDB is active and persistent.');
    }
    console.log('======================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database Connection Failed:', error.message);
    process.exit(1);
  }
}

runCheck();
