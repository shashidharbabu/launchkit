# Implementation Plan: Staging Environment + develop/stage/main Release Flow

Owner: Dmitri
Reviewed by: Rod
Status: DRAFT — decisions D1-D5 need confirmation before Milestone 2
Date: 2026-07-13

This plan takes the saas repo from "every develop merge auto-deploys to the live
site" to a gated three-branch release flow (develop -> stage -> main) with a fully
isolated staging environment (own database, Redis, buckets, secrets, domains) and
manual promotion via GitHub Actions ("Send to Stage", "Deploy to Production").
The OSS repo (rocketride-server) already runs this branch flow; it needs only
small alignment work (Milestone 5).

The companion engineer-facing doc is `docs/README-release-process.md`.

---

## 1. Current state (verified 2026-07-13)

**Branches (saas):**
- `develop` — active integration branch. `main` exists (b180d2ad) but no deploy
  workflow reads it except housekeeping (semgrep, docs-drift, secret-scan,
  deploy-lambda-oauth-google). **`stage` does not exist.**
- `feat/phase2` — the ArgoCD source of truth (path `k8s/`, selfHeal). Holds the
  digest-pinned `k8s/alb/deployment.yaml`; `promote-alb.yml` commits bumps here.
- `chore/staging-overlay` — started work: `k8s-overlays/staging/` kustomize
  overlay (alb-patch, eaas-patch, configmap-patch, kustomization). Review and
  absorb into Milestone 3 rather than redoing it.

**Deploy paths that hit the live site directly from develop (all must be retired
or retargeted in Milestone 4):**
1. Engine: push to develop -> `build-saas-engine.yml` builds
   `rocketride/alb:saas-latest` (+ `:<sha>-saas`) -> `promote-alb.yml` bumps the
   digest on `feat/phase2` -> ArgoCD rolls the live cluster.
2. UI: push to develop -> `build-deploy-ui.yml` -> `aws s3 sync` straight to the
   `cloud.rocketride.ai` bucket + CloudFront invalidation.
3. Model server: push to develop -> `build-model-server.yml` (GHCR) ->
   `deploy-model-server.yml` swaps the container on the H100 box serving
   `model.rocketride.dev`.
4. Lambda: push to develop or main -> `deploy-lambda-oauth-google.yml` deploys
   the single SAM stack `rocketride-google-oauth`.

**k8s:** kustomize, no in-repo `overlays/` yet (README points at
`terraform/dtc-prod/k8s-overlays/` for dtc-prod/dtc-stage). `k8s/alb/deployment.yaml`
hardcodes production values (Zitadel URL + client ID, `cloud.rocketride.ai`
origins, `model.rocketride.dev`). No ArgoCD Application manifests are committed
anywhere — the Application only exists in-cluster.

**OSS repo:** `develop`, `stage`, `main` all active (stage cut from develop
2026-07-13; main released v3.3.1 on 2026-07-06). CI runs on all three.
`release.yaml` publishes on push to main: npm (OIDC trusted publishing +
provenance), PyPI (token), VS Code Marketplace + Open VSX, GHCR engine image
(cosign-signed). `prerelease.yaml` currently triggers off CI success on
**develop** even though RELEASE.md says prereleases come from stage.

---

## 2. Target state

```
engineers --PR--> develop --[Send to Stage]--> stage --[Deploy to Production]--> main
                     |                            |                                |
                     v                            v                                v
              image build only            staging env deploy               production deploy
              (ECR :<sha>-saas)           (isolated stack, QA)             (same digest staging ran)
```

- Two permanent environments in the same EKS cluster, isolated by namespace,
  each with its own MySQL, Redis, S3 buckets, secrets, Zitadel clients, Stripe
  mode, and domains. DNS never moves; promotion moves image digests.
- A long-lived `deploy` branch (replacing `feat/phase2`) holds the kustomize
  base + `overlays/staging` + `overlays/production` and receives bot commits
  that pin image digests. Code branches stay clean so develop -> stage -> main
  pushes remain fast-forward.
- Two ArgoCD Applications, both watching the `deploy` branch at different paths.
- Promotion to production re-uses the exact digest QA approved on staging. The
  engine image is never rebuilt between staging and production.
- Known deviation: the UI bakes config at build time (define-injected env vars),
  so the production UI is a **rebuild of the same git SHA** with production
  values, not a byte-identical artifact. Follow-up F1 (runtime config.json)
  removes this deviation later.

