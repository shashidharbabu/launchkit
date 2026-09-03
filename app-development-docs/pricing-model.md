# RocketRide Pricing Model

## TL;DR

### What we sell

AI pipeline processing as a service — document parsing, OCR, text embedding,
audio transcription, NER — accessed through a single SDK call. No Python/ML
bridges, no multi-vendor orchestration, no infrastructure management.

### Who buys it

Developers (not AI specialists) who want to add AI capabilities to their
applications without managing ML infrastructure or coordinating multiple
cloud vendors.

### Pricing tiers

| Tier | Monthly | Included Tokens | Overage | Target |
|------|---------|----------------|---------|--------|
| **Starter** | **$50** | 2,500 | $0.03/token | Individual devs, small apps |
| **Pro** | **$250** | 15,000 | $0.03/token | Teams, production workloads |
| **Enterprise** | Custom | Custom | Negotiated | High-volume, SLA, support |

1 token ≈ $0.01 of metered compute. Overage at $0.03/token (3x metered rate).

### What the tiers buy in real work

| Capability | Tokens/job | Starter (2,500 tokens) | Pro (15,000 tokens) |
|------------|-----------|----------------------|-------------------|
| PDF parse + OCR + embed (50 docs) | 36 | **~3,500 documents** | **~20,800 documents** |
| Audio transcription (45 min) | 416 | **~4.5 hours** | **~27 hours** |
| Text embeddings (100K chunks) | 214 | **~1.2 million chunks** | **~7 million chunks** |
| NER entity extraction (10K docs) | 2,349 | **~10,600 documents** | **~63,900 documents** |
| Chat/RAG queries (200) | 10 | **~50,000 queries** | **~300,000 queries** |
| CPU-only orchestration (100 items) | 8 | **~31,250 items** | **~187,500 items** |
| Typical mixed usage | — | 500 docs + 100K embed + 1hr audio = 37% of cap | 2,500 docs + 500K embed + 10hr audio = 57% of cap |

### Why not just use cloud APIs directly?

| | RocketRide (Starter) | DIY with cloud APIs |
|---|---|---|
| Build time | **Zero** — SDK call | 2-3 weeks (92-148 dev hours) |
| Vendors to manage | **1** | 3-4 (Textract, OpenAI, Comprehend...) |
| Ongoing maintenance | **Zero** — managed | 4-8 hours/month ($300-600/mo) |
| Concurrency / scaling | **Built-in** — multithreaded, GPU batch queue | Build it yourself: async, backpressure, rate limits |
| Scale-up when usage grows | **Automatic** | Rewrite pipeline: 68-116 hours ($5,100-8,700) |
| Python/ML bridge needed? | **No** — native JS and Python SDKs | Yes, unless you're a Python shop |
| **Year 1 total cost** | **$690** | **$11,340-30,600** |
| **Year 2 total cost** | **$600** | **$4,440-10,800** |

### Breakeven

| Mix | Customers | Revenue/mo | Margin |
|-----|-----------|-----------|--------|
| 15 Starter + 3 Pro | 18 | $1,500 | Breakeven |
| 20 Starter + 4 Pro | 24 | $2,000 | +$480 (24%) |
| 50 Starter + 10 Pro | 60 | $5,000 | +$3,480 (70%) |
| 100 Starter + 25 Pro + 5 Enterprise | 130 | $12,250+ | +$10,730 (88%) |

Infrastructure: **$1,520/month** per H100 server. Breakeven at **~18-20 customers**.

### Scaling Economics Per H100

Assumes a mixed customer base (5:1 Starter:Pro ratio) with typical workloads:
- **Starter avg:** 2 × 50-PDF jobs, 1 × 10K embed job, occasional audio = ~95 tokens, ~5,400 GPU-ms (H100) / month
- **Pro avg:** 3 × 500-PDF jobs, 2 × 100K embed jobs, 5 hr audio/month = ~3,100 tokens, ~48,000 GPU-ms (H100) / month
- **Enterprise ($500 avg):** heavy multi-workload = ~8,000 tokens, ~120,000 GPU-ms (H100) / month
- **H100 GPU budget at 70% utilization:** 1,814,400,000 ms/month

| H100s | Customers | Mix (S / P / E) | GPU Load | Revenue/mo | Infra Cost/mo | Margin/mo | Margin % |
|-------|-----------|-----------------|----------|-----------|--------------|----------|----------|
| 1 | 18 | 15 / 3 / 0 | <1% | $1,500 | $1,520 | -$20 | ~0% |
| 1 | 24 | 20 / 4 / 0 | <1% | $2,000 | $1,520 | +$480 | 24% |
| 1 | 60 | 50 / 10 / 0 | 1% | $5,000 | $1,520 | +$3,480 | 70% |
| 1 | 130 | 100 / 25 / 5 | 2% | $12,250 | $1,520 | +$10,730 | 88% |
| 1 | 500 | 400 / 85 / 15 | 8% | $41,750 | $1,520 | +$40,230 | 96% |
| 1 | 1,000 | 800 / 170 / 30 | 17% | $86,500 | $1,520 | +$84,980 | 98% |
| 1 | 2,500 | 2,000 / 425 / 75 | 41% | $213,750 | $1,520 | +$212,230 | 99% |
| 2 | 4,000 | 3,200 / 680 / 120 | 33% ea | $342,000 | $3,040 | +$338,960 | 99% |
| 3 | 7,000 | 5,600 / 1,190 / 210 | 39% ea | $598,500 | $4,560 | +$593,940 | 99% |
| 5 | 12,000 | 9,600 / 2,040 / 360 | 33% ea | $1,026,000 | $7,600 | +$1,018,400 | 99% |

**Key observations:**
- **GPU is never the bottleneck.** At 2,500 customers on one H100, GPU is only 41%.
  The server runs out of CPU/RAM for concurrent pipelines before GPU saturates.
- **Second H100 at ~3,000-4,000 customers** — driven by concurrent pipeline
  count and peak CPU, not sustained GPU utilization.
