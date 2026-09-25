import { useMemo } from 'react'
import { toast } from 'sonner'
import { Download, Printer } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { prodName, useClienteMap, useData, useProductoMap } from '@/lib/data'
import { ars, dateTime, qty } from '@/lib/format'
import { ROLE_USER } from '@/lib/roles'
import type { Pedido } from '@/data/types'
import { Button, Modal } from './ui'
import { DEV, DevNotice } from './notices'

/** Código de barras SVG determinístico a partir de un string */
export function Barcode({ value, height = 44 }: { value: string; height?: number }) {
  const bars = useMemo(() => {
    const out: { x: number; w: number }[] = []
    let x = 0
    let h = 0
    for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    // quiet zone + start
    x += 6
    for (let i = 0; i < 64; i++) {
      h = (h * 1103515245 + 12345) >>> 0
      const w = 1 + ((h >>> 8) % 3)
      if (i % 2 === 0) out.push({ x, w })
      x += w
    }
    return { out, width: x + 6 }
  }, [value])
  return (
    <svg viewBox={`0 0 ${bars.width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-label={value}>
      <rect width={bars.width} height={height} fill="#fff" />
      {bars.out.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#111" />
      ))}
    </svg>
  )
}

export function Ticket80({ pedido, numero }: { pedido: Pedido; numero: string }) {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const pm = useProductoMap()
  const cm = useClienteMap()
  const cli = cm[pedido.clienteId]
  const medio = { mercadopago: 'Mercado Pago', efectivo: L('Efectivo', 'Cash'), transferencia: L('Transferencia', 'Transfer') }[pedido.medioPago]
  return (
    <div className="mx-auto w-[302px] bg-white px-4 py-5 font-mono text-[11.5px] leading-[1.45] text-zinc-900 shadow-[0_2px_12px_rgba(0,0,0,.12)]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
      <div className="text-center">
        <p className="text-[14px] font-bold">VERDULERÍA DON TITO</p>
        <p>Av. Corrientes 5230 · Villa Crespo</p>
        <p>CUIT 20-28456123-7</p>
        <p>{L('Resp. Monotributo', 'Simplified tax regime')}</p>
      </div>
      <p className="my-2 border-t border-dashed border-zinc-400" />
      <div className="flex justify-between">
        <span>{L('Ticket', 'Receipt')}</span>
        <span>{numero}</span>
      </div>
      <div className="flex justify-between">
        <span>{L('Pedido', 'Order')}</span>
        <span>#{pedido.codigo}</span>
      </div>
      <div className="flex justify-between">
        <span>{L('Fecha', 'Date')}</span>
        <span>{dateTime(pedido.creadoEl, lang)}</span>
      </div>
      <div className="flex justify-between">
        <span>{L('Cliente', 'Customer')}</span>
        <span className="max-w-[160px] truncate">{cli?.nombre}</span>
      </div>
      <p className="my-2 border-t border-dashed border-zinc-400" />
      {pedido.items.map((it) => {
        const p = pm[it.productoId]
        return (
          <div key={it.productoId} className="mb-1">
            <p className="truncate uppercase">{prodName(p, lang)}</p>
            <div className="flex justify-between text-zinc-600">
              <span>
                {qty(it.cantidad, p?.unidad ?? 'unidad', lang)} x {ars(it.precio, lang)}
              </span>
              <span className="text-zinc-900">{ars(it.cantidad * it.precio, lang)}</span>
            </div>
          </div>
        )
      })}
      <p className="my-2 border-t border-dashed border-zinc-400" />
      <div className="flex justify-between text-[14px] font-bold">
        <span>TOTAL</span>
        <span>{ars(pedido.total, lang)}</span>
      </div>
      <div className="flex justify-between">
        <span>{L('Pago', 'Payment')}</span>
        <span>{medio}</span>
      </div>
      <div className="flex justify-between">
        <span>{L('Entrega', 'Delivery')}</span>
        <span>{pedido.entregaFranja} hs</span>
      </div>
      <p className="my-2 border-t border-dashed border-zinc-400" />
      <Barcode value={numero} />
      <p className="mt-1 text-center tracking-[0.2em]">{numero.replace('-', '')}</p>
      <p className="mt-2 text-center">{L('¡Gracias por tu compra!', 'Thanks for your purchase!')}</p>
      <p className="text-center text-[10px] text-zinc-500">{L('Pedí por WhatsApp · Verdi', 'Order on WhatsApp · Verdi')}</p>
    </div>
  )
}

/** Modal con preview del ticket 80mm + imprimir / descargar PDF */
export function TicketModal({ pedidoId, onClose }: { pedidoId: string | null; onClose: () => void }) {
  const L = useL()
  const role = useApp((s) => s.role)
  const pedido = useData((s) => s.pedidos.find((p) => p.id === pedidoId))
  const printTicket = useData((s) => s.printTicket)
  const existing = useData((s) => s.tickets.find((t) => t.pedidoId === pedidoId))
  const seq = useData((s) => s.ticketSeq)
  const numero = existing?.numero ?? `0001-${String(seq).padStart(8, '0')}`
  if (!pedido) return null
  const usuario = ROLE_USER[role].nombre
  return (
    <Modal open={!!pedidoId} onClose={onClose} className="max-w-[420px]">
      <div className="p-5" data-trailer="ticket-modal">
        <h3 className="text-[16px] font-semibold">{L('Vista previa del ticket', 'Receipt preview')}</h3>
        <p className="mb-3 text-[12.5px] text-muted">{L('Térmica 80mm · Térmica mostrador', '80mm thermal · Counter thermal')}</p>
        <DevNotice compact className="mb-3" {...DEV.print} />
        <div className="rounded-xl bg-zinc-100 py-4 dark:bg-zinc-800/60">
          <Ticket80 pedido={pedido} numero={numero} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const n = printTicket(pedido.id, 'nube', usuario)
              toast.success(L(`PDF del ticket ${n} generado (simulado)`, `Receipt ${n} PDF generated (simulated)`))
            }}
          >
            <Download size={15} /> {L('Descargar PDF', 'Download PDF')}
          </Button>
          <Button
            onClick={() => {
              const n = printTicket(pedido.id, 'local', usuario)
              toast.success(L(`Ticket ${n} enviado a Térmica mostrador`, `Receipt ${n} sent to Counter thermal`))
              onClose()
            }}
          >
            <Printer size={15} /> {L('Imprimir', 'Print')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
