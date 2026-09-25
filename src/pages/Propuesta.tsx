import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, CreditCard, Eye, EyeOff, LayoutDashboard, MessageCircle, Printer, RefreshCw, Rocket, ShieldCheck, Sparkles, Store, UserRound, Bot, BarChart3, Package, Wallet, Receipt, Lock, Printer as PrinterIcon } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useAbrirPreview } from '@/lib/nav'
import { usd } from '@/lib/format'
import { cn, openWhatsApp } from '@/lib/utils'
import type { Role } from '@/lib/roles'
import { Badge, Button, Card } from '@/components/ui'

type Bi = [string, string]

interface Modulo {
  n: number
  titulo: Bi
  desc: Bi
  bullets: Bi[]
  view: string
  role: Role | null
  icon: typeof Bot
}

const CIRCUITO: { t: Bi; d: Bi; icon: typeof Bot; star?: boolean }[] = [
  { t: ['El vecino escribe', 'The neighbor writes'], d: ['Pide por WhatsApp como le sale: "2 de tomate y una lechuga".', 'Orders on WhatsApp however they like: "2 tomatoes and a lettuce".'], icon: UserRound },
  { t: ['La IA arma el pedido', 'The AI builds the order'], d: ['Entiende productos coloquiales y valida stock en tiempo real.', 'Understands colloquial products and checks stock in real time.'], icon: Sparkles, star: true },
  { t: ['Cobra solo', 'It collects payment'], d: ['Manda el link de Mercado Pago y confirma el pago.', 'Sends the Mercado Pago link and confirms the payment.'], icon: CreditCard },
  { t: ['La verdulería lo ve', 'The shop sees it'], d: ['Entra en su app, imprime el ticket y prepara la entrega.', 'It lands in their app, they print the receipt and prepare the delivery.'], icon: Printer },
  { t: ['Stock y caja al día', 'Stock & cash up to date'], d: ['Se descuenta el stock y el pedido entra al reporte del día.', "Stock is deducted and the order goes into the day's report."], icon: RefreshCw },
  { t: ['El dueño lo ve todo', 'The owner sees everything'], d: ['Desde su panel sigue ventas, estadísticas y stock de su verdulería.', "From their panel they follow the sales, stats and stock of their shop."], icon: LayoutDashboard },
]