- **Margin exceeds 95% at 500 customers.** Infrastructure cost becomes negligible.
- **$1M/month revenue at ~12,000 customers** across 5 H100s ($7,600 infra).
- Overage revenue not included above — adds 5-15% on top depending on audio mix.

---

## 1. Pricing Structure

### 1.1 Tier Design

| | Starter | Pro | Enterprise |
|---|---|---|---|
| **Monthly fee** | $50 | $250 | Custom |
| **Included tokens** | 2,500 | 15,000 | Custom |
| **Effective included rate** | $0.020/token | $0.017/token | Negotiated |
| **Overage rate** | $0.03/token | $0.03/token | Negotiated |
| **Upgrade trigger** | ~9,167 tokens/mo | Volume + SLA needs | — |

**Starter → Pro upgrade math:** $50 + (T − 2,500) × $0.03 = $250 → T = **9,167 tokens**.
Above 9,167 tokens/month, Pro is cheaper than Starter + overage.

**Pro → Enterprise trigger:** $250 + (T − 15,000) × $0.03 = ~$500 → T = **23,333 tokens**.
This represents roughly 42 hours of audio or 65,000 documents per month.

### 1.2 Token Metering

Tokens are computed from four resource dimensions metered in real time:

```
Tokens = (cpu_seconds    × R_cpu)
       + (memory_GB_sec  × R_mem)
       + (gpu_ms         × R_gpu)
       + (vram_GB_sec    × R_vram)
```

#### Billing Rates (configurable in `rocketride.metrics_conversions`)

| Lever | Symbol | Value | Unit | Description |
|-------|--------|-------|------|-------------|
| `cpu_compute` | R_cpu | **1.0** | tokens/sec | CPU time (Tika parsing, Langchain chunking) |
| `cpu_memory` | R_mem | **0.05** | tokens/GB·sec | RAM held by pipeline process |
| `gpu_compute` | R_gpu | **0.005** | tokens/ms | GPU inference time |
| `gpu_memory` | R_vram | **2.0** | tokens/GB·sec | GPU VRAM held during inference |

These rates control how fast customers burn through their token allowance.
Changing them changes what "2,500 tokens" buys in real work.

#### What each lever controls

| Lever | Dominant in | Effect of lowering |
|-------|------------|-------------------|
| **R_cpu** | Embeddings (83-86%), doc processing (35-50%) | More docs/embeds per token |
| **R_gpu** | Audio transcription (75%), doc processing (32-44%) | More audio/OCR per token |
| **R_vram** | Audio (21%), doc processing (16-20%) | Cheaper large-model workloads |
| **R_mem** | Minimal (<5% everywhere) | Enables long-running pipelines |

### 1.3 Overage Notifications

| Threshold | Action |
|-----------|--------|
| 80% of allowance | Notification: "You've used 2,000 of 2,500 tokens" |
| 100% of allowance | Notification + upgrade prompt with usage projection |
| Overage | Billed at $0.03/token, itemized on invoice |

No hard caps, no throttling. Customer is never surprised — always notified
before overage begins.

### 1.4 How Profiles Map to Tiers

| Profile | Monthly Usage | Tokens/mo | Best Tier | Monthly Bill |
|---------|-------------|-----------|-----------|-------------|
| Doc Light (250 docs) | 5 × 50 PDFs | 180 | Starter | **$50** (7% of cap) |
| Doc Medium (1K docs) | 2 × 500 PDFs | 393 | Starter | **$50** (16%) |
| Doc Heavy (2.5K docs) | 5 × 500 PDFs | 982 | Starter | **$50** (39%) |
| Embed Light (100K) | 1 × 100K chunks | 214 | Starter | **$50** (9%) |
| Embed Medium (500K) | 5 × 100K chunks | 1,068 | Starter | **$50** (43%) |
| Embed Heavy (1M) | 10 × 100K chunks | 2,136 | Starter | **$50** (85%) |
| Chat/RAG Light (1K queries/mo) | 5 × 200 queries | 48 | Starter | **$50** (2%) |
| Chat/RAG Heavy (10K queries/mo) | 20 × 500 queries | 446 | Starter | **$50** (18%) |
| Audio Light (2 hr/mo) | ~3 × 45min jobs | 1,247 | Starter | **$50** (50%) |
| NER Light (10K docs/mo) | 1 × 10K NER | 2,349 | Starter | **$50** (94%) |
| **NER Medium (50K docs/mo)** | 5 × 10K NER | 11,743 | **Pro** | **$250** (78%) |
| **Audio Medium (10 hr/mo)** | ~13 × 45min jobs | 5,405 | **Starter + overage** | **$137** |
| **Audio Heavy (40 hr/mo)** | ~53 × 45min jobs | 22,037 | **Pro + overage** | **$461** |
| **NER Heavy (100K docs/mo)** | 1 × 100K NER | 23,036 | **Pro + overage** | **$491** |
| Mixed (2.5K docs + 1M embed + 10hr audio) | Multi-capability | 8,523 | **Starter + overage** | **$231** |

**Key insight:** Doc, embed, and chat profiles all fit comfortably in Starter.
NER and audio are the workloads that push customers to Pro and generate overage.
Chat/RAG is extremely cheap — 10,000 queries/month uses only 18% of Starter.

---

## 2. Competitive Position

### 2.1 Our Customer Is Not Comparing Per-Unit API Prices

A developer choosing between RocketRide and "just call the OpenAI API" is not
comparing $0.02/1M tokens vs our token rate. They're comparing:

**One SDK call** that handles parsing, OCR, chunking, embedding, transcription,
and NER in a single pipeline definition

**vs.**

Building and maintaining a system that coordinates 3-4 vendor SDKs, manages
async job processing, handles concurrency/backpressure, bridges Python ML
runtimes into their Node/Go/Java app, and doesn't break at 3am.

### 2.2 What the DIY Alternative Actually Costs

#### Components they need to build

