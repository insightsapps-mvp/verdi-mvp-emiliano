import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Heart, MessageCircle, Repeat, Search, ShoppingBag, Users, Wallet } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { prodName, useData, useProductoMap } from '@/lib/data'
import { DAY } from '@/data/mock'
import { ars, date, ago, num } from '@/lib/format'
import { rng } from '@/lib/utils'
import type { Cliente } from '@/data/types'
import { Button, Card, Input, Kpi, Modal, PageHeader, ProductAvatar, Td, Th } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { EstadoBadge, useKicker } from '@/components/page'

function Detalle({ c, onClose }: { c: Cliente | null; onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const pm = useProductoMap()
  const pedidos = useData((s) => s.pedidos)
  const historial = useMemo(() => {
    if (!c) return []
    const hoy = pedidos.filter((p) => p.clienteId === c.id).map((p) => ({ fecha: p.creadoEl, codigo: p.codigo, total: p.total, estado: p.estado }))
    const r = rng(c.id.length * 97 + Number(c.id.slice(1)))
    const prev = Array.from({ length: 5 }, (_, i) => ({
      fecha: Date.now() - (i + 1) * (5 + Math.floor(r() * 4)) * DAY,
      codigo: `VT-${900 - i * 17 - Number(c.id.slice(1))}`,
      total: Math.round((8000 + r() * 16000) / 50) * 50,
      estado: 'entregado' as const,
    }))
    return [...hoy, ...prev]
  }, [c, pedidos])
  if (!c) return null
  const fav = pm[c.favorito]
  return (
    <Modal open={!!c} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary-soft text-[15px] font-bold text-secondary">
            {c.nombre
              .split(' ')
              .map((x) => x[0])
              .join('')}
          </span>
          <div>
            <h3 className="text-[17px] font-semibold">{c.nombre}</h3>
            <p className="text-[13px] text-muted">
              {c.barrio} · <span className="num">{c.telefono}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface2 p-2.5">
            <p className="num text-[18px] font-semibold">{c.pedidos}</p>
            <p className="text-[11px] text-muted">{L('pedidos', 'orders')}</p>
          </div>
          <div className="rounded-xl bg-surface2 p-2.5">
            <p className="num text-[15px] font-semibold">{ars(c.gastoMes, lang)}</p>
            <p className="text-[11px] text-muted">{L('este mes', 'this month')}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface2 p-2.5">
            {fav && <ProductAvatar icon={fav.icon} size={24} />}
            <p className="mt-0.5 truncate text-[11px] text-muted">{prodName(fav, lang)}</p>
          </div>
        </div>
        <p className="kicker mb-2 mt-5 text-muted">{L('Historial de pedidos', 'Order history')}</p>
        <div className="divide-y divide-line rounded-xl border border-line">
          {historial.map((h) => (
            <div key={h.codigo} className="flex items-center gap-3 px-3 py-2 text-[13px]">
              <span className="num w-20 font-medium">#{h.codigo}</span>
              <span className="flex-1 text-muted">{date(h.fecha, lang)}</span>
              <EstadoBadge estado={h.estado} />
              <span className="num w-24 text-right">{ars(h.total, lang)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => toast.success(L(`La IA le mandó a ${c.nombre.split(' ')[0]} las ofertas de la semana`, `The AI sent ${c.nombre.split(' ')[0]} this week's deals`))}>
            <MessageCircle size={15} /> {L('Enviar ofertas', 'Send deals')}
          </Button>
          <Button onClick={onClose}>{L('Cerrar', 'Close')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Clientes() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const clientes = useData((s) => s.clientes)
  const pm = useProductoMap()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Cliente | null>(null)
  const close = useCallback(() => setSel(null), [])
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return [...clientes].filter((c) => !qq || c.nombre.toLowerCase().includes(qq) || c.barrio.toLowerCase().includes(qq)).sort((a, b) => b.gastoMes - a.gastoMes)
  }, [clientes, q])
  const recurrentes = clientes.filter((c) => c.pedidos >= 10).length
  const gasto = clientes.reduce((s, c) => s + c.gastoMes, 0)

  return (
    <div>
      <PreviewBanner
        id="clientes"
        bullets={[
          ['Cada vecino que escribe queda registrado con su historial.', 'Every neighbor who writes is saved with their history.'],
          ['Sabés quién compra más, cada cuánto y qué le gusta.', 'You know who buys the most, how often and what they like.'],
          ['La IA usa ese historial para "lo mismo que la semana pasada".', 'The AI uses that history for "the same as last week".'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Clientes frecuentes', 'Frequent customers')}
        subtitle={L(`${clientes.length} clientes activos`, `${clientes.length} active customers`)}
        actions={
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Buscar por nombre o barrio', 'Search by name or area')} className="pl-9" />
          </div>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Clientes activos', 'Active customers')} value={clientes.length} icon={Users} delta={8} />
        <Kpi label={L('Recurrentes', 'Returning')} value={recurrentes} icon={Repeat} accent="blue" hint={L('10+ pedidos', '10+ orders')} />
        <Kpi label={L('Gasto del mes', 'Monthly spend')} value={ars(gasto, lang)} icon={Wallet} accent="orange" />
        <Kpi label={L('Pedidos por cliente', 'Orders per customer')} value={num(4.2, lang, 1)} icon={ShoppingBag} accent="amber" hint={L('promedio mensual', 'monthly average')} />
      </div>
      <Card className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="border-b border-line bg-surface2/60">
              <tr>
                <Th>{L('Cliente', 'Customer')}</Th>
                <Th>{L('Barrio', 'Area')}</Th>
                <Th className="text-right">{L('Pedidos', 'Orders')}</Th>
                <Th>{L('Último pedido', 'Last order')}</Th>
                <Th className="text-right">{L('Gasto del mes', 'Monthly spend')}</Th>
                <Th>{L('Favorito', 'Favorite')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => {
                const fav = pm[c.favorito]
                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-surface2/50" onClick={() => setSel(c)}>
                    <Td className="font-medium">{c.nombre}</Td>
                    <Td className="text-muted">{c.barrio}</Td>
                    <Td className="num text-right">{c.pedidos}</Td>
                    <Td className="text-muted">{ago(c.ultimoPedido, lang)}</Td>
                    <Td className="num text-right font-medium">{ars(c.gastoMes, lang)}</Td>
                    <Td>
                      <span className="flex items-center gap-2 text-muted">
                        {fav && <ProductAvatar icon={fav.icon} size={22} />}
                        {prodName(fav, lang)}
                        {c.pedidos > 25 && <Heart size={13} className="text-secondary" />}
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-line md:hidden">
          {list.map((c) => (
            <button key={c.id} onClick={() => setSel(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-soft text-[13px] font-bold text-secondary">
                {c.nombre
                  .split(' ')
                  .map((x) => x[0])
                  .join('')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{c.nombre}</span>
                <span className="block text-[12px] text-muted">
                  {c.barrio} · {c.pedidos} {L('pedidos', 'orders')}
                </span>
              </span>
              <span className="num text-[13px] font-semibold">{ars(c.gastoMes, lang)}</span>
            </button>
          ))}
        </div>
      </Card>
      <Detalle c={sel} onClose={close} />
    </div>
  )
}
