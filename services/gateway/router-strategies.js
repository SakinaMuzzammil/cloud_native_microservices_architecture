/**
 * Adaptive routing strategy for the API Gateway's product-service pool.
 *
 * Implements two selectable strategies:
 *   - "round-robin"  : the original baseline strategy (unchanged behaviour).
 *   - "adaptive"      : the paper's proposed contribution --
 *                        power-of-two-choices load balancing [Mitzenmacher, 1996]
 *                        combined with a per-instance circuit breaker
 *                        [Fowler, "CircuitBreaker", martinfowler.com, 2014;
 *                        Nygard, "Release It!", 2007].
 *
 * Power-of-two-choices: instead of routing to a single fixed next instance
 * (round-robin) or querying the load of every instance (expensive), two
 * instances are sampled at random and the request is sent to whichever of
 * the two currently has fewer in-flight requests. This is a well-studied
 * technique that achieves near-optimal load distribution with O(1) query
 * cost per request, unlike round-robin, which is load-oblivious and can
 * keep sending traffic to an already-overloaded or degraded instance.
 *
 * Circuit breaker: each instance has a small state machine (CLOSED -> OPEN
 * -> HALF_OPEN -> CLOSED) so that an instance which is failing or timing
 * out is temporarily removed from the routing pool rather than continuing
 * to receive traffic it cannot serve, and is automatically re-admitted
 * once it recovers. This is the mechanism instrumented in the paper's
 * fault-tolerance experiment (see benchmarks/fault_tolerance_test.sh).
 */

const FAILURE_THRESHOLD = 3;      // consecutive failures before opening the circuit
const OPEN_COOLDOWN_MS = 5000;    // how long an instance stays OPEN before a trial request
const LATENCY_EWMA_ALPHA = 0.3;   // smoothing factor for the exponentially weighted moving average

const CLOSED = 'CLOSED';
const OPEN = 'OPEN';
const HALF_OPEN = 'HALF_OPEN';

class InstancePool {
  constructor(urls) {
    this.instances = urls.map((url) => ({
      url,
      activeRequests: 0,
      consecutiveFailures: 0,
      circuitState: CLOSED,
      openedAt: 0,
      latencyEwmaMs: 0,
      totalRequests: 0,
      totalFailures: 0,
    }));
    this._rrIndex = 0;
  }

  _availableInstances() {
    const now = Date.now();
    return this.instances.filter((inst) => {
      if (inst.circuitState === OPEN) {
        if (now - inst.openedAt >= OPEN_COOLDOWN_MS) {
          inst.circuitState = HALF_OPEN; // trial period: allow exactly the next request through
          return true;
        }
        return false;
      }
      return true;
    });
  }

  /** Baseline strategy: unchanged simple round-robin across all configured instances. */
  selectRoundRobin() {
    const inst = this.instances[this._rrIndex % this.instances.length];
    this._rrIndex += 1;
    return inst;
  }

  /** Proposed strategy: power-of-two-choices among circuit-healthy instances. */
  selectAdaptive() {
    let pool = this._availableInstances();
    if (pool.length === 0) {
      // All instances are OPEN (failing) -- fail open onto the least-recently-opened
      // instance rather than rejecting all traffic outright. This bounds worst-case
      // unavailability instead of causing a full outage.
      pool = [...this.instances].sort((a, b) => a.openedAt - b.openedAt);
      return pool[0];
    }
    if (pool.length === 1) return pool[0];

    const i = Math.floor(Math.random() * pool.length);
    let j = Math.floor(Math.random() * pool.length);
    while (j === i) j = Math.floor(Math.random() * pool.length);
    const a = pool[i];
    const b = pool[j];
    // Choose the instance with fewer in-flight requests; break ties on lower observed latency.
    if (a.activeRequests !== b.activeRequests) return a.activeRequests < b.activeRequests ? a : b;
    return a.latencyEwmaMs <= b.latencyEwmaMs ? a : b;
  }

  select(strategy) {
    const inst = strategy === 'adaptive' ? this.selectAdaptive() : this.selectRoundRobin();
    inst.activeRequests += 1;
    inst.totalRequests += 1;
    return inst;
  }

  recordResult(inst, { success, latencyMs }) {
    inst.activeRequests = Math.max(0, inst.activeRequests - 1);
    inst.latencyEwmaMs = inst.latencyEwmaMs === 0
      ? latencyMs
      : LATENCY_EWMA_ALPHA * latencyMs + (1 - LATENCY_EWMA_ALPHA) * inst.latencyEwmaMs;

    if (success) {
      inst.consecutiveFailures = 0;
      if (inst.circuitState === HALF_OPEN) inst.circuitState = CLOSED; // recovered
    } else {
      inst.totalFailures += 1;
      inst.consecutiveFailures += 1;
      if (inst.circuitState === HALF_OPEN) {
        // Trial request failed -- back to OPEN for another cooldown period.
        inst.circuitState = OPEN;
        inst.openedAt = Date.now();
      } else if (inst.consecutiveFailures >= FAILURE_THRESHOLD && inst.circuitState === CLOSED) {
        inst.circuitState = OPEN;
        inst.openedAt = Date.now();
      }
    }
  }

  snapshot() {
    return this.instances.map(({ url, activeRequests, circuitState, latencyEwmaMs, totalRequests, totalFailures }) => ({
      url, activeRequests, circuitState, latencyEwmaMs: Math.round(latencyEwmaMs), totalRequests, totalFailures,
    }));
  }
}

module.exports = { InstancePool, CLOSED, OPEN, HALF_OPEN };
