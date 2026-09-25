import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BadgePercent, CalendarClock, CheckCircle2, ClipboardList, Download, FileDown, Receipt, Wallet } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { prodName, useClienteMap, useData, useProductoMap } from '@/lib/data'
import { MP_FEE, DAY, HOUR } from '@/data/mock'
import { ars, arsCompact, date, num, pct, time, weekday } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, Card, CardHeader, Input, Kpi, PageHeader, ProductAvatar, Tabs } from '@/components/ui'
import { DEV, DevNotice, PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'
import { ChartTooltip, useChartColors } from '@/components/charts'

type Periodo = 'hoy' | 'semana' | 'mes' | 'rango'

export default function Reportes() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const C = useChartColors()
  const pedidos = useData((s) => s.pedidos)
  const historial = useData((s) => s.historial)
  const pm = useProductoMap()
  const cm = useClienteMap()
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [desde, setDesde] = useState(() => new Date(Date.now() - 13 * DAY).toISOString().slice(0, 10))
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10))

  const validos = pedidos.filter((p) => p.estado !== 'cancelado')
  const hoyVentas = validos.reduce((s, p) => s + p.total, 0)
  const hoyRow = useMemo(() => {
    const mp = validos.filter((p) => p.medioPago === 'mercadopago').reduce((s, p) => s + p.total, 0)
    const ef = validos.filter((p) => p.medioPago === 'efectivo').reduce((s, p) => s + p.total, 0)
    return { fecha: Date.now(), ventas: hoyVentas, pedidos: validos.length, mercadopago: mp, efectivo: ef, transferencia: hoyVentas - mp - ef, whatsapp: 0, mensajesIA: 0 }
  }, [validos, hoyVentas])

  const serie = useMemo(() => {
    if (periodo === 'hoy') {
      const start = new Date()
      start.setHours(8, 0, 0, 0)
      return Array.from({ length: 12 }, (_, i) => {
        const h0 = +start + i * HOUR
        const ps = validos.filter((p) => p.creadoEl >= h0 && p.creadoEl < h0 + HOUR)
        return { label: time(h0, lang), ventas: ps.reduce((s, p) => s + p.total, 0), pedidos: ps.length }
      })
    }
    const n = periodo === 'semana' ? 6 : periodo === 'mes' ? 29 : Math.min(29, Math.max(1, Math.round((+new Date(hasta) - +new Date(desde)) / DAY)))
    const rows = [...historial.slice(-n), hoyRow]
    return rows.map((d) => ({
      label: periodo === 'semana' ? weekday(d.fecha, lang) : date(d.fecha, lang, { day: 'numeric', month: 'numeric' }),
      ventas: d.ventas,
      pedidos: d.pedidos,
      mp: d.mercadopago,
      ef: d.efectivo,
      tr: d.transferencia,
    }))
  }, [periodo, historial, hoyRow, validos, lang, desde, hasta])

  const totVentas = serie.reduce((s, d) => s + d.ventas, 0)
  const totPedidos = serie.reduce((s, d) => s + d.pedidos, 0)
  const factor = hoyVentas ? totVentas / hoyVentas : 1
  const mpShare = periodo === 'hoy' ? hoyRow.mercadopago / (hoyVentas || 1) : 0.71
  const comisiones = Math.round(totVentas * mpShare * MP_FEE)

  const medios = [
    { name: 'Mercado Pago', value: Math.round(totVentas * mpShare), color: C.info },
    { name: L('Efectivo', 'Cash'), value: Math.round(totVentas * (periodo === 'hoy' ? hoyRow.efectivo / (hoyVentas || 1) : 0.2)), color: C.primary },
    { name: L('Transferencia', 'Transfer'), value: 0, color: C.secondary },
  ]
  medios[2].value = Math.max(0, totVentas - medios[0].value - medios[1].value)

  const topProductos = useMemo(() => {
    const m = new Map<string, number>()
    validos.forEach((p) => p.items.forEach((it) => m.set(it.productoId, (m.get(it.productoId) ?? 0) + it.cantidad * it.precio)))
    return [...m.entries()]
      .map(([id, v]) => ({ id, v: Math.round(v * factor) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 10)
  }, [validos, factor])
  const topClientes = useMemo(() => {
    const m = new Map<string, number>()
    validos.forEach((p) => m.set(p.clienteId, (m.get(p.clienteId) ?? 0) + p.total))
    return [...m.entries()]
      .map(([id, v]) => ({ id, v: Math.round(v * factor) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6)
  }, [validos, factor])
  const maxTop = topProductos[0]?.v ?? 1

  return (
    <div>
      <PreviewBanner
        id="reportes"
        bullets={[
          ['Reporte del día generado automáticamente a las 23:59.', "Daily report generated automatically at 11:59 PM."],
          ['Ventas por producto, cliente y medio de pago, con comisiones y neto.', 'Sales by product, customer and payment method, with fees and net.'],
          ['Gráficos de evolución y exportación a PDF para el contador.', 'Trend charts and PDF export for your accountant.'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Reportes de facturación', 'Billing reports')}
        subtitle={L('Diario, semanal y mensual, armado solo', 'Daily, weekly and monthly, built automatically')}
        actions={
          <Button variant="secondary" onClick={() => toast.success(L('Reporte exportado a PDF (simulado)', 'Report exported to PDF (simulated)'))}>
            <FileDown size={15} /> {L('Exportar PDF', 'Export PDF')}
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs<Periodo>
          value={periodo}
          onChange={setPeriodo}
          className="w-fit"
          items={[
            { value: 'hoy', label: L('Hoy', 'Today') },
            { value: 'semana', label: L('Semana', 'Week') },
            { value: 'mes', label: L('Mes', 'Month') },
            { value: 'rango', label: L('Rango', 'Range') },
          ]}
        />
        {periodo === 'rango' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-40" aria-label={L('Desde', 'From')} />
            <span className="text-muted">→</span>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-40" aria-label={L('Hasta', 'To')} />
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Ventas', 'Sales')} value={arsCompact(totVentas, lang)} icon={Wallet} delta={periodo === 'mes' ? 14 : 9} />
        <Kpi label={L('Pedidos', 'Orders')} value={num(totPedidos, lang)} icon={ClipboardList} delta={6} accent="blue" />
        <Kpi label={L('Ticket promedio', 'Average ticket')} value={ars(totPedidos ? totVentas / totPedidos : 0, lang)} icon={Receipt} accent="orange" />
        <Kpi label={L('Neto después de comisiones', 'Net after fees')} value={arsCompact(totVentas - comisiones, lang)} icon={BadgePercent} accent="amber" hint={`${L('comisiones', 'fees')} ${arsCompact(comisiones, lang)}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" data-trailer="sales-chart">
          <CardHeader title={L('Ventas por día', 'Sales per day')} subtitle={L('Barras: facturación · Línea: pedidos', 'Bars: revenue · Line: orders')} />
          <div className="h-[300px] px-2 pb-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
                <YAxis yAxisId="v" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => arsCompact(v, lang).replace('ARS ', '')} />
                <YAxis yAxisId="p" orientation="right" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  cursor={{ fill: C.primarySoft }}
                  content={<ChartTooltip format={(v, k) => (k === 'pedidos' ? num(v, lang) : ars(v, lang))} />}
                />
                <Bar yAxisId="v" dataKey="ventas" name={L('Ventas', 'Sales')} fill={C.primary} radius={[5, 5, 0, 0]} maxBarSize={34} />
                <Line yAxisId="p" dataKey="pedidos" name={L('Pedidos', 'Orders')} stroke={C.secondary} strokeWidth={2.2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title={L('Por medio de pago', 'By payment method')} />
          <div className="relative h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={medios} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none">
                  {medios.map((m) => (
                    <Cell key={m.name} fill={m.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip format={(v) => ars(v, lang)} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="num text-[15px] font-semibold">{arsCompact(totVentas, lang)}</p>
                <p className="text-[11px] text-muted">{L('total', 'total')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {medios.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[13px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                <span className="flex-1">{m.name}</span>
                <span className="num text-muted">{pct((m.value / (totVentas || 1)) * 100, lang)}</span>
                <span className="num w-24 text-right font-medium">{arsCompact(m.value, lang)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title={L('Top 10 productos', 'Top 10 products')} subtitle={L('Por facturación en el período', 'By revenue in the period')} />
          <div className="grid gap-x-8 gap-y-2.5 px-5 pb-5 pt-4 md:grid-cols-2">
            {topProductos.map((t, i) => {
              const p = pm[t.id]
              return (
                <div key={t.id} className="flex items-center gap-2.5">
                  <span className="num w-4 text-[12px] text-muted">{i + 1}</span>
                  {p && <ProductAvatar icon={p.icon} size={26} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="truncate">{prodName(p, lang)}</span>
                      <span className="num font-medium">{arsCompact(t.v, lang)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(t.v / maxTop) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title={L('Por cliente', 'By customer')} />
            <div className="space-y-2 px-5 pb-5 pt-3">
              {topClientes.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-[13px]">
                  <span className="truncate">{cm[t.id]?.nombre}</span>
                  <span className="num font-medium">{arsCompact(t.v, lang)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-primary/30 bg-primary-soft/40 p-5">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-primary">
              <CheckCircle2 size={17} /> {L('Reporte diario automático · generado 23:59 ✓', 'Automatic daily report · generated 11:59 PM ✓')}
            </p>
            <div className="mt-3 space-y-1.5">
              {historial
                .slice(-3)
                .reverse()
                .map((d) => (
                  <div key={d.fecha} className="flex items-center gap-2 text-[13px]">
                    <CalendarClock size={14} className="text-muted" />
                    <span className="flex-1">{date(d.fecha, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="num text-muted">{arsCompact(d.ventas, lang)}</span>
                    <button
                      aria-label={L('Descargar PDF', 'Download PDF')}
                      className={cn('rounded-md p-1 text-primary hover:bg-primary-soft')}
                      onClick={() => toast.success(L('Reporte diario descargado (simulado)', 'Daily report downloaded (simulated)'))}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-5">
        <DevNotice {...DEV.pdf} />
      </div>
    </div>
  )
}
