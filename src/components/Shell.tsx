import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft, ChevronDown, LogOut, Menu, MoreHorizontal, Sparkles, X, MessageCircle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL, useT } from '@/lib/i18n'
import { navItems, ROLE_USER, type NavItem } from '@/lib/roles'
import { cn, openWhatsApp } from '@/lib/utils'
import { useCerrarPreview, useGo, useLogout, useSwitchRole } from '@/lib/nav'
import { Button, MenuItem, Popover } from './ui'
import { DemoBadge, DeviceToggle, LangToggle, Logo, RoleOptions, RoleSwitcher, ThemeToggle, WhatsAppCTA, ROLE_META } from './controls'

function useActive() {
  const { pathname } = useLocation()
  return useCallback((it: NavItem) => pathname === it.path || pathname.startsWith(it.path + '/'), [pathname])
}

/* ---------------- Top nav con overflow "Más" ---------------- */
function TopNav() {
  const role = useApp((s) => s.role)
  const lang = useApp((s) => s.lang)
  const L = useL()
  const t = useT()
  const go = useGo()
  const isActive = useActive()
  const items = navItems(role)
  const wrapRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(items.length)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const measure = measureRef.current
    if (!wrap || !measure) return
    const calc = () => {
      const avail = wrap.clientWidth - 8
      const nodes = Array.from(measure.children) as HTMLElement[]
      const more = nodes[nodes.length - 1]
      const widths = nodes.slice(0, -1).map((n) => n.offsetWidth + 4)
      const moreW = more.offsetWidth + 4
      const total = widths.reduce((a, b) => a + b, 0)
      if (total <= avail) return setVisible(items.length)
      let used = 0
      let n = 0
      for (let i = 0; i < widths.length; i++) {
        if (used + widths[i] + moreW > avail) break
        used += widths[i]
        n++
      }
      setVisible(Math.max(1, n))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [items.length, role, lang])

  const shown = items.slice(0, visible)
  const hidden = items.slice(visible)
  const hiddenActive = hidden.some(isActive)

  const pill = (it: NavItem, measure = false) => {
    const I = it.icon
    const active = !measure && isActive(it)
    return (
      <button
        key={it.id}
        data-tour={measure ? undefined : `nav-${it.id}`}
        onClick={measure ? undefined : () => go(it.path)}
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
          active ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface2 hover:text-fg',
        )}
      >
        <I size={16} strokeWidth={1.75} />
        {L(it.es, it.en)}
      </button>
    )
  }

  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      {/* fila invisible para medir anchos */}
      <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex w-max gap-1">
        {items.map((it) => (
          <div key={it.id} className={cn('flex shrink-0', it.commercial && 'pr-[18px]')}>
            {pill(it, true)}
          </div>
        ))}
        <div className="flex h-9 shrink-0 items-center gap-1 px-2.5 text-[13px] font-medium">
          <MoreHorizontal size={16} /> {t('act.more')} <ChevronDown size={13} />
        </div>
      </div>
      <nav ref={wrapRef} data-tour="top-nav" className="flex min-w-0 flex-1 items-center gap-1">
        {shown.map((it) =>
          it.commercial ? (
            <div key={it.id} className="flex shrink-0 items-center pr-2">
              <div className="relative">
                <span className="absolute -top-[11px] left-2.5 text-[9px] font-bold tracking-[0.12em] text-muted/80">{t('hdr.commercial')}</span>
                {pill(it)}
              </div>
              <span className="ml-2 h-6 w-px bg-line" />
            </div>
          ) : (
            pill(it)
          ),
        )}
        {hidden.length > 0 && (
          <Popover
            align="left"
            className="w-56"
            trigger={({ toggle, open }) => (
              <button
                data-tour="nav-more"
                onClick={toggle}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                  hiddenActive || open ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface2 hover:text-fg',
                )}
              >
                <MoreHorizontal size={16} /> {t('act.more')} <ChevronDown size={13} />
              </button>
            )}
          >
            {(close) =>
              hidden.map((it) => (
                <MenuItem
                  key={it.id}
                  icon={it.icon}
                  active={isActive(it)}
                  onClick={() => {
                    close()
                    go(it.path)
                  }}
                >
                  {L(it.es, it.en)}
                </MenuItem>
              ))
            }
          </Popover>
        )}
      </nav>
    </div>
  )
}

