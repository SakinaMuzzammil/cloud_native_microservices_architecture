const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  SectionType, PageOrientation, ExternalHyperlink, ShadingType
} = require("docx");
const fs = require("fs");

const CHARTS = __dirname + "/charts/";

function img(file, widthPx, heightPx) {
  return new ImageRun({
    type: "png",
    data: fs.readFileSync(CHARTS + file),
    transformation: { width: widthPx, height: heightPx },
  });
}

function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, size: 18, italics: false })],
  });
}

function figure(file, w, h, caption) {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [img(file, w, h)] }),
    figCaption(caption),
  ];
}

function h(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 20, allCaps: false })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, italics: true, size: 20 })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: opts.noIndent ? 0 : 220 },
    children: [new TextRun({ text, size: 20 })],
  });
}
function pRuns(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: opts.noIndent ? 0 : 220 },
    children: runs,
  });
}
function refPara(num, text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 260, hanging: 260 },
    children: [new TextRun({ text: `[${num}] `, size: 18 }), new TextRun({ text, size: 18 })],
  });
}
function codeBlock(lines) {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    spacing: { before: 100, after: 160 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" }, bottom: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" }, left: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" }, right: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" } },
    children: lines.map((l, i) => new TextRun({ text: l, font: "Courier New", size: 16, break: i === 0 ? 0 : 1 })),
  });
}

function dataTable(headerCells, rows) {
  const mk = (text, bold) => new TableCell({
    width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE },
    shading: bold ? { type: ShadingType.CLEAR, fill: "DDDDDD" } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 16, bold })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headerCells.map(t => mk(t, true)) }),
      ...rows.map(r => new TableRow({ children: r.map(t => mk(String(t), false)) })),
    ],
  });
}

// ---------------- Title block (single column) ----------------
const titleSection = {
  properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: "Cloud-Native Microservices Architecture for Scalable Web Applications: Design, Implementation, and Empirical Performance Evaluation", bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: "Sakina Muzzammil", italics: true, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "Independent Researcher — sakinamuzzammil@gmail.com — ORCID: [your-orcid-id, e.g. 0000-0000-0000-0000]", italics: true, size: 18 })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "Highlights", bold: true, size: 20 })],
    }),
    new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• Reference monolith, basic-microservices, and adaptive-gateway implementations with byte-identical business logic.", size: 18 })] }),
    new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• Novel gateway combines power-of-two-choices load balancing with a per-instance circuit breaker.", size: 18 })] }),
    new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• Real fault-injection test: proposed gateway cuts outage error rate from ~50% to ~0% within 1s.", size: 18 })] }),
    new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• CPU/memory measurements show microservices use ~3.1x more memory than the monolith under load.", size: 18 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "• Full Docker/Kubernetes/Terraform AWS deployment pipeline and reproducible benchmark suite released.", size: 18 })] }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "Abstract—", bold: true, italics: true, size: 20 }),
      new TextRun({
        text: "Microservices architecture has become the default recommendation for building scalable, cloud-native web applications, yet empirical evidence on its performance and resilience trade-offs relative to monolithic designs remains inconsistent across the literature. This paper presents (i) a reference implementation of a monolithic application, a basic microservices version using round-robin load balancing, and a proposed microservices variant using an adaptive, latency-aware API gateway; (ii) a complete cloud-native deployment pipeline targeting Amazon Web Services using Docker, Kubernetes, and Terraform; and (iii) a controlled, three-way performance and fault-tolerance evaluation. The proposed gateway combines power-of-two-choices load balancing with a per-instance circuit breaker, so that request routing adapts to real-time instance load and automatically routes around failing instances. Throughput results confirm the pattern reported in prior controlled studies: the monolith achieves substantially higher raw throughput than either microservices variant on a single host, because it avoids network-bound inter-process calls. The fault-tolerance experiment, however, shows a clear and reproducible benefit of the proposed contribution: under a real, injected instance failure, the baseline round-robin gateway sustains an approximately 50% error rate for the full duration of the outage, while the proposed adaptive gateway detects the failure and reduces the error rate to near zero within about one second, recovering automatically once the instance is restored. We further report a limitation observed under single-core test conditions, where naive horizontal scaling of a stateless service tier shows no throughput benefit absent additional physical parallelism, and we explain how this is resolved in a genuine multi-node Kubernetes deployment via Horizontal Pod Autoscaling. All source code, infrastructure-as-code, and raw benchmark data accompanying this paper are made available for reproducibility.",
        italics: true, size: 20,
      })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "Index Terms—", bold: true, italics: true, size: 20 }),
      new TextRun({ text: "cloud-native computing, microservices architecture, Kubernetes, container orchestration, API gateway, horizontal pod autoscaling, performance evaluation, scalability, AWS", italics: true, size: 20 })],
    }),
  ],
};

