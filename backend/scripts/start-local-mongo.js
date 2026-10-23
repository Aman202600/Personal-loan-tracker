const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const binaryPath = 'C:\\Users\\amanm\\.cache\\mongodb-binaries\\mongod-x64-win32-6.0.14.exe';
const dbPath = path.resolve(__dirname, '..', 'data', 'db');

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

function checkPort(port, callback) {
  const socket = new net.Socket();
  socket.setTimeout(1500);
  socket.on('connect', () => {
    socket.destroy();
    callback(true);
  });
  socket.on('timeout', () => {
    socket.destroy();
    callback(false);
  });
  socket.on('error', () => {
    callback(false);
  });
  socket.connect(port, '127.0.0.1');
}

checkPort(27017, (isOpen) => {
  if (isOpen) {
    console.log('[INFO] MongoDB is ALREADY running and listening on port 27017.');
    process.exit(0);
  }

  console.log(`[INFO] Starting local persistent MongoDB on 127.0.0.1:27017...`);
  console.log(`[INFO] Storage location: ${dbPath}`);

  const mongod = spawn(binaryPath, ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1'], {
    stdio: 'inherit',
  });

  mongod.on('error', (err) => {
    console.error('[ERROR] Failed to start mongod:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => mongod.kill('SIGINT'));
  process.on('SIGTERM', () => mongod.kill('SIGTERM'));
});