const MODULOS: Modulo[] = [
  {
    n: 1,
    titulo: ['IA en WhatsApp', 'AI on WhatsApp'],
    desc: ['Tus vecinos piden por WhatsApp y el bot arma, cobra y confirma el pedido solo.', 'Neighbors order on WhatsApp and the bot builds, charges and confirms the order on its own.'],
    bullets: [
      ['Entiende productos por nombre, código o forma coloquial', 'Understands products by name, code or colloquial phrasing'],
      ['Valida stock antes de confirmar cantidades', 'Checks stock before confirming quantities'],
      ['Manda link de Mercado Pago y confirma el pago', 'Sends the Mercado Pago link and confirms the payment'],
      ['Maneja cambios y cancelaciones', 'Handles changes and cancellations'],
    ],
    view: '/whatsapp',
    role: null,
    icon: Bot,
  },
  {
    n: 2,
    titulo: ['Admin panel Android', 'Android admin panel'],
    desc: ['El panel del dueño: los números, estadísticas y stock de su verdulería, desde el celular.', "The owner's panel: their shop's numbers, stats and stock, from the phone."],
    bullets: [
      ['Ventas, pedidos y clientes en tiempo real', 'Sales, orders and customers in real time'],
      ['Estadísticas y reportes del negocio', 'Business statistics and reports'],
      ['Stock y precios con alertas', 'Stock and prices with alerts'],
      ['Usuarios y permisos del equipo', 'Team users and permissions'],
    ],
    view: '/panel',
    role: 'admin',
    icon: LayoutDashboard,
  },
  {
    n: 3,
    titulo: ['App verdulería Android', 'Android shop app'],
    desc: ['La app del mostrador para atender el día a día: pedidos, entregas y tickets.', 'The counter app for the day-to-day: orders, deliveries and receipts.'],
    bullets: [
      ['Pedidos del día por estado (pendiente, confirmado, entregado)', "Today's orders by status (pending, confirmed, delivered)"],
      ['Entregas por franja horaria y repartidor', 'Deliveries by time window and courier'],
      ['Clientes frecuentes con historial', 'Frequent customers with history'],
      ['Sesión segura y persistente', 'Secure, persistent session'],
    ],
    view: '/pedidos',
    role: 'verduleria',
    icon: Store,
  },
  {
    n: 4,
    titulo: ['Stock y precios', 'Stock & prices'],
    desc: ['Lo que vende el bot es lo que hay en el depósito. Siempre.', 'What the bot sells is what you have in the storeroom. Always.'],
    bullets: [
      ['Catálogo con código, unidad, precio y stock', 'Catalog with code, unit, price and stock'],
      ['Ajustes por compra, venta, merma o corrección', 'Adjustments by purchase, sale, shrinkage or correction'],
      ['Alertas de stock bajo', 'Low-stock alerts'],
      ['Historial de movimientos por usuario y fecha', 'Movement history by user and date'],
    ],
    view: '/stock',
    role: 'verduleria',
    icon: Package,
  },
  {
    n: 5,
    titulo: ['Mercado Pago', 'Mercado Pago'],
    desc: ['Cobrás sin efectivo y sin tocar datos de tarjeta.', 'Get paid without cash and without handling card data.'],
    bullets: [
      ['Link de pago único por pedido', 'Unique payment link per order'],
      ['Confirmación automática del estado del pago', 'Automatic payment status confirmation'],
      ['Comisión y neto calculados solos', 'Fee and net calculated automatically'],
      ['Reintentos de pagos rechazados', 'Retries for rejected payments'],
    ],
    view: '/cobros',
    role: 'admin',
    icon: Wallet,
  },
  {
    n: 6,
    titulo: ['Ticketera local/nube', 'Local/cloud receipts'],
    desc: ['Ticket en impresora térmica o en PDF, como tenga cada local.', 'Receipt on a thermal printer or as a PDF, whatever each shop has.'],
    bullets: [
      ['Impresión térmica 80mm desde Android', '80mm thermal printing from Android'],
      ['PDF con código de barras y detalle', 'PDF with barcode and details'],
      ['Numeración secuencial auditada', 'Audited sequential numbering'],
      ['Varias impresoras por verdulería', 'Several printers per shop'],
    ],
    view: '/tickets',
    role: 'verduleria',
    icon: Receipt,
  },
  {
    n: 7,
    titulo: ['Reportes de facturación', 'Billing reports'],
    desc: ['Diario, semanal y mensual, armado solo.', 'Daily, weekly and monthly, built automatically.'],
    bullets: [
      ['Reporte del día generado automáticamente a las 23:59', 'Daily report generated automatically at 11:59 PM'],
      ['Ventas por producto, cliente y medio de pago', 'Sales by product, customer and payment method'],
      ['Gráficos de evolución', 'Trend charts'],
      ['Exportación a PDF', 'PDF export'],
    ],
    view: '/reportes',
    role: 'admin',
    icon: BarChart3,
  },
  {
    n: 8,
    titulo: ['Multi-tenancy', 'Multi-tenancy'],
    desc: ['Cada verdulería del país con sus datos, aislada de las demás.', 'Every shop in the country with its own data, isolated from the rest.'],
    bullets: [
      ['Aislamiento total de datos por verdulería', 'Full data isolation per shop'],
      ['Acceso por credenciales propias de cada local', 'Access with each shop’s own credentials'],
      ['Backups y restauración por verdulería', 'Backups and restore per shop'],
      ['Consumo por local para facturar licencias', 'Per-shop usage to bill licenses'],
    ],
    view: '/cuenta',
    role: 'admin',
    icon: Lock,
  },
]

