import type { Producto } from '@/data/types'
import { ars, qty } from './format'

/** Motor de respuestas pre-programado por keywords (sin API). Devuelve SIEMPRE texto en ES y EN. */

export interface CartItem {
  productoId: string
  cantidad: number
}

export type BotReply =
  | { kind: 'text'; es: string; en: string }
  | { kind: 'order' }
  | { kind: 'offer'; productoId: string; cantidad: number; es: string; en: string }
  | { kind: 'refund'; es: string; en: string }

export interface BotCtx {
  cart: CartItem[]
  stage: 'idle' | 'draft' | 'awaiting_pay' | 'paid'
  productos: Producto[]
  lastPedidoCodigo?: string
  history: CartItem[]
}

export interface BotResult {
  replies: BotReply[]
  cart?: CartItem[]
  intent: 'greet' | 'order' | 'ask' | 'repeat' | 'swap' | 'cancel' | 'unknown' | 'thanks' | 'help' | 'swap_paid' | 'cancel_paid'
  swap?: { from: string; to: string }
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¡!¿?.;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const WORD_NUM: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, docena: 12,
  medio: 0.5, media: 0.5, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, dozen: 12, couple: 2,
}

interface Match {
  producto: Producto
  alias: string
  index: number
}

/** Busca todos los productos mencionados (alias más largo gana, sin solapamientos) */
export function findProducts(text: string, productos: Producto[]): Match[] {
  const t = ` ${norm(text)} `
  const cands: Match[] = []
  for (const p of productos) {
    for (const a of [...p.aliases, ...p.aliasesEn, p.nombre, p.nombreEn]) {
      const na = norm(a)
      if (!na) continue
      const re = new RegExp(`(^|[^a-z])${na.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?=$|[^a-z])`, 'g')
      let m: RegExpExecArray | null
      while ((m = re.exec(t))) cands.push({ producto: p, alias: na, index: m.index + m[1].length })
    }
  }
  cands.sort((a, b) => b.alias.length - a.alias.length)
  const taken: [number, number][] = []
  const out: Match[] = []
  for (const c of cands) {
    const s = c.index
    const e = c.index + c.alias.length
    if (taken.some(([ts, te]) => s < te && e > ts)) continue
    if (out.some((o) => o.producto.id === c.producto.id)) continue
    taken.push([s, e])
    out.push(c)
  }
  return out.sort((a, b) => a.index - b.index)
}

/** Cantidad para un producto mirando el texto justo antes del alias */
function parseQty(before: string, p: Producto): { n: number; explicit: boolean } {
  const seg = norm(before).split(/,| y | e | and | con | with /).pop() ?? ''
  const words = seg.split(' ').slice(-5)
  let n: number | null = null
  let grams = false
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const d = w.replace(',', '.').match(/^(\d+(\.\d+)?)(kg|k|g|gr)?$/)
    if (d) {
      n = parseFloat(d[1])
      if (d[3] === 'g' || d[3] === 'gr') grams = true
      continue
    }
    if (w in WORD_NUM && !(w === 'a' && words[i + 1] === 'couple')) {
      // "kilo y medio"
      if ((w === 'medio' || w === 'half') && n !== null) n += 0.5
      else n = WORD_NUM[w]
    }
    if (w === 'gramos' || w === 'grams' || w === 'gr') grams = true
  }
  if (/kilo y medio|kg y medio/.test(seg)) n = 1.5
  if (/medio kilo|half a kilo|half kilo/.test(seg)) n = 0.5
  if (/media docena|half a dozen/.test(seg)) n = 6
  if (n === null) return { n: p.unidad === 'kg' ? 1 : 1, explicit: false }
  if (grams) n = n / 1000
  return { n, explicit: true }
}

