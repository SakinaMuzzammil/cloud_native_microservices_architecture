/**
 * Fault-tolerance experiment.
 *
 * Starts two gateways pointed at the SAME two product-service instances --
 * one gateway using the baseline "round-robin" strategy, one using the
 * proposed "adaptive" strategy (power-of-two-choices + circuit breaker).
 * Both are driven with a steady stream of GET /api/products requests.
 * Partway through, one product instance is killed (SIGKILL) to simulate a
 * real failure, then restarted later to observe recovery.
 *
 * This produces a real, reproducible time series of per-second error rate
 * for each strategy under the same failure -- the data behind the paper's
 * fault-tolerance section. Nothing here is simulated after the kill: the
 * process is actually terminated and actually restarted.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESULTS_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const TOTAL_SECONDS = 24;
const KILL_AT_SECOND = 6;
const RESTART_AT_SECOND = 14;
const REQUEST_INTERVAL_MS = 100; // ~10 req/s per strategy

const children = [];
function startService(name, scriptRelPath, env) {
  const child = spawn('node', [scriptRelPath], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${name}][err] ${d}`));
  children.push({ name, child });
  return child;
}

function killAll() {
  for (const { child } of children) {
    try { child.kill('SIGKILL'); } catch (_) {}
  }
}
process.on('exit', killAll);
process.on('SIGINT', () => { killAll(); process.exit(1); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(baseUrl) {
  const start = Date.now();
  try {
    const res = await fetch(baseUrl + '/api/products', { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, ms: Date.now() - start };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

async function driveTraffic(strategyName, baseUrl, log) {
  const end = Date.now() + TOTAL_SECONDS * 1000;
  while (Date.now() < end) {
    const t0 = Date.now();
    const result = await fetchOnce(baseUrl);
    log.push({ t: (Date.now() - GLOBAL_START) / 1000, strategy: strategyName, ...result });
    const elapsed = Date.now() - t0;
    if (elapsed < REQUEST_INTERVAL_MS) await sleep(REQUEST_INTERVAL_MS - elapsed);
  }
}

let GLOBAL_START;

async function main() {
  console.log('== starting shared auth + order services ==');
  startService('auth', 'services/auth/index.js', { PORT: '15001' });
  startService('product-1', 'services/product/index.js', { PORT: '15002', INSTANCE_ID: 'ft-product-1' });
  let product2 = startService('product-2', 'services/product/index.js', { PORT: '15012', INSTANCE_ID: 'ft-product-2' });
  startService('order', 'services/order/index.js', { PORT: '15003', PRODUCT_SERVICE_URL: 'http://localhost:15002' });
  await sleep(1500);

  console.log('== starting round-robin gateway (15000) and adaptive gateway (15010) ==');
  startService('gw-roundrobin', 'services/gateway/index.js', {
    PORT: '15000', AUTH_URL: 'http://localhost:15001', ORDER_URL: 'http://localhost:15003',
    PRODUCT_URLS: 'http://localhost:15002,http://localhost:15012', ROUTING_STRATEGY: 'round-robin',
  });
  startService('gw-adaptive', 'services/gateway/index.js', {
    PORT: '15010', AUTH_URL: 'http://localhost:15001', ORDER_URL: 'http://localhost:15003',
    PRODUCT_URLS: 'http://localhost:15002,http://localhost:15012', ROUTING_STRATEGY: 'adaptive',
  });
  await sleep(1500);

  GLOBAL_START = Date.now();
  const log = [];

  const trafficPromise = Promise.all([
    driveTraffic('round-robin', 'http://localhost:15000', log),
    driveTraffic('adaptive', 'http://localhost:15010', log),
  ]);

  await sleep(KILL_AT_SECOND * 1000);
  console.log(`== [t=${KILL_AT_SECOND}s] killing product-2 (SIGKILL, simulated real failure) ==`);
  product2.kill('SIGKILL');

  await sleep((RESTART_AT_SECOND - KILL_AT_SECOND) * 1000);
  console.log(`== [t=${RESTART_AT_SECOND}s] restarting product-2 ==`);
  product2 = startService('product-2-restarted', 'services/product/index.js', { PORT: '15012', INSTANCE_ID: 'ft-product-2' });

  await trafficPromise;
  console.log('== experiment complete, writing results ==');

  fs.writeFileSync(path.join(RESULTS_DIR, 'fault_tolerance_raw.json'), JSON.stringify(log, null, 2));

  // Aggregate into 1-second buckets per strategy: request count, error count, error rate.
  const buckets = {};
  for (const row of log) {
    const bucket = Math.floor(row.t);
    const key = `${row.strategy}:${bucket}`;
    if (!buckets[key]) buckets[key] = { strategy: row.strategy, second: bucket, total: 0, errors: 0 };
    buckets[key].total += 1;
    if (!row.ok) buckets[key].errors += 1;
  }
  const aggregated = Object.values(buckets)
    .map((b) => ({ ...b, errorRate: b.total ? b.errors / b.total : 0 }))
    .sort((a, b) => a.second - b.second);
  fs.writeFileSync(path.join(RESULTS_DIR, 'fault_tolerance_aggregated.json'), JSON.stringify(aggregated, null, 2));

  console.log(`Wrote ${log.length} raw requests, ${aggregated.length} aggregated buckets.`);
  killAll();
  process.exit(0);
}

main().catch((e) => { console.error(e); killAll(); process.exit(1); });