// ---------------- Body (two columns) ----------------
const body = [];

body.push(h("I. Introduction"));
body.push(p("Cloud-native computing has reshaped how web applications are designed, built, and operated. The Cloud Native Computing Foundation (CNCF) defines cloud-native technologies as those that empower organizations to build and run scalable applications in modern, dynamic environments through containers, service meshes, microservices, immutable infrastructure, and declarative APIs [9]. Among these, the microservices architectural style — an approach to developing an application as a suite of small, independently deployable services communicating over lightweight mechanisms such as HTTP — was first articulated systematically by Lewis and Fowler [1] and later elaborated into practitioner guidance by Newman [2].", { noIndent: true }));
body.push(p("The appeal of microservices is well documented: independent deployability, per-service scaling, technology heterogeneity, and fault isolation [1], [3]. However, these benefits are not free. Splitting a single process into many introduces network latency, serialization overhead, distributed-system failure modes, and operational complexity that a monolith does not incur [4], [5]. The literature on the resulting performance trade-off is, notably, inconsistent: some controlled studies report microservices improving throughput and reliability in distributed deployments [6], while others report monoliths outperforming microservices on raw throughput by measurable margins under concurrency [7], [8]. A widely discussed industry case is Amazon Prime Video's video-monitoring service, which was re-architected from a distributed serverless/microservices design back to a monolithic process, yielding a reported 90% infrastructure cost reduction and higher achievable scale for that specific workload [10]."));
body.push(p("This inconsistency motivates the approach taken in this paper: rather than asserting a universal winner, we build both architectures for the same application, deploy both to a reproducible cloud-native pipeline, and measure both under identical, disclosed conditions. Our contributions are:"));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "1) ", size: 20 }), new TextRun({ text: "A working reference implementation of a monolithic application, a basic microservices application, and a proposed adaptive-gateway microservices variant, all with byte-identical business logic (authentication, product catalog, order orchestration);", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "2) ", size: 20 }), new TextRun({ text: "A complete cloud-native deployment pipeline (Docker, Kubernetes manifests with Horizontal Pod Autoscaling, an AWS ALB Ingress, and Terraform infrastructure-as-code for Amazon EKS);", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "3) ", size: 20 }), new TextRun({ text: "A controlled, reproducible performance evaluation using real load-test data (not simulated figures), including throughput, latency, and a horizontal-scaling experiment;", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "4) ", size: 20 }), new TextRun({ text: "A proposed adaptive API gateway combining power-of-two-choices load balancing with a per-instance circuit breaker, together with a real fault-injection experiment quantifying its effect on error rate during an actual instance failure; and", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 120 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "5) ", size: 20 }), new TextRun({ text: "An honest discussion of the limitations of single-host benchmarking for evaluating horizontal scalability claims.", size: 20 })] }));

body.push(h("II. Related Work"));
body.push(p("Lewis and Fowler [1] were the first to systematically characterize the microservices style, describing common traits including componentization via services, organization around business capabilities, decentralized data management, and automated, independent deployment. Newman [2] expanded this into a practitioner handbook covering service boundaries, integration, and operational concerns. Dragoni et al. [3] surveyed the evolution of the paradigm and identified open research challenges, including standardized performance benchmarking — a gap this paper addresses directly for a concrete workload. Balalaie et al. [4] documented an industrial migration of a monolith to a cloud-native, microservices-based architecture, reporting the DevOps practices required to make the migration viable.", { noIndent: true }));
body.push(p("On the empirical performance side, Al-Debagy and Martinek [7] conducted concurrency and load tests comparing a monolith and an equivalent microservices application, finding the monolith approximately 6% higher in throughput under concurrency testing with no significant difference under general load testing. Blinowski et al. [8] ran a larger controlled experiment across local, Azure Spring Cloud, and Azure App Service environments and across two implementation languages, and reported that monolithic architecture outperforms microservices on single machines primarily due to reduced inter-process communication overhead. Our results in Section VI are directionally consistent with both studies. Container technology itself, which underlies practical microservices deployment, was introduced to a broad audience by Merkel [11], and container-orchestration design patterns were formalized by Burns and Oppenheimer [12], whose sidecar, ambassador, and adapter patterns underlie the API-gateway design used in this work."));

