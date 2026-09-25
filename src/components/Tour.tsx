import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, MessageCircle, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL, type Lang } from '@/lib/i18n'
import { NAV, NAV_BY_ROLE, type Role } from '@/lib/roles'
import { ls, openWhatsApp } from '@/lib/utils'
import { Button, Modal } from './ui'

type Bi = [string, string]
export interface TourStep {
  id: string
  selectors?: string[]
  route?: string
  title: string
  body: string
  roles?: Role[]
}

const NAV_COPY: Record<string, Bi> = {
  propuesta: [
    'Acá está todo lo que incluye el desarrollo: el circuito, los 8 módulos y el onboarding. Desde cada módulo saltás a verlo funcionando con "Ver en el demo".',
    'Everything the build includes lives here: the loop, the 8 modules and onboarding. From each module you can jump to see it working with "See it in the demo".',
  ],
  panel: [
    'Los números de Don Tito en vivo: ventas del día y del mes, 38 pedidos hoy y alertas de stock bajo (palta, frutilla y rúcula).',
    "Don Tito's numbers live: today's and this month's sales, 38 orders today and low-stock alerts (avocado, strawberry and arugula).",
  ],
  pedidos: [
    'Los 38 pedidos de hoy por estado, con ticket e impresión. Hay uno para revisar: #VT-1047 tiene el pago pendiente hace 25 min.',
    "Today's 38 orders by status, with receipt printing. One needs review: #VT-1047 has had its payment pending for 25 min.",
  ],
  whatsapp: [
    'Chat con la verdulería: probá escribir "quiero 2 kg de tomate" y mirá cómo la IA arma el pedido, cobra y lo manda a Pedidos.',
    'Chat with the shop: try typing "I want 2 kg of tomatoes" and watch the AI build the order, charge it and send it to Orders.',
  ],
  stock: [
    'La palta está en rojo porque quedan 3; el bot ya no ofrece más de esa cantidad. Todo cambio se sincroniza con WhatsApp.',
    'Avocado is red because only 3 are left; the bot won’t offer more than that. Every change syncs with WhatsApp.',
  ],
  cobros: [
    'Cobros de Mercado Pago con comisión y neto calculados. Hoy hay 3 rechazados: uno ya tiene reintento automático programado.',
    'Mercado Pago payments with fees and net calculated. There are 3 rejected today: one already has an automatic retry scheduled.',
  ],
  reportes: [
    'Ventas por día, top 10 productos y medios de pago. El reporte diario se arma solo a las 23:59 y se exporta a PDF.',
    'Sales per day, top 10 products and payment methods. The daily report builds itself at 11:59 PM and exports to PDF.',
  ],
  clientes: [
    '40 clientes con su historial. Laura Giménez lleva 27 pedidos y su favorito es el tomate perita.',
    '40 customers with their history. Laura Giménez has 27 orders and her favorite is plum tomatoes.',
  ],
  entregas: [
    'Los pedidos ordenados por franja horaria, con Lucía (moto) y Ramiro (bici) repartiendo. Despachás y marcás entregado con un toque.',
    'Orders sorted by delivery window, with Lucía (motorbike) and Ramiro (bicycle) delivering. Dispatch and mark delivered in one tap.',
  ],
  tickets: [
    'La Térmica mostrador está conectada y la del depósito sin papel. Cada ticket lleva numeración 0001-0000478x.',
    'The counter thermal is connected and the storeroom one is out of paper. Every receipt carries numbering 0001-0000478x.',
  ],
  conversaciones: [
    'El 92% de los chats los resolvió la IA sola; 2 se derivaron a Tito: un reclamo por una lechuga y un pedido mayorista.',
    '92% of chats were solved by the AI alone; 2 were handed to Tito: a lettuce complaint and a wholesale order.',
  ],
  cuenta: [
    'Tu licencia Plan Pro, los 4 usuarios del equipo, el bot y los backups. Y la prueba de que tus datos están aislados de las demás verdulerías.',
    'Your Pro plan license, the 4 team users, the bot and backups. Plus proof that your data is isolated from other shops.',
  ],
}