---

## 3. Decisions to confirm before starting

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Staging isolation level | Same EKS cluster, new namespace `rocketride-staging`, separate RDS MySQL + ElastiCache Redis instances. A separate cluster/account is cleaner but not worth the cost/ops load now. |
| D2 | Does develop auto-deploy anywhere after cutover? | No. Develop merges build images only. If the team misses "merge and see it live", stand up a small dev environment later — do not point develop at staging (staging must stay frozen for QA) or production. |
| D3 | Model server for staging | RESOLVED (Rod, 2026-07-13): two GPU boxes exist — 4xH200 (production) and 1xH100 (staging/testing). Each environment gets its own model server, and model-server deploys join the release train (section 7b). Caveat to keep in mind: staging validates on H100 silicon while production runs H200, so device-specific code paths (e.g. the H200-scoped probe guard) still need a production-side check after promotion. |
| D4 | Staging data | Seeded synthetic fixtures via a reset script (orgs, users, pipelines, billing ledger rows). No production data copies until a PII-scrub process exists. |
| D5 | saas `main` history | `main` (b180d2ad) predates this process. At the first production release, reset it to `stage` one time only via a one-time manually-dispatched workflow that uses the release App token to perform the audited `--force-with-lease` push — the Milestone 1 rulesets block human force-pushes to `main`, so the reset goes through the release App like every other `main` move. Verify nothing external consumes current main first. |

---

## 4. Milestone 1 — Branches and protections (saas repo)

1. Do NOT create `stage` manually — the "Send to Stage" action creates it on
   first run (a plain `git push origin <sha>:refs/heads/stage`). This keeps
   creation and promotion on one code path.
2. Create the `deploy` branch **from `feat/phase2`** (preserves the currently
   live digest pin). Restructure per Milestone 3. Delete `feat/phase2` only
   after ArgoCD is re-pointed (Milestone 3, step 4).
3. Branch protection rulesets:
   - `develop`: require PR + passing CI. No direct pushes. (Likely already so.)
   - `stage`, `main`: block all direct pushes and force-pushes **except** the
     release GitHub App (`GH_APP_ID` — same App promote-alb uses; it needs
     Contents R+W). Humans never push these branches; PRs into `stage` are
     allowed for hotfixes only (see engineer doc).
   - `deploy`: block force-pushes; allow release App pushes.
4. GitHub Environments: create `staging` and `production` in repo settings.
   `production` gets required reviewers (Rod + one more). Move env-scoped
   secrets/vars into them as they are created in Milestone 2 (AWS role ARNs,
   bucket names, CloudFront distribution IDs, Zitadel IDs, Stripe keys).

## 5. Milestone 2 — Staging infrastructure

Provision (Terraform where the prod equivalent is Terraform-managed; the README
says secrets flow through 04-addons/ESO):

- [ ] Namespace `rocketride-staging` in cluster `rocketride-saas` (us-east-1).
- [ ] MySQL instance for staging; secret `rocketride-db` in the staging
      namespace pointing at it.
- [ ] Redis instance for staging; staging `rocketride-redis` secret/configmap.
- [ ] S3: staging UI bucket (`cloud-staging.rocketride.ai`) + CloudFront
      distribution; any doc/object buckets the engine writes.
- [ ] DNS + certs: `api-staging.rocketride.ai` (Gateway httproute),
      `cloud-staging.rocketride.ai` (CloudFront).
- [ ] Zitadel: separate project/clients with staging redirect URIs; staging
      values for `RR_ZITADEL_URL` / client ID / callback / frontend origin.