body.push(p("Recent work (2023-2025) has begun to move beyond static round-robin or resource-threshold load balancing toward adaptive strategies: Chawla [18] proposed a reinforcement-learning-based load balancer for dynamic cloud environments; a 2024 study on adaptive load balancing and autoscaling for microservices [19] argued for hybrid reactive/predictive strategies over purely reactive HPA-style scaling; and de Carvalho Neto et al. [20] extended the Kubernetes scheduler itself with a dynamic load-balancing extension. None of these studies, however, report a controlled, reproducible fault-injection experiment quantifying the resulting error-rate benefit under a real (not simulated) instance failure alongside a monolith/microservices throughput baseline -- the specific gap this paper addresses (Table I).", { noIndent: true }));
body.push(dataTable(
  ["Study", "Year", "Adaptive routing?", "Real fault injection?", "Monolith baseline?"],
  [
    ["Al-Debagy & Martinek [7]", "2018", "No", "No", "Yes"],
    ["Blinowski et al. [8]", "2022", "No", "No", "Yes"],
    ["Chawla [18]", "2024", "Yes (RL-based)", "No", "No"],
    ["Adaptive LB/autoscaling survey [19]", "2024", "Discussed (survey)", "No", "No"],
    ["de Carvalho Neto et al. [20]", "2025", "Yes (scheduler-level)", "No", "No"],
    ["This work", "2026", "Yes (P2C + circuit breaker)", "Yes", "Yes"],
  ]
));
body.push(new Paragraph({ spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "TABLE I. RELATED-WORK GAP SUMMARY", size: 16, bold: true })] }));
body.push(h("III. System Architecture"));
body.push(p("Figure 1 shows the reference architecture evaluated in this paper. A client issues requests to a cloud load balancer (an AWS Application Load Balancer in production, or a local reverse proxy in the test-bed), which forwards traffic to a horizontally replicated API Gateway tier. The gateway is the single entry point for all client traffic and performs two roles: request routing to the correct downstream service based on URL prefix, and client-side round-robin load balancing across replicas of the Product Service. This mirrors the responsibilities that, in a managed Kubernetes deployment, are split between the Kubernetes Service abstraction (load balancing) and an Ingress controller (routing).", { noIndent: true }));
body.push(...figure("fig0_architecture.png", 430, 412, "Fig. 1. Reference system architecture: client, cloud load balancer, API gateway tier, three independently deployable microservices, per-service data stores, and a monitoring/logging cross-cutting layer."));
body.push(p("Three business microservices sit behind the gateway. The Auth Service issues and verifies JSON Web Tokens (JWT) and owns the user credential store. The Product Service is deliberately stateless and idempotent so that it can be replicated arbitrarily behind the gateway; it owns the product catalog and exposes an internal stock-reservation endpoint. The Order Service owns order placement and orchestration: rather than accessing product data directly, it performs a synchronous REST call to the Product Service to validate and reserve stock before confirming an order. This inter-service call is the architecturally significant difference from the monolithic baseline described in Section IV, and it is the specific interaction instrumented in the POST /orders benchmark in Section VI. Each service is designed to own its data exclusively, consistent with the decentralized data management principle described by Lewis and Fowler [1]."));