export function getTourSteps(role: Role, lang: Lang): TourStep[] {
  const L = (b: Bi) => (lang === 'es' ? b[0] : b[1])
  const all: TourStep[] = [
    {
      id: 'welcome-admin',
      roles: ['admin'],
      title: L(['Tour de la vista Admin', 'Admin view tour']),
      body: L([
        'Vas a recorrer lo que ve el dueño de la verdulería: sus números, estadísticas, stock, cobros y todo lo que pasa en el local. Seguimos el menú de izquierda a derecha.',
        "You'll walk through what the shop owner sees: their numbers, stats, stock, payments and everything happening in the shop. We follow the menu from left to right.",
      ]),
    },
    {
      id: 'welcome-verduleria',
      roles: ['verduleria'],
      title: L(['Tour de la vista Verdulería', 'Shop view tour']),
      body: L([
        'Vas a recorrer la app que usa el mostrador en su Android: pedidos, entregas, stock y tickets. Seguimos el menú de izquierda a derecha.',
        'You’ll walk through the app the counter uses on Android: orders, deliveries, stock and receipts. We follow the menu from left to right.',
      ]),
    },
    {
      id: 'top-nav',
      selectors: ['[data-tour="top-nav"]', '[data-tour="bottom-nav"]'],
      title: L(['El menú', 'The menu']),
      body: L([
        'Todas las secciones de esta vista. La primera siempre es la Propuesta comercial; el resto son los módulos funcionando con datos de ejemplo.',
        'Every section of this view. The first is always the commercial Proposal; the rest are the modules working with sample data.',
      ]),
    },
    ...NAV_BY_ROLE[role].map((id, i) => ({
      id: `nav-${id}`,
      selectors: [`[data-tour="nav-${id}"]`, '[data-tour="nav-more"]'],
      route: NAV[id].path,
      title: `${i + 1}. ${lang === 'es' ? NAV[id].es : NAV[id].en}`,
      body: L(NAV_COPY[id]),
    })),
    {
      id: 'device',
      selectors: ['[data-tour="device-toggle"]'],
      title: L(['Escritorio / Celular', 'Desktop / Mobile']),
      body: L([
        'Cambiá a Celular y ves la app real dentro de un iPhone: así la usa el verdulero en su Android y así le llega el WhatsApp al vecino.',
        'Switch to Mobile and you see the real app inside an iPhone: that’s how the shopkeeper uses it on Android and how neighbors get WhatsApp.',
      ]),
    },
    {
      id: 'switch',
      selectors: ['[data-tour="switch-user"]', '[data-tour="menu-btn"]'],
      title: L(['Cambiar vista', 'Switch view']),
      body: L([
        'Pasá de Admin (el dueño, que ve todo) a Verdulería (el mostrador) en vivo, sin cerrar sesión. Cada vista muestra solo lo que le corresponde.',
        'Switch live between Admin (the owner, who sees everything) and Shop (the counter), no logout needed. Each view shows only what it should.',
      ]),
    },
    {
      id: 'cta',
      selectors: ['[data-tour="whatsapp-cta"]', '[data-tour="menu-btn"]'],
      title: L(['¿Arrancamos?', 'Shall we start?']),
      body: L([
        'Si te cierra lo que viste, desde "Quiero arrancar" nos escribís por WhatsApp y coordinamos el onboarding.',
        'If what you saw works for you, tap "Let’s start" to message us on WhatsApp and we’ll schedule onboarding.',
      ]),
    },
  ]
  return all.filter((s) => !s.roles || s.roles.includes(role))
}

const isVisible = (el: Element) => {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return false
  const cs = getComputedStyle(el)
  return cs.visibility !== 'hidden' && cs.display !== 'none'
}
const findTarget = (sels?: string[]) => {
  if (!sels) return null
  for (const s of sels) {
    const el = Array.from(document.querySelectorAll(s)).find(isVisible)
    if (el) return el as HTMLElement
  }
  return null
}

const PAD = 8
type Rect = { x: number; y: number; w: number; h: number }

