import { create } from 'zustand'
import { cartTotal, mergeCart, respond, type BotReply, type CartItem } from './bot'
import { useData } from './data'
import { LAURA_ULTIMO } from '@/data/mock'
import type { Pedido } from '@/data/types'

export type ChatMsg =
  | { id: string; from: 'user'; es: string; en: string; hora: number }
  | { id: string; from: 'bot'; kind: 'text' | 'refund'; es: string; en: string; hora: number; typewriter?: boolean }
  | { id: string; from: 'bot'; kind: 'order'; items: CartItem[]; total: number; state: 'open' | 'confirmed' | 'replaced'; hora: number }
  | { id: string; from: 'bot'; kind: 'offer'; productoId: string; cantidad: number; es: string; en: string; state: 'open' | 'yes' | 'no'; hora: number }
  | { id: string; from: 'bot'; kind: 'pay'; total: number; state: 'pending' | 'paid'; hora: number }
  | { id: string; from: 'bot'; kind: 'paid'; total: number; codigo: string; hora: number }
  | { id: string; from: 'system'; es: string; en: string; hora: number }

export type Stage = 'idle' | 'draft' | 'awaiting_pay' | 'paid'

/** Progreso del circuito, para el panel "Lo que pasa detrás" */
export interface Progress {
  entendio: boolean
  stock: boolean
  link: boolean
  pago: boolean
  app: boolean
}

interface ChatState {
  msgs: ChatMsg[]
  cart: CartItem[]
  stage: Stage
  typing: boolean
  checkoutOpen: boolean
  lastPedido: Pedido | null
  progress: Progress
  send: (text: { es: string; en: string } | string) => void
  confirmOrder: () => void
  modifyOrder: () => void
  answerOffer: (msgId: string, yes: boolean) => void
  openCheckout: () => void
  closeCheckout: () => void
  pay: () => Promise<Pedido>
  reset: () => void
}

