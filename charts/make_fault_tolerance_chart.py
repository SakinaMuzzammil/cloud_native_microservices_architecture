import json
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RESULTS = os.path.join(os.path.dirname(__file__), '..', 'benchmarks', 'results')
OUT = os.path.join(os.path.dirname(__file__), '..', 'charts')
os.makedirs(OUT, exist_ok=True)

with open(os.path.join(RESULTS, 'fault_tolerance_aggregated.json')) as f:
    data = json.load(f)

KILL_AT = 6
RESTART_AT = 14

def series(strategy):
    rows = sorted([d for d in data if d['strategy'] == strategy], key=lambda d: d['second'])
    xs = [r['second'] for r in rows]
    ys = [r['errorRate'] * 100 for r in rows]
    return xs, ys

rr_x, rr_y = series('round-robin')
ad_x, ad_y = series('adaptive')

plt.rcParams.update({'font.size': 11, 'axes.grid': True, 'grid.alpha': 0.3, 'figure.dpi': 150})
fig, ax = plt.subplots(figsize=(7, 4.3))
ax.plot(rr_x, rr_y, marker='o', linewidth=2, label='Round-robin (baseline)', color='#C44E52')
ax.plot(ad_x, ad_y, marker='s', linewidth=2, label='Adaptive + circuit breaker (proposed)', color='#4C72B0')
ax.axvline(KILL_AT, color='black', linestyle='--', linewidth=1)
ax.text(KILL_AT + 0.15, 92, 'instance killed', rotation=90, va='top', fontsize=9)
ax.axvline(RESTART_AT, color='gray', linestyle=':', linewidth=1)
ax.text(RESTART_AT + 0.15, 92, 'instance restarted', rotation=90, va='top', fontsize=9)
ax.set_xlabel('Time (s)')
ax.set_ylabel('Error rate (%)')
ax.set_ylim(-5, 100)
ax.set_title('Fault-Tolerance: Error Rate Under a Real Instance Failure')
ax.legend(loc='upper right', fontsize=9)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig5_fault_tolerance.png'))
print('Saved fig5_fault_tolerance.png')
