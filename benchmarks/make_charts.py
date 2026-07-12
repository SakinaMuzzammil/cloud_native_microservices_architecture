"""
Generates the performance-evaluation figures used in the paper directly
from the raw autocannon JSON results in benchmarks/results/.
No numbers are invented here -- every value is read from a results file
produced by benchmarks/run_benchmarks.sh.
"""
import json
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RESULTS = '/home/claude/project/benchmarks/results'
OUT = '/home/claude/project/charts'
os.makedirs(OUT, exist_ok=True)

def load(name):
    with open(os.path.join(RESULTS, name)) as f:
        return json.load(f)

plt.rcParams.update({
    'font.size': 11,
    'axes.grid': True,
    'grid.alpha': 0.3,
    'figure.dpi': 150
})

# ---------- Figure 1: Throughput vs concurrency (GET /products) ----------
concurrencies = [10, 50, 100]
mono_rps = [load(f'mono_get_c{c}.json')['requests']['average'] for c in concurrencies]
micro_rps = [load(f'micro1_get_c{c}.json')['requests']['average'] for c in concurrencies]

fig, ax = plt.subplots(figsize=(6, 4.2))
ax.plot(concurrencies, mono_rps, marker='o', linewidth=2, label='Monolithic baseline')
ax.plot(concurrencies, micro_rps, marker='s', linewidth=2, label='Microservices (1 product instance)')
ax.set_xlabel('Concurrent connections')
ax.set_ylabel('Throughput (requests/sec)')
ax.set_title('Throughput vs. Concurrency: GET /products')
ax.legend()
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig1_throughput_vs_concurrency.png'))
plt.close(fig)

# ---------- Figure 2: Latency (avg & p99) vs concurrency ----------
mono_avg = [load(f'mono_get_c{c}.json')['latency']['average'] for c in concurrencies]
mono_p99 = [load(f'mono_get_c{c}.json')['latency']['p99'] for c in concurrencies]
micro_avg = [load(f'micro1_get_c{c}.json')['latency']['average'] for c in concurrencies]
micro_p99 = [load(f'micro1_get_c{c}.json')['latency']['p99'] for c in concurrencies]

fig, ax = plt.subplots(figsize=(6, 4.2))
ax.plot(concurrencies, mono_avg, marker='o', linewidth=2, label='Monolith (avg)')
ax.plot(concurrencies, mono_p99, marker='o', linestyle='--', linewidth=2, label='Monolith (p99)')
ax.plot(concurrencies, micro_avg, marker='s', linewidth=2, label='Microservices (avg)')
ax.plot(concurrencies, micro_p99, marker='s', linestyle='--', linewidth=2, label='Microservices (p99)')
ax.set_xlabel('Concurrent connections')
ax.set_ylabel('Latency (ms)')
ax.set_title('Latency vs. Concurrency: GET /products')
ax.legend(fontsize=9)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig2_latency_vs_concurrency.png'))
plt.close(fig)

# ---------- Figure 3: POST /orders (inter-service call overhead) ----------
mono_o = load('mono_orders_c50.json')
micro_o = load('micro1_orders_c50.json')
labels = ['Monolith', 'Microservices']
rps = [mono_o['requests']['average'], micro_o['requests']['average']]
lat = [mono_o['latency']['average'], micro_o['latency']['average']]

fig, axes = plt.subplots(1, 2, figsize=(8, 4))
axes[0].bar(labels, rps, color=['#4C72B0', '#DD8452'])
axes[0].set_ylabel('Throughput (req/sec)')
axes[0].set_title('POST /orders Throughput (c=50)')
axes[1].bar(labels, lat, color=['#4C72B0', '#DD8452'])
axes[1].set_ylabel('Avg latency (ms)')
axes[1].set_title('POST /orders Latency (c=50)')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig3_orders_overhead.png'))
plt.close(fig)

# ---------- Figure 4: Scalability with N product-service instances ----------
n_values = [1, 2, 4]
scale_rps = [load(f'scale_n{n}_c150.json')['requests']['average'] for n in n_values]
scale_p99 = [load(f'scale_n{n}_c150.json')['latency']['p99'] for n in n_values]

fig, ax1 = plt.subplots(figsize=(6.2, 4.2))
color1 = '#4C72B0'
ax1.plot(n_values, scale_rps, marker='o', linewidth=2, color=color1, label='Throughput')
ax1.set_xlabel('Product-service instances behind gateway')
ax1.set_ylabel('Throughput (req/sec)', color=color1)
ax1.tick_params(axis='y', labelcolor=color1)
ax1.set_xticks(n_values)

ax2 = ax1.twinx()
color2 = '#C44E52'
ax2.plot(n_values, scale_p99, marker='s', linewidth=2, color=color2, label='p99 latency')
ax2.set_ylabel('p99 latency (ms)', color=color2)
ax2.tick_params(axis='y', labelcolor=color2)

fig.suptitle('Single-Host Test-Bed Scaling (c=150) -- 1 vCPU')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig4_scalability_single_host.png'))
plt.close(fig)

print("Charts written to", OUT)
for f in sorted(os.listdir(OUT)):
    print(' -', f)