function TourButton({ compact }: { compact?: boolean }) {
  const t = useT()
  const startTour = useApp((s) => s.startTour)
  const trailer = useApp((s) => s.trailerActive)
  return (
    <Button
      data-tour="tour-btn"
      variant="secondary"
      size={compact ? 'iconSm' : 'md'}
      disabled={trailer}
      onClick={startTour}
      className={cn(!compact && 'px-2.5')}
      aria-label={t('act.tour')}
    >
      <Sparkles size={15} className="text-info" strokeWidth={2} />
      {!compact && <span className="hidden xl:inline">{t('act.tour')}</span>}
    </Button>
  )
}

function AvatarMenu() {
  const role = useApp((s) => s.role)
  const L = useL()
  const t = useT()
  const logout = useLogout()
  const u = ROLE_USER[role]
  const m = ROLE_META[role]
  return (
    <Popover
      className="w-56"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label={u.nombre} className={cn('grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold', m.soft, m.tone)}>
          {u.iniciales}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="text-[13.5px] font-semibold">{u.nombre}</p>
            <p className="text-[12px] text-muted">
              {L(u.es, u.en)} · Don Tito
            </p>
          </div>
          <div className="my-1 h-px bg-line" />
          <MenuItem
            icon={LogOut}
            onClick={() => {
              close()
              logout()
            }}
          >
            {t('act.logout')}
          </MenuItem>
        </>
      )}
    </Popover>
  )
}

function DesktopHeader() {
  const switchRole = useSwitchRole()
  const go = useGo()
  return (
    <header className="no-print sticky top-0 z-40 hidden h-16 border-b border-line bg-bg/85 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-4 px-5">
        <button onClick={() => go('/propuesta')} className="shrink-0" aria-label="Verdi">
          <Logo />
        </button>
        <TopNav />
        <div className="flex shrink-0 items-center gap-1.5">
          <TourButton />
          <DeviceToggle />
          <ThemeToggle />
          <LangToggle />
          <RoleSwitcher onPick={switchRole} />
          <WhatsAppCTA className="hidden xl:inline-flex" />
          <AvatarMenu />
        </div>
      </div>
    </header>
  )
}

function MobileHeader() {
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  const t = useT()
  const go = useGo()
  return (
    <header className="no-print sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:hidden">
      <button onClick={() => go('/propuesta')} aria-label="Verdi">
        <Logo size="sm" />
      </button>
      <DemoBadge className="ml-1" />
      <div className="ml-auto flex items-center gap-1.5">
        <TourButton compact />
        <Button data-tour="menu-btn" variant="secondary" size="iconSm" aria-label={t('act.menu')} onClick={() => setSheetOpen(true)}>
          <Menu size={17} />
        </Button>
      </div>
    </header>
  )
}

function BottomNav() {
  const role = useApp((s) => s.role)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  const L = useL()
  const t = useT()
  const go = useGo()
  const isActive = useActive()
  const items = navItems(role)
  const main = items.slice(0, 4)
  const restActive = items.slice(4).some(isActive)
  return (
    <nav data-tour="bottom-nav" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5">
        {main.map((it) => {
          const I = it.icon
          const a = isActive(it)
          return (
            <button key={it.id} data-tour={`nav-${it.id}`} onClick={() => go(it.path)} className={cn('flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium', a ? 'text-primary' : 'text-muted')}>
              <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', a && 'bg-primary-soft')}>
                <I size={18} strokeWidth={a ? 2 : 1.75} />
              </span>
              <span className="max-w-full truncate px-1">{L(it.es, it.en).split(' ')[0]}</span>
            </button>
          )
        })}
        <button data-tour="nav-more" onClick={() => setSheetOpen(true)} className={cn('flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium', restActive ? 'text-primary' : 'text-muted')}>
          <span className={cn('grid h-7 w-12 place-items-center rounded-full', restActive && 'bg-primary-soft')}>
            <MoreHorizontal size={18} />
          </span>
          {t('act.more')}
        </button>
      </div>
    </nav>
  )
}

