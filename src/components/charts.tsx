import { useApp } from '@/lib/store'

/** Colores de gráficos resueltos por tema (Recharts usa atributos SVG, no CSS vars) */
export function useChartColors() {
  const dark = useApp((s) => s.theme) === 'dark'
  return {
    primary: dark ? '#22c55e' : '#16a34a',
    primarySoft: dark ? 'rgba(34,197,94,.18)' : 'rgba(22,163,74,.14)',
    secondary: dark ? '#fb923c' : '#f97316',
    info: dark ? '#60a5fa' : '#2563eb',
    warning: dark ? '#fbbf24' : '#f59e0b',
    muted: dark ? '#a1a1aa' : '#71717a',
    grid: dark ? 'rgba(255,255,255,.06)' : '#f1f1f3',
    text: dark ? '#f4f4f5' : '#09090b',
    surface: dark ? '#131316' : '#ffffff',
    border: dark ? '#27272a' : '#e4e4e7',
  }
}

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string | number
  format: (v: number, key?: string) => string
  labelFormat?: (l: string | number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-pop">
      <p className="mb-1 font-medium text-muted">{labelFormat ? labelFormat(label ?? '') : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="num ml-auto pl-3 font-semibold">{format(p.value ?? 0, p.dataKey)}</span>
        </p>
      ))}
    </div>
  )
}
