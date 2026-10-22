const { MongoBinary } = require('mongodb-memory-server-core');

async function download() {
  console.log('Downloading Mongo binary...');
  const binaryPath = await MongoBinary.getPath({
    version: '6.0.14',
  });
  console.log('Mongo binary ready at:', binaryPath);
}

download().catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});
