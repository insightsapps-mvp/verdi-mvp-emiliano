import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowRight, Bot, CalendarRange, ClipboardList, CreditCard, Package, PrinterIcon, Users, Wallet, Wifi } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { kpisHoy, prodName, stockLevel, useData } from '@/lib/data'
import { useGo } from '@/lib/nav'
import { ars, arsCompact, date, num, qty } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, CardHeader, Kpi, PageHeader, ProductAvatar } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'
import { ChartTooltip, useChartColors } from '@/components/charts'

export default function Panel() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const go = useGo()
  const { kicker, tone } = useKicker()
  const C = useChartColors()
  const pedidos = useData((s) => s.pedidos)
  const historial = useData((s) => s.historial)
  const productos = useData((s) => s.productos)
  const clientes = useData((s) => s.clientes)
  const txs = useData((s) => s.transacciones)
  const impresoras = useData((s) => s.impresoras)
  const convs = useData((s) => s.conversaciones)
  const k = kpisHoy(pedidos)
  const mes = historial.reduce((s, d) => s + d.ventas, 0) + k.facturado
  const pedidosMes = historial.reduce((s, d) => s + d.pedidos, 0) + k.pedidos
  const stockValor = productos.reduce((s, p) => s + p.stock * p.precio, 0)
  const bajos = productos.filter((p) => stockLevel(p) !== 'ok')
  const rechazados = txs.filter((t) => t.estado === 'rechazado').length
  const revisar = pedidos.find((p) => p.revisar)
  const sinPapel = impresoras.find((i) => i.estado === 'sin_papel')
  const iaPct = Math.round((convs.filter((c) => c.resueltaPorIA).length / convs.length) * 100)

  const serie = useMemo(
    () => [...historial.map((d) => ({ fecha: d.fecha, ventas: d.ventas })), { fecha: Date.now(), ventas: k.facturado }].map((d) => ({ ...d, label: date(d.fecha, lang, { day: 'numeric', month: 'short' }) })),
    [historial, k.facturado, lang],
  )

  const topHoy = useMemo(() => {
    const m = new Map<string, number>()
    pedidos.filter((p) => p.estado !== 'cancelado').forEach((p) => p.items.forEach((it) => m.set(it.productoId, (m.get(it.productoId) ?? 0) + it.cantidad * it.precio)))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [pedidos])

  const alerts = [
    ...bajos.slice(0, 3).map((p) => ({
      tone: 'red' as const,
      icon: Package,
      es: `Stock bajo: ${p.nombre} (quedan ${qty(p.stock, p.unidad, 'es')})`,
      en: `Low stock: ${p.nombreEn} (${qty(p.stock, p.unidad, 'en')} left)`,
      to: '/stock',
    })),
    ...(revisar ? [{ tone: 'amber' as const, icon: CreditCard, es: `Pedido #${revisar.codigo} con pago pendiente hace 25 min`, en: `Order #${revisar.codigo} with payment pending for 25 min`, to: '/pedidos' }] : []),
    ...(rechazados ? [{ tone: 'red' as const, icon: CreditCard, es: `${rechazados} pagos rechazados hoy en Mercado Pago`, en: `${rechazados} payments rejected today on Mercado Pago`, to: '/cobros' }] : []),
    ...(sinPapel ? [{ tone: 'amber' as const, icon: PrinterIcon, es: 'Térmica depósito sin papel', en: 'Storeroom thermal out of paper', to: '/tickets' }] : []),
  ]

  return (
    <div>
      <PreviewBanner
        id="panel"
        bullets={[
          ['Los números de tu verdulería en tiempo real: ventas, pedidos y clientes.', "Your shop's numbers in real time: sales, orders and customers."],
          ['Alertas de stock, pagos e impresoras antes de que sean un problema.', 'Stock, payment and printer alerts before they become a problem.'],
          ['Solo ves lo tuyo: los datos de cada verdulería están aislados.', 'You only see your own: each shop’s data is isolated.'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Hola Tito 👋', 'Hi Tito 👋')}
        subtitle={L('Así viene tu verdulería hoy', "Here's how your shop is doing today")}
        actions={
          <Button variant="secondary" onClick={() => go('/reportes')}>
            <CalendarRange size={15} /> {L('Ver reportes', 'View reports')}
          </Button>
        }
      />
      <div data-trailer="admin-kpis" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={L('Ventas hoy', 'Sales today')} value={ars(k.facturado, lang)} delta={9} icon={Wallet} />
        <Kpi label={L('Pedidos hoy', 'Orders today')} value={k.pedidos} delta={12} icon={ClipboardList} accent="blue" hint={`${k.pctWhatsapp}% WhatsApp`} />
        <Kpi label={L('Ventas del mes', 'Monthly sales')} value={arsCompact(mes, lang)} delta={14} icon={CalendarRange} accent="orange" hint={`${num(pedidosMes, lang)} ${L('pedidos', 'orders')}`} />
        <Kpi label={L('Clientes activos', 'Active customers')} value={clientes.length} delta={8} icon={Users} accent="blue" />
        <Kpi label={L('Valor del stock', 'Stock value')} value={arsCompact(stockValor, lang)} icon={Package} accent="amber" hint={`${bajos.length} ${L('en alerta', 'on alert')}`} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={L('Ventas de los últimos 30 días', 'Sales in the last 30 days')} subtitle={L('Incluye WhatsApp y mostrador', 'Includes WhatsApp and counter')} />
          <div className="h-[280px] px-2 pb-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => arsCompact(v, lang).replace('ARS ', '')} />
                <Tooltip content={<ChartTooltip format={(v) => ars(v, lang)} />} />
                <Area dataKey="ventas" name={L('Ventas', 'Sales')} stroke={C.primary} strokeWidth={2.2} fill="url(#gv)" type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title={L('Alertas', 'Alerts')} action={<Badge tone="red">{alerts.length}</Badge>} />
          <div className="space-y-2 p-4">
            {alerts.map((a, i) => (
              <button key={i} onClick={() => go(a.to)} className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] transition hover:brightness-95', a.tone === 'red' ? 'border-danger/20 bg-danger-soft/50' : 'border-warning/30 bg-warning-soft/60')}>
                <a.icon size={16} className={a.tone === 'red' ? 'text-danger' : 'text-warning'} />
                <span className="flex-1">{L(a.es, a.en)}</span>
                <ArrowRight size={14} className="text-muted" />
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={L('Lo más vendido hoy', 'Best sellers today')} />
          <div className="space-y-2.5 p-5 pt-3">
            {topHoy.map(([id, v]) => {
              const p = productos.find((x) => x.id === id)
              return (
                <div key={id} className="flex items-center gap-2.5 text-[13px]">
                  {p && <ProductAvatar icon={p.icon} size={26} />}
                  <span className="flex-1">{prodName(p, lang)}</span>
                  <span className="num font-medium">{ars(v, lang)}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">{L('Bot de WhatsApp', 'WhatsApp bot')}</h3>
            <Badge tone="green" dot>
              <Wifi size={11} /> {L('En línea', 'Online')}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface2 p-3">
              <p className="num text-[22px] font-semibold">{num(historial[historial.length - 1].mensajesIA + 38, lang)}</p>
              <p className="text-[12px] text-muted">{L('mensajes hoy', 'messages today')}</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3">
              <p className="num text-[22px] font-semibold">{iaPct}%</p>
              <p className="text-[12px] text-muted">{L('resueltos por IA', 'solved by AI')}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Bot size={14} /> {L('Se reconectó solo a las 14:10 tras un corte de 3 min.', 'It reconnected on its own at 2:10 PM after a 3-min outage.')}
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => go('/conversaciones')}>
            {L('Ver conversaciones', 'View conversations')} <ArrowRight size={15} />
          </Button>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-semibold">{L('Cobros de hoy', "Today's payments")}</h3>
          <div className="mt-4 space-y-2.5 text-[13px]">
            {(
              [
                ['Mercado Pago', pedidos.filter((p) => p.medioPago === 'mercadopago' && p.estadoPago === 'aprobado').reduce((s, p) => s + p.total, 0), C.info],
                [L('Efectivo', 'Cash'), pedidos.filter((p) => p.medioPago === 'efectivo').reduce((s, p) => s + p.total, 0), C.primary],
                [L('Transferencia', 'Transfer'), pedidos.filter((p) => p.medioPago === 'transferencia').reduce((s, p) => s + p.total, 0), C.secondary],
              ] as [string, number, string][]
            ).map(([n, v, c]) => (
              <div key={n}>
                <div className="flex justify-between">
                  <span>{n}</span>
                  <span className="num font-medium">{ars(v, lang)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/60">
                  <div className="h-full rounded-full" style={{ width: `${(v / (k.facturado || 1)) * 100}%`, background: c }} />
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => go('/cobros')}>
            {L('Ver cobros', 'View payments')} <ArrowRight size={15} />
          </Button>
        </Card>
      </div>
      <p className="mt-5 flex items-center gap-1.5 text-[12px] text-muted">
        <AlertTriangle size={13} /> {L('Datos de ejemplo de una verdulería de barrio. En producción se calculan en vivo.', 'Sample data from a neighborhood produce shop. In production they are calculated live.')}
      </p>
    </div>
  )
}
