# RocketRide Shell API Cheat-Sheet

Ground truth precedence: `shell.d.ts` (authoritative) > prose docs.

Sources:
- `apps/launchkit/node_modules/shell/shell.d.ts` — 11,841 lines, `"types"` entry of `shell@1.2.0`, `rocketride.shellApiVersion: 0`
- `.rocketride/docs/ROCKETRIDE_APPS.md` (1727 lines)
- `.rocketride/docs/ROCKETRIDE_UI_COMPONENTS.md` (1590 lines)
- `.rocketride/docs/ROCKETRIDE_typescript_API.md` (1306 lines)
- `.rocketride/schema/rocketride_sql.json`, `.rocketride/services-catalog.json`

Everything below is quoted or transcribed from those files. Anything I could not
verify is in the **NOT DOCUMENTED** list at the end.

---

## A. Shell exports & hooks

All from `import { ... } from 'shell'`. `React$1` in the .d.ts is the `react` namespace import.

### A.1 `AppLayout`

`shell.d.ts:8997-9018` — verbatim:

```typescript
/** Props for {@link AppLayout}. */
export interface AppLayoutProps {
    /** The scrolling portion of the sidebar column. Present = two-column app;
        absent = one-column app spanning the full client area. Components
        inside read `useSidebarCollapsed()` to choose their collapsed
        (icon-rail) form. */
    sidebar?: React$1.ReactNode;
    /** Show the status bar (stock connection identity). Defaults to false. */
    showStatus?: boolean;
    /** App content for the status bar's middle slot. Providing it implies
        `showStatus`. */
    status?: React$1.ReactNode;
    /** The app's client-area content. */
    children: React$1.ReactNode;
}

export declare const AppLayout: React$1.FC<AppLayoutProps>;
```

Exactly four props. There is no `header`, `footer`, `title`, `className`, or `style` prop.

### A.2 `ShellAppProps`

`shell.d.ts:5706-5717` — the props the shell injects into your root component:

```typescript
/**
 * Props injected by the shell into the app's main `<App />` component.
 */
export interface ShellAppProps {
    /** Whether the RocketRide WebSocket is currently connected. */
    isConnected: boolean;
    /** Authenticated user identity, or null when not logged in. */
    identity: ConnectResult | null;
}
```

Two fields only.

### A.3 `AppDescriptor`

`shell.d.ts:5905-5933` — the single Module-Federation-exposed module:

```typescript
export interface AppDescriptor {
    /** Unique stable identifier — used as the workspace file key. */
    id: string;
    /** Display name shown in the app switcher. */
    name: string;
    /** Optional icon shown in the app switcher list. */
    icon?: React$1.ReactNode;
    /** Branding tokens (logo, welcome text) for the app. */
    branding: ShellBrandingConfig;
    /**
     * The app's ONE mount point, rendered raw in the client area. The app
     * composes its own layout inside with `<AppLayout>` (one column, sidebar,
     * status bar — declared as props from the app's single tree).
     */
    app: React$1.ComponentType<ShellAppProps>;
    /**
     * Optional cross-app component catalog. Never mounted by the shell —
     * entries are loadable by other apps via `useAppComponent()`.
     */
    components?: {
        [key: string]: React$1.ComponentType<any> | undefined;
    };
}
```

`branding` is **required**. Its shape (`shell.d.ts:5941-5964`):

```typescript
export interface ShellBrandingConfig {
    appName: string;                 // required
    logo?: React$1.ReactNode;
    logoCollapsed?: React$1.ReactNode;
    iconDark?: React$1.ReactNode;
    iconLight?: React$1.ReactNode;
    icon?: React$1.ReactNode;
    welcomeLogo?: React$1.ReactNode;
    welcomeTitle?: string;
    welcomeSubtitle?: string;
}
```

### A.4 Connection / identity hooks

```typescript
// shell.d.ts:5660-5667 (interface is NOT exported; the hook is)
interface ShellConnectionState {
    /** The shared RocketRideClient instance, or `null` if not yet initialised. */
    client: RocketRideClient | null;
    /** `true` when the WebSocket is authenticated and connected. */
    isConnected: boolean;
    /** Transient status bar text (e.g. `"Reconnecting…"`), or `null` when clear. */
    statusMessage: string | null;
}

// shell.d.ts:5684
export declare function useShellConnection(): ShellConnectionState;

// shell.d.ts:5694 — identity from the most recent successful connect
export declare function useAuthUser(): ConnectResult | null;

// shell.d.ts:5705 — ALWAYS returns null in the current implementation (see jsdoc)
export declare function useLogout(): (() => void) | null;

// shell.d.ts:7301 — client, guaranteed connected when non-null; re-renders on state change
export declare function useClient(): RocketRideClient | null;

// shell.d.ts:7521 — non-React call sites. Doc says: "Prefer
// `ConnectionManager.getInstance().getClient()` for new code."
export declare function getClient(): RocketRideClient | null;
```

`useLogout()` gotcha, verbatim from `shell.d.ts:5696-5704`: *"In the current
server-driven auth architecture, logout is handled by ShellApp via a full page
reload rather than an explicit callback, so this hook always returns null."*

`ConnectResult` (`shell.d.ts:1763-1812+`), the fields an app will actually use:

```typescript
export interface ConnectResult {
    userToken: string;        // short-lived rr_… session token
    userId: string;           // UUID
    displayName: string;
    givenName: string;
    familyName: string;
    preferredUsername: string;
    email: string;
    emailVerified: boolean;
    phoneNumber: string;
    phoneNumberVerified: boolean;
    locale: string;           // BCP-47
    devTeam: string;          // default team id
    organization: OrgInfo | null;
    apps: AppManifestEntry[]; // desktop apps w/ appStatus + onDesktop
    capabilities: string[];   // ['oss'] | ['saas']
    // …server version and further fields follow
}
```

### A.5 `usePrefs`

`shell.d.ts:8131-8156`:

```typescript
/** The shared preferences accessor: read one key, write one key. */
export interface IPrefsApi {
    /** Current value for `key`, or `undefined` if unset. Caller narrows the type. */
    getPref: (key: string) => unknown;
    /** Persist `value` under `key` (shallow-merged into the prefs bag). */
    setPref: (key: string, value: unknown) => void;
}

export declare function PrefsProvider({ value, children }: {
    value: IPrefsApi;
    children: React$1.ReactNode;
}): React$1.ReactElement;

/**
 * Reads the ambient prefs accessor. Returns a no-op accessor when no provider is
 * mounted, so callers never need to null-check.
 */
export declare function usePrefs(): IPrefsApi;
```

`getPref` returns `unknown` — you must narrow. Never null-checks needed.

### A.6 `useWorkspace`

`shell.d.ts:7279` → `IWorkspaceContext` at `shell.d.ts:7094-7213`:

```typescript
export declare function useWorkspace(): IWorkspaceContext;

export interface IWorkspaceContext {
    loaded: boolean;          // initial workspace load from disk complete
    seeded: boolean;          // pre-auth default state seeded
    appLoading: boolean;      // active app's descriptor is loading
    prefs: WorkspacePrefs;
    appState: Record<string, unknown>;
    updateAppState: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
    activeAppId: string;
    appManifest: AppManifestEntry[];            // all apps, no bundle load needed
    loadedApps: Record<string, AppDescriptor>;
    loadApp: (appId: string) => void;
    appLoadErrors: Record<string, string>;
    retryApp: (appId: string) => Promise<boolean>;
    invalidateApp: (appId: string) => void;
    loadFailure: { appId: string; name: string } | null;
    dismissLoadFailure: () => void;
    settings: Record<string, SettingValue>;          // EFFECTIVE (defaults merged)
    settingsOverrides: Record<string, SettingValue>; // RAW deltas only
    settingsRegistry: SettingsRegistry;
    updateSetting: (key: string, value: SettingValue | undefined) => void;
    updatePrefs: (patch: Partial<WorkspacePrefs>) => void;
    themeOptions: { id: string; name: string }[];
    setTheme: (themeId: string) => void;
    /** @deprecated Use `updatePrefs` for prefs, ConnectionManager…emit('shell:switchApp') for app switches. */
    dispatch: (action: { type: string; [key: string]: unknown }) => void;
    emit: /* 25 typed overloads, one per ShellConnectionEventMap key */;
    on:   /* 25 typed overloads; each returns () => void */;
}
```

