# shadcn CLI — verified command reference

Verified against ui.shadcn.com/docs/cli and npm, Aug 2026. `shadcn` on npm:
`latest = 4.18.0`. Last Tailwind-v3-compatible release: `2.3.0` (its docs live
at v3.shadcn.com; ui.shadcn.com also keeps a `/docs/legacy` pointer).

All examples use `npx`; `pnpm dlx` / `yarn dlx` / `bunx` equivalents work.

## init

```bash
npx shadcn@latest init            # existing project
npx shadcn@latest init -t next    # scaffold a new Next.js project
```

Installs dependencies, adds the `cn` util, writes `components.json`, and
configures CSS variables. Key options (4.x):

```
-t, --template <template>  next | vite | start | react-router | laravel | astro
-b, --base <base>          component base: base | radix | aria
-p, --preset [name]        preset configuration (e.g. nova)
-d, --defaults             --template=next --preset=nova
-f, --force                overwrite existing configuration
-n, --name <name>          name for a new project
-c, --cwd <cwd>            working directory
--css-variables            use CSS variables for theming (default)
```

`init` can also take component names/URLs directly and will install them after
setup. On Tailwind v3 projects use `npx shadcn@2.3.0 init` instead — the 2.x
init asks for style (use `new-york`), base color, and CSS-variables choice, and
installs `tailwindcss-animate` (1.0.7). The 4.x init writes
`@import "shadcn/tailwind.css"` (Tailwind v4 syntax) into your global CSS —
this is what breaks v3 builds.

## add

```bash
npx shadcn@latest add button card dialog
npx shadcn@latest add @acme/auth          # from a configured namespace
npx shadcn@latest add ./local-item.json   # local path or URL also accepted
```

```
-o, --overwrite      overwrite existing files (destructive — branch first)
-a, --all            add every component in the registry
-p, --path <path>    target path for the component
--dry-run            preview what would be written, write nothing
--diff [path]        show diff for a file
--view [path]        show file contents
-y, --yes            skip confirmation
```

## view / search / list / docs

```bash
npx shadcn@latest view button                 # inspect registry item pre-install
npx shadcn@latest view @acme/auth @v0/dashboard
npx shadcn@latest search @shadcn -q "button"  # query a registry
npx shadcn@latest search @v0 @acme --limit 10 --offset 20
npx shadcn@latest list @acme                  # alias for search
npx shadcn@latest docs button                 # component docs/API in terminal
```

## build / eject (registry authors & v4 only)

```bash
npx shadcn@latest build                   # registry.json -> public/r/*.json
npx shadcn@latest build --output ./public/registry
npx shadcn@latest eject                   # inline shadcn/tailwind.css, drop dep
```

`eject` is v4-only and **irreversible** — after it, CLI updates to the shared
Tailwind layer no longer apply.

## Third-party registries — the @namespace system

Configure namespaces in `components.json`. `{name}` is substituted per item:

```jsonc
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@acme": "https://registry.acme.com/resources/{name}.json",
    "@company-ui": {
      "url": "https://registry.company.com/ui/{name}.json",
      "headers": { "Authorization": "Bearer ${COMPANY_TOKEN}" }
    }
  }
}
```

- `${VAR}` in headers is interpolated from environment variables — keep tokens
  out of the committed file.
- Then: `npx shadcn@latest add @acme/header @company-ui/auth-utils`.
- **Trust model:** registries are never auto-discovered; only what you
  explicitly configure can install. A registry item can bring files and npm
  dependencies with it — `view` it before you `add` it. Treat adding a
  namespace like adding a dependency source.

Known public namespaces beyond `@shadcn` include `@v0` (v0.dev output). The
registry directory at ui.shadcn.com/docs/registry/registry-index lists more.

## Upgrade / diff workflow

Components are owned source; there is no `update` command in 4.x. The reliable
workflow, on any CLI version:

```bash
git checkout -b chore/shadcn-refresh
npx shadcn@latest add button --dry-run     # see what upstream would write
npx shadcn@latest add button --diff        # show per-file diff vs upstream
npx shadcn@latest add button -o            # take upstream onto the branch
git diff main -- components/ui/button.tsx  # re-apply your local edits by hand
```

On `2.3.0` the `--diff`/`--dry-run` flags are not available; skip straight to
the branch + `add -o` + `git diff` merge. Never `-o` on main: overwrite is a
replace, not a merge, and your customizations are the part worth keeping.

## MCP

The registry also speaks MCP (`ui.shadcn.com/docs/registry/mcp`) for
agent-driven browsing/installs. Prefer the plain CLI in scripts — it's the
stable, documented surface.
