import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WA_URL =
  'https://wa.me/5491139375146?text=Vi%20el%20demo%20de%20Verdi%2C%20quiero%20que%20arranquemos!'

export function openWhatsApp() {
  window.open(WA_URL, '_blank', 'noopener,noreferrer')
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** PRNG determinístico (mulberry32) para que el mock sea estable entre recargas */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function safeStorage(kind: 'local' | 'session') {
  return {
    get(key: string): string | null {
      try {
        return (kind === 'local' ? localStorage : sessionStorage).getItem(key)
      } catch {
        return null
      }
    },
    set(key: string, value: string) {
      try {
        ;(kind === 'local' ? localStorage : sessionStorage).setItem(key, value)
      } catch {
        /* noop */
      }
    },
    remove(key: string) {
      try {
        ;(kind === 'local' ? localStorage : sessionStorage).removeItem(key)
      } catch {
        /* noop */
      }
    },
  }
}

export const ls = safeStorage('local')
export const ss = safeStorage('session')
