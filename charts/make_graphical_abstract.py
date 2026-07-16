import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

fig, ax = plt.subplots(figsize=(13, 5), dpi=300)
ax.set_xlim(0, 13); ax.set_ylim(0, 5); ax.axis('off')

def box(x, y, w, h, text, fc, ec, fontsize=9, bold=False):
    b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", linewidth=1.4,
                        edgecolor=ec, facecolor=fc)
    ax.add_patch(b)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=fontsize,
             fontweight='bold' if bold else 'normal', wrap=True)

def arrow(x1, y1, x2, y2, color='#555555'):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=14,
                                   linewidth=1.3, color=color))

# Title
ax.text(6.5, 4.7, "Cloud-Native Microservices: Monolith vs. Basic vs. Adaptive-Gateway Architecture",
        ha='center', va='center', fontsize=12, fontweight='bold')

# Input
box(0.2, 2.2, 1.7, 1.0, "Same app\n(auth, catalog,\norders) --\nbyte-identical\nbusiness logic", '#EEEDFE', '#534AB7', fontsize=8)

arrow(1.9, 2.7, 2.5, 3.4)
arrow(1.9, 2.7, 2.5, 2.7)
arrow(1.9, 2.7, 2.5, 2.0)

# Three architectures
box(2.5, 3.35, 2.6, 0.75, "Monolith\n(single process)", '#E6F1FB', '#185FA5', fontsize=9, bold=True)
box(2.5, 2.35, 2.6, 0.75, "Basic Microservices\n(round-robin gateway)", '#FAECE7', '#993C1D', fontsize=9, bold=True)
box(2.5, 1.35, 2.6, 0.75, "Proposed: Adaptive Gateway\n(power-of-2-choices +\ncircuit breaker)", '#E1F5EE', '#0F6E56', fontsize=9, bold=True)

arrow(5.1, 3.7, 5.7, 3.2)
arrow(5.1, 2.7, 5.7, 2.9)
arrow(5.1, 1.7, 5.7, 2.6)

# Results panel
box(5.8, 3.5, 3.1, 1.1, "Throughput (c=100)\nMonolith: 2163 req/s\nMicroservices: 621 req/s\n(~3.5x gap)", '#FFF7E0', '#8A6D00', fontsize=8)
box(5.8, 2.25, 3.1, 1.1, "Memory under load\nMonolith: 100.5 MB\nMicroservices: 314.7 MB\n(~3.1x more)", '#FFF7E0', '#8A6D00', fontsize=8)
box(5.8, 1.0, 3.1, 1.1, "Fault injection (kill instance)\nRound-robin: ~50% errors (8s)\nAdaptive: ~0% within ~1s", '#E1F5EE', '#0F6E56', fontsize=8, bold=True)

arrow(8.95, 4.0, 9.5, 3.8)
arrow(8.95, 2.75, 9.5, 3.1)
arrow(8.95, 1.5, 9.5, 2.2)

# Conclusion callout
box(9.6, 1.6, 3.1, 2.4,
    "Takeaway:\nMonolith wins on raw\nthroughput/memory.\nProposed adaptive gateway\nadds resilience at ~0 extra\ninfra cost -- automatic\nfailure detection & recovery.",
    '#F3F0FF', '#534AB7', fontsize=9, bold=True)

# Bottom strip: deployment
ax.text(6.5, 0.45, "Full stack: Docker -> Kubernetes (HPA) -> Terraform -> AWS EKS  |  Open-source code + benchmarks + raw data",
        ha='center', va='center', fontsize=8, style='italic', color='#444444')

fig.tight_layout()
fig.savefig('/home/claude/user_project/cloud_native_microservices_architecture-main/charts/graphical_abstract.png',
            dpi=300, bbox_inches='tight', facecolor='white')
print("Saved graphical_abstract.png")