export function Tour() {
  const active = useApp((s) => s.tourActive)
  const run = useApp((s) => s.tourRun)
  const role = useApp((s) => s.role)
  const lang = useApp((s) => s.lang)
  const trailer = useApp((s) => s.trailerActive)
  const stopTour = useApp((s) => s.stopTour)
  const cancelPreview = useApp((s) => s.cancelPreview)
  const L = useL()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const steps = useMemo(() => getTourSteps(role, lang), [role, lang])
  const [visibleSteps, setVisibleSteps] = useState<TourStep[]>(steps)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [finalOpen, setFinalOpen] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const tipRef = useRef<HTMLDivElement>(null)
  const [tipH, setTipH] = useState(220)
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  // Arranque / reinicio (solo por botón: tourRun cambia únicamente con startTour)
  useEffect(() => {
    if (!active) return
    // Pasos sin ningún selector visible (ej. toggle de dispositivo en mobile) se filtran sin reordenar
    setVisibleSteps(steps.filter((s) => !s.selectors || s.id.startsWith('nav-') || s.id === 'top-nav' || findTarget(s.selectors)))
    setI(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  // Si cambia rol o idioma con el tour abierto → reinicia en el paso 1
  const firstRL = useRef(true)
  useEffect(() => {
    if (firstRL.current) {
      firstRL.current = false
      return
    }
    if (!useApp.getState().tourActive) return
    setVisibleSteps(steps.filter((s) => !s.selectors || s.id.startsWith('nav-') || s.id === 'top-nav' || findTarget(s.selectors)))
    setI(0)
  }, [role, lang, steps])

  const step = visibleSteps[i]

  const measure = useCallback(
    (scroll: boolean) => {
      if (!step?.selectors) {
        setRect(null)
        return true
      }
      const el = findTarget(step.selectors)
      if (!el) return false
      if (scroll) el.scrollIntoView({ block: 'center' })
      const r = el.getBoundingClientRect()
      setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 })
      return true
    },
    [step],
  )

  useEffect(() => {
    if (!active || !step || trailer) return
    clearTimers()
    const needNav = !!step.route && pathRef.current !== step.route
    if (needNav) {
      cancelPreview()
      navigate(step.route!)
    }
    if (!step.selectors) {
      setRect(null)
      return
    }
    timers.current.push(
      setTimeout(
        () => {
          if (!measure(true)) timers.current.push(setTimeout(() => measure(true) || setRect(null), 220))
        },
        needNav ? 260 : 40,
      ),
    )
    return clearTimers
  }, [active, step, trailer, measure, navigate, cancelPreview, clearTimers])

  useEffect(() => {
    if (!active) return
    const on = () => measure(false)
    window.addEventListener('resize', on)
    window.addEventListener('scroll', on, true)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('scroll', on, true)
    }
  }, [active, measure])

  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight)
  }, [i, rect, lang])

  const teardown = useCallback(
    (completed: boolean) => {
      clearTimers()
      setRect(null)
      stopTour()
      if (completed) {
        const key = `verdi_tour_completed_${role}`
        if (!ls.get(key)) {
          ls.set(key, '1')
          setFinalOpen(true)
        }
      }
    },
    [clearTimers, stopTour, role],
  )

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') teardown(false)
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, visibleSteps.length - 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, teardown, visibleSteps.length])

  const next = useCallback(() => {
    if (i >= visibleSteps.length - 1) teardown(true)
    else setI(i + 1)
  }, [i, visibleSteps.length, teardown])
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), [])
  const closeFinal = useCallback(() => setFinalOpen(false), [])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const tipW = Math.min(360, vw - 24)
  let tipStyle: React.CSSProperties
  if (rect) {
    const below = rect.y + rect.h + 14
    const above = rect.y - 14 - tipH
    const top = below + tipH <= vh - 12 ? below : above >= 12 ? above : Math.max(12, vh - tipH - 12)
    const left = Math.min(Math.max(12, rect.x + rect.w / 2 - tipW / 2), vw - tipW - 12)
    tipStyle = { top, left, width: tipW }
  } else {
    tipStyle = { left: '50%', top: '50%', translate: '-50% -50%', width: tipW }
  }

  return (
    <>
      {active && step && !trailer &&
        createPortal(
          <div className="no-print fixed inset-0 z-[9980]" aria-live="polite">
            <svg className="absolute inset-0 h-full w-full" onClick={(e) => e.stopPropagation()}>
              <defs>
                <mask id="verdi-tour-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {rect && <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="12" ry="12" fill="black" style={{ transition: 'all .3s ease' }} />}
                </mask>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="rgba(10,10,10,.55)" mask="url(#verdi-tour-mask)" />
            </svg>
            {rect && (
              <div
                className="pointer-events-none absolute rounded-xl"
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  boxShadow: '0 0 0 2px rgba(34,197,94,.95), 0 0 22px 4px rgba(34,197,94,.45)',
                  transition: 'all .3s ease',
                }}
              >
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
                  <span className="anim-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500" />
                </span>
              </div>
            )}
            <div ref={tipRef} role="dialog" className="anim-pop absolute rounded-2xl border border-line bg-surface p-5 shadow-pop" style={tipStyle}>
              <div className="flex items-center justify-between">
                <span className="num inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-0.5 text-[11px] font-semibold text-info">
                  <Sparkles size={11} />
                  {L('Paso', 'Step')} {i + 1} / {visibleSteps.length}
                </span>
              </div>
              <h3 className="mt-3 text-[16px] font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{step.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button onClick={() => teardown(false)} className="text-[12.5px] font-medium text-muted hover:text-fg">
                  {L('Saltar tour', 'Skip tour')}
                </button>
                <div className="flex gap-2">
                  {i > 0 && (
                    <Button size="sm" variant="secondary" onClick={prev}>
                      <ArrowLeft size={14} /> {L('Atrás', 'Back')}
                    </Button>
                  )}
                  <Button size="sm" onClick={next}>
                    {i === visibleSteps.length - 1 ? L('Terminar', 'Finish') : L('Siguiente', 'Next')} <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <Modal open={finalOpen} onClose={closeFinal} className="max-w-[440px]" z="z-[9985]">
        <div className="p-7 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Sparkles size={26} />
          </span>
          <h3 className="mt-4 text-[20px] font-bold tracking-tight">{L('¡Listo, ya viste todo!', "Done, you've seen it all!")}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {L('Ahora recorrela a tu ritmo, o si ya te cierra, escribinos y arrancamos.', 'Now explore at your own pace, or if it already works for you, message us and we’ll get started.')}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" size="lg" onClick={closeFinal}>
              <Compass size={16} /> {L('Explorar por mi cuenta', 'Explore on my own')}
            </Button>
            <Button
              size="lg"
              onClick={() => {
                closeFinal()
                openWhatsApp()
              }}
            >
              <MessageCircle size={16} /> {L('Quiero mi app →', 'I want my app →')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