| Component | Effort | Ongoing maintenance |
|-----------|--------|---------------------|
| PDF parsing (Tika or cloud SDK) | SDK integration + format handling | JVM tuning, version updates, OOM debugging |
| OCR (Textract / Document AI) | API integration + page-type detection | API versioning, error codes, regional failover |
| Text chunking (LangChain) | Splitter config + edge cases | LangChain breaking changes (frequent) |
| Embedding (OpenAI / Cohere) | API key management + batching | Rate limit handling, model deprecation notices |
| Audio transcription (Whisper API) | Upload + polling + chunking long audio | Format handling, timeout management |
| Pipeline orchestration | Job queue + async + retry logic | **This is the part that breaks at 3am** |
| Concurrency & scaling | Thread pools, backpressure, auto-scaling | Deadlocks, race conditions, memory leaks, cold starts |
| Error handling | Per-vendor retry logic, DLQ, partial failure | Every vendor fails differently, every error is unique |
| Python ↔ App bridge | Subprocess or FFI or microservice | Serialization bugs, version conflicts, memory overhead |
| Monitoring | Per-vendor dashboards + alerting | 4 dashboards, 4 billing consoles, 4 alert configs |

#### Build cost

| Phase | Hours | Cost (@ $75/hr) |
|-------|-------|-----------------|
| Research and evaluate APIs | 8-16 | $600-1,200 |
| Implement parse + OCR pipeline | 16-24 | $1,200-1,800 |
| Add embedding integration | 8-12 | $600-900 |
| Add audio transcription | 8-12 | $600-900 |
| Build async job queue + error handling | 16-24 | $1,200-1,800 |
| Implement concurrency, backpressure, thread pools | 12-20 | $900-1,500 |
| Build Python↔App runtime bridge | 8-16 | $600-1,200 |
| Testing, edge cases, format handling | 16-24 | $1,200-1,800 |
| **Total** | **92-148 hours** | **$6,900-11,100** |

#### Monthly run cost

| Item | Cost/month | Notes |
|------|-----------|-------|
| Cloud API bills | $20-100 | Varies by workload |
| Infrastructure (Lambda/ECS/queues) | $30-150 | Idle costs, provisioning |
| Monitoring / logging | $20-50 | CloudWatch, Datadog, etc. |
| **Developer maintenance (4-8 hr/mo)** | **$300-600** | **The expensive part** |
| **Total** | **$370-900/month** | |

Developer maintenance: updating SDKs when APIs change, debugging async failures,
tuning concurrency for new workloads, handling rate limits when usage spikes,
fixing the job queue when it stalls, managing Python environment updates, and
dealing with the edge-case document format that crashes the parser.

#### Scale-up cost (when usage grows 10-100x)

| Challenge | What breaks | Fix cost |
|-----------|------------|----------|
| Throughput | Serial processing can't keep up | Rewrite for parallel/async: 20-40 hours |
| Memory | Large batches cause OOM | Streaming architecture: 16-24 hours |
| Rate limits | Cloud APIs throttle at volume | Backoff/retry + queue management: 8-16 hours |
| Cost control | Cloud bills spike unpredictably | Usage monitoring + budget caps: 8-12 hours |
| Reliability | More requests = more failures | Circuit breakers, DLQ, retry policies: 16-24 hours |
| **Total** | | **68-116 hours ($5,100-8,700)** |

RocketRide handles all of this out of the box: multithreaded pipeline execution,
GPU batch queue with adaptive backpressure, automatic retry with dead-letter
handling, streaming processing for large files, and load-tested for 100K+ items.

#### Total cost comparison

| | RocketRide (Starter) | DIY (cloud APIs + custom code) |
|---|---|---|
| Build cost | $0 | $6,900-11,100 |
| Months 1-12 | $600 ($50 × 12) | $4,440-10,800 ($370-900 × 12) |
| Overage (est.) | ~$90 | — (included in API bills) |
| Scale-up rework | $0 | $5,100-8,700 |
| **Year 1** | **$690** | **$11,340-30,600** |
| **Year 2** | **$600** | **$4,440-10,800** |

**Year 1: 16-44x cheaper. Year 2: 7-18x cheaper.** The ongoing developer
maintenance cost alone ($300-600/month) exceeds our entire subscription.

### 2.3 Raw API Cost Comparison (for reference)

For transparency: if a customer compared *only* the cost of API calls — ignoring
all build, orchestration, concurrency, scaling, and maintenance costs — cloud
APIs are cheaper per unit.

**This is not the comparison our customer is making.** But we should know the
numbers in case a customer asks.

| Workload | RocketRide tokens | RocketRide $ | Cheapest cloud API | Cloud $ |
|----------|------------------|-------------|-------------------|---------|
| 50 PDFs (OCR + embed) | 36 | $0.36 | Textract + OpenAI embed | ~$0.04-0.13 |
| 500 PDFs (OCR + embed) | 196 | $1.96 | Textract + OpenAI embed | ~$0.42-1.37 |
| 45 min audio | 416 | $4.16 | OpenAI Whisper API | $0.27 |
| 10K text embeddings | 23 | $0.23 | OpenAI embed-3-small | $0.03 |
| 100K text embeddings | 214 | $2.14 | OpenAI embed-3-small | $0.30 |
| 10K NER docs | 2,349 | $23.49 | Google NL API | ~$1.25 |
| 100K NER docs | 23,036 | $230.36 | Google NL API | ~$12.50 |
| 50 chat queries | 3 | $0.03 | N/A (managed RAG $50+/mo) | N/A |
| 200 chat queries | 10 | $0.10 | N/A (managed RAG $75+/mo) | N/A |
| 500 chat queries | 22 | $0.22 | N/A (managed RAG $100+/mo) | N/A |
| 100 CPU-only parse | 8 | $0.08 | Negligible | ~$0 |

Cloud API costs above **do not include**: infrastructure to run them, orchestration
code, error handling, concurrency/scaling, Python runtime bridging, monitoring,
or any developer time. They are raw per-call costs only.

---

## 3. Breakeven & Revenue

### 3.1 Infrastructure

