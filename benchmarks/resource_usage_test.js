/**
 * Resource usage experiment: samples real CPU% and memory (RSS) of the
 * monolith process, and of all four microservices processes combined,
 * while each is driven with the same GET /products load (concurrency 100,
 * 6 seconds). Uses `pidusage`, which reads live process stats from /proc
 * on Linux -- these are real OS-reported measurements, not estimates.
 */
const { spawn } = require('child_process');
const pidusage = require('pidusage');
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESULTS_DIR = path.join(__dirname, 'results');
const SAMPLE_INTERVAL_MS = 250;
const LOAD_DURATION_S = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startProc(name, scriptRelPath, env) {
  const child = spawn('node', [scriptRelPath], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {}); // silence -- we only need the process running
  child.stderr.on('data', (d) => process.stderr.write(`[${name}][err] ${d}`));
  return child;
}

async function sampleWhile(pids, durationMs) {
  const samples = [];
  const end = Date.now() + durationMs;
  while (Date.now() < end) {
    try {
      const stats = await pidusage(pids);
      const totalCpu = Object.values(stats).reduce((s, v) => s + v.cpu, 0);
      const totalMemMb = Object.values(stats).reduce((s, v) => s + v.memory, 0) / (1024 * 1024);
      samples.push({ t: Date.now(), cpu: totalCpu, memMb: totalMemMb });
    } catch (e) { /* process may have briefly exited between ticks; skip */ }
    await sleep(SAMPLE_INTERVAL_MS);
  }
  return samples;
}

function summarize(samples) {
  const cpuVals = samples.map((s) => s.cpu);
  const memVals = samples.map((s) => s.memMb);
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    sampleCount: samples.length,
    avgCpuPercent: +avg(cpuVals).toFixed(1),
    peakCpuPercent: +Math.max(...cpuVals).toFixed(1),
    avgMemMb: +avg(memVals).toFixed(1),
    peakMemMb: +Math.max(...memVals).toFixed(1),
  };
}

async function main() {
  const results = {};

  console.log('== [1/2] Monolith: starting + sampling under load ==');
  const mono = startProc('monolith', 'monolith/index.js', { PORT: '16000' });
  await sleep(1000);
  const monoLoadPromise = autocannon({ url: 'http://localhost:16000/api/products', connections: 100, duration: LOAD_DURATION_S });
  const monoSamples = await sampleWhile([mono.pid], LOAD_DURATION_S * 1000);
  await monoLoadPromise;
  results.monolith = summarize(monoSamples);
  mono.kill('SIGKILL');
  await sleep(500);

  console.log('== [2/2] Microservices: starting all 4 processes + sampling under load ==');
  const auth = startProc('auth', 'services/auth/index.js', { PORT: '16001' });
  const product = startProc('product', 'services/product/index.js', { PORT: '16002', INSTANCE_ID: 'ru-product-1' });
  const order = startProc('order', 'services/order/index.js', { PORT: '16003', PRODUCT_SERVICE_URL: 'http://localhost:16002' });
  await sleep(1000);
  const gateway = startProc('gateway', 'services/gateway/index.js', {
    PORT: '16004', AUTH_URL: 'http://localhost:16001', ORDER_URL: 'http://localhost:16003',
    PRODUCT_URLS: 'http://localhost:16002', ROUTING_STRATEGY: 'round-robin',
  });
  await sleep(1000);

  const microPids = [auth.pid, product.pid, order.pid, gateway.pid];
  const microLoadPromise = autocannon({ url: 'http://localhost:16004/api/products', connections: 100, duration: LOAD_DURATION_S });
  const microSamples = await sampleWhile(microPids, LOAD_DURATION_S * 1000);
  await microLoadPromise;
  results.microservices = summarize(microSamples);
  [auth, product, order, gateway].forEach((p) => p.kill('SIGKILL'));

  results.testbed = { vCPUs: 1, node: process.version, os: 'Ubuntu 24.04.4 LTS', sampledEveryMs: SAMPLE_INTERVAL_MS };
  fs.writeFileSync(path.join(RESULTS_DIR, 'resource_usage.json'), JSON.stringify(results, null, 2));
  console.log('== done ==');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
