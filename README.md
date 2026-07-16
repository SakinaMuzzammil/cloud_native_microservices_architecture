# Cloud-Native Microservices Architecture for Scalable Web Applications

Reference implementation and empirical performance evaluation accompanying the research paper of the same name (formatted for submission to Future Generation Computer Systems).

**Live demo:** _https://cloud-native-microservices-demo-0ur2.onrender.com_ (free tier — first request after inactivity may take 30-60s to wake up)
**Paper (PDF):** [`IEEE_Paper_Cloud_Native_Microservices.pdf`](./IEEE_Paper_Cloud_Native_Microservices.pdf)
**Graphical abstract:** [`charts/graphical_abstract.png`](./charts/graphical_abstract.png)

![Architecture diagram](./charts/fig0_architecture.png)

## What this is

A small e-commerce style application (login, product catalog, order placement) implemented in **three variants**, byte-identical in business logic, so they can be fairly compared:

- **`monolith/`** — the whole application as one single process (baseline).
- **`services/`** — four independent microservices (Auth, Product, Order, API Gateway) communicating over real HTTP, using simple round-robin load balancing.
- **Proposed contribution** — the same microservices, but with the gateway's routing strategy set to `ROUTING_STRATEGY=adaptive` (see `services/gateway/router-strategies.js`): power-of-two-choices load balancing combined with a per-instance circuit breaker, so the gateway adapts to real-time instance load and automatically routes around failing instances.

All three were benchmarked under identical load using [`autocannon`](https://github.com/mcollina/autocannon), including a real fault-injection experiment (an instance is actually killed and restarted mid-benchmark) and real CPU/memory sampling via `/proc`. The raw results, charts, and full methodology are written up in the accompanying paper.

## Key results

| Experiment | Result |
|---|---|
| Throughput, GET /products (c=100) | Monolith 2163 req/s vs. microservices 621 req/s (~3.5x gap) |
| Memory under load | Monolith 100.5 MB vs. microservices 314.7 MB (~3.1x more) |
| Fault injection (instance killed mid-load) | Round-robin: ~50% error rate for the full 8s outage. Adaptive gateway: ~0% within ~1s |

## Repository structure

```
services/                     Auth, Product, Order, and Gateway microservices (Express)
services/gateway/router-strategies.js   Proposed adaptive routing: power-of-two-choices + circuit breaker
monolith/                      Single-process baseline implementation
demo/server.js                 Bundles all 4 microservices into one deployable process (for free-tier hosting)
public/                        Static frontend (login / catalog / place order) for the live demo
docker-compose.yml             Local multi-container orchestration
Dockerfile.demo                Container image used for the live demo deployment
render.yaml                    Render.com one-click deploy blueprint
k8s/                           Kubernetes manifests (Deployments, Services, HPA, Ingress) for production
terraform/                     Terraform for AWS EKS + ECR provisioning
benchmarks/                    Load-test, fault-tolerance, and resource-usage scripts + raw JSON results
charts/                        Scripts + generated figures (architecture diagram, performance charts, graphical abstract)
docs/DEPLOYMENT.md             Full step-by-step AWS/Azure/GCP deployment guide
IEEE_Paper_Cloud_Native_Microservices.docx / .pdf   The research paper
CITATION.cff                   Machine-readable citation metadata (GitHub "Cite this repository")
```

## Running it locally

**Option A — Docker Compose (closest to the real architecture, separate containers):**
```bash
docker compose up --build
curl http://localhost:4000/api/products
```

**Option B — plain Node (fastest to try):**
```bash
npm install
PORT=4001 node services/auth/index.js &
PORT=4002 node services/product/index.js &
PORT=4003 PRODUCT_SERVICE_URL=http://localhost:4002 node services/order/index.js &
PORT=4000 AUTH_URL=http://localhost:4001 ORDER_URL=http://localhost:4003 PRODUCT_URLS=http://localhost:4002 node services/gateway/index.js &
curl http://localhost:4000/api/products
```
> Windows (plain CMD/PowerShell) doesn't support trailing `&` for backgrounding — open four separate terminal windows instead, one per command, omitting the `&`.
> To stop all of them afterwards: `pkill -f "node services"` (Mac/Linux) or close the terminal windows (Windows).
> To try the proposed adaptive gateway instead of round-robin, add `ROUTING_STRATEGY=adaptive` to the gateway command above.

**Option C — the bundled demo (one process, what the live demo runs):**
```bash
npm install
PORT=8080 node demo/server.js
# open http://localhost:8080 in a browser
```

Default test accounts (seeded in-memory, not real users): `alice` / `password123` (customer) and `bob` / `password123` (admin).

## Reproducing the benchmarks

```bash
npm install
bash benchmarks/run_benchmarks.sh              # throughput/latency/scaling benchmarks -> benchmarks/results/
node benchmarks/fault_tolerance_test.js        # real instance-kill fault-injection experiment
node benchmarks/resource_usage_test.js         # real CPU/memory sampling, monolith vs. microservices
python3 charts/make_architecture_diagram.py
python3 charts/make_fault_tolerance_chart.py
python3 benchmarks/make_charts.py
python3 benchmarks/make_resource_chart.py
python3 charts/make_graphical_abstract.py
```

All experiments were run on Node.js v22.22.2, Ubuntu 24.04.4 LTS, 1 vCPU. Exact package versions are pinned in `package.json` / `package-lock.json`.

## Deploying the live demo

The full architecture (4 separate scalable microservices behind a Kubernetes-managed gateway) is meant for a real cluster — see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the complete AWS EKS / Terraform path. For a **free, public, clickable demo**, this repo also includes a bundled version (`demo/server.js`) that runs the same four services as real internal processes inside one container (using the proposed adaptive routing strategy by default), so it fits a free hosting plan's single exposed port.

To deploy on [Render](https://render.com) (free tier):
1. Push this repo to GitHub (see below).
2. On Render: **New → Blueprint**, connect this repo. Render will read `render.yaml` automatically and build `Dockerfile.demo`.
3. Wait for the build to finish; Render gives you a public URL.
4. Put that URL at the top of this README.

(Railway and Fly.io work the same way — point them at `Dockerfile.demo`.)

## Pushing this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit: cloud-native microservices reference implementation + paper"
git branch -M main
git remote add origin https://github.com/SakinaMuzzammil/cloud_native_microservices_architecture.git
git push -u origin main
```

## Citing this work

If you reference this repository or the accompanying paper, please cite (also available in machine-readable form in [`CITATION.cff`](./CITATION.cff) via GitHub's "Cite this repository" button):

> S. Muzzammil, "Cloud-Native Microservices Architecture for Scalable Web Applications: Design, Implementation, and Empirical Performance Evaluation," 2026.

## Author

Sakina Muzzammil

## License

MIT — see [`LICENSE`](./LICENSE).