| Item | Monthly Cost |
|------|-------------|
| GPU Server (H100 80GB, 64-core, 256GB RAM) | $1,300 |
| Database (MySQL, shared) | $50 |
| Storage (2TB NVMe, model cache) | $50 |
| Networking | $20 |
| Ops / monitoring | $100 |
| **Total** | **$1,520/month** |

One H100 server handles 100+ concurrent pipelines. Models are shared — one
EasyOCR instance serves all customers needing OCR. The GPU batch queue
aggregates inference requests from all pipelines into efficient batches.

### 3.2 Revenue Per Tier

| Source | Amount |
|--------|--------|
| Starter subscription | $50/month |
| Pro subscription | $250/month |
| Overage (per token over cap) | $0.03/token |

### 3.3 Breakeven Scenarios

#### All Starter

| Customers | Revenue/mo | vs $1,520 cost | Margin |
|-----------|-----------|---------------|--------|
| 10 | $500 | -$1,020 | -204% |
| 20 | $1,000 | -$520 | -52% |
| **31** | **$1,550** | **+$30** | **2%** |
| 50 | $2,500 | +$980 | 39% |
| 100 | $5,000 | +$3,480 | 70% |

#### All Pro

| Customers | Revenue/mo | vs $1,520 cost | Margin |
|-----------|-----------|---------------|--------|
| 5 | $1,250 | -$270 | -22% |
| **7** | **$1,750** | **+$230** | **13%** |
| 10 | $2,500 | +$980 | 39% |
| 25 | $6,250 | +$4,730 | 76% |

#### Realistic Mix

| Starter | Pro | Enterprise ($500) | Total | Revenue/mo | Margin | Margin % |
|---------|-----|-------------------|-------|-----------|--------|----------|
| 15 | 3 | 0 | 18 | $1,500 | -$20 | ~0% |
| 20 | 4 | 0 | 24 | $2,000 | +$480 | 24% |
| 30 | 5 | 0 | 35 | $2,750 | +$1,230 | 45% |
| 50 | 10 | 0 | 60 | $5,000 | +$3,480 | 70% |
| 75 | 15 | 3 | 93 | $8,000 | +$6,480 | 81% |
| 100 | 25 | 5 | 130 | $12,250 | +$10,730 | 88% |
| 200 | 50 | 10 | 260 | $27,500 | +$25,980 | 94% |

**Breakeven: ~18-20 customers** (realistic mix).

### 3.4 Overage Revenue (bonus)

Overage from customers exceeding their token allowance is additive. With
$0.03/token, even modest overage adds meaningful revenue:

| Scenario | Overages/month | Extra revenue |
|----------|---------------|--------------|
| 5 Starter customers, 1K tokens over each | 5,000 tokens | **$150/mo** |
| 3 Pro customers, 5K tokens over each | 15,000 tokens | **$450/mo** |
| 10% of 100 customers averaging 500 tokens over | 5,000 tokens | **$150/mo** |

At 60 customers with 10% overage averaging 500 tokens: ~$90/month extra.
Not transformative, but pure margin.

### 3.5 GPU Capacity & When to Add a Second Server

GPU-ms consumed per job (RTX 4000 measured, H100 estimated at ÷4):

| Workload | GPU-ms (RTX 4000) | GPU-ms (H100 est.) |
|----------|------------------|-------------------|
| 50 PDFs | 2,295 | ~574 |
| 500 PDFs | 17,302 | ~4,326 |
| 45 min audio | 62,401 | ~15,600 |
| 10K embeddings | 235 | ~59 |
| 100K embeddings | 1,238 | ~310 |

H100 at 70% utilization: **1,814,400,000 GPU-ms available per month**.

| Load Level | Customer count (mixed) | GPU-ms/month (H100) | Utilization |
|------------|----------------------|--------------------|-----------  |
| Light | 50 | ~5M | <1% |
| Moderate | 200 | ~50M | 3% |
| Heavy | 500 | ~200M | 11% |
| Very heavy | 1,000 | ~500M | 28% |
| Add 2nd server | ~2,500 | ~1,300M | ~70% |

**One H100 comfortably serves 1,000+ customers.** A second server is needed
only when sustained GPU utilization exceeds 70% during peak hours — roughly
2,000-2,500 customers depending on workload mix.

---

## 4. Billing Lever Reference

### 4.1 Raw Usage Data (for rate modeling)

All values from benchmark runs on 2026-05-28, baseline-subtracted.

| Scenario | cpu_s | mem_GBs | gpu_ms | vram_GBs | Tokens | Wall clock |
|----------|-------|---------|--------|----------|--------|------------|
| 1A (50 PDFs) | 17.97 | 11.78 | 2,295 | 2.93 | 36 | 27.3s |
| 1B (500 PDFs) | 69.03 | 37.48 | 17,302 | 19.49 | 196 | 39.1s |
| 2A (45 min audio) | 15.56 | 13.73 | 62,401 | 43.75 | 416 | 74.6s |
| 3A (10K embed) | 18.89 | 23.71 | 235 | 0.69 | 23 | 43.8s |
| 3B (100K embed) | 183.06 | 220.73 | 1,238 | 6.68 | 214 | 288.8s |
| 5A (10K NER) | 108.63 | 49.01 | 279,513 | 419.92 | 2,349 | 384.2s |
| 5B (100K NER) | 1,068.52 | 485.82 | 2,741,665 | 4,117.48 | 23,036 | 3,753s |
| 7A (50 queries) | 0.66 | 1.11 | 363 | 0.04 | 3 | 15.1s |
| 7B (200 queries) | 2.53 | 5.25 | 1,309 | 0.14 | 10 | 15.4s |
| 7C (500 queries) | 5.83 | 9.62 | 3,052 | 0.35 | 22 | 21.1s |
| 8A (100 text parse) | 7.75 | 1.28 | 0 | 0 | 8 | 7.9s |

To compute tokens at any rate configuration:

```
Tokens = (cpu_s × R_cpu) + (mem_GBs × R_mem) + (gpu_ms × R_gpu) + (vram_GBs × R_vram)
Cost   = Tokens × $0.01  (metered)
Cost   = Tokens × $0.03  (overage)
```