Related types:

```typescript
// shell.d.ts:5726-5737
export interface WorkspacePrefs {
    activeView: string;
    activeActivity: string | null;
    sidePanelOpen: boolean;   // mirrored to global.json
    theme: string;            // mirrored to global.json
    [key: string]: unknown;   // apps may stash extra keys
}

// shell.d.ts:5748-5753
export interface AppWorkspaceState {
    prefs: WorkspacePrefs;
    appState: Record<string, unknown>;  // opaque; shell persists, never reads
}

// shell.d.ts:5761-5765
export interface WorkspaceState { version: 3; activeAppId: string; apps: Record<string, AppWorkspaceState>; }

// shell.d.ts:5767
export type SettingValue = string | number | boolean;
```

`updateSetting` semantics (`shell.d.ts:7157-7161`, verbatim): *"Writing a value
equal to the schema default DELETES the override (deltas-only storage); passing
`undefined` resets the key to its default explicitly."*

### A.7 `useShellEvent`

See section F.

### A.8 Other exported hooks

```typescript
// shell.d.ts:7328-7334
export declare function useSubscriptions(): {
    desktopApps: AppManifestEntry[];
    isOnDesktop: (appId: string) => boolean;
    getStatus: (appId: string) => AppStatus | undefined;
};
// AppStatus (shell.d.ts:7320, NOT exported as a type):
//   "auth" | "free" | "unsubscribed" | "subscribed" | "trialing" | "past_due" | "canceled"

// shell.d.ts:7375 — polls only while connected
export declare function usePolling(fetcher: () => void | Promise<void>, /* IUsePollingOptions @7364 */): /* … */;

// shell.d.ts:7509
export declare function useClickOutside(ref: React$1.RefObject<HTMLElement | null>, onClose: () => void): void;

// shell.d.ts:7510
export declare function useFixedPopupPosition(
    triggerRef: React$1.RefObject<HTMLElement | null>,
    isOpen: boolean,
    placement?: "below" | "above"
): { /* … */ };

// shell.d.ts:10709
export declare function useDebouncedValue<T>(value: T, delayMs: number): T;

// shell.d.ts:10733
export declare function useAnnouncements(): Announcement[];   // Announcement @10711
```

`useAppComponent(appId, componentName)` is documented in
`ROCKETRIDE_typescript_API.md:993` for the `rocketride/app-sdk` subpath:
*"load a React component from another app's catalog (lazy-loads the descriptor;
`null` while loading)"*. Its `shell` export signature — see NOT DOCUMENTED.

### A.9 Stock UI components

Function components (`export declare function`, all return `React$1.ReactElement`):

| Component | Line | Destructured props (exact) |
|---|---|---|
| `Button` | 9207 | `{ variant, small, mini, disabled, onClick, children, title, pressed, ariaExpanded }: IButtonProps` |
| `Card` | 9416 | `{ header, headerActions, children, noBodyPadding, toolbar, onClick, fill }: ICardProps` |
| `Modal` | 9755 | `{ title, onClose, children, footer, showClose, closeOnEscape, width, noBodyPadding, ariaLabel }: IModalProps` |
| `ConfirmDialog` | 9048 | `{ title, message, confirmLabel, cancelLabel, secondaryLabel, onConfirm, onCancel, onSecondary, destructive, confirmDisabled }: IConfirmDialogProps` |
| `Banner` | 9269 | `{ variant, children }: IBannerProps` |
| `StatusBadge` | 9235 | `{ variant, children }: IStatusBadgeProps` |
| `StatusDot` | 9228 | `{ variant }: IStatusDotProps` |
| `EmptyState` | 9253 | `{ icon, title, description, action }: IEmptyStateProps` |
| `InputField` | 9279 | `{ className, style, ...rest }: IInputFieldProps` |
| `ToggleGroup` | 9334 | `<T extends string>(props: IToggleGroupProps<T>)` |
| `Chip` / `ChipAdd` | 9355 / 9362 | `{ label, onRemove }` / `{ label, onClick }` |
| `DropZone` | 9378 | `{ title, hint, onFiles }: IDropZoneProps` |
| `MiniCard` / `MiniContainer` | 9456 / 9463 | `{ title, value, label, color }` / `{ columns, children }` |
| `Section` / `LabelValue` | 9486 / 9493 | `{ label, children }` / `{ label, children, mono }` |
| `ContentHeader` | 9509 | `{ title, subtitle, actions }: IContentHeaderProps` |
| `TabControl` / `TabPanel` | 9701 / 9720 | `{ menu, activeId, onSelect, trailing }` / `{ panels, activeId }` |
| `DetailPanel` | 9671 | `{ open, onClose, avatar, title, subtitle, tabs, activeTab, onTabSelect, children, side, width, height, footer, flushBody, contained, resizable, dirty, editing, onExitMode, busy, modeless, minWidth, persistKey }` — returns `ReactElement \| null` |
| `PanelTabBody` | 9683 | `{ children }` |
| `SidebarMenu` | 9831 | `{ menu, activeId, onSelect, sectionLabel, collapsed }` |
| `SaveFileDialog` | 9800 | `{ title, vfs, fileTypes, rootLabel, defaultDir, initialName, onConfirm, onCancel }` |
| `ConnectionCard` | 10622 | `{ icon, name, address, status, statusLabel, connected, onEdit, onDelete, onClick }` |
| `ConnectionCardAdd` | 10629 | `{ label, onClick }` |
| `ConnectionManagerView` | 10697 | `<T extends {…}>(props: IConnectionManagerViewProps<T>)` |
| `RocketRideMark` | 9529 | `{ size, color, bodyColor, className, style }` |

`React.FC` const components:

```typescript
export declare const AppLayout: React$1.FC<AppLayoutProps>;                         // 9018
export declare const ChatView: React$1.FC<IChatViewProps>;                          // 10553
export declare const MessageList: React$1.FC<MessageListProps>;                     // 10568
export declare const MarkdownRenderer: React$1.FC<MarkdownRendererProps>;           // 10572
export declare const FilterStrip: React$1.FC<IFilterStripProps>;                    // 10187
export declare const DataGrid: <Row extends Record<string, unknown>>(props: IDataGridProps<Row> & {…}) => …;      // 10436
export declare const CardDataGrid: <Row extends Record<string, unknown>>(props: ICardDataGridProps<Row> & {…}) => …; // 10453
export declare const Explorer: React$1.FC<IExplorerProps>;                          // 8798
export declare const DocTabs: React$1.FC<DocTabsProps>;                             // 8827
export declare const DocSplitLayout: React$1.FC<DocSplitLayoutProps>;               // 8846
export declare const Shell: React$1.FC<ShellProps>;                                 // 8862
export declare const Sidebar: React$1.FC<SidebarProps>;                             // 8975
export declare const NavButton: React$1.FC<NavButtonProps>;                         // 8967
export declare const SidebarFooter: React$1.FC<SidebarFooterProps>;                 // 9907
export declare const SidebarCollapsedProvider: React$1.FC<ISidebarCollapsedProviderProps>; // 9846
export declare const SidebarCollapsedGate: React$1.FC<ISidebarCollapsedGateProps>;  // 9871
export declare const BottomPanel: React$1.FC<BottomPanelProps>;                     // 8979
export declare const DebugPanel: React$1.FC<{ onClose: () => void }>;               // 8994
export declare const PopupRow: React$1.FC<{…}>;                                     // 9049
export declare const MonitorView: React$1.FC<IMonitorViewProps>;                    // 7419
export declare const WorkspaceProvider: React$1.FC<IWorkspaceProviderProps>;        // 7270
export declare const AccountProvider: React$1.FC;                                   // 9060
export declare const SettingsProvider: React$1.FC;                                  // 9069
export declare const OverviewGrid / ConnectionsPanel / TasksPanel / ActivityPanel;  // 11186/11213/11241/11275
export declare const AccountView / EnvironmentView / CheckoutModal / PlanPicker / UpgradeModal; // 11464/11512/11518/11578/11604
```

Grid constants: `GRID_CONFIG_GET = "rr:grid-config:get"`, `GRID_CONFIG_SET =
"rr:grid-config:set"`, `GRID_CONFIG_CLEAR = "rr:grid-config:clear"`
(`shell.d.ts:10457-10461`). `CLOSE_GLYPH = "✕"` (`shell.d.ts:9722`).