- [ ] Stripe **test mode** keys + a staging webhook endpoint and signing secret.
- [ ] Email capture: staging sends through Mailpit (or provider sandbox domain).
      Staging must never email real users — account lifecycle emails (#274) now
      exist, so this is a hard requirement, not a nicety.
- [ ] Google OAuth: second client (staging redirect); SAM stack
      `rocketride-google-oauth-staging`.
- [ ] PagerDuty: staging routing key -> low-urgency service (or Slack only).
- [ ] IAM: staging-scoped deploy roles (`AWS_*_ROLE_ARN` per environment) —
      separate roles, not widened trust on the prod ones.
- [ ] Seed/reset script for D4 fixtures, runnable as a k8s Job.
- [ ] `billing-reconciler` CronJob in staging: enabled, against staging DB +
      Stripe test mode (leave base dry-run default as-is for prod).
- [ ] Model server DNS per environment. First **verify the current mapping** —
      `deploy-model-server.yml` says `original` -> model.rocketride.dev and
      `4xh100` -> model1.rocketride.dev (the "4xh100" target is actually the
      4xH200 box), while the prod engine deployment hardcodes
      `--modelserver=wss://model.rocketride.dev:443`. End state: production
      engine -> the 4xH200 box, staging engine -> the 1xH100 box, each via a
      stable env-named DNS record (e.g. model.rocketride.dev = prod/4xH200,
      model-staging.rocketride.dev = staging/1xH100), set in the overlays.

Sizing: staging runs 1 replica of everything, small instance classes. Same
MySQL/Redis/engine versions as production — identical topology, smaller scale.

## 6. Milestone 3 — Deploy branch, overlays, ArgoCD

On the `deploy` branch:

1. Restructure to kustomize base + overlays:
   ```
   k8s/
     base/                      # existing base + alb/ eaas/ model-server/ (env-neutral)
     overlays/
       staging/                 # namespace, replicas, staging config values, DIGEST PIN
       production/              # production config values, DIGEST PIN
   argocd/
     app-staging.yaml           # Application: deploy branch, path k8s/overlays/staging
     app-production.yaml        # Application: deploy branch, path k8s/overlays/production
   ```
2. Move every hardcoded production literal out of
   `k8s/alb/deployment.yaml` into the overlays: `RR_ZITADEL_URL`, client ID,
   callback/frontend origins, `--modelserver=` URL, httproute hostnames,
   replica counts. Start from `chore/staging-overlay` (alb-patch, eaas-patch,
   configmap-patch already drafted there) and reconcile with the existing
   `terraform/dtc-prod/k8s-overlays/` structure so there is exactly one overlay
   scheme, not three.
3. Both overlays pin `rocketride/alb@sha256:...` explicitly (digest, never a
   floating tag — same reasoning as promote-alb.yml's header comment). The
   production overlay starts pinned to whatever `feat/phase2` currently pins
   (that is the live site).
4. Commit the two ArgoCD Application manifests (they exist only in-cluster
   today — `debug-alb.yml` can dump the current one for reference). Re-point
   the existing Application to `deploy`/`k8s/overlays/production`, create the
   staging Application, verify both sync, then delete `feat/phase2`.

## 7. Milestone 4 — GitHub Actions (saas repo)

### 7a. New workflows

The deploy surface splits into three component workflows plus one orchestrator.
Each component workflow carries both `workflow_dispatch` (runnable alone from
the Actions tab) and `workflow_call` (invoked by the orchestrator), takes an
`environment` input (`staging`/`production`), and binds to the matching GitHub
Environment so production runs always hit the approval gate no matter how they
are invoked. All promotion/deploy workflows share the `release-train`
concurrency group.

**Component 1 — `deploy-model-server.yml` — "Deploy Model Server"**
Inputs: `environment`, `digest` (default: production = the digest staging
validated; staging = the `:<stage-sha>` build). SSH container swap on the
matching box (staging = 1xH100, production = 4xH200), smoke test, built-in
rollback-on-failure. Records the deployed digest in the environment's overlay
ledger on `deploy`. This is the existing workflow reshaped per section 7b.
Supports model-server-only releases (model updates, loading fixes) under the
component-release rules below.

**Component 2 — `deploy-cloud.yml` — "Deploy Cloud"** (engine/ALB on EKS)
Inputs: `environment`, `digest` (default: production = the digest pinned in
`k8s/overlays/staging`, i.e. what QA approved; staging = the digest of
`:<stage-sha>-saas`). Commits the pin to the environment's overlay on the
`deploy` branch; ArgoCD syncs. Contains the provenance check (pinned digest
must match the ECR tag built from the promoted SHA) and the
"already pinned — no-op" guard inherited from promote-alb.

**Component 3 — `deploy-ui.yml` — "Deploy UI"** (CDN)
Inputs: `environment`, `ref` (default: staging = `stage`; production = `stage`
for a UI-only release, since `main` only advances on full releases). Builds
with the environment's injected config, syncs to the environment's S3 bucket,
invalidates its CloudFront distribution. Records the built SHA in the
environment's overlay ledger on `deploy`. (Build-per-env deviation tracked
as F1.) Supports UI-only releases under the component-release rules below.

**Orchestrator — `deploy-everything.yml` — "Deploy Everything"**
Input: `environment`. Runs the components in dependency order:

```yaml
name: Deploy Everything
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
  workflow_call:
    inputs: { environment: ... }
concurrency:
  group: release-train
  cancel-in-progress: false
jobs:
  promote-branches:               # production only
    environment: production       # approval gate lives here
    steps:
      # guard: main must be ancestor of stage; ff-push stage -> main
  model-server:                   # needs: promote-branches (when production)
    uses: ./.github/workflows/deploy-model-server.yml
  cloud:
    needs: model-server           # engine depends on the model-server API
    uses: ./.github/workflows/deploy-cloud.yml
  ui:
    needs: cloud                  # UI talks to the engine API
    uses: ./.github/workflows/deploy-ui.yml
  smoke:
    needs: ui
    uses: ./.github/workflows/synthetic-monitoring.yml   # workflow_call lane
```

Unchanged components no-op (same digest pin, same artifact), so "Deploy
Everything" is always a safe default. The component actions serve two distinct
purposes:

1. **Operational repair**: re-deploying a component that failed mid-train,
   targeted rollback (deploy an older digest), pushing one component to
   staging during debugging.
2. **Component-scoped releases**: shipping just the UI (or just the model
   server) to production without cycling the engine. The change still goes
   through stage and staging QA first; the component action then deploys that
   component alone.

Rules that make component-scoped releases safe:

- **Pairing warning.** A component deployed alone runs against the *current
  production* versions of the other components — a pairing staging may never
  have tested (staging ran new-UI + new-engine; production now runs new-UI +
  old-engine). Each component action diffs `main..stage` and **warns when the
  diff touches paths outside its own component** (e.g. Deploy UI warns if
  engine paths changed on stage), because then the deployed pairing was not
  the QA'd one. Warn, not block — the operator decides.
- **Compatibility rule** (engineer doc): a component shipped alone must be
  compatible with the versions of its neighbors currently in production — for
  the UI that means no hard dependency on engine APIs that have not shipped yet.
- **The deploy branch is the what-runs-where ledger.** Every component deploy
  — including the UI, which has no k8s pin — commits its deployed version
  (digest or built SHA) to the environment's overlay directory on `deploy`.
  `main` is only guaranteed to equal production after a full Deploy Everything.
- **Branch moves stay in Deploy Everything.** A UI-only deploy from `stage`
  does not move `main` (stage may carry engine changes that are *not* being
  released); the next full release catches `main` up. What production actually
  runs is always answerable from the deploy branch, never by guessing from
  `main`.

**`send-to-stage.yml` — "Send to Stage"** (manual, Actions tab)

```yaml
name: Send to Stage
on:
  workflow_dispatch:
    inputs:
      source_ref:
        description: 'Branch or SHA to promote (default: develop)'
        required: true
        default: 'develop'
concurrency:
  group: release-train          # serialize all promotion workflows
  cancel-in-progress: false
jobs:
  promote:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      # 1. Mint GitHub App token (release bot; only identity allowed to push stage)
      # 2. Checkout full history
      # 3. Guard: if source_ref is NOT an ancestor of protected develop, fail —
      #    only PR-reviewed, CI-passing commits can promote (blocks promoting a
      #    feature-branch SHA that never merged). Hotfixes bypass this workflow
      #    via the separately authorized PR-into-stage path (Milestone 1).
      # 4. Guard: if stage exists and is NOT an ancestor of source_ref, fail with
      #    "stage has commits missing from develop (hotfix not back-merged?);
      #     merge stage into develop first" — this is what keeps promotion ff-only
      # 5. git push origin <source_sha>:refs/heads/stage   (creates stage on first run)
      # 6. Job summary: promoted SHA, links to the build runs this push triggers
```

The push to `stage` then drives the build chain:
- `build-saas-engine.yml` and `build-model-server.yml` gain
  `push: branches: [stage]` with **no path filters** (a release always builds
  exactly the promoted SHA; path filters stay on the develop triggers).
  Buildcache keeps this fast.
- A thin `workflow_run` chain waits for the stage builds to succeed, then
  invokes **Deploy Everything (environment: staging)** — the same orchestrator
  a production release uses, pointed at staging. One deploy code path for both
  environments; staging just skips the approval gate and the branch move.

**Releasing to production = running "Deploy Everything" with
`environment: production`.** The `promote-branches` job (approval-gated) does
the guard + ff-push of stage -> main, `deploy-cloud` performs the provenance
check and pins the staging-validated digest to the production overlay,
`deploy-model-server` moves the same GHCR digest to the 4xH200 box, `deploy-ui`
builds from the main SHA, and the smoke job closes it out.

**`deploy-staging-adhoc.yml` — "Deploy to Staging from branch"** (manual)

Input: `ref`. Dispatches the builds on that ref, waits, then calls
`deploy-cloud` (and optionally `deploy-model-server` / `deploy-ui`) with the
resulting digests and `environment: staging`. Prints a warning in the job
summary that staging no longer matches the `stage` branch; running
"Send to Stage" restores it. For QA-ing a feature branch on real
infrastructure. Same `release-train` concurrency group so it cannot race a
real release.

**`rollback-production.yml` — "Rollback Production"** (manual, gated)

Convenience wrapper: defaults `digest` to the previous pin from the deploy
branch history of `k8s/overlays/production` (plus optional
`model_server_digest` and UI `ref`), then calls the component workflows with
`environment: production`. Targeted rollbacks can equally run a single
component action with an older digest — same code path either way. Job summary
must state the DB caveat: rollback is safe only within the expand/contract
migration window (see engineer doc, section "Migrations").

### 7b. Changes to existing workflows

| File | Change |
|------|--------|
| `promote-alb.yml` | Retire the `workflow_run`-on-develop trigger (this is the "develop deploys to prod" path). Its digest-resolve + App-token-commit logic moves into `deploy-staging.yml`. Delete the file once that lands. |
| `build-saas-engine.yml` | Add `push: branches: [stage]` (no path filters on that trigger). Keep develop trigger as-is (image-only builds). |
| `build-deploy-ui.yml` | Remove the auto-deploy-to-prod-bucket on develop push (per D2, develop deploys nowhere). Its build + S3 sync + CloudFront logic becomes the `deploy-ui.yml` component workflow (7a), parameterized by GitHub Environment (bucket, distribution ID, injected config). |
| `deploy-alb.yml` | Keep as break-glass. Add an `environment` choice input (staging/production) selecting cluster context + namespace + smoke URL. |
| `build-model-server.yml` | Add `push: branches: [stage]` (no path filters, same rationale as the engine). Keep the develop trigger as image-only build. Tag `:<sha>` already exists — that is the promotion handle. |
| `deploy-model-server.yml` | Remove the `workflow_run`-on-develop auto-deploy (today it ships model-server code to the box the production engine points at, ungated). Reshape into the Component 1 workflow of 7a: `workflow_dispatch` + `workflow_call`, `environment` input replacing the `target` choice (`original`/`4xh100`): staging -> 1xH100 host (`H100_SSH_*` secrets), production -> 4xH200 host (`H100_4X_SSH_*` secrets — rename these to env-named secrets while touching this). Deploys by GHCR digest; production always receives the **same digest** staging validated — the image is never rebuilt between environments. Keep the existing container-swap + rollback-on-failure logic; it is exactly right. |
| `deploy-gpu-monitoring.yml` | Align target names/labels with the new environment split (staging = 1xH100, production = 4xH200); update the Grafana `site` labels accordingly. |
| `deploy-lambda-oauth-google.yml` | Split by branch: push to `stage` deploys `rocketride-google-oauth-staging` with staging params; push to `main` deploys the prod stack. Remove the develop trigger. |
| `synthetic-monitoring.yml` | Matrix over staging + production every 15 min (staging failures -> low-urgency). Expose `workflow_call` so Deploy to Production can invoke it as the post-deploy smoke test. |
| `retag-alb-from-ghcr.yml`, `debug-alb.yml` | Keep; update namespace/cluster inputs to be env-aware. |
| `sync-pagerduty-secret.yml` | Add staging namespace + staging routing key. |

## 8. Milestone 5 — OSS repo alignment (rocketride-server)

The branch flow already exists; the work is consistency and hardening:

1. Add the same two dispatch actions for operator consistency: "Send to Stage"
   (guarded ff push develop -> stage) and "Deploy to Production" (guarded ff
   push stage -> main, `environment: release` approval). Today these moves are
   hand-made PRs (#1561 etc.); the actions make them uniform with saas.
2. Fix `prerelease.yaml`: trigger off CI success on **stage**, not develop
   (RELEASE.md already describes stage-based prereleases; the trigger predates
   that). Then "Send to Stage" automatically produces the prerelease artifacts
   + prerelease engine image that saas staging consumes.
3. Idempotency audit of `_release.yaml`: every registry publish step must
   skip-if-version-exists (npm, PyPI x2, vsce, ovsx) so a re-run after a
   partial failure republishes only what is missing. The docker job already
   gates on `server_tag_exists` — extend that pattern.
4. Move PyPI from `PYPI_TOKEN` to OIDC trusted publishing (npm already uses
   OIDC + provenance).
5. Branch protections mirroring Milestone 1 step 3.

## 9. Milestone 6 — Production cutover hardening (later; requires engine work)

Not needed for the first releases (a normal ArgoCD rolling update with
maxUnavailable:0 is acceptable), but this is the agreed target for zero-drop
releases. Prerequisites in the engine, in build order:

1. **Scheduler tick-claim**: unique-constraint insert on
   (schedule_id, tick_time) in the shared DB; both stacks' schedulers run hot,
   the DB arbitrates each tick. Also covers crash recovery. This is required
   before any two engine versions may run concurrently in production.
2. **Drain mode**: a flag that makes an instance stop claiming scheduler ticks,
   finish in-flight requests per connection, then close sockets with a
   deliberate close code (clients auto-reconnect via desiredState).
3. **Metering flush-on-close** in pipe teardown (usage keyed per run task ID is
   additive across stacks; the only loss risk is the unflushed tail).
4. **Server-initiated close runs the identical teardown as client close** (the
   "no pipe state after close" invariant must hold for forced closes).
5. **Reconnect-fuzz test in CI**: kill sockets mid-scenario, assert identical
   results. Guards the statelessness invariant continuously.

Then: Argo Rollouts blueGreen strategy on the production Application
(previewService for private smoke tests, prePromotionAnalysis running the
warm-up job, postPromotionAnalysis auto-rollback). Longest scheduled run bounds
the minimum drain window — measure before setting timeouts. Capacity note:
both ReplicaSets run simultaneously during cutover; the cluster needs headroom
for 2x the engine tier.

## 10. First-release runbook (end of Milestone 4)

1. Announce: develop merges no longer deploy anywhere (biggest team-visible change).
2. Verify staging stack healthy: seed script run, synthetic-monitoring green on staging.
3. Run **Send to Stage** (creates `stage`). Confirm: engine build, staging digest
   bump on `deploy`, ArgoCD staging sync, staging UI deployed, model server
   deployed to the 1xH100 box and its smoke green.
4. QA on `cloud-staging.rocketride.ai` per the checklist in the engineer doc.
5. One-time D5 reset of `main` to `stage` (manually-dispatched one-time
   workflow; release App token does the `--force-with-lease` push — humans
   cannot force-push `main` under the Milestone 1 rulesets).
6. Run **Deploy Everything** with `environment: production` (reviewer
   approves). Confirm: stage ff-pushed to main, model server on the 4xH200 box
   at the staging-validated digest, prod overlay pinned to the staging engine
   digest, ArgoCD prod sync, prod UI built from the main SHA, smoke green.
   Because staging is H100 and production is H200, spot-check the device-gated
   paths (probe/billing) on production after the flip.
7. Run each component action once standalone (Deploy UI is the cheapest) to
   verify the granular path works before anyone needs it in an emergency.
8. Run **Rollback Production** once as a drill, then roll forward again. A
   rollback path that has never been exercised does not exist.
9. Delete `feat/phase2`; retire `promote-alb.yml`.

## 11. Follow-ups (tracked, not blocking)

- **F1**: UI runtime config (`config.json` fetched at boot) so the production UI
  is the byte-identical staged artifact, closing the build-once deviation.
- **F2**: Dev environment auto-tracking develop (only if the team misses it, per D2).
- **F3**: Staging DB refresh pipeline with PII scrubbing (upgrade from D4 fixtures).
- **F4**: Send idempotency keys in the pipe protocol — closes the pre-existing
  double-processing window when a client re-sends after an ambiguous failure
  (network death between processing and response). Exists today independent of
  this plan; the graceful cutover does not widen it.
