import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Bike, CheckCircle2, ChevronDown, ClipboardList, Clock, MapPin, MessageCircle, Printer, Receipt, Search, Send, Store, Wallet, ChefHat } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL, useT } from '@/lib/i18n'
import { kpisHoy, prodName, useClienteMap, useData, useProductoMap } from '@/lib/data'
import { ago, ars, date, qty, time } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EstadoPedido, Pedido } from '@/data/types'
import { Badge, Button, Card, EmptyState, Input, Kpi, PageHeader, ProductAvatar, Tabs } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { EstadoBadge, MedioLabel, PagoBadge, useKicker } from '@/components/page'
import { TicketModal } from '@/components/Ticket80'

type Tab = 'todos' | EstadoPedido

const NEXT: Partial<Record<EstadoPedido, { to: EstadoPedido; es: string; en: string; icon: typeof Send }>> = {
  pendiente: { to: 'confirmado', es: 'Confirmar', en: 'Confirm', icon: CheckCircle2 },
  confirmado: { to: 'preparacion', es: 'Preparar', en: 'Prepare', icon: ChefHat },
  preparacion: { to: 'en_camino', es: 'Despachar', en: 'Dispatch', icon: Bike },
  en_camino: { to: 'entregado', es: 'Marcar entregado', en: 'Mark delivered', icon: CheckCircle2 },
}