export function parseOrder(text: string, productos: Producto[]): CartItem[] {
  const matches = findProducts(text, productos)
  const t = norm(text)
  return matches.map((m, i) => {
    const prevEnd = i === 0 ? 0 : matches[i - 1].index + matches[i - 1].alias.length
    const before = t.slice(Math.max(0, prevEnd), m.index)
    const { n } = parseQty(before, m.producto)
    return { productoId: m.producto.id, cantidad: n }
  })
}

const has = (t: string, re: RegExp) => re.test(t)

export function mergeCart(cart: CartItem[], add: CartItem[]) {
  const out = cart.map((c) => ({ ...c }))
  for (const a of add) {
    const ex = out.find((o) => o.productoId === a.productoId)
    if (ex) ex.cantidad = a.cantidad
    else out.push({ ...a })
  }
  return out
}

export const cartTotal = (cart: CartItem[], productos: Producto[]) =>
  Math.round(cart.reduce((s, c) => s + c.cantidad * (productos.find((p) => p.id === c.productoId)?.precio ?? 0), 0))

function suggestions(productos: Producto[], exclude: string[] = []) {
  return productos.filter((p) => p.stock > p.minimo && !exclude.includes(p.id)).slice(0, 40)
}

export function respond(text: string, ctx: BotCtx): BotResult {
  const t = norm(text)
  const P = ctx.productos
  const byId = (id: string) => P.find((p) => p.id === id)!

  // 1. Cancelación
  if (has(t, /\b(cancel|cancela|cancelar|cancelalo|anula|anular|no lo quiero|dejalo sin efecto)/)) {
    if (ctx.stage === 'paid' && ctx.lastPedidoCodigo) {
      return {
        intent: 'cancel_paid',
        replies: [
          { kind: 'text', es: `Listo, cancelé tu pedido #${ctx.lastPedidoCodigo}. Ya le avisé a Tito para que no lo prepare.`, en: `Done, I cancelled your order #${ctx.lastPedidoCodigo}. I already told Tito not to prepare it.` },
          { kind: 'refund', es: 'Reembolso iniciado en Mercado Pago. Lo ves acreditado en 1 a 3 días hábiles.', en: 'Refund started on Mercado Pago. It will show up in 1 to 3 business days.' },
        ],
      }
    }
    if (ctx.cart.length) {
      return { intent: 'cancel', cart: [], replies: [{ kind: 'text', es: 'Sin problema, descarté el pedido. Cuando quieras me escribís de nuevo 🙌', en: "No problem, I discarded the order. Write to me again whenever you want 🙌" }] }
    }
    return { intent: 'cancel', replies: [{ kind: 'text', es: 'No tenés ningún pedido en curso. ¿Querés armar uno?', en: "You don't have any order in progress. Want to put one together?" }] }
  }

  // 2. Cambio: "cambiá la lechuga por rúcula"
  const swap = t.match(/(cambia|cambiame|cambiar|reemplaza|change|swap|replace)\s+(.*?)\s+(por|for|with)\s+(.*)/)
  if (swap) {
    const from = findProducts(swap[2], P)[0]?.producto
    const to = findProducts(swap[4], P)[0]?.producto
    if (from && to) {
      if (ctx.stage === 'paid' && ctx.lastPedidoCodigo) {
        const cur = ctx.history.find((c) => c.productoId === from.id)
        const diff = cur ? Math.round(cur.cantidad * (to.precio - from.precio)) : 0
        const replies: BotReply[] = [
          { kind: 'text', es: `Hecho: en el pedido #${ctx.lastPedidoCodigo} cambié ${from.nombre.toLowerCase()} por ${to.nombre.toLowerCase()} ✅`, en: `Done: in order #${ctx.lastPedidoCodigo} I swapped ${from.nombreEn.toLowerCase()} for ${to.nombreEn.toLowerCase()} ✅` },
        ]
        if (diff < 0) replies.push({ kind: 'refund', es: `La diferencia de ${ars(-diff, 'es')} te la devolvemos: reembolso iniciado.`, en: `We'll return the ${ars(-diff, 'en')} difference: refund started.` })
        else if (diff > 0) replies.push({ kind: 'text', es: `Son ${ars(diff, 'es')} más; lo abonás al recibir.`, en: `That's ${ars(diff, 'en')} more; you pay it on delivery.` })
        return { intent: 'swap_paid', swap: { from: from.id, to: to.id }, replies }
      }
      const inCart = ctx.cart.find((c) => c.productoId === from.id)
      if (inCart) {
        const cart = ctx.cart.map((c) => (c.productoId === from.id ? { productoId: to.id, cantidad: c.cantidad } : c))
        return {
          intent: 'swap',
          cart,
          replies: [
            { kind: 'text', es: `Dale, cambié ${from.nombre.toLowerCase()} por ${to.nombre.toLowerCase()}. Así queda:`, en: `Sure, I swapped ${from.nombreEn.toLowerCase()} for ${to.nombreEn.toLowerCase()}. Here's how it looks:` },
            { kind: 'order' },
          ],
        }
      }
      return { intent: 'swap', replies: [{ kind: 'text', es: `No tenías ${from.nombre.toLowerCase()} en el pedido. ¿Te agrego ${to.nombre.toLowerCase()}?`, en: `You didn't have ${from.nombreEn.toLowerCase()} in the order. Shall I add ${to.nombreEn.toLowerCase()}?` }] }
    }
  }

  // 3. Repetir pedido anterior
  if (has(t, /(lo mismo|lo de siempre|semana pasada|la otra vez|same as last|last week|usual|repeat)/)) {
    const cart = ctx.history.map((c) => ({ ...c }))
    return {
      intent: 'repeat',
      cart,
      replies: [
        { kind: 'text', es: '¡Claro! Esto es lo que pediste la semana pasada (martes 16): ', en: "Of course! This is what you ordered last week (Tuesday the 16th):" },
        { kind: 'order' },
      ],
    }
  }

  const items = parseOrder(text, P)
  const isQuestion = has(t, /\b(tenes|tienen|hay|queda|quedan|do you have|got any|have any|is there)\b/) || text.includes('?')

  // 4. Consulta de disponibilidad sin cantidad
  if (items.length === 1 && isQuestion && !/\d/.test(t)) {
    const p = byId(items[0].productoId)
    if (p.stock <= 0) {
      const alt = suggestions(P, [p.id]).filter((x) => x.categoria === p.categoria).slice(0, 2)
      return { intent: 'ask', replies: [{ kind: 'text', es: `Hoy no me queda ${p.nombre.toLowerCase()} 😕 ¿Te ofrezco ${alt.map((a) => a.nombre.toLowerCase()).join(' o ')}?`, en: `I'm out of ${p.nombreEn.toLowerCase()} today 😕 Can I offer you ${alt.map((a) => a.nombreEn.toLowerCase()).join(' or ')}?` }] }
    }
    if (p.stock <= p.minimo) {
      return {
        intent: 'ask',
        replies: [
          {
            kind: 'offer',
            productoId: p.id,
            cantidad: p.stock,
            es: `Sí, pero me quedan solo ${qty(p.stock, p.unidad, 'es')} de ${p.nombre.toLowerCase()} (${ars(p.precio, 'es')} c/${p.unidad === 'kg' ? 'kg' : 'u.'}). ¿Te las separo?`,
            en: `Yes, but I only have ${qty(p.stock, p.unidad, 'en')} of ${p.nombreEn.toLowerCase()} left (${ars(p.precio, 'en')} per ${p.unidad === 'kg' ? 'kg' : 'piece'}). Shall I set them aside?`,
          },
        ],
      }
    }
    return {
      intent: 'ask',
      replies: [{ kind: 'text', es: `¡Sí! Tengo ${p.nombre.toLowerCase()} a ${ars(p.precio, 'es')} ${p.unidad === 'kg' ? 'el kilo' : 'c/u'}. ¿Cuánto te separo?`, en: `Yes! I have ${p.nombreEn.toLowerCase()} at ${ars(p.precio, 'en')} ${p.unidad === 'kg' ? 'per kilo' : 'each'}. How much should I set aside?` }],
    }
  }

  // 5. Pedido con productos
  if (items.length) {
    const replies: BotReply[] = []
    const ok: CartItem[] = []
    for (const it of items) {
      const p = byId(it.productoId)
      if (it.cantidad > p.stock) {
        replies.push({
          kind: 'offer',
          productoId: p.id,
          cantidad: p.stock,
          es: `Me quedan ${qty(p.stock, p.unidad, 'es')} de ${p.nombre.toLowerCase()}, ¿te las separo?`,
          en: `I have ${qty(p.stock, p.unidad, 'en')} of ${p.nombreEn.toLowerCase()} left, shall I set them aside?`,
        })
      } else ok.push(it)
    }
    const cart = mergeCart(ctx.cart, ok)
    const lead = ctx.cart.length
      ? { kind: 'text' as const, es: 'Listo, lo sumé. Tu pedido queda así:', en: "Done, I added it. Your order now looks like this:" }
      : { kind: 'text' as const, es: '¡Hola! 🍅 Ya te armo el pedido. Verifiqué el stock y está todo:', en: "Hi! 🍅 I'm putting your order together. I checked stock and it's all here:" }
    const out: BotReply[] = ok.length ? [lead, { kind: 'order' }, ...replies] : replies
    return { intent: 'order', cart, replies: out }
  }

  // 6. Pidió algo que no está en el catálogo
  const wantsSomething = has(t, /\b(quiero|mandame|mandas|necesito|dame|traeme|kg|kilo|kilos|want|need|send me|give me|some)\b/) || /\d/.test(t)
  if (wantsSomething) {
    const alt = suggestions(P).filter((p) => ['frutas', 'verduras'].includes(p.categoria))
    const pick = [alt[3], alt[21], alt[8]].filter(Boolean)
    return {
      intent: 'unknown',
      replies: [
        {
          kind: 'text',
          es: `Uh, no tengo ese producto 😕 ¿Te ofrezco ${pick.map((p) => p.nombre.toLowerCase()).join(', ')}? Hoy están muy buenos.`,
          en: `Oh, I don't have that product 😕 Can I offer you ${pick.map((p) => p.nombreEn.toLowerCase()).join(', ')}? They're really good today.`,
        },
      ],
    }
  }

  if (has(t, /\b(gracias|genial|buenisimo|perfecto|thanks|thank you|great)\b/)) {
    return { intent: 'thanks', replies: [{ kind: 'text', es: '¡De nada! Cualquier cosa me escribís 💚', en: "You're welcome! Write to me anytime 💚" }] }
  }

  if (has(t, /\b(hola|buenas|buen dia|buenos dias|buenas tardes|hi|hello|hey|good morning)\b/)) {
    return {
      intent: 'greet',
      replies: [
        {
          kind: 'text',
          es: '¡Hola! Soy el asistente de Verdulería Don Tito 🥬 Decime qué necesitás, por ejemplo: "2 kg de tomate y una lechuga".',
          en: 'Hi! I\'m Don Tito\'s produce shop assistant 🥬 Tell me what you need, for example: "2 kg of tomatoes and a lettuce".',
        },
      ],
    }
  }

  return {
    intent: 'help',
    replies: [
      {
        kind: 'text',
        es: 'Te leo 🙂 Podés pedirme productos con cantidades ("un kilo de papa y 3 bananas"), preguntar si hay algo, o repetir tu pedido de la semana pasada.',
        en: 'Got it 🙂 You can ask me for products with quantities ("a kilo of potatoes and 3 bananas"), ask if something is in stock, or repeat last week\'s order.',
      },
    ],
  }
}
