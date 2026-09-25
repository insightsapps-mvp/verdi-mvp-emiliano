import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useData } from '@/lib/data'
import { useChat } from '@/lib/chat'
import { openWhatsApp } from '@/lib/utils'
import type { Role } from '@/lib/roles'
import { Logo } from './controls'

type Bi = [string, string]

export interface TrailerScene {
  view?: string
  role?: Role
  selector?: string
  click?: boolean
  position?: 'top' | 'bottom'
  chapter: Bi
  title: Bi
  body: Bi
  duration: number
  cta?: boolean
  /** Pasos extra dentro de la escena: mover el cursor (y opcionalmente clickear) a otro selector en el ms indicado */
  steps?: { at: number; selector: string; click?: boolean }[]
  setup?: () => void
}

const SCENES: TrailerScene[] = [
  {
    view: '/propuesta',
    role: 'admin',
    selector: '[data-trailer="circuito"]',
    chapter: ['01 · La propuesta', '01 · The proposal'],
    title: ['Todo lo que incluye tu plataforma', 'Everything your platform includes'],
    body: ['Un circuito completo: del WhatsApp del vecino al panel del dueño, sin tocar papel.', "A full loop: from the neighbor's WhatsApp to the owner's panel, no paper involved."],
    duration: 7000,
    setup: () => {
      useData.getState().resetDemo()
      useChat.getState().reset()
    },
  },
  {
    view: '/whatsapp',
    selector: '[data-trailer="chip-0"]',
    click: true,
    chapter: ['02 · WhatsApp', '02 · WhatsApp'],
    title: ['El vecino escribe como le sale', 'The neighbor writes however they like'],
    body: ['"Hola, quiero 2 kg de tomate y una lechuga." Sin apps, sin formularios.', '"Hi, I want 2 kg of tomatoes and a lettuce." No apps, no forms.'],
    duration: 7500,
  },
  {
    view: '/whatsapp',
    selector: '[data-trailer="confirm-order"]',
    steps: [{ at: 4600, selector: '[data-trailer="confirm-order"]', click: true }],
    chapter: ['03 · IA', '03 · AI'],
    title: ['La IA arma el pedido y valida stock', 'The AI builds the order and checks stock'],
    body: ['Entiende "una lechuga", calcula precios y confirma que haya en el depósito.', 'It understands "a lettuce", prices everything and confirms it is in stock.'],
    duration: 8000,
  },
  {
    view: '/whatsapp',
    selector: '[data-trailer="pay-btn"]',
    steps: [
      { at: 1600, selector: '[data-trailer="pay-btn"]', click: true },
      { at: 3600, selector: '[data-trailer="checkout-pay"]', click: true },
      { at: 7000, selector: '[data-trailer="paid"]' },
    ],
    chapter: ['04 · Cobro', '04 · Payment'],
    title: ['Link de Mercado Pago → pago aprobado ✓', 'Mercado Pago link → payment approved ✓'],
    body: ['La IA manda el link, el vecino paga y el pedido queda confirmado solo.', 'The AI sends the link, the neighbor pays and the order confirms itself.'],
    duration: 9500,
  },
  {
    view: '/pedidos',
    role: 'verduleria',
    selector: '[data-trailer="new-order"]',
    chapter: ['05 · Verdulería', '05 · Shop'],
    title: ['El pedido entra solo en la app del mostrador', 'The order lands in the counter app on its own'],
    body: ['Arriba de todo, resaltado en naranja y ya cobrado.', 'At the very top, highlighted in orange and already paid.'],
    duration: 7000,
  },
  {
    view: '/pedidos',
    selector: '[data-trailer="print-new"]',
    steps: [
      { at: 1800, selector: '[data-trailer="print-new"]', click: true },
      { at: 3000, selector: '[data-trailer="ticket-modal"]' },
    ],
    chapter: ['06 · Ticket', '06 · Receipt'],
    title: ['Un toque y sale el ticket de 80mm', 'One tap and the 80mm receipt prints'],
    body: ['Térmica del local o PDF en la nube, con numeración auditada.', "The shop's thermal printer or a cloud PDF, with audited numbering."],
    duration: 7000,
  },
  {
    view: '/stock',
    selector: '[data-trailer="row-tomate"]',
    steps: [{ at: 3800, selector: '[data-trailer="alert-palta"]' }],
    chapter: ['07 · Stock', '07 · Stock'],
    title: ['El stock se descuenta solo', 'Stock is deducted automatically'],
    body: ['El tomate bajó 2 kg con la venta. Y la palta está en alerta: quedan 3.', 'Tomatoes dropped 2 kg with the sale. And avocado is on alert: only 3 left.'],
    duration: 8000,
  },
  {
    view: '/reportes',
    role: 'admin',
    selector: '[data-trailer="sales-chart"]',
    chapter: ['08 · Reportes', '08 · Reports'],
    title: ['Las ventas de la semana, armadas solas', "The week's sales, built automatically"],
    body: ['Reporte diario a las 23:59, por producto, cliente y medio de pago.', 'Daily report at 11:59 PM, by product, customer and payment method.'],
    duration: 7000,
  },
  {
    view: '/panel',
    role: 'admin',
    selector: '[data-trailer="admin-kpis"]',
    chapter: ['09 · Admin', '09 · Admin'],
    title: ['El dueño ve todos sus números', 'The owner sees all their numbers'],
    body: ['Ventas del día y del mes, pedidos, clientes y valor del stock, en vivo.', 'Daily and monthly sales, orders, customers and stock value, live.'],
    duration: 7000,
  },
  {
    view: '/cuenta',
    role: 'admin',
    selector: '[data-trailer="cuenta-aislado"]',
    chapter: ['10 · Multi-verdulería', '10 · Multi-shop'],
    title: ['Cada verdulería del país, aislada', 'Every shop in the country, isolated'],
    body: ['Datos propios, credenciales propias y backups por local. Nadie ve lo de otro.', 'Own data, own credentials and per-shop backups. Nobody sees anyone else’s.'],
    duration: 7000,
  },
  {
    chapter: ['11 · ¿Arrancamos?', '11 · Shall we start?'],
    title: ['Tu plataforma, lista para vender licencias', 'Your platform, ready to sell licenses'],
    body: ['8 módulos + onboarding · 2 meses y medio · garantía de devolución del 100%.', '8 modules + onboarding · two and a half months · 100% money-back guarantee.'],
    duration: 7000,
    cta: true,
  },
]