export function PedidoRow({ p, onPrint, highlighted }: { p: Pedido; onPrint: (id: string) => void; highlighted?: boolean }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const t = useT()
  const pm = useProductoMap()
  const cm = useClienteMap()
  const setEstado = useData((s) => s.setEstado)
  const [open, setOpen] = useState(false)
  const cli = cm[p.clienteId]
  const next = NEXT[p.estado]
  const resumen = p.items
    .slice(0, 3)
    .map((it) => `${qty(it.cantidad, pm[it.productoId]?.unidad ?? 'unidad', lang)} ${prodName(pm[it.productoId], lang).toLowerCase()}`)
    .join(' · ')

  const move = (to: EstadoPedido) => {
    setEstado(p.id, to)
    const msg: Record<string, [string, string]> = {
      confirmado: [`Pedido #${p.codigo} confirmado. La IA le avisó al cliente por WhatsApp.`, `Order #${p.codigo} confirmed. The AI notified the customer on WhatsApp.`],
      preparacion: [`#${p.codigo} pasó a preparación.`, `#${p.codigo} moved to preparing.`],
      en_camino: [`#${p.codigo} despachado. El cliente recibió "Tu pedido está en camino 🛵".`, `#${p.codigo} dispatched. The customer got "Your order is on the way 🛵".`],
      entregado: [`#${p.codigo} entregado ✓ Se movió a Entregados.`, `#${p.codigo} delivered ✓ Moved to Delivered.`],
    }
    const m = msg[to]
    if (m) toast.success(L(m[0], m[1]))
  }

  return (
    <Card
      id={`pedido-${p.id}`}
      data-trailer={p.nuevo ? 'new-order' : undefined}
      className={cn(
        'overflow-hidden transition-all duration-500',
        p.nuevo && 'border-secondary/60',
        highlighted && 'anim-new bg-secondary-soft/40 ring-2 ring-secondary/50',
        p.revisar && 'border-warning/50',
      )}
    >
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', p.origen === 'whatsapp' ? 'bg-primary-soft text-primary' : 'bg-surface2 text-muted')}>
            {p.origen === 'whatsapp' ? <MessageCircle size={18} strokeWidth={1.9} /> : <Store size={18} strokeWidth={1.9} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="num text-[13.5px] font-semibold">#{p.codigo}</span>
              {p.nuevo && <Badge tone="orange">{L('NUEVO', 'NEW')}</Badge>}
              {p.revisar && (
                <Badge tone="amber">
                  <AlertTriangle size={11} /> {L('Revisar', 'Review')}
                </Badge>
              )}
              <EstadoBadge estado={p.estado} />
              <span className="text-[12px] text-muted">· {time(p.creadoEl, lang)}</span>
            </span>
            <span className="mt-1 block truncate text-[14px] font-medium">
              {cli?.nombre} <span className="font-normal text-muted">· {cli?.barrio}</span>
            </span>
            <span className="mt-0.5 block truncate text-[12.5px] text-muted">
              {resumen}
              {p.items.length > 3 && ` +${p.items.length - 3}`}
            </span>
            {p.revisar && (
              <span className="mt-1 block text-[12px] font-medium text-amber-700 dark:text-warning">
                {L('Pago pendiente', 'Payment pending')} {ago(p.creadoEl, lang)} · {L('la IA ya le recordó al cliente', 'the AI already reminded the customer')}
              </span>
            )}
          </span>
        </button>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="text-left md:text-right">
            <div className="num text-[16px] font-semibold">{ars(p.total, lang)}</div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted md:justify-end">
              <Wallet size={12} /> <MedioLabel medio={p.medioPago} />
              <span>·</span>
              <Clock size={12} /> {p.entregaFranja} hs
            </div>
          </div>
          <button onClick={() => setOpen((v) => !v)} aria-label={L('Ver detalle', 'View details')} className="rounded-lg p-1.5 text-muted hover:bg-surface2 md:hidden">
            <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:w-auto">
          {p.revisar && (
            <Button size="sm" variant="secondary" onClick={() => toast.success(L('Link de pago reenviado por WhatsApp', 'Payment link resent via WhatsApp'))}>
              <Send size={14} /> {L('Reenviar link', 'Resend link')}
            </Button>
          )}
          {next && (
            <Button size="sm" variant={p.estado === 'pendiente' ? 'primary' : 'secondary'} onClick={() => move(next.to)}>
              <next.icon size={14} /> {L(next.es, next.en)}
            </Button>
          )}
          {p.estado !== 'entregado' && p.estado !== 'en_camino' && p.estado !== 'cancelado' && p.estado !== 'pendiente' && (
            <Button size="sm" variant="ghost" onClick={() => move('entregado')}>
              <CheckCircle2 size={14} /> {L('Entregado', 'Delivered')}
            </Button>
          )}
          {p.estado !== 'cancelado' && (
            <Button size="sm" variant="ghost" data-trailer={p.nuevo ? 'print-new' : undefined} onClick={() => onPrint(p.id)} aria-label={L('Imprimir ticket', 'Print receipt')}>
              <Printer size={14} /> <span className="hidden sm:inline">{L('Imprimir ticket', 'Print receipt')}</span>
            </Button>
          )}
          <button onClick={() => setOpen((v) => !v)} aria-label={L('Ver detalle', 'View details')} className="hidden rounded-lg p-1.5 text-muted hover:bg-surface2 md:block">
            <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      </div>
      {open && (
        <div className="anim-pop border-t border-line bg-surface2/60 px-4 py-3">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="space-y-2">
              {p.items.map((it) => {
                const pr = pm[it.productoId]
                return (
                  <div key={it.productoId} className="flex items-center gap-3 text-[13.5px]">
                    {pr && <ProductAvatar icon={pr.icon} size={28} />}
                    <span className="flex-1">{prodName(pr, lang)}</span>
                    <span className="num text-muted">
                      {qty(it.cantidad, pr?.unidad ?? 'unidad', lang)} × {ars(it.precio, lang)}
                    </span>
                    <span className="num w-24 text-right font-medium">{ars(it.cantidad * it.precio, lang)}</span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1.5 rounded-xl border border-line bg-surface p-3 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-muted">{L('Origen', 'Source')}</span>
                <span>{t(`or.${p.origen}` as 'or.whatsapp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{L('Pago', 'Payment')}</span>
                <PagoBadge estado={p.estadoPago} />
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">{L('Dirección', 'Address')}</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} /> {p.direccion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{L('Reparto', 'Courier')}</span>
                <span>{p.repartidor ?? L('Sin asignar', 'Unassigned')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{L('Teléfono', 'Phone')}</span>
                <span className="num">{cli?.telefono}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Pedidos() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const pedidos = useData((s) => s.pedidos)
  const highlight = useData((s) => s.highlightPedidoId)
  const setHighlight = useData((s) => s.setHighlight)
  const [tab, setTab] = useState<Tab>('todos')
  const [q, setQ] = useState('')
  const [printId, setPrintId] = useState<string | null>(null)
  const cm = useClienteMap()
  const k = kpisHoy(pedidos)
  const didScroll = useRef(false)
  const closePrint = useCallback(() => setPrintId(null), [])

  useEffect(() => {
    if (!highlight || didScroll.current) return
    didScroll.current = true
    setTab('todos')
    const id = setTimeout(() => document.getElementById(`pedido-${highlight}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)
    const clear = setTimeout(() => setHighlight(null), 9000)
    return () => {
      clearTimeout(id)
      clearTimeout(clear)
    }
  }, [highlight, setHighlight])

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: pedidos.length }
    pedidos.forEach((p) => (c[p.estado] = (c[p.estado] ?? 0) + 1))
    return c
  }, [pedidos])

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return pedidos
      .filter((p) => tab === 'todos' || p.estado === tab)
      .filter((p) => !qq || p.codigo.toLowerCase().includes(qq) || cm[p.clienteId]?.nombre.toLowerCase().includes(qq) || cm[p.clienteId]?.barrio.toLowerCase().includes(qq))
      .sort((a, b) => Number(!!b.nuevo) - Number(!!a.nuevo) || Number(!!b.revisar) - Number(!!a.revisar) || b.creadoEl - a.creadoEl)
  }, [pedidos, tab, q, cm])

  return (
    <div>
      <PreviewBanner
        id="pedidos"
        bullets={[
          ['Los pedidos que toma la IA por WhatsApp entran solos, ya cobrados.', 'Orders the AI takes on WhatsApp come in on their own, already paid.'],
          ['Cada pedido avanza por estados y el cliente recibe el aviso automático.', 'Each order moves through statuses and the customer is notified automatically.'],
          ['Ticket térmico o PDF con un toque, desde el celular del mostrador.', 'Thermal or PDF receipt in one tap, from the counter phone.'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Pedidos de hoy', "Today's orders")}
        subtitle={date(Date.now(), lang, { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={
          <Button variant="secondary" onClick={() => toast.success(L('Resumen del día enviado a la Térmica mostrador', 'Daily summary sent to the Counter thermal'))}>
            <Receipt size={15} /> {L('Imprimir resumen', 'Print summary')}
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Pedidos hoy', 'Orders today')} value={k.pedidos} delta={12} icon={ClipboardList} hint={L('vs. mismo día sem. pasada', 'vs. same day last week')} />
        <Kpi label={L('Facturado hoy', 'Billed today')} value={ars(k.facturado, lang)} delta={9} icon={Wallet} />
        <Kpi label={L('Ticket promedio', 'Average ticket')} value={ars(k.ticket, lang)} delta={-2} icon={Receipt} accent="blue" />
        <Kpi label={L('Por WhatsApp', 'Via WhatsApp')} value={`${k.pctWhatsapp}%`} icon={MessageCircle} accent="orange" hint={L('tomados por la IA', 'taken by the AI')} />
      </div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          className="md:flex-1"
          items={[
            { value: 'todos', label: L('Todos', 'All'), count: counts.todos },
            { value: 'pendiente', label: L('Pendientes', 'Pending'), count: counts.pendiente ?? 0 },
            { value: 'confirmado', label: L('Confirmados', 'Confirmed'), count: counts.confirmado ?? 0 },
            { value: 'preparacion', label: L('En preparación', 'Preparing'), count: counts.preparacion ?? 0 },
            { value: 'en_camino', label: L('En camino', 'On the way'), count: counts.en_camino ?? 0 },
            { value: 'entregado', label: L('Entregados', 'Delivered'), count: counts.entregado ?? 0 },
          ]}
        />
        <div className="relative md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Buscar pedido, cliente o barrio', 'Search order, customer or area')} className="pl-9" />
        </div>
      </div>
      <div className="space-y-2.5">
        {list.map((p) => (
          <PedidoRow key={p.id} p={p} onPrint={setPrintId} highlighted={p.id === highlight} />
        ))}
        {list.length === 0 && (
          <Card>
            <EmptyState title={L('No hay pedidos en este estado', 'No orders in this status')} body={L('Cuando la IA tome un pedido nuevo, aparece acá al instante.', 'When the AI takes a new order, it shows up here instantly.')} />
          </Card>
        )}
      </div>
      <TicketModal pedidoId={printId} onClose={closePrint} />
    </div>
  )
}