### 4.2 What Each Lever Does

**R_cpu (cpu_compute)** — CPU seconds consumed by the pipeline.
- Dominant cost for embeddings (83-86%), doc processing (35-50%), CPU-only (98%)
- Driven by: Tika PDF parsing (Java, heavyweight), LangChain chunking
- Lowering: makes docs and embeddings cheaper, barely affects audio or NER
- This lever has the most impact on the largest number of workloads

**R_mem (cpu_memory)** — RAM held by the pipeline (GB × seconds).
- Small contributor everywhere (<5%)
- Dangerous for long-running/always-on pipelines if set too high
- Safe to keep low — it's a fairness mechanism, not a revenue driver

**R_gpu (gpu_compute)** — GPU inference milliseconds.
- Dominant cost for audio (75%), NER (59%), chat/RAG (68%), and doc processing (32-44%)
- Hardware-dependent: H100 is ~4x faster than RTX 4000, so same workload
  consumes ~4x fewer GPU-ms on production hardware
- Lowering: makes audio, NER, and chat dramatically cheaper, barely affects embeddings

**R_vram (gpu_memory)** — GPU VRAM held during inference (GB × seconds).
- Significant for NER (36%), audio (21%), doc processing (16-20%)
- Negligible for embeddings and chat (<6%)
- In shared architecture, VRAM cost is amortized across all customers
- Lowering: makes large-model workloads (audio, NER) cheaper

### 4.3 Rate Adjustment Examples

**Halving R_cpu (1.0 → 0.5):**

| Scenario | Current tokens | New tokens | Change | New $ |
|----------|---------------|-----------|--------|-------|
| 1A (50 PDFs) | 36 | 27 | -25% | $0.27 |
| 1B (500 PDFs) | 196 | 162 | -18% | $1.62 |
| 2A (45 min audio) | 416 | 408 | -2% | $4.08 |
| 3A (10K embed) | 23 | 13 | -41% | $0.13 |
| 3B (100K embed) | 214 | 122 | -43% | $1.22 |

Biggest impact on embeddings. Minimal impact on audio.

**Cutting R_gpu (0.005 → 0.001):**

| Scenario | Current tokens | New tokens | Change | New $ |
|----------|---------------|-----------|--------|-------|
| 1A (50 PDFs) | 36 | 27 | -26% | $0.27 |
| 1B (500 PDFs) | 196 | 117 | -41% | $1.17 |
| 2A (45 min audio) | 416 | 110 | **-73%** | $1.10 |
| 3A (10K embed) | 23 | 22 | -5% | $0.22 |
| 3B (100K embed) | 214 | 208 | -3% | $2.08 |

Biggest impact on audio. Minimal impact on embeddings.

**Combined (R_cpu=0.5, R_gpu=0.001):**

| Scenario | Current tokens | New tokens | Change | New $ |
|----------|---------------|-----------|--------|-------|
| 1A | 36 | 18 | -51% | $0.18 |
| 1B | 196 | 83 | -58% | $0.83 |
| 2A | 416 | 102 | -76% | $1.02 |
| 3A | 23 | 12 | -47% | $0.12 |
| 3B | 214 | 116 | -46% | $1.16 |

**What this does to the tiers:** At halved rates, Starter's 2,500 tokens buys
roughly 2x the work — ~7,000 docs or ~9 hours of audio instead of ~3,500 or ~4.5.
The cap feels more generous, fewer customers hit overage, but the competitive
story is about platform value, not per-unit cost.

### 4.4 Infrastructure Cost Per Token

Our actual cost to serve tokens (single-tenant, worst case):

| Workload | Tokens | Our infra cost | Cost/token |
|----------|--------|---------------|-----------|
| 1A (50 PDFs) | 36 | $0.016 | $0.00044 |
| 1B (500 PDFs) | 196 | $0.023 | $0.00012 |
| 2A (45 min audio) | 416 | $0.044 | $0.00011 |
| 3A (10K embed) | 23 | $0.026 | $0.00113 |
| 3B (100K embed) | 214 | $0.169 | $0.00079 |
| 5A (10K NER) | 2,349 | $0.225 | $0.00010 |
| 5B (100K NER) | 23,036 | $2.199 | $0.00010 |
| 7A (50 queries) | 3 | $0.009 | $0.00300 |
| 7B (200 queries) | 10 | $0.009 | $0.00090 |
| 7C (500 queries) | 22 | $0.012 | $0.00055 |
| 8A (100 parse) | 8 | $0.005 | $0.00063 |

Worst case: ~$0.003/token (7A — small chat job, fixed overhead dominates).
Typical: $0.0001-$0.001/token. The metered rate ($0.01) is 3-100x our cost.
The overage rate ($0.03) is 10-300x our cost. **Every token is profitable.**

---

## 5. Detailed Scenario Data

All benchmark data collected 2026-05-28 on NVIDIA RTX 4000 (8GB VRAM).
Baseline subtraction enabled — pipeline startup costs excluded.

### 5.1 Scenario 1A: 50 PDF Documents — Parse + OCR + Embed

**Pipeline:** Tika parse → EasyOCR (scanned pages only) → LangChain chunk → SentenceTransformer embed

**Input:** 50 PDF files cycling through 33 unique test documents. Real-world mix:
government forms, financial reports, multilingual docs, scanned images, tables.
7KB to 964KB per file, ~85 total pages. Most have embedded text and skip GPU OCR.

**Output:** Text chunks with 384-dimensional vector embeddings.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 17.97 | seconds |
| cpu_memory | 11.78 | GB·sec (~872 MB avg) |
| gpu_compute | 2,295 | ms |
| gpu_memory | 2.93 | GB·sec |
| gpu_inference_count | 73 | calls |
| gpu_queue_wait | 896 | ms |
| Wall clock | 27.3 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 17.97 × 1.0 | 17.97 | $0.180 | 50% |
| cpu_memory | 11.78 × 0.05 | 0.59 | $0.006 | 2% |
| gpu_compute | 2,295 × 0.005 | 11.48 | $0.115 | 32% |
| gpu_memory | 2.93 × 2.0 | 5.86 | $0.059 | 16% |
| **Total** | | **35.9** | **$0.360** | |