type Rect = { x: number; y: number; w: number; h: number }

const waitFor = (sel: string, ms = 3000) =>
  new Promise<HTMLElement | null>((resolve) => {
    const t0 = Date.now()
    const tick = () => {
      const el = Array.from(document.querySelectorAll(sel)).find((e) => (e as HTMLElement).getBoundingClientRect().width > 0) as HTMLElement | undefined
      if (el) return resolve(el)
      if (Date.now() - t0 > ms) return resolve(null)
      setTimeout(tick, 120)
    }
    tick()
  })

export function Trailer() {
  const active = useApp((s) => s.trailerActive)
  const setTrailer = useApp((s) => s.setTrailer)
  const L = useL()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [cursor, setCursor] = useState({ x: -60, y: -60 })
  const [ripple, setRipple] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const target = useRef<HTMLElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const alive = useRef(0)

  const exit = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    alive.current++
    setTrailer(false)
    useApp.getState().logout()
    useData.getState().resetDemo()
    useChat.getState().reset()
    navigate('/login')
  }, [setTrailer, navigate])

  // Arranque
  useEffect(() => {
    if (!active) return
    const s = useApp.getState()
    if (s.device !== 'desktop') s.setDevice('desktop')
    s.login('admin')
    setIdx(0)
    setCursor({ x: window.innerWidth / 2, y: window.innerHeight + 40 })
  }, [active])

  // Seguimiento del target (el highlight acompaña scroll/animaciones)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const loop = () => {
      const el = target.current
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect()
        setRect((p) => (p && Math.abs(p.x - r.left + 6) < 0.5 && Math.abs(p.y - r.top + 6) < 0.5 && Math.abs(p.w - r.width - 12) < 0.5 && Math.abs(p.h - r.height - 12) < 0.5 ? p : { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 }))
      } else if (el && !el.isConnected) {
        target.current = null
        setRect(null)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])

  // Ejecución de cada escena
  useEffect(() => {
    if (!active) return
    const token = ++alive.current
    const scene = SCENES[idx]
    const T = (fn: () => void, ms: number) => timers.current.push(setTimeout(() => token === alive.current && fn(), ms))
    timers.current.forEach(clearTimeout)
    timers.current = []

    // cerrar modales abiertos de la escena anterior
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    const app = useApp.getState()
    if (scene.role && app.role !== scene.role) app.setRole(scene.role)
    scene.setup?.()
    if (scene.view && location.pathname !== scene.view) navigate(scene.view)
    if (scene.view === '/propuesta' || scene.view === '/panel') window.scrollTo({ top: 0 })

    const pointTo = async (sel: string, click?: boolean) => {
      const el = await waitFor(sel)
      if (!el || token !== alive.current) return
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      T(() => {
        target.current = el
        const r = el.getBoundingClientRect()
        setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 60) })
        if (click)
          T(() => {
            setRipple((v) => v + 1)
            el.click()
          }, 950)
      }, 450)
    }

    target.current = null
    setRect(null)
    if (scene.selector) T(() => pointTo(scene.selector!, scene.click && !scene.steps), 700)
    if (scene.click && scene.selector && !scene.steps) {
      /* click incluido en pointTo */
    }
    scene.steps?.forEach((s) => T(() => pointTo(s.selector, s.click), s.at))
    if (scene.cta) {
      setCursor({ x: window.innerWidth / 2 + 90, y: window.innerHeight / 2 + 80 })
    }
    T(() => setIdx((i) => (i + 1) % SCENES.length), scene.duration)
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [active, idx, navigate])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && e.isTrusted) exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, exit])

  if (!active) return null
  const scene = SCENES[idx]
  return createPortal(
    <div className="no-print">
      {/* capa que bloquea la interacción manual */}
      <div className="fixed inset-0 z-[9990]" style={{ cursor: 'none' }} />

      {/* highlight con doble box-shadow (sin el truco 9999px) */}
      {rect && !scene.cta && (
        <div
          className="pointer-events-none fixed z-[9991] rounded-xl"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            boxShadow: '0 0 0 3px rgba(37,99,235,.9), 0 0 0 10px rgba(37,99,235,.18)',
            transition: 'left .35s ease, top .35s ease, width .35s ease, height .35s ease',
          }}
        />
      )}

      {/* cierre con CTA */}
      {scene.cta && (
        <div className="fixed inset-0 z-[9992] bg-black/55 backdrop-blur-sm">
          <div data-trailer="cta" className="anim-modal fixed inset-0 m-auto h-fit w-[calc(100%-32px)] max-w-[520px] rounded-3xl border border-white/10 bg-surface p-8 text-center shadow-pop">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <h2 className="mt-5 text-[26px] font-extrabold tracking-tight">{L(scene.title[0], scene.title[1])}</h2>
            <p className="mt-2 text-[14.5px] text-muted">{L(scene.body[0], scene.body[1])}</p>
            <button onClick={openWhatsApp} className="relative z-[9993] mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-white dark:text-zinc-950">
              <MessageCircle size={18} /> {L('Quiero mi plataforma →', 'I want my platform →')}
            </button>
            <p className="mt-4 text-[11px] text-muted">Powered by Insights</p>
          </div>
        </div>
      )}

      {/* cursor virtual */}
      <div
        className="pointer-events-none fixed z-[9993]"
        style={{ left: cursor.x, top: cursor.y, transition: 'left .9s cubic-bezier(.65,0,.35,1), top .9s cubic-bezier(.65,0,.35,1)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.35))' }}>
          <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.3 L11.3 13.7 L17.5 13.5 Z" fill="#2563eb" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {ripple > 0 && <span key={ripple} className="absolute -left-4 -top-4 h-10 w-10 rounded-full border-2 border-blue-500" style={{ animation: 'click-ripple .6s ease-out both' }} />}
      </div>

      {/* captions de vidrio */}
      <div className="fixed inset-x-0 bottom-5 z-[9994] flex justify-center px-4">
        <div className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/30 bg-white/70 px-5 py-4 shadow-pop backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="kicker text-info">{L(scene.chapter[0], scene.chapter[1])}</p>
              <p className="mt-1 text-[17px] font-semibold tracking-tight">{L(scene.title[0], scene.title[1])}</p>
              <p className="mt-0.5 text-[13.5px] text-muted">{L(scene.body[0], scene.body[1])}</p>
            </div>
            <button onClick={exit} aria-label={L('Salir de la demo', 'Exit demo')} className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-fg dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex gap-1">
            {SCENES.map((_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                {i < idx && <span className="block h-full w-full bg-info" />}
                {i === idx && <span key={`p${idx}`} className="block h-full bg-info" style={{ animation: `trailer-progress ${scene.duration}ms linear both` }} />}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-muted">{L('Demo automática · Esc para salir', 'Automatic demo · Esc to exit')}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
