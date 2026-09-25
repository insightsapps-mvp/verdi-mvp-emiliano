import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BatteryFull, Maximize2, Signal, Wifi } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { Button } from './ui'
import { DeviceToggle, LangToggle, Logo, ThemeToggle, DemoBadge } from './controls'

type Msg =
  | { source: 'verdi'; type: 'state'; payload: { theme?: 'light' | 'dark'; lang?: 'es' | 'en'; role?: 'admin' | 'verduleria'; authed?: boolean } }
  | { source: 'verdi'; type: 'nav'; path: string }
  | { source: 'verdi'; type: 'startTrailer' }

const isMsg = (d: unknown): d is Msg => !!d && typeof d === 'object' && (d as { source?: string }).source === 'verdi'

export function useWide() {
  const [wide, setWide] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches))
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

const snapshot = () => {
  const s = useApp.getState()
  return { theme: s.theme, lang: s.lang, role: s.role, authed: s.authed }
}

/** Dentro del iframe: sincroniza estado y navegación con el padre */
export function FrameBridge() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || !isMsg(e.data)) return
      if (e.data.type === 'state') useApp.getState().applyRemote(e.data.payload)
      if (e.data.type === 'nav' && e.data.path !== location.pathname) navigate(e.data.path)
    }
    window.addEventListener('message', onMsg)
    const unsub = useApp.subscribe((s, prev) => {
      if (s.theme !== prev.theme || s.lang !== prev.lang || s.role !== prev.role || s.authed !== prev.authed) {
        window.parent.postMessage({ source: 'verdi', type: 'state', payload: snapshot() }, location.origin)
      }
    })
    return () => {
      window.removeEventListener('message', onMsg)
      unsub()
    }
  }, [navigate])
  useEffect(() => {
    window.parent.postMessage({ source: 'verdi', type: 'nav', path: pathname }, location.origin)
  }, [pathname])
  return null
}

/** Padre: marco de iPhone con la app real adentro (iframe = viewport de 390px real) */
export function DeviceStage() {
  const L = useL()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const theme = useApp((s) => s.theme)
  const setDevice = useApp((s) => s.setDevice)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [src] = useState(() => {
    const s = useApp.getState()
    const path = s.authed ? (pathname === '/login' || pathname === '/' ? '/propuesta' : pathname) : '/login'
    return `${path}?device=frame&theme=${s.theme}&lang=${s.lang}&role=${s.role}`
  })

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || !isMsg(e.data)) return
      if (e.data.type === 'state') useApp.getState().applyRemote(e.data.payload)
      if (e.data.type === 'nav') navigate(e.data.path, { replace: true })
      if (e.data.type === 'startTrailer') {
        useApp.getState().setDevice('desktop')
        useApp.getState().setTrailer(true)
      }
    }
    window.addEventListener('message', onMsg)
    const unsub = useApp.subscribe((s, prev) => {
      if (s.theme !== prev.theme || s.lang !== prev.lang || s.role !== prev.role || s.authed !== prev.authed) {
        frameRef.current?.contentWindow?.postMessage({ source: 'verdi', type: 'state', payload: snapshot() }, location.origin)
      }
    })
    return () => {
      window.removeEventListener('message', onMsg)
      unsub()
    }
  }, [navigate])

  const onLoad = () => frameRef.current?.contentWindow?.postMessage({ source: 'verdi', type: 'state', payload: snapshot() }, location.origin)

  const dark = theme === 'dark'
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-100 via-zinc-200/70 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="pointer-events-none absolute -left-32 top-10 h-[460px] w-[460px] rounded-full bg-primary/20 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[460px] w-[460px] rounded-full bg-secondary/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-black/[0.03] dark:bg-black/30" />

      {/* Toolbar */}
      <div className="absolute left-6 top-5 flex items-center gap-3">
        <Logo />
        <DemoBadge />
      </div>
      <div className="absolute right-6 top-5 flex items-center gap-1.5">
        <DeviceToggle />
        <ThemeToggle />
        <LangToggle />
      </div>

      <div className="relative flex items-center gap-10">
        {/* Marco */}
        <div
          className="anim-frame relative rounded-[44px] bg-zinc-900 p-[11px] shadow-[0_40px_80px_-20px_rgba(0,0,0,.45),0_0_0_1px_rgba(255,255,255,.08)_inset] ring-1 ring-black/40"
          style={{ width: 412, height: 'min(844px, 88vh)' }}
        >
          <div className="pointer-events-none absolute inset-[3px] rounded-[42px] ring-1 ring-white/15" />
          <div className={`relative flex h-full w-full flex-col overflow-hidden rounded-[34px] ${dark ? 'bg-[#09090b]' : 'bg-white'}`}>
            {/* Barra de estado */}
            <div className={`relative flex h-[46px] shrink-0 items-center justify-between px-7 pt-1 text-[14px] font-semibold ${dark ? 'text-white' : 'text-zinc-900'}`}>
              <span className="num">9:41</span>
              <span className="absolute left-1/2 top-[10px] h-[28px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
              <span className="flex items-center gap-1.5">
                <Signal size={15} strokeWidth={2.4} />
                <Wifi size={15} strokeWidth={2.4} />
                <BatteryFull size={20} strokeWidth={1.8} />
              </span>
            </div>
            <iframe ref={frameRef} src={src} onLoad={onLoad} title="Verdi · iPhone" className="block w-full flex-1 border-0" style={{ width: 390 }} />
            {/* Barra de gestos */}
            <div className="flex h-[22px] shrink-0 items-center justify-center">
              <span className={`h-[5px] w-[134px] rounded-full ${dark ? 'bg-white/80' : 'bg-zinc-900/85'}`} />
            </div>
          </div>
        </div>

        {/* Lateral */}
        <div className="hidden w-[210px] flex-col gap-3 xl:flex">
          <span className="num w-fit rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[12px] font-medium text-muted shadow-card backdrop-blur">iPhone 15 · 390 × 844</span>
          <p className="text-[13px] leading-relaxed text-muted">
            {L(
              'Es la app real con layout de teléfono: la Verdulería la ve así en su Android y tu cliente así en su WhatsApp.',
              'This is the real app with a phone layout: the shop sees it like this on Android and your customer like this on WhatsApp.',
            )}
          </p>
          <Button variant="secondary" className="w-fit" onClick={() => setDevice('desktop')}>
            <Maximize2 size={15} /> {L('Abrir a pantalla completa', 'Open full screen')}
          </Button>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 xl:hidden">
        <span className="num rounded-full border border-line bg-surface/80 px-3 py-1 text-[11.5px] text-muted backdrop-blur">iPhone 15 · 390 × 844</span>
        <Button size="sm" variant="secondary" onClick={() => setDevice('desktop')}>
          <Maximize2 size={14} /> {L('Abrir a pantalla completa', 'Open full screen')}
        </Button>
      </div>
    </div>
  )
}