**Icons:** 51 `Bx*` exports, all typed `IconComponent`
(`shell.d.ts:8870+`), e.g. `BxPlus`, `BxTrash`, `BxCog`, `BxSearch`, `BxRefresh`,
`BxChevronDown/Left/Right`, `BxRocket`, `BxPalette`, `BxDownload`.
`ROCKETRIDE_APPS.md:1413-1414`: *"**No emojis** in UI text or output. Use the icon
set (`Bx*` components from `'shell'`) for glyphs."*

**Styles & theme utilities:**

```typescript
export declare const commonStyles: { /* … */ };        // shell.d.ts:37
export type ThemeTokens = { /* ~80 tokens */ };        // shell.d.ts:10768
export declare function applyTheme(tokens: ThemeTokens): void;  // shell.d.ts:10852
export declare function formatBytes(bytes: number): string;     // shell.d.ts:10747
export declare function formatDate(iso: string): string;        // shell.d.ts:10755
```

`commonStyles` members, verbatim from `ROCKETRIDE_UI_COMPONENTS.md:1558-1576`:

- **Cards & sections**: `card`, `cardHeader`, `cardBody`, `cardFlat`, `section`, `sectionHeader`, `sectionHeaderLabel`
- **Buttons**: `buttonPrimary`, `buttonSecondary`, `buttonDanger`, `buttonDangerOutline`, the `*Small` variants, `buttonDisabled`, `cardHeaderButton`, `cardBodyButton`, `toggleButton(active)`, `toggleGroup`
- **Layout**: `splitHeader`, `tabContent`, `columnFill`, `headerBar`, `divider`
- **Text**: `textMuted`, `textEllipsis`, `fontMono`, `labelUppercase`, `empty`
- **Overlays & menus**: `overlay`, `modalOverlay`, `dialog`, `modalDialog`, `modalHeader`, `modalBody`, `modalFooter`, `popupMenu`, `menuRow`
- **Controls & lists**: `inputField`, `listRow(active)`, `emptyState`, `iconBox`, `badge`
- **Tables**: `tableHeader`, `tableCell`
- **Status indicators**: `indicatorSuccess`, `indicatorInfo`, `indicatorWarning`, `indicatorError`, `indicatorMuted`

*"(`toggleButton` and `listRow` are functions of the active state; `viewPadding`
is deprecated.)"*

**Connection manager** (`ROCKETRIDE_APPS.md:710-717`, verbatim):

```typescript
import { ConnectionManager } from 'shell';

const cm = ConnectionManager.getInstance();
cm.emit('shell:switchApp', { appId: 'acme.brandy' });
const unsub = cm.on('shell:connected', () => console.log('Connected'));
unsub();
```

Plus `cm.getDebugLog(): DebugLogEntry[]`, `cm.clearDebugLog()`,
`cm.onAny((event, payload) => …): () => void` (`ROCKETRIDE_APPS.md:772-775`,
`shell.d.ts:8125-8129`).

---

## B. Data access from an app

### B.1 SQL — use `client.database`, not `client.tool`

**This is the direct answer to "how does an app execute SQL against a
`rocketride_sql` node".** `client.database.query` *is* the typed wrapper around
the node's `execute` tool function.

`shell.d.ts:3902-3936` — verbatim:

```typescript
/**
 * Direct database-query namespace on RocketRideClient.
 *
 * Accessed via `client.database` — not instantiated directly. Statements
 * submitted through this namespace bypass the LLM translation layer and
 * safety checks, so the caller is responsible for the SQL/Cypher they pass.
 */
export declare class DatabaseApi {
    constructor(client: RocketRideClient);
    /**
     * Execute a raw SQL or Cypher statement against a database pipeline node.
     *
     * Invokes the `execute` tool function on the target database node,
     * bypassing LLM translation and SQL safety checks.
     *
     * @param options.token - Pipeline token for authentication and resource access.
     * @param options.sql - Raw SQL or Cypher statement to execute.
     * @param options.nodeId - Target database node ID.  When empty the call
     *   broadcasts to all tool-lane nodes; the first database node handles it.
     * @param options.sessionId - Optional transaction session ID returned by
     *   `beginTransaction`.  When provided the statement runs within that session.
     * @param options.params - Optional positional parameters bound to the statement
     *   (e.g. `[1, 'foo']` for `$1`, `$2` placeholders).
     * @returns Object with `rows` (array of row objects) and `affected_rows` (number).
     */
    query(options: {
        token: string;
        sql: string;
        nodeId?: string;
        sessionId?: string;
        params?: unknown[];
    }): Promise<{
        rows: Record<string, unknown>[];
        affected_rows: number;
    }>;

    beginTransaction(options: { token: string; nodeId?: string }): Promise<{ session_id: string }>;
    commit(options: { token: string; sessionId: string; nodeId?: string }): Promise<{ ok: boolean }>;
    rollback(options: { token: string; sessionId: string; nodeId?: string }): Promise<{ ok: boolean }>;
}

export declare enum DatabaseDialect {   // shell.d.ts:3897
    POSTGRES = "postgres",
    MYSQL = "mysql",
    NEO4J = "neo4j"
}
```

`ROCKETRIDE_typescript_API.md:938-971` adds `dialect` and `sequelize`, verbatim:

> `dialect(options: { token: string; nodeId?: string }): Promise<DatabaseDialect>` — discover the underlying engine (`DatabaseDialect.POSTGRES | MYSQL | NEO4J`); branch on SQL syntax differences or detect a graph DB

> ##### `sequelize(options): Sequelize`
> Build a Sequelize ORM instance that transports its SQL over the RocketRide pipe instead of a TCP socket. `sequelize` is an optional **peer dependency** — import the class yourself and pass it in:
> ```typescript
> import { Sequelize } from 'sequelize';
>
> const db = client.database.sequelize({ Sequelize, token, nodeId: 'db_postgres_1' });
> // define models / run queries as usual — traffic rides the RocketRide connection
> ```

> **Transaction example:**
> ```typescript
> const { session_id } = await client.database.beginTransaction({ token, nodeId: 'db_postgres_1' });
> try {
> 	await client.database.query({ token, sql: 'INSERT INTO items (name) VALUES ($1)', params: ['widget'], sessionId: session_id });
> 	await client.database.commit({ token, sessionId: session_id });
> } catch (err) {
> 	await client.database.rollback({ token, sessionId: session_id });
> 	throw err;
> }
> ```
> Pin `nodeId` on every call of a transaction when the pipeline has more than one database node — broadcasts may land on different nodes.

**The `rocketride_sql` node itself** (`.rocketride/schema/rocketride_sql.json`):

```json
{
  "title": "RocketRide SQL",
  "protocol": "rocketride_sql://",
  "prefix": "rocketridesql",
  "plans": null,
  "capabilities": 1024,
  "classType": ["database", "tool"],
  "actions": 0,
  "description": "A RocketRide-managed relational database. Stores structured table data \nin your own provisioned RocketRide cloud database with zero setup — no host, \nuser, or password to enter. The connection is resolved automatically from \nyour signed-in RocketRide identity. Supports the same natural-language query, \nschema reflection, and direct-execute surface as the generic PostgreSQL node.",
  "lanes": { "answers": [], "questions": ["table", "text", "answers"] },
  "invoke": { "llm": { "description": "LLM to use to craft SQL queries from question", "min": 1 } },
  "documentation": "https://docs.rocketride.org",
  "icon": "18"
}
```

Key facts: `classType` includes `"tool"` (so it sits on the tool lane and
`client.database.query` can reach it), it has **no** `properties` (zero config
fields — the connection resolves from identity), and `invoke.llm` has `min: 1`,
so a pipeline using it **must** wire an `llm` control node.

**nodeId convention** (`ROCKETRIDE_PIPELINES.md:82`, verbatim): *"Unique within
the pipeline. Convention: `<provider>_<n>` (`chat_1`, `llm_openai_1`)."* So a
`rocketride_sql` node is conventionally `rocketride_sql_1`. Passing `nodeId: ''`
(or omitting it) broadcasts to all tool-lane nodes and the first database node
handles it — safe when the pipeline has exactly one DB node.