Our infrastructure cost: $0.016 | Margin: 96%

**Cloud API comparison (raw API cost only, excludes build/maintenance):**

| Provider | Service | Cost |
|----------|---------|------|
| **RocketRide** | Single pipeline call | **$0.360** |
| AWS Textract + OpenAI embed | ~30% pages need OCR | ~$0.04 |
| AWS Textract + OpenAI embed | 100% pages need OCR | ~$0.13 |
| Google Document AI + OpenAI embed | 100% pages need OCR | ~$0.85 |

---

### 5.2 Scenario 1B: 500 PDF Documents — Parse + OCR + Embed

**Pipeline:** Same as 1A, 10x volume. 500 files cycling through 33 unique PDFs.
~909 total pages.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 69.03 | seconds |
| cpu_memory | 37.48 | GB·sec (~1,307 MB avg) |
| gpu_compute | 17,302 | ms |
| gpu_memory | 19.49 | GB·sec |
| gpu_inference_count | 680 | calls |
| Wall clock | 39.1 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 69.03 × 1.0 | 69.03 | $0.690 | 35% |
| cpu_memory | 37.48 × 0.05 | 1.87 | $0.019 | 1% |
| gpu_compute | 17,302 × 0.005 | 86.51 | $0.865 | 44% |
| gpu_memory | 19.49 × 2.0 | 38.98 | $0.390 | 20% |
| **Total** | | **196.4** | **$1.964** | |

Our infrastructure cost: $0.023 | Margin: 99%

**Cloud API comparison:**

| Provider | Service | Cost |
|----------|---------|------|
| **RocketRide** | Single pipeline call | **$1.964** |
| AWS Textract + OpenAI embed | ~30% OCR | ~$0.42 |
| AWS Textract + OpenAI embed | 100% OCR | ~$1.37 |
| Google Document AI + embed | 100% OCR | ~$9.10 |

CPU scaling: 10x items → 3.8x CPU (batching efficiency). GPU scaling: 10x → 7.5x.

---

### 5.3 Scenario 2A: Audio Transcription — 8 clips (~45 minutes)

**Pipeline:** Audio → Whisper (self-hosted) → Text transcript

**Input:** 7 WAV clips (total 50.8 seconds) + 1 MP3 file (44.3 minutes).
Total: **45.1 minutes of audio.** The MP3 is 98% of the content.

| File | Duration | Format |
|------|----------|--------|
| 7 WAV clips | 50.8s total | 16kHz 16-bit mono |
| ben_riley_ai.mp3 | 44.3 min | 128kbps stereo |

Whisper processes in ~30-second chunks → 51 GPU inference calls.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 15.56 | seconds |
| cpu_memory | 13.73 | GB·sec (~198 MB avg) |
| gpu_compute | 62,401 | ms |
| gpu_memory | 43.75 | GB·sec |
| gpu_inference_count | 51 | calls |
| Wall clock | 74.6 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 15.56 × 1.0 | 15.56 | $0.156 | 4% |
| cpu_memory | 13.73 × 0.05 | 0.69 | $0.007 | <1% |
| gpu_compute | 62,401 × 0.005 | 312.01 | $3.120 | 75% |
| gpu_memory | 43.75 × 2.0 | 87.50 | $0.875 | 21% |
| **Total** | | **415.8** | **$4.158** | |

Our infrastructure cost: $0.044 | Margin: 99%

**H100 estimate:** GPU ÷4 → gpu_compute ~78 tokens, gpu_memory ~22 tokens.
Total ~116 tokens = **$1.16 on H100**.

**Cloud API comparison (per-minute pricing × 45.1 minutes):**

| Provider | Service | $/minute | Cost |
|----------|---------|---------|------|
| **RocketRide (RTX 4000)** | Self-hosted Whisper | — | **$4.16** |
| **RocketRide (H100 est.)** | Self-hosted Whisper | — | **~$1.16** |
| OpenAI | Whisper API | $0.006 | **$0.27** |
| Google | Speech-to-Text v2 | $0.016 | **$0.72** |
| Azure | Speech-to-Text | $0.017 | **$0.77** |
| AWS | Transcribe | $0.024 | **$1.08** |

Audio is our most expensive workload relative to cloud APIs. R_gpu is the
dominant lever (75% of bill). On H100, we approach AWS Transcribe pricing.

---

### 5.4 Scenario 3A: 10,000 Text Embeddings

**Pipeline:** Text → LangChain chunking → SentenceTransformer (all-MiniLM-L6-v2) → Embeddings

**Input:** 10 batches × 1,000 text chunks (~100 words/chunk, ~150 tokens/chunk).
Total: ~1.5M tokens of text. Output: 384-dimensional embeddings.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 18.89 | seconds |
| cpu_memory | 23.71 | GB·sec (~787 MB avg) |
| gpu_compute | 235 | ms |
| gpu_memory | 0.69 | GB·sec |
| gpu_inference_count | 10 | calls |
| Wall clock | 43.8 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 18.89 × 1.0 | 18.89 | $0.189 | 83% |
| cpu_memory | 23.71 × 0.05 | 1.19 | $0.012 | 5% |
| gpu_compute | 235 × 0.005 | 1.18 | $0.012 | 5% |
| gpu_memory | 0.69 × 2.0 | 1.39 | $0.014 | 6% |
| **Total** | | **22.6** | **$0.227** | |

Our infrastructure cost: $0.026 | Margin: 89%