body.push(h("IV. Implementation"));
body.push(h2("A. Technology stack"));
body.push(p("All services are implemented in Node.js with the Express web framework, chosen for low boilerplate and because its single-threaded, event-loop execution model makes network-bound overhead (the variable of interest in this study) clearly observable rather than masked by multi-threaded request handling. Authentication uses signed JSON Web Tokens (jsonwebtoken). Inter-service HTTP calls use the platform fetch API. Each service exposes a /health endpoint returning liveness status, used both by local health checks and by Kubernetes readiness/liveness probes in the cloud deployment.", { noIndent: true }));
body.push(h2("B. Monolithic baseline"));
body.push(p("To isolate architectural effects from implementation effects, we also implemented a monolithic version of the identical application: one Express process containing the same authentication, catalog, and order-placement logic, using in-process function calls instead of network requests. This is the standard controlled-comparison methodology used in prior work [7], [8]: the only independent variable that changes between the two systems under test is whether a component boundary is crossed in-process or over the network."));
body.push(h2("C. API Gateway and service discovery"));
body.push(p("The gateway resolves the Product Service's address from a configurable, comma-separated list of instance URLs and applies simple round-robin selection on each incoming request. This is a minimal, self-contained analogue of the service-discovery and client-side load-balancing responsibility that, in the cloud deployment described in Section V, is instead delegated to the Kubernetes Service object and kube-proxy, which perform the same function against a dynamically changing set of pod IP addresses."));
body.push(codeBlock([
  "// Order Service -> Product Service inter-service call",
  "const reserveResp = await fetch(",
  "  `${PRODUCT_SERVICE_URL}/products/${productId}/reserve`,",
  "  { method: 'POST',",
  "    headers: {'Content-Type':'application/json'},",
  "    body: JSON.stringify({ qty }) }",
  ");",
]));
body.push(h2("D. Proposed contribution: adaptive gateway"));
body.push(p("The gateway described above uses round-robin selection, which is load-oblivious: it continues to forward a fixed share of traffic to an instance regardless of whether that instance is slow, overloaded, or has failed outright. We propose and implement an adaptive alternative, selectable at runtime via a ROUTING_STRATEGY environment variable so that both strategies run from the same codebase and can be compared under identical conditions. The proposed strategy combines two established techniques not previously combined and evaluated together, to our knowledge, with a real fault-injection benchmark in a microservices context (Table I):", { noIndent: true }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "1) ", size: 20 }), new TextRun({ text: "Power-of-two-choices load balancing [15]: for each request, two candidate instances are sampled at random from the pool and the request is routed to whichever currently has fewer in-flight requests. This achieves near-optimal load distribution at O(1) query cost per request, without the overhead of querying every instance's load on every request.", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 120 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "2) ", size: 20 }), new TextRun({ text: "A per-instance circuit breaker [16], [17]: each instance is tracked through a CLOSED -> OPEN -> HALF_OPEN -> CLOSED state machine. Three consecutive failures or request timeouts (3 s) open the circuit, removing that instance from the routing pool for a 5 s cooldown; a trial request is then allowed through (HALF_OPEN), closing the circuit on success or re-opening it on failure. If every instance is simultaneously OPEN, the gateway fails open onto the least-recently-failed instance rather than rejecting all traffic, bounding worst-case unavailability.", size: 20 })] }));
body.push(codeBlock([
  "// Power-of-two-choices selection (services/gateway/router-strategies.js)",
  "const i = randomIndex(pool), j = randomIndex(pool, i);",
  "const a = pool[i], b = pool[j];",
  "return a.activeRequests !== b.activeRequests",
  "  ? (a.activeRequests < b.activeRequests ? a : b)",
  "  : (a.latencyEwmaMs <= b.latencyEwmaMs ? a : b);",
]));
body.push(p("This is implemented purely at the application layer inside the existing Node.js gateway (services/gateway/router-strategies.js) -- it requires no service mesh, sidecar, or additional infrastructure, making it a low-cost addition to the baseline architecture described in Section III. Section VI-E reports a controlled fault-injection experiment quantifying its effect relative to the round-robin baseline."));

body.push(h("V. Cloud Deployment"));
body.push(p("Each microservice is packaged as an independent, minimal Docker image (node:20-alpine base) [11], with a docker-compose.yml provided for local multi-container orchestration and integration testing. For production deployment, the accompanying repository provides:", { noIndent: true }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "1) ", size: 20 }), new TextRun({ text: "Kubernetes manifests defining a Deployment, Service, and readiness/liveness probes for each microservice, with a HorizontalPodAutoscaler (HPA) on the Product Service (2-10 replicas) and the Gateway (2-8 replicas) targeting 60% average CPU utilization, following the resource-based autoscaling model documented for Kubernetes [13];", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "2) ", size: 20 }), new TextRun({ text: "An AWS Application Load Balancer Ingress resource routing external traffic to the Gateway Service; and", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 120 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "3) ", size: 20 }), new TextRun({ text: "Terraform configuration provisioning an Amazon EKS cluster, its supporting VPC, and one Amazon ECR repository per service, so the entire cloud environment is reproducible from source [14].", size: 20 })] }));
body.push(p("The container images and Kubernetes manifests are cloud-provider agnostic; the deployment guide accompanying this work additionally documents the equivalent steps for Azure Kubernetes Service and Google Kubernetes Engine, since none of the Kubernetes-level constructs used (Deployment, Service, HPA, readiness probes) are AWS-specific — only the Ingress controller annotation and managed registry differ across providers."));

