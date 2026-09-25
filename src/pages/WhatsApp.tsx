import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  Circle,
  CreditCard,
  Leaf,
  Loader2,
  Lock,
  Mic,
  MoreVertical,
  Paperclip,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  Smile,
  Store,
  Wallet,
  X,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useChat, type ChatMsg } from '@/lib/chat'
import { prodName, stockLevel, useData, useProductoMap } from '@/lib/data'
import { ars, qty, time } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, PageHeader, Popover, MenuItem, ProductAvatar } from '@/components/ui'
import { DEV, DevNotice, PreviewBanner } from '@/components/notices'

const typedOnce = new Set<string>()

function Typewriter({ id, text, enabled }: { id: string; text: string; enabled?: boolean }) {
  const [n, setN] = useState(() => (enabled && !typedOnce.has(id) ? 0 : text.length))
  useEffect(() => {
    if (!enabled || typedOnce.has(id)) {
      setN(text.length)
      return
    }
    const step = Math.max(1, Math.ceil(text.length / 60))
    const iv = setInterval(() => {
      setN((v) => {
        const nv = v + step
        if (nv >= text.length) {
          clearInterval(iv)
          typedOnce.add(id)
          return text.length
        }
        return nv
      })
    }, 16)
    return () => clearInterval(iv)
  }, [id, text, enabled])
  return <>{text.slice(0, n)}</>
}

function Meta({ hora, user }: { hora: number; user?: boolean }) {
  const lang = useApp((s) => s.lang)
  return (
    <span className="float-right ml-2 mt-1.5 flex translate-y-1 items-center gap-0.5 text-[10.5px] text-muted">
      {time(hora, lang)}
      {user && <CheckCheck size={14} className="text-sky-500" />}
    </span>
  )
}