function MobileSheet() {
  const open = useApp((s) => s.sheetOpen)
  const setOpen = useApp((s) => s.setSheetOpen)
  const role = useApp((s) => s.role)
  const L = useL()
  const t = useT()
  const go = useGo()
  const switchRole = useSwitchRole()
  const logout = useLogout()
  const isActive = useActive()
  const u = ROLE_USER[role]
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[150] lg:hidden">
      <div className="anim-fade absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside className="anim-sheet absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-bg shadow-pop">
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo size="sm" />
          <Button variant="ghost" size="iconSm" aria-label={t('act.close')} onClick={() => setOpen(false)}>
            <X size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-surface2 px-3 py-2.5">
            <span className={cn('grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold', ROLE_META[role].soft, ROLE_META[role].tone)}>{u.iniciales}</span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold">{u.nombre}</p>
              <p className="text-[11.5px] text-muted">{L(u.es, u.en)} · Don Tito</p>
            </div>
          </div>
          <div data-tour="switch-user" className="rounded-xl border border-line p-1">
            <RoleOptions onPick={switchRole} />
          </div>
          <div className="mt-3 space-y-0.5">
            {navItems(role).map((it) => (
              <MenuItem key={it.id} icon={it.icon} active={isActive(it)} onClick={() => go(it.path)} className="py-2.5 text-[14px]">
                {L(it.es, it.en)}
                {it.commercial && <span className="ml-auto text-[9px] font-bold tracking-wider text-muted">{t('hdr.commercial')}</span>}
              </MenuItem>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <ThemeToggle />
            <LangToggle />
            <Button variant="ghost" size="sm" className="ml-auto text-muted" onClick={logout}>
              <LogOut size={15} /> {t('act.logout')}
            </Button>
          </div>
        </div>
        <div className="border-t border-line bg-surface2 p-3">
          <div className="mb-2 flex items-center gap-2">
            <DemoBadge />
            <span className="text-[12px] text-muted">{t('foot.liked')}</span>
          </div>
          <Button data-tour="whatsapp-cta" className="w-full" onClick={openWhatsApp}>
            <MessageCircle size={16} /> {t('act.start')}
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted">{t('brand.powered')}</p>
        </div>
      </aside>
    </div>
  )
}

export function FooterCTA() {
  const t = useT()
  return (
    <footer className="no-print mt-10 border-t border-line bg-surface2/70">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:px-6">
        <DemoBadge />
        <p className="text-center text-[13.5px] font-medium sm:text-left">{t('foot.liked')}</p>
        <Button size="sm" className="sm:ml-auto" onClick={openWhatsApp}>
          <MessageCircle size={15} /> WhatsApp
        </Button>
        <span className="text-[10px] text-muted">{t('brand.powered')}</span>
      </div>
    </footer>
  )
}

/* ---------------- Botón de retorno a la Propuesta ---------------- */
function PreviewReturn() {
  const preview = useApp((s) => s.preview)
  const trailer = useApp((s) => s.trailerActive)
  const L = useL()
  const cerrar = useCerrarPreview()
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[data-modal]')) cerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview, cerrar])
  if (!preview || trailer) return null
  return (
    <div className="no-print sticky top-14 z-30 bg-gradient-to-b from-bg via-bg/90 to-transparent px-4 pb-3 pt-3 lg:top-16 lg:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
        <button onClick={cerrar} data-preview-return className="relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-pop dark:text-zinc-950">
          <span className="anim-halo pointer-events-none absolute inset-0 rounded-full bg-primary" />
          <ArrowLeft size={15} strokeWidth={2.2} className="relative" />
          <span className="relative">{L('Volver a la propuesta', 'Back to the proposal')}</span>
        </button>
        <span className="rounded-full border border-white/40 bg-surface/60 px-3 py-1.5 text-[12px] text-muted shadow-card backdrop-blur-md dark:border-white/10">
          {L('Estás viendo:', "You're viewing:")} <b className="font-semibold text-fg">{L(preview.titulo.es, preview.titulo.en)}</b>
        </span>
      </div>
    </div>
  )
}

export function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <DesktopHeader />
      <MobileHeader />
      <PreviewReturn />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-6 lg:pt-7">
        <Outlet />
      </main>
      <div className="pb-[68px] lg:pb-0">
        <FooterCTA />
      </div>
      <BottomNav />
      <MobileSheet />
    </div>
  )
}
