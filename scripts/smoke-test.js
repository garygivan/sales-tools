import http from 'http';
import { spawn } from 'child_process';

const smokeEnv = { ...process.env, PORT: '3333' };
delete smokeEnv.CLOUDFLARE_ACCOUNT_ID;
delete smokeEnv.CLOUDFLARE_API_TOKEN;
delete smokeEnv.OPENAI_API_KEY;
delete smokeEnv.ANTHROPIC_API_KEY;
const child = spawn(process.execPath, ['server.js'], { env: smokeEnv, stdio: ['ignore', 'pipe', 'pipe'] });
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 3333, path }, res => {
      let data=''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}
function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 3333, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let data=''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}
try {
  await wait(800);
  const health = await get('/health');
  if (health.status !== 200 || !health.data.includes('quick-assess')) throw new Error('health failed: '+health.status+' '+health.data);
  const home = await get('/');
  if (home.status !== 200 || !home.data.includes('Quick Assess')) throw new Error('home failed: '+home.status);
  const api = await post('/api/interpret', { text: 'Acme has 250 employees and needs better payroll by January.' });
  if (api.status !== 502 || !api.data.includes('AI provider not configured')) throw new Error('api fallback failed: '+api.status+' '+api.data);
  console.log('smoke ok: /health, /, and API fallback served');
} finally {
  child.kill('SIGTERM');
}