Assembled app-side shape:

```typescript
import pipe from './data.pipe';
import { useShellConnection } from 'shell';

const { client } = useShellConnection();
const { token } = await client.use({ pipeline: pipe, useExisting: true, ttl: 900 });

const { rows, affected_rows } = await client.database.query({
    token,
    sql: 'SELECT id, name FROM items WHERE owner = $1 ORDER BY created_at DESC LIMIT $2',
    params: ['me', 50],
    nodeId: 'rocketride_sql_1',   // '' / omitted broadcasts to the tool lane
});
```

### B.2 `client.tool({...})` — generic tool-function invocation

`shell.d.ts:5636-5658` — verbatim (jsdoc trimmed to the param block):

```typescript
    /**
     * @param options.token - Pipeline token for authentication and resource access
     * @param options.tool - Name of the @tool_function to invoke (e.g. 'search', 'list', 'execute')
     * @param options.nodeId - Target node ID.  When empty the call broadcasts to all
     *                         tool-lane nodes; the first node that owns the tool handles it.
     * @param options.input - Arguments forwarded to the tool function
     * @param options.timeout - Optional per-request timeout in ms
     * @returns The tool's return value (typically a record/object)
     * @throws Error if the server signals failure or no node handles the requested tool
     */
    tool<T = any>(options: {
        token: string;
        tool: string;
        nodeId?: string;
        input?: Record<string, unknown>;
        timeout?: number;
    }): Promise<T>;
```

`ROCKETRIDE_typescript_API.md:468-480` — verbatim:

> ### `tool(options): Promise<T>` (client-level)
>
> Invoke a `@tool_function` on a pipeline node without an open pipe — the server borrows a pipeline instance from the pool, dispatches the call, and returns the result directly (no Question/Answer/SSE overhead).
>
> ```typescript
> const rows = await client.tool({
> 	token,
> 	tool: 'search',
> 	nodeId: '',        // '' broadcasts; first node owning the tool handles it
> 	input: { q: 'invoices 2026' },
> 	timeout: 30000,    // optional per-request timeout in ms
> });
> ```

Also available on an **open** `DataPipe` (cheaper, reuses that pipe's instance),
`ROCKETRIDE_typescript_API.md:458`:

> `tool<T>(tool: string, nodeId?: string, input?: Record<string, unknown>): Promise<T>` — invoke a `@tool_function` on a pipeline node **through this open pipe**, reusing its pipeline instance (no pool borrow). An empty `nodeId` broadcasts to all tool-lane nodes; the first owner of the tool handles it

### B.3 `client.use({...})`

`shell.d.ts:4839-4856` — verbatim:

```typescript
    use(options?: {
        token?: string;
        filepath?: string;
        pipeline?: PipelineConfig;
        source?: string;
        threads?: number;
        useExisting?: boolean;
        args?: string[];
        ttl?: number;
        /** Pipeline trace level. When set, captures every lane write and invoke call in the response under '_trace'. */
        pipelineTraceLevel?: "none" | "metadata" | "summary" | "full";
        /** Optional display name for the task (e.g. shown in dashboard). */
        name?: string;
        /** Unfiltered per-use values merged over the filtered `ROCKETRIDE_*` client environment. */
        env?: Record<string, string>;
    }): Promise<Record<string, unknown> & {
        token: string;
    }>;
```

`ROCKETRIDE_APPS.md:856-864` — verbatim:

```typescript
// The rsbuild config treats .pipe as JSON, and src/global.d.ts declares the
// module type — both scaffolded for you.
import summarizer from './summarizer.pipe';
import { useShellConnection } from 'shell';

const { client } = useShellConnection();
const { token } = await client.use({ pipeline: summarizer });
```

`ROCKETRIDE_APPS.md:866-867`, verbatim: *"The browser has no filesystem — always
pass `pipeline:` (the imported object), never `filepath:` (Node-only)."*

`ROCKETRIDE_APPS.md:898-900`, verbatim: *"`use()` is expensive — start the
pipeline once per session and keep the token; never start/stop around every
request. `ttl` controls the idle shutdown window (`0` = run until terminated)."*

Lifecycle companions (`ROCKETRIDE_APPS.md:884-896`, verbatim):

```typescript
// Start once, reuse: useExisting attaches to a running instance of the
// same pipeline instead of starting a second one.
const { token } = await client.use({ pipeline, useExisting: true, ttl: 900 });

// Recover a token after a reload (project_id + source identify the task):
const existing = await client.getTaskToken({ projectId, source: 'input' });

// Pre-flight check, restart with a new config, stop:
await client.validate({ pipeline });
await client.restart({ projectId, source: 'input', pipeline });
await client.terminate(token);
```

```typescript
// shell.d.ts:4903-4907
getTaskToken(options: {
    projectId: string;
    source: string;
    teamId?: string;   // "Address the team's DEPLOY run; omit for your own dev run." (:4901)
}): Promise<string | undefined>;

// shell.d.ts:4860
terminate(token: string): Promise<void>;

// shell.d.ts:4917
getTaskPipeline(token: string): Promise<Record<string, unknown> | undefined>;
```

### B.4 `client.chat(...)` and `client.send(...)`

`shell.d.ts:4925` and `4969-4973` — verbatim:

```typescript
    send(token: string, data: string | Uint8Array, objinfo?: Record<string, unknown>,
         mimetype?: string,
         onSSE?: (type: string, data: Record<string, unknown>) => Promise<void>
    ): Promise<PIPELINE_RESULT | undefined>;

    chat(options: {
        token: string;
        question: Question;
        onSSE?: (type: string, data: Record<string, unknown>) => Promise<void>;
    }): Promise<PIPELINE_RESULT>;

    // shell.d.ts:4961-4965
    sendFiles(files: Array<{ file: File; objinfo?: Record<string, unknown>; mimetype?: string }>,
              token: string, maxConcurrent?: number): Promise<UPLOAD_RESULT[]>;

    // shell.d.ts:4921
    pipe(token: string, objinfo?: Record<string, unknown>, mimeType?: string,
         provider?: string,
         onSSE?: (type: string, data: Record<string, unknown>) => Promise<void>): Promise<DataPipe>;
```

Note `chat`'s `question` is typed `Question` (the exported class at
`shell.d.ts:581`), not `string`.

Which one to use (`ROCKETRIDE_APPS.md:946-950`, verbatim):

> - `client.send(token, data, objinfo?, mimetype?, onSSE?)` — for pipelines whose source pipeline component is `webhook` or `dropper`; `client.sendFiles(files, token)` for parallel file upload.
> - `client.chat({ token, question, onSSE })` — for a `chat` source pipeline component.

Streaming into React (`ROCKETRIDE_APPS.md:955-963`, verbatim):

```typescript
const response = await client.chat({
	token,
	question,
	onSSE: async (type, data) => {
		setStreamText((prev) => prev + String(data.text ?? ''));
	},
});
```

`onSSE` signature (`ROCKETRIDE_typescript_API.md:487`): `onSSE?: (type: string,
data: Record<string, unknown>) => Promise<void>`. It is *"the last positional
parameter on `pipe()` and `send()`, and a field on the `chat()` options object"*
(`:484`).

### B.5 Per-user vs deployed-task addressing — YES, there is a distinction

`ROCKETRIDE_APPS.md:902-942` — verbatim:

> ### One task for everyone vs a task per user
>
> A task's identity is owner + `project_id` + source component — and when your app calls `use()`, the owner is the signed-in **user**. So every user of your app gets their own instance of the pipeline, automatically. `useExisting` does not change that: it attaches to *that user's* own already-running instance (a reload, a second tab, a second component) instead of failing with 'Pipeline is already running.' — it never crosses user boundaries.
>
> **Per-user tasks (the default, and the only behavior `use()` can produce):**
>
> - Isolation — whatever state the pipeline holds in memory (accumulated documents, warm models, conversation state) belongs to that user alone.
> - Cost — each user's task runs and bills under their own identity, and `${ROCKETRIDE_*}` placeholders resolve from *their* environment layers.
> - Cleanup — each instance idles out on its own `ttl`; `terminate(token)` ends only that user's instance. Pass `useExisting: true` routinely so a reload re-attaches instead of erroring while the previous instance lives.
>
> **One shared task for all users** is a *deployed*, team-owned pipeline, not an app-embedded one: deploy the pipeline as its own `kind: 'pipe'` project and point a team at it (see 'App pipes cannot be scheduled' below and the SDK deploy docs). The team's run is a single instance; your app addresses it by adding the `teamId` scope when resolving the token:
>
> ```typescript
> const token = await client.getTaskToken({ projectId, source: 'webhook_1', teamId });
> if (token) await client.send(token, data, undefined, 'text/plain');
> ```
>
> - Shared state — one instance serves every caller; anything the pipeline accumulates is visible to all of them.
> - Cost and lifecycle — the run bills to the owning team, resolves the team's environment, and outlives any one user's session; restarting or terminating it affects everyone at once.
>
> **Choosing:** per-user when the pipeline holds per-user state or cost should follow the user; shared when the pipeline is a service — one big index, one warm model — whose state and cost belong to the team. When in doubt, start per-user: it is what you get by writing nothing.

`ROCKETRIDE_APPS.md:1040-1048`, verbatim: *"A pipeline embedded in your app
exists only inside your bundle — it runs when your code calls `use()`. Schedules
(cron runs) are a feature of pipelines *deployed to the server* as their own
`kind: 'pipe'` projects via the deploy registry."*

The team-service identity pattern (`ROCKETRIDE_APPS.md:1057-1069`, verbatim):

