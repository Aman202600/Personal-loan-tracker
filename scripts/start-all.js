const { spawn } = require('child_process');
const net = require('net');

console.log('======================================================');
console.log('🚀 Launching MiniLedger Full-Stack System');
console.log('   - Step 1: Starting Local Persistent MongoDB (Port 27017)...');
console.log('   - Step 2: Starting Backend API (Port 5000)...');
console.log('   - Step 3: Starting Frontend Web App (Port 8081)...');
console.log('======================================================\n');

let mongo, backend, mobile;

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(1000);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => { resolve(false); });
    s.connect(port, host);
  });
}

async function waitForPort(port, maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    const open = await checkPort(port);
    if (open) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function startAll() {
  // 1. Start MongoDB
  mongo = spawn('npm', ['run', 'mongo:local'], { stdio: 'inherit', shell: true });

  console.log('[INFO] Waiting for MongoDB to be ready on port 27017...');
  const mongoReady = await waitForPort(27017);
  if (mongoReady) {
    console.log('🟢 MongoDB is ready and listening on port 27017!\n');
  } else {
    console.warn('⚠️  MongoDB port check timed out, proceeding to start backend...\n');
  }

  // 2. Start Backend
  backend = spawn('npm', ['run', 'dev:backend'], { stdio: 'inherit', shell: true });

  // 3. Start Frontend Web
  mobile = spawn('npm', ['run', 'web:mobile'], { stdio: 'inherit', shell: true });
}

const cleanup = () => {
  console.log('\n🛑 Stopping all MiniLedger services...');
  try { if (mongo) mongo.kill(); } catch (e) {}
  try { if (backend) backend.kill(); } catch (e) {}
  try { if (mobile) mobile.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

startAll();