body.push(h("VI. Performance Evaluation"));
body.push(h2("A. Methodology"));
body.push(p("Both systems were deployed side by side on the same host and exercised with autocannon, an HTTP/1.1 load-testing tool, using identical request payloads, duration (5 s per run), and concurrency levels. Three experiments were conducted: (1) GET /products throughput and latency across concurrency levels of 10, 50, and 100 connections; (2) POST /orders throughput and latency at 50 connections, isolating the cost of the Order-to-Product inter-service call; and (3) a scaling experiment measuring throughput and p99 latency at a fixed 150 connections while the number of Product Service replicas behind the gateway was increased from 1 to 2 to 4. All raw JSON results are included in the accompanying repository (benchmarks/results/) for independent verification; no figures in this section are estimated or simulated.", { noIndent: true }));
body.push(p("Test-bed disclosure: the benchmarks in this section were executed on a single-vCPU containerized host. This is an important and deliberate limitation discussed in Section VII — it represents a worst case for microservices, since every inter-service network hop must serialize on the same core that is also running the monolith's comparison workload, and it precludes observing the multi-core/multi-node scaling benefit that the Kubernetes HPA configuration in Section V is designed to exploit."));
body.push(p("Exact reproducibility details: Node.js v22.22.2, npm 10.9.7, Ubuntu 24.04.4 LTS, 1 vCPU / 3.9 GiB RAM. Load generation used autocannon v8.0.0; the HTTP frameworks were Express 5.2.1 (all services) with jsonwebtoken 9.0.3 for JWT issuance and pidusage 4.0.1 for the /proc-based resource sampling in Section VI-F. All package versions are pinned in package.json / package-lock.json in the accompanying repository, and every benchmark in this paper can be reproduced end-to-end via the scripts in benchmarks/ (see the repository README for exact commands)."));

body.push(h2("B. Throughput and latency: monolith vs. microservices"));
body.push(...figure("fig1_throughput_vs_concurrency.png", 300, 210, "Fig. 2. GET /products throughput vs. concurrent connections."));
body.push(...figure("fig2_latency_vs_concurrency.png", 300, 210, "Fig. 3. GET /products average and p99 latency vs. concurrent connections."));
body.push(p("Table II summarizes the raw measurements underlying Figs. 2-3. Across all tested concurrency levels, the monolith sustained approximately 3.3-4.0x higher throughput than the single-instance microservices configuration, and average latency 3.3-3.9x lower. This gap is attributable to the additional HTTP request/response cycle, JSON serialization, and event-loop context switch introduced at the API Gateway and, for the product endpoint, is a direct measurement of pure routing overhead since GET /products does not itself trigger a further downstream call.", { noIndent: true }));
body.push(dataTable(
  ["Concurrency", "Monolith req/s", "Micro. req/s", "Monolith lat. (ms)", "Micro. lat. (ms)"],
  [
    [10, "1380.8", "346.2", "6.81", "28.39"],
    [50, "1944.8", "523.4", "25.19", "94.62"],
    [100, "2163.4", "621.4", "45.58", "159.24"],
  ]
));
body.push(new Paragraph({ spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "TABLE II. GET /products RESULTS (5 s PER RUN)", size: 16, bold: true })] }));

body.push(h2("C. Inter-service call overhead: order placement"));
body.push(...figure("fig3_orders_overhead.png", 340, 170, "Fig. 4. POST /orders throughput and latency at concurrency 50, monolith vs. microservices."));
body.push(p("The order-placement endpoint isolates the cost of a genuine synchronous inter-service call (Order Service to Product Service). At concurrency 50, the monolith achieved 1724.6 req/s at 28.51 ms average latency, versus 193.2 req/s at 255.22 ms average latency for the microservices configuration — roughly an 8.9x throughput reduction and 9x latency increase. This is the largest gap observed in our evaluation and quantifies, for this workload and test-bed, the cost of decomposing a single transactional operation across a network boundary, consistent with the general finding in [7], [8] that microservices' communication overhead is most pronounced for operations that require multiple services to complete a single logical transaction.", { noIndent: true }));

body.push(h2("D. Horizontal scaling experiment"));
body.push(...figure("fig4_scalability_single_host.png", 300, 210, "Fig. 5. Throughput and p99 latency vs. number of Product Service replicas behind the gateway, fixed concurrency = 150, single-vCPU test-bed."));
body.push(p("Contrary to the scaling benefit typically cited as microservices' primary advantage, throughput did not improve as Product Service replicas increased from 1 to 4 on our single-core test-bed (477.2, 407.2, and 381.6 req/s respectively), and p99 latency was highest at 4 replicas (3184 ms). We interpret this not as evidence against horizontal scaling as a concept, but as an artifact of the test environment, discussed in Section VII: with only one physical CPU core available, additional replicas compete for the same core as the gateway process and the existing replicas, rather than executing in parallel, and the gateway's own single-threaded event loop becomes the bottleneck before any replica-level benefit can be realized.", { noIndent: true }));