**Cloud API comparison (embedding only — cloud doesn't include chunking):**

| Provider | Model | $/1M tokens | × 1.5M | Cost |
|----------|-------|------------|--------|------|
| **RocketRide** | MiniLM-L6-v2 (384d) | — | — | **$0.227** |
| OpenAI | embedding-3-small (1536d) | $0.02 | 1.5M | **$0.03** |
| Cohere | embed-v3 (1024d) | $0.10 | 1.5M | **$0.15** |
| OpenAI | embedding-3-large (3072d) | $0.13 | 1.5M | **$0.20** |

CPU is 83% of our cost (LangChain preprocessing). GPU embedding is trivially
fast (235ms). R_cpu is the only lever that moves the needle.

---

### 5.5 Scenario 3B: 100,000 Text Embeddings

**Pipeline:** Same as 3A, 10x volume. 100 batches × 1,000 chunks. ~15M tokens.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 183.06 | seconds |
| cpu_memory | 220.73 | GB·sec (~821 MB avg) |
| gpu_compute | 1,238 | ms |
| gpu_memory | 6.68 | GB·sec |
| gpu_inference_count | 100 | calls |
| Wall clock | 288.8 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 183.06 × 1.0 | 183.06 | $1.831 | 86% |
| cpu_memory | 220.73 × 0.05 | 11.04 | $0.110 | 5% |
| gpu_compute | 1,238 × 0.005 | 6.19 | $0.062 | 3% |
| gpu_memory | 6.68 × 2.0 | 13.36 | $0.134 | 6% |
| **Total** | | **213.6** | **$2.137** | |

Our infrastructure cost: $0.169 | Margin: 92%

**Cloud API comparison:**

| Provider | Model | × 15M tokens | Cost |
|----------|-------|-------------|------|
| **RocketRide** | MiniLM-L6-v2 | — | **$2.137** |
| OpenAI | embedding-3-small | 15M | **$0.30** |
| Cohere | embed-v3 | 15M | **$1.50** |
| OpenAI | embedding-3-large | 15M | **$1.95** |

10x items → 9.7x CPU (nearly linear) but only 5.3x GPU (batching efficiency).

---

### 5.6 Scenario 5A: 10,000 Document NER (Entity Extraction)

**Pipeline:** Text → GLiNER (self-hosted NER model) → Extracted entities

**Input:** 10,000 synthetic text documents (~150 words each). GLiNER extracts
people, organizations, locations, and other named entities.

**Output:** Annotated text with entity labels and positions.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 108.63 | seconds |
| cpu_memory | 49.01 | GB·sec (~133 MB avg) |
| gpu_compute | 279,513 | ms |
| gpu_memory | 419.92 | GB·sec |
| gpu_inference_count | 10,000 | calls |
| Wall clock | 384.2 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 108.63 × 1.0 | 108.63 | $1.086 | 5% |
| cpu_memory | 49.01 × 0.05 | 2.45 | $0.025 | <1% |
| gpu_compute | 279,513 × 0.005 | 1,397.57 | $13.976 | **59%** |
| gpu_memory | 419.92 × 2.0 | 839.84 | $8.398 | **36%** |
| **Total** | | **2,348.5** | **$23.485** | |

Our infrastructure cost: $0.225 | Margin: 99%

**Cloud API comparison (NER on ~150-word documents, ~750 chars each):**

| Provider | Service | Pricing | × 10K docs (~7.5M chars) | Cost |
|----------|---------|---------|--------------------------|------|
| **RocketRide** | GLiNER (self-hosted) | — | — | **$23.49** |
| AWS | Comprehend (NER) | $0.0001/char | 7.5M chars | **$750** |
| Google | NL API (entity) | $0.001/1K chars | 7.5M chars | **$7.50** |
| Azure | Language (NER) | $0.005/1K-char record | 7.5K records | **$37.50** |

NER is where cloud per-character pricing becomes punitive — AWS Comprehend at
$750 for 10K documents is **32x more expensive** than RocketRide. Google NL API
is 3x cheaper than us, but Azure is 1.6x more expensive.

GPU dominates the bill (95%). R_gpu and R_vram are the levers. On H100 (÷4),
this drops to approximately $6.80 — cheaper than Google.

---

### 5.7 Scenario 5B: 100,000 Document NER (Entity Extraction)

**Pipeline:** Same as 5A, 10x volume: 100,000 documents.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 1,068.52 | seconds |
| cpu_memory | 485.82 | GB·sec (~133 MB avg) |
| gpu_compute | 2,741,665 | ms |
| gpu_memory | 4,117.48 | GB·sec |
| gpu_inference_count | 100,000 | calls |
| Wall clock | 3,753 | seconds (~62.6 min) |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 1,068.52 × 1.0 | 1,068.52 | $10.685 | 5% |
| cpu_memory | 485.82 × 0.05 | 24.29 | $0.243 | <1% |
| gpu_compute | 2,741,665 × 0.005 | 13,708.33 | $137.083 | **60%** |
| gpu_memory | 4,117.48 × 2.0 | 8,234.96 | $82.350 | **36%** |
| **Total** | | **23,036.1** | **$230.361** | |

Our infrastructure cost: $2.199 | Margin: 99%

**Cloud API comparison (100K docs, ~75M chars):**

| Provider | Service | Cost |
|----------|---------|------|
| **RocketRide** | GLiNER | **$230.36** |
| **RocketRide (H100 est.)** | GLiNER | **~$66** |
| AWS Comprehend | NER | **$7,500** |
| Google NL API | Entity | **$75** |
| Azure Language | NER | **$375** |

At 100K documents, AWS Comprehend is **33x more expensive** than RocketRide.
On H100, we're cheaper than Google ($66 vs $75). This is our strongest
competitive scenario for per-unit pricing.

Scaling: 10x items → 9.8x CPU, 9.8x GPU. Nearly perfectly linear.

---

### 5.8 Scenario 7A: Chat/RAG — 50 Queries

**Pipeline:** Text → SentenceTransformer embed → Response (embedding for vector search)

**Input:** 50 short text queries (~12 words each, cycling through 15 templates).
These represent a user session with a RAG chatbot.

**Output:** Query embeddings for vector similarity search.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 0.66 | seconds |
| cpu_memory | 1.11 | GB·sec (~715 MB avg) |
| gpu_compute | 363 | ms |
| gpu_memory | 0.04 | GB·sec |
| gpu_inference_count | 50 | calls |
| Wall clock | 15.1 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 0.66 × 1.0 | 0.66 | $0.007 | 25% |
| cpu_memory | 1.11 × 0.05 | 0.06 | $0.001 | 2% |
| gpu_compute | 363 × 0.005 | 1.82 | $0.018 | **69%** |
| gpu_memory | 0.04 × 2.0 | 0.08 | $0.001 | 3% |
| **Total** | | **2.6** | **$0.026** | |

Our infrastructure cost: $0.009 | Margin: 66%

Chat queries are extremely cheap. 50 queries costs 2.6 tokens — a Starter
customer could run **~960 sessions** (48,000 queries) before hitting the cap.

---

### 5.9 Scenario 7B: Chat/RAG — 200 Queries

**Pipeline:** Same as 7A, 200 queries.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 2.53 | seconds |
| cpu_memory | 5.25 | GB·sec (~768 MB avg) |
| gpu_compute | 1,309 | ms |
| gpu_memory | 0.14 | GB·sec |
| gpu_inference_count | 200 | calls |
| Wall clock | 15.4 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 2.53 × 1.0 | 2.53 | $0.025 | 26% |
| cpu_memory | 5.25 × 0.05 | 0.26 | $0.003 | 3% |
| gpu_compute | 1,309 × 0.005 | 6.55 | $0.065 | **68%** |
| gpu_memory | 0.14 × 2.0 | 0.28 | $0.003 | 3% |
| **Total** | | **9.6** | **$0.096** | |

Our infrastructure cost: $0.009 | Margin: 91%

Per-query rate: ~0.048 tokens/query. Consistent with 7A (0.052 tokens/query).

---

### 5.10 Scenario 7C: Chat/RAG — 500 Queries

**Pipeline:** Same as 7A, 500 queries.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 5.83 | seconds |
| cpu_memory | 9.62 | GB·sec (~768 MB avg) |
| gpu_compute | 3,052 | ms |
| gpu_memory | 0.35 | GB·sec |
| gpu_inference_count | 500 | calls |
| Wall clock | 21.1 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 5.83 × 1.0 | 5.83 | $0.058 | 26% |
| cpu_memory | 9.62 × 0.05 | 0.48 | $0.005 | 2% |
| gpu_compute | 3,052 × 0.005 | 15.26 | $0.153 | **68%** |
| gpu_memory | 0.35 × 2.0 | 0.70 | $0.007 | 3% |
| **Total** | | **22.3** | **$0.223** | |

Our infrastructure cost: $0.012 | Margin: 95%

Per-query rate: ~0.045 tokens/query. Scales linearly — no surprises at 500.

**Chat is our most token-efficient workload.** A Starter customer doing 500
queries/day × 22 days = 11,000 queries/month consumes only ~495 tokens (20% of cap).

---

### 5.11 Scenario 8A: CPU-Only Parse (No GPU)

**Pipeline:** Text → Parse → Response (CPU only, no models)

**Input:** 100 synthetic text items (~200 words each). No GPU inference at all —
validates the minimum platform cost for CPU-only pipelines that call external
APIs (OpenAI, Google, etc.) for the AI work.

| Resource | Value | Unit |
|----------|-------|------|
| cpu_compute | 7.75 | seconds |
| cpu_memory | 1.28 | GB·sec (~295 MB avg) |
| gpu_compute | 0 | ms |
| gpu_memory | 0 | GB·sec |
| Wall clock | 7.9 | seconds |

| Lever | Raw × Rate | Tokens | Dollars | % of bill |
|-------|-----------|--------|---------|-----------|
| cpu_compute | 7.75 × 1.0 | 7.75 | $0.078 | **98%** |
| cpu_memory | 1.28 × 0.05 | 0.06 | $0.001 | 1% |
| gpu_compute | 0 | 0 | $0.000 | 0% |
| gpu_memory | 0 | 0 | $0.000 | 0% |
| **Total** | | **7.9** | **$0.079** | |

Our infrastructure cost: $0.005 | Margin: 94%

This represents the minimum platform fee for any pipeline. A Starter customer
using CPU-only orchestration (calling external APIs) would consume ~8 tokens
per 100-item batch — effectively unlimited within the 2,500 token cap.

---

## Appendix

### A.1 Tracked But Not Billed Metrics

| Metric | Unit | Purpose |
|--------|------|---------|
| `gpu_preprocess` | ms | Tokenization + memcpy to GPU |
| `gpu_postprocess` | ms | Memcpy from GPU + extraction |
| `gpu_queue_wait` | ms | Wait time for GPU stream (contention indicator) |
| `gpu_inference_count` | count | Discrete inference calls |
| `pagesProcessed` | count | Reserved for future OEM billing |

### A.2 Infrastructure Details

| Parameter | Value |
|-----------|-------|
| Benchmark GPU | NVIDIA RTX 4000 (8GB VRAM) |
| Production GPU | NVIDIA H100 80GB |
| H100 speedup factor | ~4x (conservative estimate) |
| Monthly server cost | $1,520 (GPU $1,300 + DB $50 + storage $50 + net $20 + ops $100) |
| Cost per wall-clock second | $0.000586 |
| Models shared across all customers | Yes — one instance per model, GPU batch queue |

### A.3 Cloud Pricing Sources

All cloud prices are from provider pricing pages as of early 2026. Verify
before making business decisions.

- AWS Textract: $0.0015/page (basic OCR)
- AWS Transcribe: $0.024/minute
- OpenAI Whisper API: $0.006/minute
- OpenAI embedding-3-small: $0.02/1M tokens
- OpenAI embedding-3-large: $0.13/1M tokens
- Cohere embed-v3: $0.10/1M tokens
- Google Speech-to-Text v2: $0.016/minute
- Google Document AI: $0.01/page
- Azure Speech-to-Text: $0.017/minute
- Azure Document Intelligence: $0.0015/page (read/OCR)
- AWS Comprehend (NER): $0.0001/character
- Google NL API (entity): $0.001/1K characters
- Azure Language (NER): $0.005/1K-character record
