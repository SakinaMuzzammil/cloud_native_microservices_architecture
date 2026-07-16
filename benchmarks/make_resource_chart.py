import json, os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RESULTS = os.path.join(os.path.dirname(__file__), '..', 'benchmarks', 'results')
OUT = os.path.join(os.path.dirname(__file__))

with open(os.path.join(RESULTS, 'resource_usage.json')) as f:
    data = json.load(f)

labels = ['Monolith', 'Microservices']
avg_cpu = [data['monolith']['avgCpuPercent'], data['microservices']['avgCpuPercent']]
peak_cpu = [data['monolith']['peakCpuPercent'], data['microservices']['peakCpuPercent']]
avg_mem = [data['monolith']['avgMemMb'], data['microservices']['avgMemMb']]
peak_mem = [data['monolith']['peakMemMb'], data['microservices']['peakMemMb']]

plt.rcParams.update({'font.size': 11, 'axes.grid': True, 'grid.alpha': 0.3, 'figure.dpi': 150})
fig, axes = plt.subplots(1, 2, figsize=(9, 4.2))

x = range(len(labels))
w = 0.35
axes[0].bar([i - w/2 for i in x], avg_cpu, width=w, label='Average', color='#4C72B0')
axes[0].bar([i + w/2 for i in x], peak_cpu, width=w, label='Peak', color='#DD8452')
axes[0].set_xticks(list(x)); axes[0].set_xticklabels(labels)
axes[0].set_ylabel('CPU utilization (%)')
axes[0].set_title('CPU Usage Under Load (c=100)')
axes[0].legend(fontsize=9)

axes[1].bar([i - w/2 for i in x], avg_mem, width=w, label='Average', color='#4C72B0')
axes[1].bar([i + w/2 for i in x], peak_mem, width=w, label='Peak', color='#DD8452')
axes[1].set_xticks(list(x)); axes[1].set_xticklabels(labels)
axes[1].set_ylabel('Memory RSS (MB)')
axes[1].set_title('Memory Usage Under Load (c=100)')
axes[1].legend(fontsize=9)

fig.tight_layout()
fig.savefig(os.path.join(OUT, '..', 'charts', 'fig7_resource_usage.png'))
print('Saved fig7_resource_usage.png')