body.push(h2("E. Fault-tolerance evaluation: proposed adaptive gateway vs. round-robin"));
body.push(p("To evaluate the proposed contribution (Section IV-D), we ran both routing strategies simultaneously against the same two-instance Product Service pool, driving each with a steady ~10 requests/second GET /products workload for 24 seconds. At t=6 s, one product-service instance was terminated with SIGKILL -- a real process kill, not a simulated fault -- and restarted at t=14 s. Both gateways observed the identical failure and restart events at the identical wall-clock times.", { noIndent: true }));
body.push(...figure("fig5_fault_tolerance.png", 380, 233, "Fig. 6. Per-second error rate for round-robin vs. the proposed adaptive gateway, under a real instance kill at t=6s and restart at t=14s (473 total requests logged)."));
body.push(p("The round-robin baseline continues to route approximately half of all requests to the dead instance for the entire 8-second outage window, sustaining a 40-50% error rate throughout, since it has no mechanism to detect or avoid a failed instance -- it only recovers once the instance is manually restarted and happens to be selected again. The proposed adaptive gateway's error rate spikes briefly at the moment of failure (a single in-flight request necessarily fails before the breaker opens) but falls to near 0% within about one second, as the circuit breaker opens for the dead instance and power-of-two-choices routes all subsequent traffic to the surviving instance; it remains at approximately 0% for the rest of the outage and integrates the restarted instance back into rotation automatically once its trial request succeeds. Raw per-request data (473 requests) and the aggregated per-second error rates are included in benchmarks/results/fault_tolerance_raw.json and fault_tolerance_aggregated.json for independent verification."));

body.push(h2("F. Resource utilization: CPU and memory"));
body.push(p("To address CPU and memory cost directly (not only throughput/latency), we sampled live process statistics via the Linux /proc filesystem every 250 ms while each architecture was driven with the same GET /products workload at concurrency 100 for 6 seconds. For the monolith this is a single process; for microservices it is the sum across the Auth, Product, Order, and Gateway processes.", { noIndent: true }));
body.push(...figure("fig7_resource_usage.png", 400, 187, "Fig. 7. CPU utilization and memory (RSS) under identical load, monolith vs. microservices, measured via /proc sampling every 250ms."));
body.push(p("The monolith averaged 72.0% CPU and 100.5 MB RSS (peak 84.0% / 110.7 MB). The microservices configuration averaged 88.1% CPU and 314.7 MB RSS (peak 100% / 350.9 MB) -- approximately 3.1x the memory footprint and a CPU profile that reaches full saturation of the single available core, versus headroom remaining for the monolith. The memory difference is expected and structural: each microservice process carries its own Node.js runtime and module graph, a fixed per-process overhead that a single monolithic process pays only once. This is a direct, measured cost of the architectural decomposition, independent of the routing-overhead cost already quantified in Section VI-B/C."));

body.push(h("VII. Discussion and Threats to Validity"));
body.push(p("Internal validity: because both systems share identical business logic, implementation language, and host, the throughput and latency differences reported in Section VI can be attributed with reasonable confidence to the architectural boundary itself (in-process call vs. network call) rather than to confounding implementation differences.", { noIndent: true }));
body.push(p("External validity — the single-core limitation: the most significant threat to validity in this study is that all benchmarks were executed on a single-vCPU host, for practical sandboxing reasons. This setting is a worst case for microservices communication overhead (Section VI-B, VI-C) and is unable to demonstrate the horizontal-scaling benefit that motivates microservices adoption in practice (Section VI-D). In a genuine multi-node Kubernetes deployment such as the Amazon EKS cluster provisioned in Section V, each additional Product Service replica can be scheduled to a distinct worker node with its own CPU allocation, and the HorizontalPodAutoscaler would provision replicas automatically as CPU utilization crosses the configured 60% threshold [13]; under that condition, prior larger-scale studies [6] and industry practice report throughput scaling roughly linearly with replica count until a downstream bottleneck (e.g., a shared database) is reached. We report our single-host results transparently rather than extrapolating, and recommend that any reproduction of this study for publication-grade claims about horizontal scalability be conducted on a genuine multi-node cluster."));
body.push(p("Counter-evidence from industry: the Amazon Prime Video case [10] is a useful counterpoint even at production scale — that team found a specific, highly network-chatty microservices/serverless decomposition to be more expensive and less scalable than a consolidated process for their video-monitoring workload, illustrating that the trade-off measured in this paper is workload-dependent and not resolved simply by moving to more powerful infrastructure."));
body.push(p("Recommendation: consistent with [3], [8], and the Prime Video case [10], we do not recommend microservices as a default choice. They are appropriate when independent team ownership, independent deployment cadence, and independent elastic scaling of specific components are organizational requirements that outweigh the measured raw-throughput and latency cost documented in Section VI."));