let seq = 0
const mid = () => `m${Date.now()}${seq++}`
const timers = new Set<ReturnType<typeof setTimeout>>()
const later = (fn: () => void, ms: number) => {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

const EMPTY_PROGRESS: Progress = { entendio: false, stock: false, link: false, pago: false, app: false }

const initialMsgs = (): ChatMsg[] => [
  {
    id: 'sys0',
    from: 'system',
    es: 'Hoy',
    en: 'Today',
    hora: Date.now(),
  },
]

export const useChat = create<ChatState>((set, get) => {
  /** Encola respuestas del bot con "escribiendo…" entre cada una */
  const pushReplies = (replies: BotReply[], after?: () => void) => {
    let delay = 0
    replies.forEach((r, i) => {
      const typingMs = r.kind === 'order' ? 650 : 900 + Math.min(700, ('es' in r ? r.es.length : 30) * 8)
      later(() => set({ typing: true }), delay)
      delay += typingMs
      later(() => {
        const hora = Date.now()
        const { cart, productos } = { cart: get().cart, productos: useData.getState().productos }
        let msg: ChatMsg
        if (r.kind === 'order') {
          // las órdenes anteriores abiertas quedan reemplazadas
          set((s) => ({ msgs: s.msgs.map((m) => (m.from === 'bot' && m.kind === 'order' && m.state === 'open' ? { ...m, state: 'replaced' } : m)) }))
          msg = { id: mid(), from: 'bot', kind: 'order', items: cart.map((c) => ({ ...c })), total: cartTotal(cart, productos), state: 'open', hora }
        } else if (r.kind === 'offer') {
          msg = { id: mid(), from: 'bot', kind: 'offer', productoId: r.productoId, cantidad: r.cantidad, es: r.es, en: r.en, state: 'open', hora }
        } else {
          msg = { id: mid(), from: 'bot', kind: r.kind, es: r.es, en: r.en, hora, typewriter: true }
        }
        set((s) => ({ msgs: [...s.msgs, msg], typing: i < replies.length - 1 }))
        if (i === replies.length - 1) after?.()
      }, delay)
      delay += 250
    })
  }

  return {
    msgs: initialMsgs(),
    cart: [],
    stage: 'idle',
    typing: false,
    checkoutOpen: false,
    lastPedido: null,
    progress: { ...EMPTY_PROGRESS },

    send: (text) => {
      const es = typeof text === 'string' ? text : text.es
      const en = typeof text === 'string' ? text : text.en
      const s = get()
      set({ msgs: [...s.msgs, { id: mid(), from: 'user', es, en, hora: Date.now() }] })
      const res = respond(es, {
        cart: s.cart,
        stage: s.stage,
        productos: useData.getState().productos,
        lastPedidoCodigo: s.lastPedido?.codigo,
        history: s.stage === 'paid' && s.lastPedido ? s.lastPedido.items : LAURA_ULTIMO,
      })
      // efectos sobre el store de datos (pedido ya pagado)
      if (res.intent === 'cancel_paid' && s.lastPedido) {
        const pid = s.lastPedido.id
        later(() => useData.getState().refundPedido(pid), 1400)
      }
      if (res.intent === 'swap_paid' && s.lastPedido && res.swap) {
        const pid = s.lastPedido.id
        const sw = res.swap
        later(() => useData.getState().swapItem(pid, sw.from, sw.to), 1400)
      }
      if (res.cart) {
        set({ cart: res.cart, stage: res.cart.length ? 'draft' : 'idle' })
        if (res.cart.length) set({ progress: { ...EMPTY_PROGRESS } })
      }
      later(() => set({ typing: true }), 350)
      later(() => {
        if (res.cart && res.cart.length) set((st) => ({ progress: { ...st.progress, entendio: true } }))
        pushReplies(res.replies, () => {
          if (res.cart && res.cart.length) set((st) => ({ progress: { ...st.progress, stock: true } }))
        })
      }, 500)
    },

    confirmOrder: () => {
      const s = get()
      if (!s.cart.length) return
      set({
        msgs: [
          ...s.msgs.map((m) => (m.from === 'bot' && m.kind === 'order' && m.state === 'open' ? { ...m, state: 'confirmed' as const } : m)),
          { id: mid(), from: 'user', es: 'Confirmar pedido ✅', en: 'Confirm order ✅', hora: Date.now() },
        ],
        stage: 'awaiting_pay',
      })
      const total = cartTotal(s.cart, useData.getState().productos)
      later(() => set({ typing: true }), 300)
      later(() => {
        set((st) => ({
          typing: false,
          msgs: [...st.msgs, { id: mid(), from: 'bot', kind: 'text', es: '¡Genial! Te paso el link de pago de Mercado Pago 👇', en: "Great! Here's your Mercado Pago payment link 👇", hora: Date.now(), typewriter: true }],
        }))
      }, 1200)
      later(() => {
        set((st) => ({
          msgs: [...st.msgs, { id: mid(), from: 'bot', kind: 'pay', total, state: 'pending', hora: Date.now() }],
          progress: { ...st.progress, link: true },
        }))
      }, 1900)
    },

    modifyOrder: () => {
      set((s) => ({ msgs: [...s.msgs, { id: mid(), from: 'user', es: 'Modificar', en: 'Change it', hora: Date.now() }] }))
      pushReplies([{ kind: 'text', es: 'Dale, decime qué querés cambiar o sumar. Ej: "cambiá la lechuga por rúcula" o "sumale 1 kg de papa".', en: 'Sure, tell me what you want to change or add. E.g. "swap the lettuce for arugula" or "add 1 kg of potatoes".' }])
    },

    answerOffer: (msgId, yes) => {
      const s = get()
      const m = s.msgs.find((x) => x.id === msgId)
      if (!m || m.from !== 'bot' || m.kind !== 'offer' || m.state !== 'open') return
      const p = useData.getState().productos.find((x) => x.id === m.productoId)!
      set({
        msgs: [
          ...s.msgs.map((x) => (x.id === msgId ? { ...m, state: yes ? ('yes' as const) : ('no' as const) } : x)),
          yes ? { id: mid(), from: 'user', es: 'Sí, separalas 🙌', en: 'Yes, set them aside 🙌', hora: Date.now() } : { id: mid(), from: 'user', es: 'No, gracias', en: 'No, thanks', hora: Date.now() },
        ],
      })
      if (yes) {
        const cart = mergeCart(s.cart, [{ productoId: p.id, cantidad: m.cantidad }])
        set({ cart, stage: 'draft', progress: { ...get().progress, entendio: true } })
        later(() => set({ typing: true }), 300)
        later(
          () =>
            pushReplies(
              [
                { kind: 'text', es: `¡Hecho! Te separé ${p.nombre.toLowerCase()} y ya las descontamos del stock para que no se vendan.`, en: `Done! I set aside the ${p.nombreEn.toLowerCase()} and took them out of stock so nobody else gets them.` },
                { kind: 'order' },
              ],
              () => set((st) => ({ progress: { ...st.progress, stock: true } })),
            ),
          400,
        )
      } else {
        pushReplies([{ kind: 'text', es: 'Perfecto. ¿Querés algo más?', en: 'Perfect. Anything else?' }])
      }
    },

    openCheckout: () => set({ checkoutOpen: true }),
    closeCheckout: () => set({ checkoutOpen: false }),

    pay: () =>
      new Promise<Pedido>((resolve) => {
        const s = get()
        const productos = useData.getState().productos
        const items = s.cart.map((c) => ({ productoId: c.productoId, cantidad: c.cantidad, precio: productos.find((p) => p.id === c.productoId)!.precio }))
        const log = s.msgs
          .filter((m) => m.from === 'user' || (m.from === 'bot' && (m.kind === 'text' || m.kind === 'refund')))
          .map((m) => ({ from: m.from === 'user' ? ('cliente' as const) : ('ia' as const), es: (m as { es: string }).es, en: (m as { en: string }).en }))
        const pedido = useData.getState().addPedidoWhatsApp(items, 'c1', log)
        set((st) => ({
          checkoutOpen: false,
          stage: 'paid',
          lastPedido: pedido,
          cart: [],
          progress: { ...st.progress, pago: true },
          msgs: [
            ...st.msgs.map((m) => (m.from === 'bot' && m.kind === 'pay' && m.state === 'pending' ? { ...m, state: 'paid' as const } : m)),
            { id: mid(), from: 'bot', kind: 'paid', total: pedido.total, codigo: pedido.codigo, hora: Date.now() },
          ],
        }))
        later(() => set({ typing: true }), 500)
        later(() => {
          set((st) => ({
            typing: false,
            progress: { ...st.progress, app: true },
            msgs: [
              ...st.msgs,
              {
                id: mid(),
                from: 'bot',
                kind: 'text',
                es: `¡Listo! Pedido #${pedido.codigo} confirmado. Te lo llevamos entre 18 y 19 hs. 🛵`,
                en: `All set! Order #${pedido.codigo} confirmed. We'll deliver it between 6 and 7 PM. 🛵`,
                hora: Date.now(),
                typewriter: true,
              },
            ],
          }))
          resolve(pedido)
        }, 1500)
      }),

    reset: () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      set({ msgs: initialMsgs(), cart: [], stage: 'idle', typing: false, checkoutOpen: false, lastPedido: null, progress: { ...EMPTY_PROGRESS } })
    },
  }
})
