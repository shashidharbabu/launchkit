# 04 — Custom Nodes: the PR-and-Approval Process

Some apps need pipeline components that don't exist in the platform catalog (example already in flight: `visual_similarity_filter`). **A custom node is platform code, not app code** — it runs inside the engine for every tenant, so it ships through the `rocketride-server` repo with review, never as something you register locally and hope survives on staging.

> **Hard rule:** a pipe deployed to staging can only reference nodes that exist in **staging's** `.rocketride/services-catalog.json`. Your locally-hacked node will validate on your machine and fail on the server. The only path to the cloud is a merged, approved PR.

> **Timing:** node PRs have review latency. If your Phase-0/§1 catalog check found a gap, **raise the PR today** — it must be merged and live on staging well before Sept 1. Raising it is part of today's 6:00 PM development deadline.

---

## When do you need a custom node?

Check, in order — most "custom node" needs aren't:

1. **Catalog first.** Search `.rocketride/services-catalog.json` and `.rocketride/schema/` — the capability may already exist under a name you didn't guess.
2. **`tool_python`.** Deterministic logic that runs inside a pipeline can usually live in a `tool_python` node (code delivered via your app/store — the Spaceport engine-seeding pattern). No PR needed.
3. **`tool_http_request`.** Calling an external service is an HTTP tool with a URL whitelist, not a node.
4. **A genuinely new provider** — a new model/filter/data component with its own config schema, lifecycle, and resource profile → that's a custom node. Continue below.

Unsure which bucket you're in? Ask **Shashidhar** before writing node code.

## The process

### 1. Fork/branch on `rocketride-server`

Branch from `develop` (PRs target `develop`; the release train carries it to staging — see the release-process doc, owned by **Dmitrii**).

### 2. Implement the node in the nodes package

```
rocketride-server/
  nodes/
    src/nodes/<your_node_name>/     # implementation — follow an existing node
    test/                           # tests — REQUIRED, no untested nodes get approved
```

Use an existing node (e.g. `nodes/src/nodes/visual_similarity_filter/`) as the structural reference: same layout, same registration pattern, a config schema for every field your `.pipe` will set.

Requirements for approval:

- **Config schema** declared, so `client.validate({ pipeline })` can check pipe configs against it.
- **Tests** under `nodes/test` covering the node's contract: happy path, bad config, empty input, and any resource cleanup. They must pass in the repo's test runner.
- **No secrets, no hardcoded endpoints** — anything environment-specific reads `${ROCKETRIDE_*}` from the layered environment.
- **No blocking of the event loop / unbounded memory** — nodes share the engine with every other tenant's pipelines.
- **Docs:** a short description for the catalog entry (what it does, inputs/outputs, config fields).

### 3. Raise the PR

- Title: `nodes: add <your_node_name>`.
- Body: what the node does, which app needs it, link to your migration contract, and the test evidence (runner output).
- Request review from the server team; ping **Shashidhar** with the PR link so it's tracked against the launch list.

### 4. Approval → merge → reaches staging

After merge to `develop`, the node reaches staging with the next **Send to Stage** run (Dmitrii's release train). It is usable **only when it appears in staging's catalog**:

```bash
grep '<your_node_name>' .rocketride/services-catalog.json   # after reconnecting the workspace
```

### 5. Then, and only then, reference it in your pipes

Add it to your pipe generator, `client.validate({ pipeline })` every variant against staging, and continue with doc 03 §6–§8.

## Interim development (while the PR is in review)

Don't block your whole migration on the PR:

- Develop and test the node **inside the `rocketride-server` checkout** with its own test runner (`nodes/test`).
- Keep your pipe generator emitting **two variants**: one referencing the new node (target), one degraded/stubbed variant (e.g. the step as a `tool_python` approximation or skipped) so the rest of the app's migration can proceed and be validated on staging.
- Never deploy a pipe referencing the unmerged node — it will fail server-side validation and pollute your deploy history.

## Checklist

- [ ] Confirmed the capability is not already in the catalog / not expressible via `tool_python` / `tool_http_request`
- [ ] Node implemented under `nodes/src/nodes/<name>` following an existing node's structure
- [ ] Config schema declared
- [ ] Tests under `nodes/test` passing
- [ ] No secrets / hardcoded endpoints / event-loop blocking
- [ ] PR raised on `rocketride-server` targeting `develop`, reviewers requested, Shashidhar notified
- [ ] PR merged, node visible in **staging's** `services-catalog.json`
- [ ] Pipes referencing it validate clean against staging

**Next → [05-data-migration.md](05-data-migration.md).**