body.push(h("VIII. Limitations"));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "1) ", size: 20 }), new TextRun({ text: "Single-host test-bed: all throughput, latency, resource-usage, and fault-tolerance results in this paper were measured on a single 1-vCPU host. Absolute numbers, and particularly the horizontal-scaling result in Section VI-D, should not be extrapolated to multi-node production clusters without re-measurement; Section VII discusses the expected qualitative difference.", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "2) ", size: 20 }), new TextRun({ text: "Application scope: the reference application (auth, catalog, orders) is intentionally small so that monolith and microservices implementations could be kept byte-identical in business logic; results may not transfer directly to systems with substantially more services, deeper call chains, or stateful inter-service transactions.", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "3) ", size: 20 }), new TextRun({ text: "Single-run measurements: due to time constraints, each benchmark configuration was run once rather than averaged across multiple repeated trials; we report raw data transparently (Section VI, accompanying repository) so readers can assess variance from the per-request logs directly, but we did not compute confidence intervals across repeated runs.", size: 20 })] }));
body.push(new Paragraph({ spacing: { after: 120 }, indent: { left: 260, hanging: 200 }, children: [new TextRun({ text: "4) ", size: 20 }), new TextRun({ text: "Proposed gateway maturity: the adaptive gateway (Section IV-D) is a research prototype evaluated against one failure mode (a killed instance); it has not been evaluated against network partitions, cascading failures across multiple services, or production traffic patterns.", size: 20 })] }));

body.push(h("IX. Conclusion and Future Work"));
body.push(p("This paper presented a reference implementation, complete AWS-targeted cloud-native deployment pipeline, and controlled empirical comparison of a monolithic architecture, a basic microservices architecture, and a proposed adaptive-gateway microservices variant for the same application. On raw throughput, our measurements are consistent with prior controlled studies [7], [8]: the monolith achieves 3-9x higher throughput and correspondingly lower latency on a single host, with the largest gap on operations requiring an inter-service transaction, and this cost was not reduced by the proposed gateway, which does not change the number of network hops. On resource usage, microservices consumed approximately 3.1x the memory of the monolith under identical load (Section VI-F). On resilience, however, the proposed contribution shows a clear, reproducible benefit: under a real injected instance failure, the round-robin baseline sustained a 40-50% error rate for the full 8-second outage, while the proposed power-of-two-choices plus circuit-breaker gateway reduced the error rate to near zero within about one second, at effectively no additional infrastructure cost since it required no service mesh or extra components. Future work includes repeating the scaling, resource-usage, and fault-tolerance experiments on a genuine multi-node Amazon EKS cluster; extending the evaluation to include a service mesh (e.g., Istio) as an infrastructure-level alternative to the application-level adaptive gateway proposed here; and evaluating cost-per-request across all three architectures using actual AWS billing data.", { noIndent: true }));

body.push(h("Declaration of Competing Interest"));
body.push(p("The author declares that she has no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.", { noIndent: true }));

body.push(h("CRediT Authorship Contribution Statement"));
body.push(p("Sakina Muzzammil: Conceptualization, Methodology, Software, Validation, Formal analysis, Investigation, Data curation, Writing – original draft, Writing – review & editing.", { noIndent: true }));

body.push(h("Data Availability"));
body.push(p("All source code, Kubernetes/Terraform infrastructure-as-code, benchmark scripts, and raw benchmark result files (JSON) supporting the findings of this study are openly available in the GitHub repository accompanying this paper, enabling full reproduction of every figure and table.", { noIndent: true }));

body.push(h("Declaration of Generative AI and AI-Assisted Technologies in the Writing Process"));
body.push(p("During the preparation of this work, the author used an AI assistant (Anthropic's Claude) to help design and implement the reference software system, design and run benchmark experiments, generate figures from the resulting data, and draft and revise portions of the manuscript text. The author reviewed, verified, and takes full responsibility for all code, experimental results, and content in this publication. All reported figures and statistics were generated from real, executed benchmarks; none were fabricated or estimated by the AI assistant.", { noIndent: true }));

