import * as React from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

export type ChartConfig = Record<string, { label: string; color: string }>;

/**
 * shadcn-style ChartContainer (dataviz.md wiring): injects each series color
 * as --color-<key> so marks use fill="var(--color-signups)" and the token
 * flip at .dark needs no chart code.
 */
export function ChartContainer({
  config,
  className,
  style,
  children,
}: {
  config: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactElement;
}) {
  const colorVars = Object.fromEntries(
    Object.entries(config).map(([key, v]) => [`--color-${key}`, v.color]),
  ) as React.CSSProperties;
  return (
    <div className={cn('h-64 w-full', className)} style={{ ...colorVars, ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Tooltip = floating layer: 4px radius, shadow-float, Data mono values. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; name?: string | number; value?: number | string }>;
  label?: string | number;
  config: ChartConfig;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-float">
      {label != null && <p className="text-body font-medium">{label}</p>}
      {payload.map((entry, i) => {
        const key = String(entry.dataKey ?? entry.name ?? i);
        const series = config[key];
        return (
          <p key={key} className="flex items-center gap-1.5 font-mono text-data tabular">
            <span
              aria-hidden
              className="inline-block h-2 w-2"
              style={{ background: series?.color }}
            />
            <span className="text-muted-foreground">{series?.label ?? key}</span>
            <span>{entry.value}</span>
          </p>
        );
      })}
    </div>
  );
}