function OrderCard({ m }: { m: Extract<ChatMsg, { kind: 'order' }> }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const pm = useProductoMap()
  const confirm = useChat((s) => s.confirmOrder)
  const modify = useChat((s) => s.modifyOrder)
  return (
    <div className={cn('w-[290px] max-w-full overflow-hidden rounded-xl border border-line bg-surface', m.state === 'replaced' && 'opacity-55')}>
      <div className="flex items-center justify-between bg-primary-soft/70 px-3 py-2">
        <span className="text-[12.5px] font-semibold text-primary">🧺 {L('Tu pedido', 'Your order')}</span>
        {m.state === 'confirmed' && (
          <Badge tone="green">
            <Check size={11} /> {L('Confirmado', 'Confirmed')}
          </Badge>
        )}
        {m.state === 'replaced' && <Badge>{L('Actualizado', 'Updated')}</Badge>}
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        {m.items.map((it) => {
          const p = pm[it.productoId]
          return (
            <div key={it.productoId} className="flex items-center gap-2 text-[12.5px]">
              {p && <ProductAvatar icon={p.icon} size={22} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{prodName(p, lang)}</span>
                <span className="num block text-[11px] text-muted">
                  {qty(it.cantidad, p?.unidad ?? 'unidad', lang)} × {ars(p?.precio ?? 0, lang)}
                </span>
              </span>
              <span className="num font-medium">{ars(it.cantidad * (p?.precio ?? 0), lang)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-line px-3 py-2">
        <span className="text-[12px] text-muted">{L('Total', 'Total')}</span>
        <span className="num text-[15px] font-bold">{ars(m.total, lang)}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-1 text-[10.5px] text-primary">
        <ShieldCheck size={12} /> {L('Stock verificado en tiempo real', 'Stock verified in real time')}
      </div>
      {m.state === 'open' && (
        <div className="grid grid-cols-2 border-t border-line">
          <button data-trailer="confirm-order" onClick={confirm} className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary-soft/50">
            <Check size={15} /> {L('Confirmar pedido', 'Confirm order')}
          </button>
          <button onClick={modify} className="flex items-center justify-center gap-1.5 border-l border-line py-2.5 text-[13px] font-medium text-muted hover:bg-surface2">
            <Pencil size={13} /> {L('Modificar', 'Change')}
          </button>
        </div>
      )}
    </div>
  )
}

function PayCard({ m }: { m: Extract<ChatMsg, { kind: 'pay' }> }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const open = useChat((s) => s.openCheckout)
  const num = useData((s) => s.nextNum)
  return (
    <div className="w-[290px] max-w-full overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/15">
          <Wallet size={17} />
        </span>
        <div>
          <p className="text-[13px] font-semibold">{L('Link de pago', 'Payment link')}</p>
          <p className="text-[11.5px] text-sky-600 underline dark:text-sky-400">mpago.la/vt{m.state === 'paid' ? num - 1 : num}</p>
        </div>
        <span className="num ml-auto text-[15px] font-bold">{ars(m.total, lang)}</span>
      </div>
      <div className="px-3 pb-3 pt-2.5">
        {m.state === 'pending' ? (
          <button data-trailer="pay-btn" onClick={open} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-[13px] font-semibold text-white hover:bg-sky-600">
            <CreditCard size={15} /> {L('Pagar con Mercado Pago', 'Pay with Mercado Pago')}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-soft py-2.5 text-[13px] font-semibold text-primary">
            <CheckCircle2 size={15} /> {L('Pagado', 'Paid')}
          </div>
        )}
        <DevNotice compact className="mt-2 px-2 py-1.5" {...DEV.mp} />
      </div>
    </div>
  )
}

function Bubble({ m }: { m: ChatMsg }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const answer = useChat((s) => s.answerOffer)
  if (m.from === 'system') {
    return (
      <div className="my-1 flex justify-center">
        <span className="rounded-lg bg-surface/90 px-3 py-1 text-[11.5px] font-medium text-muted shadow-card">{L(m.es, m.en)}</span>
      </div>
    )
  }
  if (m.from === 'user') {
    return (
      <div className="anim-msg flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-chat-bubble px-3 py-2 text-[14px] leading-snug text-fg shadow-card">
          {lang === 'es' ? m.es : m.en}
          <Meta hora={m.hora} user />
        </div>
      </div>
    )
  }
  const inner = (() => {
    switch (m.kind) {
      case 'order':
        return <OrderCard m={m} />
      case 'pay':
        return <PayCard m={m} />
      case 'paid':
        return (
          <div data-trailer="paid" className="w-[260px] rounded-xl border border-primary/30 bg-primary-soft/70 px-3 py-3">
            <p className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <CheckCircle2 size={18} /> {L('Pago aprobado ✓', 'Payment approved ✓')}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              <span className="num font-semibold text-fg">{ars(m.total, lang)}</span> · Mercado Pago · #{m.codigo}
            </p>
          </div>
        )
      case 'offer':
        return (
          <div className="max-w-[290px]">
            <div className="rounded-2xl rounded-tl-sm bg-surface px-3 py-2 text-[14px] leading-snug shadow-card">
              {L(m.es, m.en)}
              <Meta hora={m.hora} />
            </div>
            {m.state === 'open' && (
              <div className="mt-1.5 flex gap-1.5">
                <button onClick={() => answer(m.id, true)} className="flex-1 rounded-xl bg-surface py-2 text-[13px] font-semibold text-primary shadow-card hover:bg-primary-soft">
                  {L('Sí, separalas', 'Yes, set them aside')}
                </button>
                <button onClick={() => answer(m.id, false)} className="flex-1 rounded-xl bg-surface py-2 text-[13px] font-medium text-muted shadow-card hover:bg-surface2">
                  {L('No, gracias', 'No, thanks')}
                </button>
              </div>
            )}
          </div>
        )
      case 'refund':
        return (
          <div className="max-w-[290px] rounded-2xl rounded-tl-sm border border-info/30 bg-info-soft px-3 py-2 text-[13.5px] leading-snug shadow-card">
            <span className="mb-0.5 flex items-center gap-1.5 text-[12px] font-bold text-info">
              <RotateCcw size={13} /> {L('Reembolso iniciado', 'Refund started')}
            </span>
            {L(m.es, m.en)}
          </div>
        )
      default:
        return (
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-surface px-3 py-2 text-[14px] leading-snug shadow-card">
            <Typewriter id={`${m.id}-${lang}`} text={L(m.es, m.en)} enabled={m.typewriter} />
            <Meta hora={m.hora} />
          </div>
        )
    }
  })()
  return <div className="anim-msg flex justify-start">{inner}</div>
}

function Checkout() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const open = useChat((s) => s.checkoutOpen)
  const close = useChat((s) => s.closeCheckout)
  const pay = useChat((s) => s.pay)
  const cart = useChat((s) => s.cart)
  const productos = useData((s) => s.productos)
  const setRole = useApp((s) => s.setRole)
  const cancelPreview = useApp((s) => s.cancelPreview)
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'form' | 'processing' | 'ok'>('form')
  const total = Math.round(cart.reduce((s, c) => s + c.cantidad * (productos.find((p) => p.id === c.productoId)?.precio ?? 0), 0))
  useEffect(() => {
    if (open) setPhase('form')
  }, [open])
  if (!open) return null
  const doPay = () => {
    setPhase('processing')
    setTimeout(() => {
      setPhase('ok')
      setTimeout(async () => {
        const pedido = await pay()
        if (useApp.getState().trailerActive) return
        toast.success(L('El pedido ya apareció en la app de la verdulería', 'The order already showed up in the shop app'), {
          description: `#${pedido.codigo} · ${ars(pedido.total, lang)}`,
          duration: 9000,
          action: {
            label: L('Ver →', 'View →'),
            onClick: () => {
              cancelPreview()
              setRole('verduleria')
              useData.getState().setHighlight(pedido.id)
              navigate('/pedidos')
            },
          },
        })
      }, 900)
    }, 1300)
  }
  return (
    <div className="absolute inset-0 z-20 flex items-end">
      <div className="anim-fade absolute inset-0 bg-black/40" onClick={phase === 'form' ? close : undefined} />
      <div className="anim-sheet-up relative w-full rounded-t-2xl bg-surface p-5 shadow-pop">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        {phase === 'ok' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-white dark:text-zinc-950">
              <Check size={30} strokeWidth={3} />
            </span>
            <p className="mt-3 text-[18px] font-bold">{L('Pago aprobado ✓', 'Payment approved ✓')}</p>
            <p className="num mt-1 text-muted">{ars(total, lang)}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker text-sky-600 dark:text-sky-400">{L('Checkout de prueba', 'Test checkout')}</p>
                <p className="text-[15px] font-semibold">Mercado Pago</p>
              </div>
              <button onClick={close} disabled={phase !== 'form'} aria-label={L('Cerrar', 'Close')} className="rounded-lg p-1.5 text-muted hover:bg-surface2">
                <X size={17} />
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-surface2 p-3">
              <p className="text-[12px] text-muted">{L('Verdulería Don Tito · pedido por WhatsApp', 'Don Tito produce shop · WhatsApp order')}</p>
              <p className="num mt-0.5 text-[26px] font-bold">{ars(total, lang)}</p>
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-3 rounded-xl border-2 border-sky-500 px-3 py-2.5 text-[13.5px]">
                <Wallet size={17} className="text-sky-600" />
                <span className="flex-1 font-medium">{L('Dinero en cuenta', 'Account balance')}</span>
                <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-[13.5px] text-muted">
                <CreditCard size={17} />
                <span className="flex-1">{L('Tarjeta de débito', 'Debit card')} •••• 4821</span>
                <Circle size={16} />
              </label>
            </div>
            <button
              data-trailer="checkout-pay"
              onClick={doPay}
              disabled={phase !== 'form'}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-[14.5px] font-semibold text-white hover:bg-sky-600 disabled:opacity-80"
            >
              {phase === 'processing' ? <Loader2 size={17} className="animate-spin" /> : <Lock size={15} />}
              {phase === 'processing' ? L('Procesando…', 'Processing…') : `${L('Pagar', 'Pay')} ${ars(total, lang)}`}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">{L('Simulación: no se cobra nada real.', 'Simulation: nothing is actually charged.')}</p>
          </>
        )}
      </div>
    </div>
  )
}

export const CHIPS: [string, string][] = [
  ['Hola! quiero 2 kg de tomate y una lechuga', 'Hi! I want 2 kg of tomatoes and a lettuce'],
  ['¿Tenés palta?', 'Do you have avocados?'],
  ['Mandame lo mismo que la semana pasada', 'Send me the same as last week'],
  ['Cambiá la lechuga por rúcula', 'Swap the lettuce for arugula'],
]

function ChatWindow({ className }: { className?: string }) {
  const L = useL()
  const lang = useApp((s) => s.lang)
  const msgs = useChat((s) => s.msgs)
  const typing = useChat((s) => s.typing)
  const send = useChat((s) => s.send)
  const reset = useChat((s) => s.reset)
  const [text, setText] = useState('')
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const v = text.trim()
      if (!v) return
      send(v)
      setText('')
    },
    [text, send],
  )

  const deco = (es: string, en: string) => () => toast(L(es, en))

  return (
    <div data-trailer="chat" className={cn('relative flex flex-col overflow-hidden bg-surface', className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 bg-[#075e54] px-3 py-2.5 text-white dark:bg-[#1f2c34]">
        <ArrowLeft size={19} className="opacity-80" />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-primary">
          <Leaf size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14.5px] font-semibold">Verdulería Don Tito</p>
          <p className="text-[11.5px] text-white/80">{typing ? L('escribiendo…', 'typing…') : `● ${L('en línea', 'online')}`}</p>
        </div>
        <Popover
          className="w-52 text-fg"
          trigger={({ toggle }) => (
            <button onClick={toggle} aria-label={L('Opciones', 'Options')} className="rounded-full p-1.5 hover:bg-white/10">
              <MoreVertical size={18} />
            </button>
          )}
        >
          {(close) => (
            <MenuItem
              icon={RotateCcw}
              onClick={() => {
                close()
                reset()
              }}
            >
              {L('Reiniciar conversación', 'Restart conversation')}
            </MenuItem>
          )}
        </Popover>
      </div>

      {/* Mensajes */}
      <div ref={scroller} className="chat-pattern flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <div className="flex justify-center">
          <span className="max-w-[90%] rounded-lg bg-warning-soft px-3 py-1.5 text-center text-[11.5px] text-amber-900 shadow-card dark:text-amber-100">
            🔧 WhatsApp Business API · {L('función en desarrollo. Las respuestas están pre-programadas.', 'feature in development. Replies are pre-programmed.')}
          </span>
        </div>
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-surface px-3.5 py-3 shadow-card">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot h-2 w-2 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto bg-chat-bg px-3 pb-1.5 pt-1">
        {CHIPS.map(([es, en], i) => (
          <button
            key={i}
            data-trailer={`chip-${i}`}
            onClick={() => send({ es, en })}
            className="shrink-0 rounded-full border border-primary/25 bg-surface px-3 py-1.5 text-[12.5px] font-medium text-primary shadow-card hover:bg-primary-soft"
          >
            {lang === 'es' ? es : en}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={submit} className="flex items-center gap-2 bg-chat-bg px-2.5 pb-2.5 pt-1">
        <div className="flex flex-1 items-center gap-1 rounded-full bg-surface px-2 shadow-card">
          <button type="button" onClick={deco('Los emojis llegan con la integración real 😉', 'Emojis arrive with the real integration 😉')} className="p-1.5 text-muted" aria-label="Emoji">
            <Smile size={19} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={L('Escribí un mensaje', 'Type a message')}
            className="h-10 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
          />
          <button type="button" onClick={deco('Adjuntar fotos de la lista: en desarrollo', 'Attaching photos of your list: in development')} className="p-1.5 text-muted" aria-label={L('Adjuntar', 'Attach')}>
            <Paperclip size={18} />
          </button>
        </div>
        {text.trim() ? (
          <button type="submit" aria-label={L('Enviar', 'Send')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00a884] text-white">
            <Send size={18} />
          </button>
        ) : (
          <button type="button" onClick={deco('Los audios los transcribe la IA en la versión real 🎙️', 'Voice notes are transcribed by the AI in the real version 🎙️')} aria-label={L('Audio', 'Voice note')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00a884] text-white">
            <Mic size={19} />
          </button>
        )}
      </form>
      <Checkout />
    </div>
  )
}

function BehindPanel() {
  const L = useL()
  const lang = useApp((s) => s.lang)
  const progress = useChat((s) => s.progress)
  const cart = useChat((s) => s.cart)
  const last = useChat((s) => s.lastPedido)
  const reset = useChat((s) => s.reset)
  const productos = useData((s) => s.productos)
  const setRole = useApp((s) => s.setRole)
  const cancelPreview = useApp((s) => s.cancelPreview)
  const navigate = useNavigate()
  const steps: [keyof typeof progress, string, string][] = [
    ['entendio', 'La IA entendió el pedido', 'The AI understood the order'],
    ['stock', 'Validó el stock en tiempo real', 'It checked stock in real time'],
    ['link', 'Mandó el link de Mercado Pago', 'It sent the Mercado Pago link'],
    ['pago', 'Pago aprobado', 'Payment approved'],
    ['app', 'El pedido entró en la app de la verdulería', 'The order reached the shop app'],
  ]
  const ids = cart.length ? cart.map((c) => c.productoId) : last ? last.items.map((i) => i.productoId) : ['tomate', 'lechuga', 'palta']
  const watch = productos.filter((p) => ids.includes(p.id))
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="kicker text-primary">{L('En vivo', 'Live')}</p>
        <h3 className="mt-1 text-[16px] font-semibold">{L('Lo que pasa detrás', 'What happens behind the scenes')}</h3>
        <ol className="mt-4 space-y-3">
          {steps.map(([k, es, en], i) => {
            const done = progress[k]
            return (
              <li key={k} className="flex items-center gap-3">
                <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-colors', done ? 'bg-primary text-white dark:text-zinc-950' : 'bg-surface2 text-muted')}>
                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('text-[13.5px] transition-colors', done ? 'font-medium' : 'text-muted')}>{L(es, en)}</span>
              </li>
            )
          })}
        </ol>
        {last && (
          <Button
            className="mt-5 w-full"
            variant="orange"
            onClick={() => {
              cancelPreview()
              setRole('verduleria')
              useData.getState().setHighlight(last.id)
              navigate('/pedidos')
            }}
          >
            <Store size={15} /> {L(`Ver #${last.codigo} en la app de la verdulería`, `See #${last.codigo} in the shop app`)}
          </Button>
        )}
      </Card>
      <Card className="p-5">
        <h3 className="text-[14px] font-semibold">{L('Stock en vivo', 'Live stock')}</h3>
        <p className="text-[12.5px] text-muted">{L('Se descuenta apenas se aprueba el pago.', 'Deducted as soon as the payment is approved.')}</p>
        <div className="mt-3 space-y-2">
          {watch.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 text-[13px]">
              <ProductAvatar icon={p.icon} size={26} />
              <span className="flex-1">{prodName(p, lang)}</span>
              <span className={cn('num font-semibold', stockLevel(p) !== 'ok' && 'text-danger')}>{qty(p.stock, p.unidad, lang)}</span>
            </div>
          ))}
        </div>
      </Card>
      <DevNotice {...DEV.whatsapp} />
      <Button variant="secondary" className="w-full" onClick={reset}>
        <RotateCcw size={15} /> {L('Reiniciar conversación', 'Restart conversation')}
      </Button>
    </div>
  )
}

export default function WhatsApp() {
  const L = useL()
  return (
    <div>
      <div className="hidden lg:block">
        <PreviewBanner
          id="whatsapp"
          android={false}
          bullets={[
            ['El vecino pide como le sale: la IA entiende productos coloquiales y cantidades.', 'Neighbors order however they like: the AI understands colloquial products and quantities.'],
            ['Valida stock antes de confirmar y manda el link de Mercado Pago.', 'It checks stock before confirming and sends the Mercado Pago link.'],
            ['El pedido pagado entra solo en la app de la verdulería.', 'The paid order lands in the shop app on its own.'],
          ]}
        />
        <PageHeader
          kicker={L('ASÍ LO VE TU CLIENTE · WHATSAPP', 'HOW YOUR CUSTOMER SEES IT · WHATSAPP')}
          kickerTone="chat"
          title={L('Pedí como un vecino', 'Order like a neighbor')}
          subtitle={L('Laura Giménez, clienta de Villa Crespo, le escribe a Don Tito. Probá los chips o escribí libre.', 'Laura Giménez, a Villa Crespo customer, writes to Don Tito. Try the chips or type freely.')}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="-mx-4 -mt-5 sm:-mx-6 lg:m-0">
          <ChatWindow className="h-[calc(100dvh-56px-68px)] lg:h-[680px] lg:rounded-2xl lg:border lg:border-line lg:shadow-pop" />
        </div>
        <div className="hidden lg:block">
          <BehindPanel />
        </div>
      </div>
    </div>
  )
}
