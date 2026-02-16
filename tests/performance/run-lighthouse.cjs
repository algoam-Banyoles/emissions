const { execSync, spawn } = require('node:child_process');

const url = 'http://127.0.0.1:4173';
const reportPath = './coverage/lighthouse-report.json';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady(timeoutMs = 25_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // keep waiting
    }
    await wait(500);
  }
  return false;
}

async function run() {
  let previewProcess;
  try {
    execSync('npm run build', { stdio: 'inherit' });

    previewProcess = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
      stdio: 'ignore',
      shell: true,
    });

    const ready = await waitForServerReady();
    if (!ready) {
      console.log('No s\'ha pogut iniciar el servidor de preview per Lighthouse.');
      process.exit(0);
    }

    execSync(
      `npx lighthouse ${url} --quiet --chrome-flags="--headless --no-sandbox" --output json --output-path ${reportPath}`,
      { stdio: 'pipe' },
    );
    console.log(`Informe Lighthouse generat a ${reportPath}`);
  } catch {
    console.log('No s\'ha pogut executar Lighthouse en aquest entorn.');
    process.exit(0);
  } finally {
    if (previewProcess && !previewProcess.killed) {
      previewProcess.kill('SIGTERM');
    }
  }
}

void run();