> - **Identity without drift** — import the `.pipe` for its `project_id` (the scaffold's build treats `.pipe` as JSON) and address the service as `{ projectId, source, teamId }`. The import is identity only — the app never calls `use()` on it. Listing the pipeline folder under `appManifest.include` packs the definition with the app as provenance.
> - **Store the team NAME in settings, resolve the id at runtime** — names are portable across environments; a team GUID baked into a settings default dies on any other server.

```typescript
import filePipe from '../../../pipelines/file-to-text.pipe'; // identity only
const PROJECT_ID = String(filePipe.project_id);
```

### B.6 Secrets

`ROCKETRIDE_APPS.md:874-877`, verbatim: *"Pipeline configs reference secrets as
`${ROCKETRIDE_*}` placeholders. Substitution happens server-side when you call
`use()` — the values come from the user's stored environment keys, so no secret
ever ships inside your app bundle or `.pipe` file."*

### B.7 Error handling

`ROCKETRIDE_APPS.md:973-1016`, verbatim in essence:

1. **The request** — `send()`, `sendFiles()`, `chat()` throw `PipeException`
   (importable from `'rocketride'`; also exported from `'shell'` at
   `shell.d.ts:175`).
2. **The task** — `getTaskStatus(token)` (`shell.d.ts:4887`): *"`completed` flips
   true once the run is over, `exitCode !== 0` (with `exitMessage`) means it did
   not end well, `errors` carries the most recent error lines (capped at 50), and
   `serviceUp: false` … means it cannot serve."*
3. **Live signals** —

```typescript
useEffect(() => {
	if (!client || !token) return;
	client.addMonitor({ token }, ['task', 'summary']);
	return () => { client.removeMonitor({ token }, ['task', 'summary']); };
}, [client, token]);

useShellEvent('shell:event', ({ event }) => {
	const e = event as { event?: string; body?: { errors?: string[] } };
	if (e.event === 'apaevt_status_update' && e.body?.errors?.length) {
		setError(e.body.errors[e.body.errors.length - 1]);
	}
});
```

```typescript
// shell.d.ts:4549, 5011, 5019
export type MonitorKey = { /* … */ };
addMonitor(key: MonitorKey, types: string[]): Promise<void>;
removeMonitor(key: MonitorKey, types: string[]): Promise<void>;
```

UI guidance (`ROCKETRIDE_APPS.md:1035-1038`, verbatim): *"Reserve `EmptyState`
for a dead pipeline that blocks the whole view. For a degraded-but-serving
pipeline (errors accumulating while requests still succeed), render a `<Banner
variant='error'>` above your content instead of replacing it."*

---

## C. App manifest schema

Declared in `package.json` under the `appManifest` key
(`ROCKETRIDE_APPS.md:347-351`, verbatim): *"This metadata is available to the
platform without loading your bundle — it drives the app store listing,
authentication gating, packaging, and billing."*

### C.1 Complete field reference — `ROCKETRIDE_APPS.md:355-372`, verbatim

| Field | Type | Default | Meaning |
|---|---|---|---|
| `id` | `string` | required | Stable unique identity, `<developerId>.<name>` (e.g. `acme.brandy`). The prefix must be your org's claimed namespace to deploy or publish. Renaming the id makes it a different app. |
| `projectId` | `string` | auto | Working-copy GUID the App Builder manages — tells one checkout apart from another; rides deploys only as provenance. Leave it alone. |
| `publisher` | `string` | — | Publisher display name in the app store. |
| `name` | `string` | required | Display name (app switcher, store tile). |
| `description` | `string` | — | Short description for the store listing. |
| `icon` | `string` | — | App-folder-relative icon path (e.g. `./icon.svg`); must live inside the app folder. |
| `readme` | `string` | — | App-folder-relative store README (markdown); must live inside the app folder. |
| `categories` | `string[]` | `[]` | Store filter categories (e.g. `["tools"]`). |
| `mode` | `string` | `'free'` | Billing mode: `'free'`, `'subscription'`, or `'paywall'`. |
| `authenticated` | `boolean` | `true` | `false` lets the app run signed-out (`isConnected: false`, `identity: null`). |
| `showStatusBar` | `boolean` | `true` | `false` hides the shell status bar for this app. |
| `shells` | `string[]` | all | Compatible shells: any of `'saas'`, `'oss'`, `'vscode'`. Omitted = all. |
| `include` | `string[]` | — | Extra workspace-relative paths packed into the deploy zip — see [below](#packaging-extra-directories-include). |
| `typecheck` | `boolean` | `true` | `false` = the server build skips the `tsc` gate and deploys even with type errors — a visible waiver, not a default. |
| `billing.plans` | `object[]` | — | Pricing plans for paid modes: `{ nickname, amountCents, currency, interval, metadata? }` (Stripe-shaped). A *proposal* that rides every deploy and goes live when a version is approved for the store. Edited on the Store tab. |
| `contributes.configuration` | `object` | — | Settings declaration in the VS Code `contributes.configuration` shape (below). |

`ROCKETRIDE_APPS.md:374-376`, verbatim: *"The id grammar is enforced at scaffold
and at deploy: `^[a-z][a-z_]*\.[a-z][a-zA-Z0-9_-]*$` — publisher segment first,
then a dot, then the app name (`acme.s3-explorer`, `acme.app2`)."*

### C.2 BILLING — how to declare a PAID app

Two fields, and they are the whole story:

```jsonc
{
  "appManifest": {
    "mode": "subscription",          // 'free' (default) | 'subscription' | 'paywall'
    "billing": {
      "plans": [                     // Stripe-shaped
        {
          "nickname": "Pro",
          "amountCents": 2900,
          "currency": "usd",
          "interval": "month",
          "metadata": { }            // optional
        }
      ]
    }
  }
}
```

Exact plan object keys, from the manifest table: `{ nickname, amountCents,
currency, interval, metadata? }`. `amountCents` is an integer count of cents (not
a decimal amount). `billing.plans` is *"A **proposal** that rides every deploy and
goes live when a version is approved for the store."* — it is not live on deploy
alone; store approval activates it. The App Builder's **Store** tab is the GUI
editor for it, and `ROCKETRIDE_APPS.md:145-148` says that tab holds *"billing
mode, pricing plans, and the store requirements checklist. Personal and team
publishing never touches this tab."*

Runtime billing surface: `AppPrice` (`shell.d.ts:896`), aliased
`export type StripePlan = AppPrice;` (`shell.d.ts:919`); `BillingDetail`
(`:861`), `CreditBalance` (`:927`), `CreditPack` (`:1041`), `CheckoutPlan`
(`:6206`), `PlanAction` (`:6190`). App-status values reaching the app via
`useSubscriptions().getStatus()` / `AppManifestEntry.appStatus`
(`shell.d.ts:5891`, `:7320`): `auth | free | unsubscribed | subscribed |
trialing | past_due | canceled`. Shell-side checkout UI is exported:
`CheckoutModal`, `PlanPicker`, `UpgradeModal`, and the
`shell:subscribe` / `shell:unsubscribe` events open it.

### C.3 `contributes.configuration` (runtime settings)

`ROCKETRIDE_APPS.md:383-418` — verbatim:

```json
{
  "appManifest": {
    "contributes": {
      "configuration": {
        "title": "Brand Studio",
        "properties": {
          "acme.brandy.maxResults": {
            "type": "integer",
            "default": 50,
            "description": "Maximum results per query."
          }
        }
      }
    }
  }
}
```

> Rules and behavior:
>
> - Every key must be prefixed with your app id (`acme.brandy.<setting>`).
> - `type` is one of `string | number | integer | boolean`; `enum`, `enumDescriptions`, `markdownDescription`, `order`, `required`, and `placeholder` refine the control. The display label derives from the key, VS Code style (`maxResults` renders as "Max Results") — there is no label field.
> - Settings render in the shell's Settings overlay, grouped by `title`; only user *overrides* are stored (defaults live in your schema).
> - Read settings via `useWorkspace().settings` — an *effective* map with defaults already merged, keyed by the full dotted key:
>
> ```typescript
> const { settings } = useWorkspace();
> const maxResults = settings['acme.brandy.maxResults'] as number;
> ```

Typed schema (`shell.d.ts:5783-5799+`):

```typescript
export interface SettingSchema {
    type: "string" | "number" | "integer" | "boolean";
    default?: SettingValue;
    description?: string;
    markdownDescription?: string;
    enum?: string[];   // "Typed string[] per the frozen v0 contract" — see note
    // …enumDescriptions, order, required, placeholder
}
```

`shell.d.ts:5795-5799` warns, verbatim: *"Fixed value choices — renders as a
dropdown. Typed `string[]` per the frozen v0 contract; integer/number schemas may
carry numeric entries in the manifest JSON at runtime, so render through
`String()` and coerce the selected value back via `type`."*

Label derivation (`shell.d.ts:5778-5781`): *"'rocketride.pipeBuilder.pipelineTraceLevel'
renders as "Pipeline Builder: Pipeline Trace Level" — there is no label field.
Key casing is therefore label casing (use 'pipelineTTL' for "Pipeline TTL")."*

### C.4 `include`

`ROCKETRIDE_APPS.md:420-442` — verbatim:

> Deploying an app uploads its SOURCE — the server owns the build. The deploy zip mirrors your workspace tree: the app folder packs at its workspace-relative position, and any `include` entries pack verbatim at theirs, so relative references between them (a shared-source tsconfig mapping, a `file:` dependency) resolve identically after the server unpacks:
>
> ```json
> {
>   "appManifest": {
>     "include": ["libs/ui-kit"]
>   }
> }
> ```
>
> Entries are workspace-relative paths (files or directories) — no absolute paths, drive letters, or `.`/`..` segments, and every entry must exist or the deploy fails. Packing honors your workspace's `.gitignore` plus a built-in baseline (`node_modules/`, `dist/`, `.git/`): dependency trees and build output never ship — the server installs and builds from source. The zipped upload caps at 50 MB; hitting it usually means an over-broad `include` entry.

### C.5 Real scaffolded manifest (this workspace)

`apps/launchkit/package.json`:

```json
"appManifest": {
  "id": "rocketride_ai.launchkit",
  "publisher": "rocketride_ai",
  "name": "Launch Kit",
  "description": "Launch Kit — a RocketRide app",
  "icon": "./icon.svg",
  "readme": "./README.md",
  "categories": ["custom"],
  "mode": "free",
  "authenticated": false
}
```

`apps/testapp-ui/package.json` is identical in shape plus
`"projectId": "d95cf66a-1591-4646-a18d-24f2334d0c51"`. Both scaffolds emit
`categories: ["custom"]`.

---

## D. Styling constraints

### D.1 The doctrine — `ROCKETRIDE_APPS.md:1375-1414`, verbatim

> ## Styles Doctrine
>
> The platform's UI conventions — the App Builder's Components gallery shows all of it live.
>
> 1. **Plain CSS via style objects.** No CSS frameworks, no MUI, no styled-components, no separate stylesheet files. Each component file declares one named `styles` const at the top:
>
>    ```typescript
>    const styles: Record<string, React.CSSProperties> = {
>    	wrap: { padding: 40, fontFamily: 'var(--rr-font-family, system-ui)' },
>    	title: { fontSize: 22, fontWeight: 600, color: 'var(--rr-text-primary)' },
>    	sub: { marginTop: 8, fontSize: 13, color: 'var(--rr-text-secondary)' },
>    };
>    ```
>
>    JSX references `styles.wrap` — no inline object literals scattered through the markup.
>
> 2. **Tokens for every visual value.** Colors, fonts, and borders always come from `--rr-*` variables so all themes work for free.
>
> 3. **Stock components first.** Before building a card, badge, modal, grid, or input from scratch, check the surface: `Button`, `Card`, `Modal`, `ConfirmDialog`, `StatusBadge`, `Banner`, `InputField`, `ToggleGroup`, `Chip`, `DataGrid`, `TabControl`, `TabPanel`, `EmptyState`, `Section`, `DetailPanel`, `SidebarMenu`, `ChatView`, and more — all importable from `'shell'`, all token-styled and theme-correct.
>
> 4. **`commonStyles` for shared shapes.** [...] Spread and extend (`{ ...commonStyles.buttonPrimary, minWidth: 96 }`) for genuinely shared shapes; keep one-off styling in your own `styles` const.
>
> 5. **No emojis** in UI text or output. Use the icon set (`Bx*` components from `'shell'`) for glyphs.

**This is the only documented statement about CSS files, and it is a
prohibition:** *"No CSS frameworks, no MUI, no styled-components, no separate
stylesheet files."* A precompiled Tailwind stylesheet violates rule 1 twice
(framework + separate stylesheet file) and rule 2 (Tailwind's utility classes
carry literal colors, not `--rr-*` tokens).

**Is the prohibition mechanically enforced?** NOT DOCUMENTED — see the caveats
list. What *is* verifiable from `apps/launchkit/rsbuild.config.mts`: the build is
a stock `@rsbuild/core` + `pluginReact()` + `pluginModuleFederation()` config
with exactly one `tools.rspack` rule added (`{ test: /\.pipe$/, type: 'json' }`).
Nothing disables rsbuild's built-in CSS handling, and nothing adds a Tailwind or
PostCSS plugin. Whether a `.css` import would build, and where its `<style>`
would land at runtime (the app is a Module Federation **remote** mounted inside
the shell's page, so any global stylesheet it injects would apply to the shell
chrome too), is not covered by any doc I read.

### D.2 Theming — `ROCKETRIDE_APPS.md:1330-1371`, verbatim

> The shell manages themes via CSS custom properties. Use `--rr-*` variables for every color, font, and border — never hardcoded values. The user's theme choice (light, dark, and other palettes, including a Visual Studio-flavored one) swaps the values out from under you; an app built on tokens needs no theme-specific code.

### Core tokens (documented set)

| Variable | Purpose |
|---|---|
| `--rr-bg-default` / `--rr-bg-paper` | Main / card-panel backgrounds |
| `--rr-bg-surface` / `--rr-bg-surface-alt` | Raised / alternate surfaces |
| `--rr-bg-widget` / `--rr-bg-input` | Widget-toolbar / input backgrounds |
| `--rr-bg-list-hover` / `--rr-bg-list-active` | List row hover/active |
| `--rr-text-primary` / `--rr-text-secondary` / `--rr-text-disabled` / `--rr-text-link` | Text colors |
| `--rr-brand` / `--rr-accent` / `--rr-accent-faded` | Brand and accent colors |
| `--rr-border` / `-hover` / `-focus` / `-input` | Border colors |
| `--rr-color-success` / `-warning` / `-error` / `-info` | Semantic status colors |
| `--rr-font-family`, `--rr-font-size` / `-sm` / `-xs` | Primary font and sizes |
| `--rr-icon-color` | Default icon tint |
| `--rr-chart-blue` … `--rr-chart-red` | Categorical chart palette (blue, green, yellow, purple, orange, red) |

That table is the documented core; the full set is larger.
`ROCKETRIDE_UI_COMPONENTS.md:1549-1552`, verbatim: *"every colour, font, radius,
and shadow is a `--rr-*` CSS variable declared on `:root` and re-declared per
theme (`ThemeTokens` is the typed map, **~80 tokens**)"*. The exact 80 are
enumerable from `ThemeTokens` at `shell.d.ts:10768` and from the shipped
`shell/tokens.css`.

Gotcha, `ROCKETRIDE_APPS.md:1354-1355`, verbatim: *"There is no monospace token —
use a fallback stack: `fontFamily: 'var(--rr-font-mono, Consolas, monospace)'`."*

Reacting to theme changes (`ROCKETRIDE_APPS.md:1364-1368`, verbatim):

```typescript
useShellEvent('shell:themeChange', ({ tokens }) => {
	redraw(tokens['--rr-brand']);
});
```

### D.3 Fonts

No doc in `.rocketride/docs/` mentions `@font-face`, `woff`, font bundling, or
font files — see NOT DOCUMENTED. The only verifiable data point: the **shell's
own** `package.json` depends on `@fontsource-variable/figtree@^5.2.10`, and the
shell package publishes two CSS subpath exports for its own use:

```json
"exports": {
  ".": { "types": "./shell.d.ts", "default": "./dist/index.js" },
  "./themes/rocketride-default.css": "./dist/themes/rocketride-default.css",
  "./tokens.css": "./tokens.css",
  "./package.json": "./package.json"
}
```

The documented way for an app to set type is `var(--rr-font-family, system-ui)`
— i.e. inherit the shell's font rather than ship one.

### D.4 Styling inside an embedded iframe

`ROCKETRIDE_APPS.md:665-701` — the one place raw CSS text is sanctioned, and only
inside an iframe you build with `srcdoc`. Verbatim:

> - **Seed the theme into the `srcdoc` markup.** Waiting for `shell:init` to theme the document paints one unthemed frame first. Instead, generate a `:root { ... }` style block from the current token map when you build the `srcdoc` string — the shell writes every `--rr-*` token as an inline style property on the document root, so the current values are trivial to read — and use `shell:init`/`shell:themeChange` only to keep them fresh afterwards.
> - **Hide until ready.** Keep the iframe `visibility: 'hidden'` until the content posts `view:initialized`, then reveal [...] Never use `display: 'none'` for this: a display-none frame has zero dimensions, which breaks any layout measured inside it.

> Style the embedded document with `var(--rr-*)` exactly as you would in the app itself and it follows every theme switch live.

The iframe must be `srcdoc` or same-origin (`:659-661`): *"The bridge posts every
message with the shell's own origin as the target, so a document on a foreign
origin never receives it — by design: identity and config must not leak."*

---

## E. Assets

### E.1 What is documented

Only **two** app-level asset references exist in the manifest, both
app-folder-relative and both required to live inside the app folder
(`ROCKETRIDE_APPS.md:362-363`):

- `icon` — e.g. `./icon.svg`
- `readme` — e.g. `./README.md`

The scaffold ships `icon.svg` (`ROCKETRIDE_APPS.md:250`, verbatim): *"Neutral
placeholder so icon readiness starts green and store tiles never render a bare
fallback glyph. Replacing it is your first branding act."*

Anything else ships via `appManifest.include` (section C.4), which packs
**workspace-relative** paths verbatim into the deploy zip.

`import img from './x.png'` and font files referenced from CSS: NOT DOCUMENTED
anywhere in `.rocketride/docs/`. The bundler is stock rsbuild (which has default
asset handling), but no doc states what the platform does with it, and
`output: { assetPrefix: 'auto' }` in `rsbuild.config.mts` is the only
asset-related build setting present.

### E.2 Size caps — CONFIRMED

`ROCKETRIDE_APPS.md:441`: *"The zipped upload caps at 50 MB."*

`ROCKETRIDE_python_API.md:880-881`, verbatim: *"(node_modules/, dist/, .git/),
symlink containment, and the 50MB zipped / 512MB uncompressed caps"*.

`ROCKETRIDE_typescript_API.md:853`, verbatim: *"it packs the source exactly as
the App Builder does (workspace-rooted layout, `appManifest.include` honored,
gitignore + baseline filtering, the 50MB zipped / 512MB uncompressed caps) and
ships it through the registry rail"*.

**Both caps confirmed: 50 MB zipped, 512 MB uncompressed.**

Pre-flight check before deploying (`ROCKETRIDE_typescript_API.md:853`, verbatim):

> Pre-check everything first with `client.deploy.verifyApp(appFolder)` — a purely local dry run (no server call) returning `{ ok, checks: [{ id, ok, note }], fileCount, uncompressedBytes }` covering the manifest shape, id grammar, declared assets, include entries, and pack size.

CI shape, verbatim from the same line:

```bash
rocketride app verify ./apps/reports && rocketride app deploy ./apps/reports --comment 'v1.4'
```

> both read the `ROCKETRIDE_DEPLOY_*` pair, and deploy refuses to run without a configured deployment target.

Note the caps apply to **source**, not build output: *"Deploying an app uploads
its SOURCE — the server owns the build"* (`:422`) and *"dependency trees and
build output never ship — the server installs and builds from source"* (`:439`).

---

## F. Events & realtime

### F.1 `useShellEvent` — exact signature

`shell.d.ts:7302-7319` — verbatim:

```typescript
/**
 * Subscribe to a typed shell event with automatic cleanup on unmount.
 *
 * Replaces the common pattern of manually calling `cm.on()` in a useEffect
 * and returning the unsubscribe function. The handler is stable — it always
 * calls the latest version without needing it in the dependency array.
 *
 * @param event   - The event name from ShellConnectionEventMap.
 * @param handler - Callback invoked when the event fires.
 *
 * @example
 * ```tsx
 * useShellEvent('shell:event', ({ event }) => {
 *     console.log('Server pushed:', event);
 * });
 * ```
 */
export declare function useShellEvent<K extends keyof ShellConnectionEventMap>(
    event: K,
    handler: (payload: ShellConnectionEventMap[K]) => void
): void;
```

Returns `void` — no unsubscribe to manage; cleanup is automatic on unmount, and
the handler is stable (no dependency array needed).

### F.2 Complete event name list

`ShellConnectionEventMap` is declared at `shell.d.ts:6369` (the interface itself
is **not** exported — only `useShellEvent`'s generic references it). The complete
key set, enumerated from the 25 `emit`/`on` overloads at `shell.d.ts:7179-7213`
and the `ConnectionManager.on` overloads at `shell.d.ts:6637-6709`:

| Event | Payload (from `shell.d.ts:6369-6500`, and `ROCKETRIDE_APPS.md:752-760`) |
|---|---|
| `shell:connected` | `Record<string, never>` — WS handshake + auth complete |
| `shell:disconnected` | `{ reason: string; hasError: boolean }` |
| `shell:statusMessage` | `{ message: string \| null }` — `null` clears |
| `shell:statusChange` | `ConnectionStatus` — full state machine update |
| `shell:error` | `{ error: Error \| unknown }` |
| `shell:event` | `{ event: DAPMessage }` — **every** raw server push |
| `shell:accountUpdate` | `ConnectResult` — from the `apaext_account` DAP event |
| `shell:orgChanged` | `{ orgId: string }` — from `apaext_org_changed`; pure notification |
| `shell:servicesUpdated` | `{ services: Record<string, unknown>; icons?: Record<string, string>; servicesError?: string }` |
| `shell:appsUpdated` | `{ apps: ShellAppEntry[] }` — complete replacement set |
| `shell:login` | `{ user: ConnectResult }` |
| `shell:logout` | `Record<string, never>` |
| `shell:loginRequest` | `{ appId?: string; register?: boolean }` |
| `shell:logoutRequest` | `Record<string, never>` |
| `shell:switchApp` | `{ appId: string }` |
| `shell:subscribe` | opens `CheckoutModal`; `app` = manifest entry, optional `plan` preselects a tier (`:6485-6488`) |
| `shell:unsubscribe` | see NOT DOCUMENTED (payload not read) |
| `shell:myApps` | `{}` — navigate to the My Apps launcher |
| `shell:openOverlay` | `{ id }` — `'account' \| 'settings' \| 'environment'` |
| `shell:sidebarCollapsing` | `{}` |
| `shell:themeChange` | `{ tokens }` — the full `--rr-*` map |
| `shell:viewActivated` | `{ viewId }` — a view/tab became active; lazy panels init here |
| `shell:manifestRefresh` | `{ source }` — server-side app manifest changed (dev overlay, publish, expiry) |
| `app:statusChanged` | `{ appId, version?, status, notes? }` — store review status changed |
| `store:changed` | `{ prefix, paths }` — files changed under a watched store prefix |

`ROCKETRIDE_APPS.md:761`: *"The event map is the platform's shared vocabulary."*

Note the payload asymmetry: several events carry `Record<string, never>` (an
empty object type), so destructuring fields off them will not typecheck.

### F.3 How server push reaches the app

Every DAP message the WebSocket receives is republished on the shell bus as
`shell:event`. `shell.d.ts:6401-6409`, verbatim:

> Every push event received from the RocketRide server over the WebSocket.
>
> Wraps the raw DAP event message so app plugins can subscribe to server-pushed data without needing direct client access.

```typescript
"shell:event": { event: DAPMessage };   // DAPMessage @ shell.d.ts:1551
```

`ROCKETRIDE_APPS.md:965-967`, verbatim: *"Server push events (task status, custom
pipeline-to-UI messages) arrive on the shell bus — subscribe with
`useShellEvent('shell:event', ...)`; see `ROCKETRIDE_OBSERVABILITY.md` for the
event taxonomy."*

For **task-scoped** events you must first register a monitor on the token,
otherwise the server does not push them (`ROCKETRIDE_APPS.md:1003-1015`):

```typescript
useEffect(() => {
	if (!client || !token) return;
	client.addMonitor({ token }, ['task', 'summary']);
	return () => { client.removeMonitor({ token }, ['task', 'summary']); };
}, [client, token]);

useShellEvent('shell:event', ({ event }) => {
	const e = event as { event?: string; body?: { errors?: string[] } };
	if (e.event === 'apaevt_status_update' && e.body?.errors?.length) {
		setError(e.body.errors[e.body.errors.length - 1]);
	}
});
```

Named DAP events referenced in the app docs: `apaevt_status_update`,
`apaevt_task` (with `action: 'end'`), `apaevt_status_upload` (emitted by
`sendFiles`), `apaext_account`, `apaext_org_changed`.

`ROCKETRIDE_APPS.md:997-1001`, verbatim: *"an `apaevt_task` event with `action:
'end'` that you did not cause — no `terminate()`, no TTL you expected — is your
cue to check the status and show the error state"*.

### F.4 Non-React subscription

`ROCKETRIDE_APPS.md:710-720`, verbatim:

```typescript
import { ConnectionManager } from 'shell';

const cm = ConnectionManager.getInstance();
cm.emit('shell:switchApp', { appId: 'acme.brandy' });
const unsub = cm.on('shell:connected', () => console.log('Connected'));
unsub();
```

> In React, prefer the hook — it unsubscribes on unmount and always calls your latest handler

### F.5 The iframe bridge (a separate, non-overlapping message set)

`ROCKETRIDE_APPS.md:639-656` — messages the shell posts *into* an embedded
iframe. These are **not** `ShellConnectionEventMap` keys:

| Message | Payload | When |
|---|---|---|
| `shell:init` | `{ theme, user, isConnected, apiConfig }` | The reply to `view:ready` — the bootstrap snapshot. `theme` is the full `--rr-*` token map. |
| `shell:themeChange` | `{ tokens }` | The user switched themes — re-apply the token map. |
| `shell:connectionChange` | `{ isConnected }` | The platform WebSocket opened or closed. |
| `shell:login` / `shell:logout` | `{ user }` / — | Identity changed. |
| `shell:event` | `{ event }` | Every raw server push event, forwarded. |
| `shell:viewActivated` | `{ viewId }` | — |

Content-side messages include `view:ready`, `view:initialized`, and an
open-singleton-tab request `{ viewType, label }`. Hook: `useIframeBridge`
(`shell/dist/hooks/useIframeBridge.js`; documented at
`ROCKETRIDE_UI_COMPONENTS.md:1465`).

---

## ⚠️ NOT DOCUMENTED

Everything below was asked for but could not be verified in
`shell.d.ts`, `ROCKETRIDE_APPS.md`, `ROCKETRIDE_UI_COMPONENTS.md`,
`ROCKETRIDE_typescript_API.md`, or the schema/catalog files. Do not assume.

1. **Legal values for `appManifest.categories`.** The manifest table gives type
   `string[]`, default `[]`, and one example `["tools"]`. Both scaffolded apps in
   this workspace use `["custom"]`. **No enumeration of legal categories exists
   in any doc.** Whether the store validates against a fixed list is unknown.

2. **Whether `import './styles.css'` compiles.** The Styles Doctrine forbids
   "separate stylesheet files" as a *convention*. No doc says whether the rsbuild
   build, the server-side build, or the deploy validator *rejects* a `.css`
   import. `rsbuild.config.mts` neither enables nor disables CSS handling.

3. **CSS Modules support.** Never mentioned in any doc. Not configured in
   `rsbuild.config.mts`.

4. **Where an app's injected CSS lands at runtime.** The app is a Module
   Federation remote mounted inside the shell's page. Whether a stylesheet it
   injects is scoped to the app's subtree or leaks into shell chrome is not
   documented. Treat a global Tailwind reset (`*, ::before, ::after { … }`,
   `body { … }`) as **high risk** on this basis alone.

5. **Any explicit statement about Tailwind.** Rule 1 says "No CSS frameworks",
   which covers it by category. There is no Tailwind-specific guidance,
   allowance, or escape hatch documented.

6. **Fonts entirely.** No doc mentions `@font-face`, `woff`/`woff2`, bundling
   font files, self-hosting a font, or a font-related manifest field. The shell's
   own `@fontsource-variable/figtree` dependency is the shell's, not an app API.

7. **`import img from './x.png'` and static asset handling.** No doc covers image
   imports, data-URI inlining thresholds, asset output paths, or what
   `assetPrefix: 'auto'` resolves to when the app is served as an MF remote.

8. **The full `--rr-*` token list.** Only ~30 tokens are named in the
   `ROCKETRIDE_APPS.md:1340-1352` table; `ROCKETRIDE_UI_COMPONENTS.md:1550` says
   there are **~80**. Read `ThemeTokens` (`shell.d.ts:10768`) or
   `shell/tokens.css` for the exact set before relying on a token not in the
   table above.

9. **`shell:unsubscribe` payload shape.** Confirmed to exist as an event key (via
   the `emit`/`on` overloads at `shell.d.ts:7212+`) but I did not read its
   payload declaration.

10. **`ConnectionStatus` and `ShellAppEntry` field shapes.** Referenced as the
    payloads of `shell:statusChange` and `shell:appsUpdated`; their declarations
    were not read.

11. **`useAppComponent`'s signature as a `shell` export.** Documented only for
    the `rocketride/app-sdk` subpath
    (`ROCKETRIDE_typescript_API.md:993`) as `useAppComponent(appId,
    componentName): React.ComponentType | null`. A
    `shell/dist/hooks/useAppComponent.js` exists but I did not read its .d.ts
    declaration line.

12. **Prop interface bodies for most stock components.** Section A.9 lists the
    exact *destructured prop names* (which is what you code against) and the
    interface name + line. The interfaces' full type bodies (`IButtonProps`
    variants, `IDataGridProps<Row>`, `IChatViewProps`, `IDetailPanelProps`, etc.)
    were not transcribed — read them at the cited lines.

13. **Whether `mode: 'paywall'` and `mode: 'subscription'` differ in required
    `billing.plans` shape.** The manifest table gives one plan shape for "paid
    modes" collectively and does not distinguish the two.

14. **Whether `billing.plans` is validated at deploy or only at store review.**
    The doc says it "rides every deploy and goes live when a version is approved
    for the store" — the validation point is not stated.

15. **`AppConfiguration` / `SettingsRegistry` full shapes.** Referenced by
    `AppManifestEntry.configuration` (`shell.d.ts:5877`) and
    `IWorkspaceContext.settingsRegistry` (`:7156`); `AppConfiguration.properties`
    is `Record<string, SettingSchema>` (`:5840-5841`), the rest not read.
