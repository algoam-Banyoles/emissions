const { execSync } = require('node:child_process');

try {
  execSync('k6 version', { stdio: 'ignore' });
} catch {
  console.log('k6 no disponible. Saltant test de carrega.');
  process.exit(0);
}

execSync('k6 run tests/performance/api-load.js', { stdio: 'inherit' });
