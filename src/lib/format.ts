import type { Lang } from './i18n'

const loc = (lang: Lang) => (lang === 'es' ? 'es-AR' : 'en-US')

/** Pesos argentinos: "$ 12.400" (es) · "ARS 12,400" (en) */
export function ars(n: number, lang: Lang, decimals = 0) {
  const s = new Intl.NumberFormat(loc(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
  return lang === 'es' ? `$ ${s}` : `ARS ${s}`
}

/** Pesos compactos para KPIs grandes: "$ 18,4 M" */
export function arsCompact(n: number, lang: Lang) {
  const s = new Intl.NumberFormat(loc(lang), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
  return lang === 'es' ? `$ ${s}` : `ARS ${s}`
}

export function usd(n: number, lang: Lang) {
  return `USD ${new Intl.NumberFormat(loc(lang)).format(n)}`
}

export function num(n: number, lang: Lang, decimals = 0) {
  return new Intl.NumberFormat(loc(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function pct(n: number, lang: Lang, decimals = 0) {
  return `${num(n, lang, decimals)}%`
}

export function time(d: Date | number, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

export function date(d: Date | number, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat(loc(lang), opts).format(d)
}

export function dateTime(d: Date | number, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

export function weekday(d: Date | number, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { weekday: 'short' }).format(d)
}

/** "hace 25 min" / "25 min ago" */
export function ago(d: Date | number, lang: Lang) {
  const diff = Math.max(0, Date.now() - +d)
  const m = Math.round(diff / 60000)
  const rtf = new Intl.RelativeTimeFormat(loc(lang), { numeric: 'auto', style: 'short' })
  if (m < 60) return rtf.format(-m, 'minute')
  const h = Math.round(m / 60)
  if (h < 24) return rtf.format(-h, 'hour')
  return rtf.format(-Math.round(h / 24), 'day')
}

/** Cantidad + unidad localizada: "2 kg", "1 atado", "3 u." */
export function qty(n: number, unidad: string, lang: Lang) {
  const q = num(n, lang, n % 1 === 0 ? 0 : 1)
  const map: Record<string, [string, string, string, string]> = {
    kg: ['kg', 'kg', 'kg', 'kg'],
    unidad: ['u.', 'u.', 'pc', 'pcs'],
    atado: ['atado', 'atados', 'bunch', 'bunches'],
    maple: ['maple', 'maples', 'tray', 'trays'],
    bandeja: ['bandeja', 'bandejas', 'pack', 'packs'],
  }
  const u = map[unidad] ?? [unidad, unidad, unidad, unidad]
  const plural = n !== 1
  const label = lang === 'es' ? (plural ? u[1] : u[0]) : plural ? u[3] : u[2]
  return `${q} ${label}`
}
