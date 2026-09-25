import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Cloud, FileText, Printer, PrinterCheck, AlertTriangle, Download, Hash } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useData } from '@/lib/data'
import { ars, dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, CardHeader, PageHeader, Td, Th } from '@/components/ui'
import { DEV, DevNotice, PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'
import { TicketModal, Ticket80 } from '@/components/Ticket80'

export default function Tickets() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const tickets = useData((s) => s.tickets)
  const impresoras = useData((s) => s.impresoras)
  const setImpresora = useData((s) => s.setImpresora)
  const pedidos = useData((s) => s.pedidos)
  const [modo, setModo] = useState<'local' | 'nube'>('local')
  const [preview, setPreview] = useState<string | null>(null)
  const closePreview = useCallback(() => setPreview(null), [])
  const sample = pedidos.find((p) => p.id === tickets[0]?.pedidoId)

  return (
    <div>
      <PreviewBanner
        id="tickets"
        bullets={[
          ['Ticket en impresora térmica de 80mm directo desde el Android.', 'Receipt on an 80mm thermal printer straight from Android.'],
          ['O en PDF con código de barras, guardado en la nube.', 'Or as a PDF with barcode, stored in the cloud.'],
          ['Numeración secuencial auditada y varias impresoras por local.', 'Audited sequential numbering and several printers per shop.'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Ticketera', 'Receipts')}
        subtitle={L(`${tickets.length} comprobantes emitidos hoy`, `${tickets.length} receipts issued today`)}
        actions={
          <div className="flex rounded-lg border border-line bg-surface p-0.5">
            {(
              [
                ['local', Printer, L('Impresora local', 'Local printer')],
                ['nube', Cloud, L('Nube (PDF)', 'Cloud (PDF)')],
              ] as const
            ).map(([m, I, label]) => (
              <button
                key={m}
                onClick={() => {
                  setModo(m)
                  toast.success(L(`Modo de emisión: ${label}`, `Issue mode: ${label}`))
                }}
                className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium', modo === m ? 'bg-primary text-white dark:text-zinc-950' : 'text-muted hover:text-fg')}
              >
                <I size={15} /> {label}
              </button>
            ))}
          </div>
        }
      />
      <DevNotice {...(modo === 'local' ? DEV.print : DEV.pdf)} />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {impresoras.map((p) => (
              <Card key={p.id} className={cn('flex items-center gap-3 p-4', p.estado === 'sin_papel' && 'border-warning/50')}>
                <span className={cn('grid h-11 w-11 place-items-center rounded-xl', p.estado === 'conectada' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning')}>
                  {p.estado === 'conectada' ? <PrinterCheck size={20} /> : <AlertTriangle size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{L(p.nombre.es, p.nombre.en)}</p>
                  <p className="text-[12.5px] text-muted">{L(p.tipo.es, p.tipo.en)}</p>
                </div>
                {p.estado === 'conectada' ? (
                  <Badge tone="green" dot>
                    {L('Conectada', 'Connected')}
                  </Badge>
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone="amber" dot>
                      {L('Sin papel', 'Out of paper')}
                    </Badge>
                    <button
                      className="text-[12px] font-medium text-primary hover:underline"
                      onClick={() => {
                        setImpresora(p.id, 'conectada')
                        toast.success(L('Rollo repuesto. Térmica depósito lista.', 'Roll replaced. Storeroom thermal ready.'))
                      }}
                    >
                      {L('Ya repuse el rollo', 'Roll replaced')}
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader title={L('Comprobantes', 'Receipts')} subtitle={L('Numeración secuencial auditada', 'Audited sequential numbering')} className="pb-3" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-line bg-surface2/60">
                  <tr>
                    <Th>{L('Número', 'Number')}</Th>
                    <Th>{L('Pedido', 'Order')}</Th>
                    <Th>{L('Modo', 'Mode')}</Th>
                    <Th className="hidden md:table-cell">{L('Usuario', 'User')}</Th>
                    <Th className="hidden md:table-cell">{L('Fecha', 'Date')}</Th>
                    <Th className="text-right">{L('Monto', 'Amount')}</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tickets.slice(0, 30).map((t) => (
                    <tr key={t.numero} className="cursor-pointer hover:bg-surface2/50" onClick={() => setPreview(t.pedidoId)}>
                      <Td className="num font-medium">
                        <span className="flex items-center gap-1.5">
                          <Hash size={13} className="text-muted" />
                          {t.numero}
                        </span>
                      </Td>
                      <Td className="num text-muted">#{t.pedidoCodigo}</Td>
                      <Td>
                        {t.modo === 'local' ? (
                          <Badge>
                            <Printer size={11} /> {L('Térmica', 'Thermal')}
                          </Badge>
                        ) : (
                          <Badge tone="blue">
                            <FileText size={11} /> PDF
                          </Badge>
                        )}
                      </Td>
                      <Td className="hidden text-muted md:table-cell">{t.usuario}</Td>
                      <Td className="hidden text-muted md:table-cell">{dateTime(t.fecha, lang)}</Td>
                      <Td className="num text-right font-medium">{ars(t.monto, lang)}</Td>
                      <Td className="text-right">
                        <Button
                          size="iconSm"
                          variant="ghost"
                          aria-label={L('Descargar PDF', 'Download PDF')}
                          onClick={(e) => {
                            e.stopPropagation()
                            toast.success(L(`PDF ${t.numero} descargado (simulado)`, `PDF ${t.numero} downloaded (simulated)`))
                          }}
                        >
                          <Download size={15} />
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="hidden xl:block">
          <Card className="sticky top-24 p-4">
            <p className="kicker mb-3 text-muted">{L('Último ticket · vista 80mm', 'Last receipt · 80mm view')}</p>
            <div className="rounded-xl bg-zinc-100 py-4 dark:bg-zinc-800/60">{sample && <Ticket80 pedido={sample} numero={tickets[0].numero} />}</div>
            <Button className="mt-3 w-full" onClick={() => sample && setPreview(sample.id)}>
              <Printer size={15} /> {L('Reimprimir', 'Reprint')}
            </Button>
          </Card>
        </div>
      </div>
      <TicketModal pedidoId={preview} onClose={closePreview} />
    </div>
  )
}
