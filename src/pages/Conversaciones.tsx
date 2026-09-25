import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Bot, CheckCircle2, Hand, MessageCircle, Send, UserRound } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useClienteMap, useData } from '@/lib/data'
import { time } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, Input, Kpi, PageHeader, Tabs } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'

export default function Conversaciones() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const convs = useData((s) => s.conversaciones)
  const cm = useClienteMap()
  const [filtro, setFiltro] = useState<'todas' | 'ia' | 'derivadas'>('todas')
  const [sel, setSel] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [extra, setExtra] = useState<Record<string, { es: string; hora: number }[]>>({})

  const resueltas = convs.filter((c) => c.resueltaPorIA).length
  const pctIA = Math.round((resueltas / convs.length) * 100)
  const list = convs.filter((c) => filtro === 'todas' || (filtro === 'ia' ? c.resueltaPorIA : !c.resueltaPorIA))
  const active = convs.find((c) => c.id === sel) ?? (typeof window !== 'undefined' && window.innerWidth >= 1024 ? list[0] : undefined)

  const send = () => {
    if (!reply.trim() || !active) return
    setExtra((e) => ({ ...e, [active.id]: [...(e[active.id] ?? []), { es: reply.trim(), hora: Date.now() }] }))
    setReply('')
    toast.success(L('Mensaje enviado por WhatsApp', 'Message sent via WhatsApp'))
  }

  return (
    <div>
      <PreviewBanner
        id="conversaciones"
        bullets={[
          ['Todos los chats que atendió la IA, con el pedido que generaron.', 'Every chat the AI handled, with the order it generated.'],
          ['Si la IA no puede resolver (reclamos, mayoristas), deriva al verdulero.', "If the AI can't solve it (complaints, wholesale), it hands off to the shopkeeper."],
          ['El verdulero responde desde la app sin sacar su WhatsApp personal.', 'The shopkeeper replies from the app without using their personal WhatsApp.'],
        ]}
      />
      <PageHeader kicker={kicker} kickerTone={tone} title={L('Conversaciones de la IA', 'AI conversations')} subtitle={L('Chats de WhatsApp de hoy', "Today's WhatsApp chats")} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label={L('Resueltos sin intervención', 'Solved without help')} value={`${pctIA}%`} icon={Bot} delta={4} className="col-span-2 lg:col-span-1" />
        <Kpi label={L('Conversaciones hoy', 'Chats today')} value={convs.length} icon={MessageCircle} accent="blue" />
        <Kpi label={L('Derivadas a vos', 'Handed to you')} value={convs.length - resueltas} icon={Hand} accent="orange" />
      </div>

      <Card className="grid overflow-hidden lg:h-[620px] lg:grid-cols-[340px_1fr]">
        {/* Lista */}
        <div className={cn('flex min-h-0 flex-col border-line lg:border-r', active && sel ? 'hidden lg:flex' : 'flex')}>
          <div className="border-b border-line p-3">
            <Tabs
              value={filtro}
              onChange={setFiltro}
              items={[
                { value: 'todas', label: L('Todas', 'All'), count: convs.length },
                { value: 'ia', label: L('IA', 'AI'), count: resueltas },
                { value: 'derivadas', label: L('Derivadas', 'Handed off'), count: convs.length - resueltas },
              ]}
            />
          </div>
          <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {list.map((c) => {
              const cli = cm[c.clienteId]
              const last = c.mensajes[c.mensajes.length - 1]
              return (
                <button key={c.id} onClick={() => setSel(c.id)} className={cn('flex w-full gap-3 px-3.5 py-3 text-left hover:bg-surface2/60', active?.id === c.id && 'bg-primary-soft/40')}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface2 text-[13px] font-bold text-muted">
                    {cli?.nombre
                      .split(' ')
                      .map((x) => x[0])
                      .join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold">{cli?.nombre}</span>
                      <span className="num shrink-0 text-[11px] text-muted">{time(last.hora, lang)}</span>
                    </span>
                    <span className="block truncate text-[12.5px] text-muted">{L(last.es, last.en)}</span>
                    <span className="mt-1 block">
                      {c.resueltaPorIA ? (
                        <Badge tone="green">
                          <Bot size={11} /> {L('Resuelto por IA', 'Solved by AI')}
                        </Badge>
                      ) : (
                        <Badge tone="orange">
                          <Hand size={11} /> {L('Derivado al verdulero', 'Handed to shopkeeper')}
                        </Badge>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        {/* Detalle */}
        {active && (
          <div className={cn('min-h-0 flex-col', sel ? 'flex' : 'hidden lg:flex')}>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Button size="iconSm" variant="ghost" className="lg:hidden" onClick={() => setSel(null)} aria-label={L('Volver', 'Back')}>
                <ArrowLeft size={17} />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold">{cm[active.clienteId]?.nombre}</p>
                <p className="text-[12px] text-muted">
                  {cm[active.clienteId]?.barrio} · {L(active.tema.es, active.tema.en)}
                </p>
              </div>
              {active.resueltaPorIA ? (
                <Badge tone="green">
                  <CheckCircle2 size={11} /> {L('Resuelto por IA', 'Solved by AI')}
                </Badge>
              ) : (
                <Badge tone="orange">{L('Derivado', 'Handed off')}</Badge>
              )}
            </div>
            <div className="chat-pattern min-h-[360px] flex-1 space-y-2 overflow-y-auto p-4">
              {active.mensajes.map((m, i) => (
                <div key={i} className={cn('flex', m.from === 'cliente' ? 'justify-start' : 'justify-end')}>
                  <div className={cn('max-w-[78%] rounded-2xl px-3 py-2 text-[13.5px] shadow-card', m.from === 'cliente' ? 'rounded-tl-sm bg-surface' : 'rounded-tr-sm bg-chat-bubble')}>
                    {m.from !== 'cliente' && (
                      <span className={cn('mb-0.5 flex items-center gap-1 text-[11px] font-bold', m.from === 'ia' ? 'text-primary' : 'text-secondary')}>
                        {m.from === 'ia' ? <Bot size={12} /> : <UserRound size={12} />}
                        {m.from === 'ia' ? L('IA de Verdi', 'Verdi AI') : 'Tito'}
                      </span>
                    )}
                    {L(m.es, m.en)}
                    <span className="num ml-2 text-[10.5px] text-muted">{time(m.hora, lang)}</span>
                  </div>
                </div>
              ))}
              {(extra[active.id] ?? []).map((m, i) => (
                <div key={`x${i}`} className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-chat-bubble px-3 py-2 text-[13.5px] shadow-card">
                    <span className="mb-0.5 flex items-center gap-1 text-[11px] font-bold text-secondary">
                      <UserRound size={12} /> {L('Vos', 'You')}
                    </span>
                    {m.es}
                    <span className="num ml-2 text-[10.5px] text-muted">{time(m.hora, lang)}</span>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2 border-t border-line p-3"
            >
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={L('Responder como verdulero…', 'Reply as the shopkeeper…')} />
              <Button type="submit" size="icon" aria-label={L('Enviar', 'Send')} disabled={!reply.trim()}>
                <Send size={16} />
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  )
}