function Inversion() {
  const L = useL()
  const lang = useApp((s) => s.lang)
  const [open, setOpen] = useState(false)
  return (
    <section className="print-break mt-12">
      <h2 className="text-[20px] font-bold tracking-tight">{L('Inversión', 'Investment')}</h2>
      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="kicker text-muted">{L('Total del desarrollo', 'Total development')}</p>
            {open ? (
              <p className="mt-1 text-[15px] font-medium text-muted">{L('8 módulos + onboarding · pago único', '8 modules + onboarding · one-time payment')}</p>
            ) : (
              <p className="num mt-1 text-[34px] font-bold tracking-tight sm:text-[40px]">USD ••••••</p>
            )}
          </div>
          <Button size="lg" variant={open ? 'secondary' : 'primary'} className="w-full sm:w-auto" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-tour-skip>
            {open ? <EyeOff size={18} /> : <Eye size={18} />}
            {open ? L('Ocultar inversión', 'Hide investment') : L('Ver inversión', 'View investment')}
          </Button>
        </div>
        <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} style={{ overflow: 'hidden' }}>
          {open && (
            <div className="border-t border-line p-5 sm:p-6">
              <p className="num text-[44px] font-bold leading-none tracking-tight text-primary sm:text-[56px]">{usd(6500, lang)}</p>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
                {L(
                  'Plataforma completa: 8 módulos + onboarding · 1 mes de soporte · garantía de devolución del 100% si el primer prototipo no cumple lo acordado.',
                  'Full platform: 8 modules + onboarding · 1 month of support · 100% money-back guarantee if the first prototype does not meet what was agreed.',
                )}
              </p>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px]">
                <span>{L('Desarrollo completo de la plataforma', 'Full platform development')}</span>
                <span className="num font-semibold">{usd(6500, lang)}</span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-muted">{L('Pago único; sin mensualidad.', 'One-time payment; no monthly fee.')}</p>
              <p className="kicker mb-2 mt-5 text-muted">{L('Condiciones de pago', 'Payment terms')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface2 p-4">
                  <p className="text-[13px] text-muted">{L('50% al firmar', '50% on signing')}</p>
                  <p className="num mt-1 text-[22px] font-semibold">{usd(3250, lang)}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface2 p-4">
                  <p className="text-[13px] text-muted">{L('50% a los 30 días', '50% after 30 days')}</p>
                  <p className="num mt-1 text-[22px] font-semibold">{usd(3250, lang)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border-2 border-primary/40 bg-primary-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14.5px] font-semibold">{L('Pagando el 100% por adelantado: 15% de descuento', 'Paying 100% upfront: 15% discount')}</p>
                <p className="flex items-baseline gap-3">
                  <span className="num text-[15px] text-muted line-through">{usd(6500, lang)}</span>
                  <span className="num text-[26px] font-bold text-primary">{usd(5525, lang)}</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </Card>
    </section>
  )
}

export default function Propuesta() {
  const L = useL()
  const abrirPreview = useAbrirPreview()
  const destacado = useApp((s) => s.moduloDestacado)
  const limpiar = useApp((s) => s.limpiarDestacado)
  const refs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (destacado == null) return
    const el = refs.current[destacado]
    const t0 = setTimeout(() => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120)
    const t1 = setTimeout(limpiar, 4200)
    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
    }
  }, [destacado, limpiar])

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* 7.1 Encabezado */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <Badge tone="green" className="kicker px-2.5 py-1">
            {L('PROPUESTA COMERCIAL · EMILIANO', 'COMMERCIAL PROPOSAL · EMILIANO')}
          </Badge>
          <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[38px]">{L('Propuesta para Emiliano', 'Proposal for Emiliano')}</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
            {L(
              'Tu SaaS de verdulerías para todo el país: bot de WhatsApp con IA, apps Android para el dueño y para el mostrador, cobros, tickets y reportes. Entrega en 2 meses y medio, con 1 mes de soporte incluido.',
              'Your produce-shop SaaS for the whole country: AI WhatsApp bot, Android apps for the owner and the counter, payments, receipts and reports. Delivered in two and a half months, with 1 month of support included.',
            )}
          </p>
        </div>
        <div className="no-print flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <PrinterIcon size={15} /> {L('Imprimir', 'Print')}
          </Button>
          <Button onClick={openWhatsApp}>
            <MessageCircle size={15} /> {L('Avanzar por WhatsApp', 'Move forward on WhatsApp')}
          </Button>
        </div>
      </div>

      {/* 7.2 Circuito */}
      <section className="mt-10" data-trailer="circuito">
        <h2 className="text-[20px] font-bold tracking-tight">{L('El circuito', 'The loop')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {CIRCUITO.map((c, i) => (
            <Card key={i} className={cn('print-break relative p-4', c.star && 'border-secondary/50 bg-secondary-soft/60')}>
              <div className="flex items-center justify-between">
                <span className={cn('kicker', c.star ? 'text-secondary' : 'text-muted')}>
                  {L('PASO', 'STEP')} {i + 1}
                </span>
                {c.star ? <Sparkles size={15} className="text-secondary" /> : <c.icon size={15} className="text-primary" />}
              </div>
              <p className="mt-2 text-[14.5px] font-semibold leading-snug">{L(c.t[0], c.t[1])}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{L(c.d[0], c.d[1])}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">
          {L('Y vuelve a empezar: cada pedido deja el stock al día y el reporte más completo.', 'And it starts again: every order leaves stock up to date and the report more complete.')}
        </p>
      </section>

      {/* 7.3 Qué incluye */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-[20px] font-bold tracking-tight">{L('Qué incluye la plataforma', 'What the platform includes')}</h2>
          <span className="num shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary">{L('8 módulos + onboarding', '8 modules + onboarding')}</span>
        </div>
        <Card className="print-break mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Rocket size={20} />
          </span>
          <div>
            <p className="kicker text-primary">{L('ARRANQUE · Onboarding + relevamiento', 'KICKOFF · Onboarding + discovery')}</p>
            <p className="mt-1 text-[14px] text-muted">
              {L('Mapeamos tu flujo, migramos datos y definimos la arquitectura.', 'We map your flow, migrate data and define the architecture.')}
            </p>
          </div>
        </Card>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => {
            const hl = destacado === m.n
            return (
              <div
                key={m.n}
                ref={(el) => {
                  refs.current[m.n] = el
                }}
                data-modulo={m.n}
                className={cn(
                  'print-break flex flex-col rounded-card border bg-surface p-5 shadow-card transition-all duration-500',
                  hl ? '-translate-y-1 border-secondary shadow-pop ring-4 ring-secondary/25' : 'border-line',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="num text-[12px] font-bold text-muted">{String(m.n).padStart(2, '0')}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                    <m.icon size={16} />
                  </span>
                </div>
                <h3 className="mt-3 text-[13.5px] font-semibold uppercase tracking-wide">{L(m.titulo[0], m.titulo[1])}</h3>
                <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{L(m.desc[0], m.desc[1])}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {m.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-snug">
                      <Check size={15} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.4} />
                      {L(b[0], b[1])}
                    </li>
                  ))}
                </ul>
                <button
                  data-trailer={`ver-demo-${m.n}`}
                  onClick={() => abrirPreview(m.n, m.view, m.role, { es: m.titulo[0], en: m.titulo[1] })}
                  className="no-print mt-4 inline-flex w-fit items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline"
                >
                  {L('Ver en el demo', 'See it in the demo')} <ArrowUpRight size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Plazo y garantía */}
      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          [Rocket, L('2 meses y medio', 'Two and a half months'), L('de desarrollo hasta la entrega', 'of development until delivery')],
          [ShieldCheck, L('1 mes de soporte', '1 month of support'), L('incluido después de entregar', 'included after delivery')],
          [RefreshCw, L('Garantía 100%', '100% guarantee'), L('te devolvemos todo si el primer prototipo no cumple', 'full refund if the first prototype falls short')],
        ].map(([I, t, d], i) => {
          const Icon = I as typeof Rocket
          return (
            <Card key={i} className="print-break flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-[14.5px] font-semibold">{t as string}</p>
                <p className="text-[12.5px] text-muted">{d as string}</p>
              </div>
            </Card>
          )
        })}
      </section>

      {/* 7.4 Inversión (siempre al final) */}
      <Inversion />

      {/* 7.5 Cierre */}
      <section className="no-print mt-10">
        <Button size="lg" className="h-14 w-full text-[16px]" onClick={openWhatsApp}>
          <MessageCircle size={19} /> {L('Avanzar por WhatsApp', 'Move forward on WhatsApp')}
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted">Powered by Insights</p>
      </section>
    </div>
  )
}
