# 05 — Data Migration to the Staging DBs (Stage 3)

**The rule for launch:** on staging, all app data lives in the **staging-managed databases**, reached through the platform DB nodes — `rocketride_graph` (graph), `rocketride_sql` (SQL), `rocketride_vector` (vector). Inside the staging environment those nodes connect to **staging's own database layer** through the server-side DB broker.

What must go away:

- **Personal DBs** — your Neo4j Aura instance, your personal Postgres, a Qdrant you pay for, anything keyed to your personal credentials.
- **Public / self-hosted open-source DBs** — the community Neo4j/Postgres/Qdrant/etc. you've been pointing external-store nodes (`graph_neo4j`, `db_postgres`, `qdrant`, …) at during development.

Marketplace apps can't depend on a database only you can reach. The staging DB nodes give every tenant a zero-setup, identity-scoped store the platform operates.

---

## How the staging DB nodes actually work (so you don't fight them)

- **Identity is injected by the task engine, server-side.** The per-tenant DSN resolution happens in the server process via the DB broker (`ROCKETRIDE_DB_BROKER_URL`/`_TOKEN` in the *server's* environment). **Every client-side workaround fails by design** — API-key sessions, per-call `env` overrides on `use()`, setting `ROCKETRIDE_CLIENT_ID` yourself, user-scope env secrets. Don't spend time on them; this was proven exhaustively during the Spaceport migration (its `STORAGE.md` is the deep-dive).
- Consequence: the nodes only work **when run on the server as a signed-in identity** — which is exactly how your deployed pipes run. Local trickery is not part of the design.

## Step 1 — Probe before you migrate anything

Write a ten-line throwaway pipe (webhook → agent/data node with the DB tool) using the `rocketride_*` node you need, validate it, run it on staging, and execute a trivial statement (`RETURN 1` for graph, `SELECT 1` for SQL, a no-op upsert for vector).

- **Probe passes** → proceed to Step 2.
- **Probe fails with a broker/identity error** (`ROCKETRIDE_CLIENT_ID is not set…` or similar) → the broker isn't configured on staging for that store. **Report to Dmitrii immediately** and, while you wait, keep your pipes **generated in two provider variants** (see below). Don't silently ship on your personal DB.

## Step 2 — Make the store provider-switchable in your pipes

Your pipe **generator** (doc 03 §6) emits each pipe in two variants sharing the same graph-tool node id (provider-neutral, e.g. `graph_1`):

| Variant | Node | Use |
|---|---|---|
| `default` | `rocketride_graph` / `rocketride_sql` / `rocketride_vector` | **The launch target** — staging-managed store |
| `external` | `graph_neo4j` / `db_postgres` / `qdrant` … | Transitional fallback only, switched by a runtime app setting (e.g. `<devId>.<app>.storeVariant`) |

Because the node id is identical across variants, the app's read path (`client.tool({ tool: 'execute', nodeId: 'graph_1' })`) and every agent instruction work unchanged whichever variant is deployed. One generator owns both — no hand-edited divergence.

## Step 3 — Inventory the data to move

For each store your app uses, write down: what entities live there, roughly how many rows/nodes, what seeds vs. what user data, and what can simply be **re-generated** (indexes, derived rows, bootstrap proposals) rather than copied. Much "migration" is just re-running your bootstrap/seed pipe against the new store.

## Step 4 — Export from the old store

From your personal/OSS DB, export with its native tooling to neutral files (JSON/CSV/Cypher dumps). Keep exports **outside** the workspace (they may contain user data — never commit them, never bundle them).

## Step 5 — Import into the staging store *through a pipe*

You cannot connect to the staging DB directly — there is no DSN to hand out. Imports go through the same seam everything else uses:

1. Add (or reuse) an **import/bootstrap pipe**: webhook → deterministic import step (`tool_python` reading the payload, or your existing bootstrap module) → the `rocketride_*` store node.
2. Deploy it (`deployTo` a team), trigger it with your exported data in chunks (mind payload sizes; batch).
3. For schema/config/seed rows, prefer your app's own **seed path** (the "Seed engine" / config-as-data defaults from doc 03) over raw copying — it re-establishes the data the way a fresh org adoption would.

Alternatively for small datasets: the app's own admin surface + `client.tool` execute calls (literal statements, no LLM in the loop) can replay an export interactively.

## Step 6 — Verify

- Storage probe (Step 1's statement) green from inside the app's flow.
- Row/node counts match the inventory (or the expected regenerated set).
- Every app read path renders from the staging store with the `default` variant active.
- Writes are stamped with real shell identity.

## Step 7 — Decommission the old store

- Flip the store-variant app setting to `default` everywhere; redeploy the `default` pipes.
- Remove the external-store secrets (`ROCKETRIDE_<APP>_NEO4J_URI/_USER/_PASSWORD` etc.) from the staging environment overlay — the owner removes them, same rule as setting them.
- Delete the personal DB credentials from every `.env`; keep `.env.example` documenting only what the app still uses.
- Keep the `external` variant **in the generator** (it costs nothing and is your rollback), but nothing deployed references it.

## Secrets reminder

While the external variant is still in use: its credentials live **only** in the server-side layered environment (org scope so team-scheduled runs resolve them), referenced as `${ROCKETRIDE_*}` in pipe configs, set by their owner. Never in the bundle, never in a `.pipe` file.

## Checklist

- [ ] Storage probe run against staging for every store the app uses
- [ ] Pipes generated in `default` (rocketride_*) + `external` variants, same node ids, one generator
- [ ] Data inventory written (copy vs. regenerate)
- [ ] Export taken, stored outside the workspace, not committed
- [ ] Import executed through a deployed pipe / seed path
- [ ] Verification green on the `default` variant end-to-end
- [ ] Personal / open-source DB credentials removed from staging env and local `.env`
- [ ] Broker gaps (if any) reported to Dmitrii, with the external variant explicitly flagged as temporary

**Next → [06-ready-to-deploy-checklist.md](06-ready-to-deploy-checklist.md).**