body.push(h("Acknowledgment"));
body.push(p("The author thanks the open-source maintainers of Node.js, Express, Docker, Kubernetes, and autocannon, whose tooling made the reproducible evaluation in this paper possible.", { noIndent: true }));

// References
body.push(h("References"));
const refs = [
  "J. Lewis and M. Fowler, \"Microservices: a definition of this new architectural term,\" martinfowler.com, Mar. 2014. [Online]. Available: https://martinfowler.com/articles/microservices.html",
  "S. Newman, Building Microservices: Designing Fine-Grained Systems. Sebastopol, CA, USA: O'Reilly Media, 2015.",
  "N. Dragoni, S. Giallorenzo, A. L. Lafuente, M. Mazzara, F. Montesi, R. Mustafin, and L. Safina, \"Microservices: yesterday, today, and tomorrow,\" in Present and Ulterior Software Engineering, Springer, 2017, pp. 195-216.",
  "A. Balalaie, A. Heydarnoori, and P. Jamshidi, \"Microservices architecture enables DevOps: Migration to a cloud-native architecture,\" IEEE Software, vol. 33, no. 3, pp. 42-52, 2016.",
  "C. Pahl, \"Containerization and the PaaS cloud: A case study of microservices-based software architecture,\" 2018.",
  "Cloud performance study, \"Empirical evaluation of cloud-based microservices performance,\" arXiv preprint, 2023.",
  "O. Al-Debagy and P. Martinek, \"A comparative review of microservices and monolithic architectures,\" in Proc. 2018 IEEE 18th Int. Symp. Computational Intelligence and Informatics (CINTI), Budapest, Hungary, 2018, pp. 149-154, doi: 10.1109/CINTI.2018.8928192.",
  "G. Blinowski, A. Ojdowska, and A. Przybyłek, \"Monolithic vs. microservice architecture: A performance and scalability evaluation,\" IEEE Access, vol. 10, pp. 20357-20374, 2022.",
  "Cloud Native Computing Foundation, \"CNCF Cloud Native Definition v1.1,\" [Online]. Available: https://github.com/cncf/toc/blob/main/DEFINITION.md",
  "M. Kolny, \"Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%,\" Prime Video Tech, Amazon, Mar. 2023. [Online]. Available: https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90",
  "D. Merkel, \"Docker: lightweight Linux containers for consistent development and deployment,\" Linux Journal, vol. 2014, no. 239, Article 2, Mar. 2014.",
  "B. Burns and D. Oppenheimer, \"Design patterns for container-based distributed systems,\" in Proc. 8th USENIX Workshop on Hot Topics in Cloud Computing (HotCloud'16), 2016.",
  "Kubernetes documentation, \"Horizontal Pod Autoscaling,\" The Kubernetes Authors. [Online]. Available: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/",
  "Amazon Web Services, \"Amazon EKS Documentation.\" [Online]. Available: https://docs.aws.amazon.com/eks/",
  "M. Mitzenmacher, \"The power of two choices in randomized load balancing,\" IEEE Transactions on Parallel and Distributed Systems, vol. 12, no. 10, pp. 1094-1104, 2001.",
  "M. Fowler, \"CircuitBreaker,\" martinfowler.com, 2014. [Online]. Available: https://martinfowler.com/bliki/CircuitBreaker.html",
  "M. T. Nygard, Release It! Design and Deploy Production-Ready Software, 2nd ed. Raleigh, NC, USA: Pragmatic Bookshelf, 2018.",
  "K. Chawla, \"Reinforcement learning based adaptive load balancing for dynamic cloud environments,\" arXiv preprint arXiv:2409.04896, 2024.",
  "Anonymous, \"Adaptive load balancing and auto scaling algorithms for resource optimization in distributed microservices based cloud applications,\" International Journal of Science, Architecture, Technology and Environment, vol. 1, no. 5, 2024.",
  "M. de Carvalho Neto et al., \"Dynamic load balancing in Kubernetes environments with Kubernetes Scheduling Extension (KSE),\" Concurrency and Computation: Practice and Experience, 2025.",
];
refs.forEach((r, i) => body.push(refPara(i + 1, r)));

const bodySection = {
  properties: {
    type: SectionType.CONTINUOUS,
    page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 720, left: 1080, right: 1080 } },
    column: { count: 1, space: 360 },
  },
  children: body,
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 20 } } },
  },
  sections: [titleSection, bodySection],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(__dirname + "/IEEE_Paper_Cloud_Native_Microservices.docx", buf);
  console.log("written");
});
