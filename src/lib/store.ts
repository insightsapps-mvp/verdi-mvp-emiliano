import { create } from 'zustand'
import type { Lang } from './i18n'
import type { Role } from './roles'
import { ls, ss } from './utils'

export type Theme = 'light' | 'dark'
export type Device = 'desktop' | 'mobile'

export interface PreviewCtx {
  modulo: number
  view: string
  rolePrevio: Role
  titulo: { es: string; en: string }
}

interface AppState {
  lang: Lang
  theme: Theme
  device: Device
  isFrame: boolean
  authed: boolean
  role: Role
  welcomeOpen: boolean
  preview: PreviewCtx | null
  moduloDestacado: number | null
  tourActive: boolean
  tourRun: number
  trailerActive: boolean
  sheetOpen: boolean
  bannersCollapsed: Record<string, boolean>

  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  setDevice: (d: Device) => void
  login: (role: Role) => void
  logout: () => void
  setRole: (r: Role) => void
  setWelcomeOpen: (v: boolean) => void
  abrirPreview: (modulo: number, view: string, role: Role, titulo: { es: string; en: string }) => void
  cerrarPreview: () => void
  cancelPreview: () => void
  limpiarDestacado: () => void
  startTour: () => void
  stopTour: () => void
  setTrailer: (v: boolean) => void
  setSheetOpen: (v: boolean) => void
  toggleBanner: (id: string) => void
  applyRemote: (p: Partial<Pick<AppState, 'lang' | 'theme' | 'role' | 'authed'>>) => void
}

const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
const isFrame = q.get('device') === 'frame'

const initialAuth = (() => {
  try {
    return JSON.parse(ss.get('verdi_auth') ?? 'null') as { authed: boolean; role: Role } | null
  } catch {
    return null
  }
})()

const validRole = (r: string | null): Role | null => (r === 'admin' || r === 'verduleria' ? r : null)

export function applyThemeClass(t: Theme) {
  const d = document.documentElement
  d.classList.toggle('dark', t === 'dark')
  d.style.background = t === 'dark' ? '#09090b' : '#ffffff'
}

export const useApp = create<AppState>((set, get) => ({
  lang: ((q.get('lang') as Lang) || (ls.get('verdi_lang') as Lang) || 'es') === 'en' ? 'en' : 'es',
  theme: ((q.get('theme') as Theme) || (ls.get('verdi_theme') as Theme) || 'light') === 'dark' ? 'dark' : 'light',
  device: ls.get('verdi_device_view') === 'mobile' ? 'mobile' : 'desktop',
  isFrame,
  authed: initialAuth?.authed ?? false,
  role: validRole(q.get('role')) ?? initialAuth?.role ?? 'admin',
  welcomeOpen: false,
  preview: null,
  moduloDestacado: null,
  tourActive: false,
  tourRun: 0,
  trailerActive: false,
  sheetOpen: false,
  bannersCollapsed: {},

  setLang: (lang) => {
    ls.set('verdi_lang', lang)
    document.documentElement.lang = lang
    set({ lang })
  },
  setTheme: (theme) => {
    ls.set('verdi_theme', theme)
    applyThemeClass(theme)
    set({ theme })
  },
  setDevice: (device) => {
    ls.set('verdi_device_view', device)
    set({ device })
  },
  login: (role) => {
    ss.set('verdi_auth', JSON.stringify({ authed: true, role }))
    set({ authed: true, role, preview: null, sheetOpen: false })
  },
  logout: () => {
    ss.remove('verdi_auth')
    set({ authed: false, preview: null, tourActive: false, sheetOpen: false, welcomeOpen: false })
  },
  setRole: (role) => {
    if (get().authed) ss.set('verdi_auth', JSON.stringify({ authed: true, role }))
    set({ role })
  },
  setWelcomeOpen: (welcomeOpen) => set({ welcomeOpen }),
  abrirPreview: (modulo, view, role, titulo) => {
    const rolePrevio = get().role
    if (role !== rolePrevio) get().setRole(role)
    set({ preview: { modulo, view, rolePrevio, titulo }, sheetOpen: false })
  },
  cerrarPreview: () => {
    const p = get().preview
    if (!p) return
    if (p.rolePrevio !== get().role) get().setRole(p.rolePrevio)
    set({ preview: null, moduloDestacado: p.modulo })
  },
  cancelPreview: () => set({ preview: null }),
  limpiarDestacado: () => set({ moduloDestacado: null }),
  startTour: () => set((s) => ({ tourActive: true, tourRun: s.tourRun + 1, sheetOpen: false })),
  stopTour: () => set({ tourActive: false }),
  setTrailer: (trailerActive) => set({ trailerActive, tourActive: false, preview: null, sheetOpen: false }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  toggleBanner: (id) => set((s) => ({ bannersCollapsed: { ...s.bannersCollapsed, [id]: !s.bannersCollapsed[id] } })),
  applyRemote: (p) => {
    const s = get()
    if (p.lang && p.lang !== s.lang) s.setLang(p.lang)
    if (p.theme && p.theme !== s.theme) s.setTheme(p.theme)
    if (p.authed !== undefined && p.authed !== s.authed) {
      if (p.authed) s.login(p.role ?? s.role)
      else s.logout()
    }
    if (p.role && p.role !== get().role) s.setRole(p.role)
  },
}))

// Si viene por query (iframe), persistir tema/idioma para que el anti-flash coincida
if (isFrame) {
  const qt = q.get('theme')
  if (qt === 'dark' || qt === 'light') applyThemeClass(qt)
}
