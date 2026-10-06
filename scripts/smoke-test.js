import http from 'http';
import { spawn } from 'child_process';

const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: '3333' }, stdio: ['ignore', 'pipe', 'pipe'] });
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 3333, path }, res => {
      let data=''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}
try {
  await wait(800);
  const health = await get('/health');
  if (health.status !== 200 || !health.data.includes('quick-assess')) throw new Error('health failed: '+health.status+' '+health.data);
  const home = await get('/');
  if (home.status !== 200 || !home.data.includes('Quick Assess')) throw new Error('home failed: '+home.status);
  console.log('smoke ok: /health and / served');
} finally {
  child.kill('SIGTERM');
}
