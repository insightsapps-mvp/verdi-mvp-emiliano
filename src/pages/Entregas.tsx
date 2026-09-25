import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bike, CheckCircle2, Clock, MapPin, Navigation, PackageCheck, Timer, Truck } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useClienteMap, useData } from '@/lib/data'
import { ars } from '@/lib/format'
import { cn } from '@/lib/utils'
import { REPARTIDORES } from '@/data/mock'
import { Badge, Button, Card, Kpi, PageHeader, Select, Tabs } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { EstadoBadge, useKicker } from '@/components/page'

export default function Entregas() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const pedidos = useData((s) => s.pedidos)
  const setEstado = useData((s) => s.setEstado)
  const setRepartidor = useData((s) => s.setRepartidor)
  const cm = useClienteMap()
  const [vista, setVista] = useState<'activas' | 'entregadas'>('activas')

  const activas = pedidos.filter((p) => ['confirmado', 'preparacion', 'en_camino'].includes(p.estado))
  const entregadas = pedidos.filter((p) => p.estado === 'entregado')
  const list = vista === 'activas' ? activas : entregadas
  const franjas = useMemo(() => {
    const m = new Map<string, typeof list>()
    ;[...list].sort((a, b) => a.entregaFranja.localeCompare(b.entregaFranja)).forEach((p) => m.set(p.entregaFranja, [...(m.get(p.entregaFranja) ?? []), p]))
    return [...m.entries()]
  }, [list])

  const porRep = (n: string) => pedidos.filter((p) => p.repartidor === n && p.estado === 'en_camino').length

  return (
    <div>
      <PreviewBanner
        id="entregas"
        bullets={[
          ['Los pedidos confirmados se ordenan solos por franja horaria.', 'Confirmed orders sort themselves by delivery window.'],
          ['Asignás repartidor con un toque y el cliente recibe el aviso "en camino".', 'Assign a courier in one tap and the customer gets the "on the way" notice.'],
          ['Al marcar entregado, el pedido se cierra y entra al reporte del día.', "When marked delivered, the order closes and goes into the day's report."],
        ]}
      />
      <PageHeader kicker={kicker} kickerTone={tone} title={L('Entregas', 'Deliveries')} subtitle={L('Organizadas por franja horaria', 'Organized by delivery window')} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Por despachar', 'To dispatch')} value={pedidos.filter((p) => ['confirmado', 'preparacion'].includes(p.estado)).length} icon={PackageCheck} accent="amber" />
        <Kpi label={L('En camino', 'On the way')} value={pedidos.filter((p) => p.estado === 'en_camino').length} icon={Truck} accent="blue" />
        <Kpi label={L('Entregados hoy', 'Delivered today')} value={entregadas.length} icon={CheckCircle2} />
        <Kpi label={L('A tiempo', 'On time')} value="96%" icon={Timer} delta={3} accent="orange" />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {REPARTIDORES.map((r, i) => (
          <Card key={r} className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-info-soft text-info">
              <Bike size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold">{r}</p>
              <p className="text-[12.5px] text-muted">
                {i === 0 ? L('Moto', 'Motorbike') : L('Bicicleta', 'Bicycle')} · {porRep(r)} {L('en camino', 'on the way')}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => toast(L(`Ubicación de ${r}: Thames y Padilla (hace 1 min)`, `${r}'s location: Thames & Padilla (1 min ago)`))}>
              <Navigation size={14} /> {L('Ubicar', 'Locate')}
            </Button>
          </Card>
        ))}
      </div>

      <Tabs
        className="mb-4 w-fit"
        value={vista}
        onChange={setVista}
        items={[
          { value: 'activas', label: L('Para entregar', 'To deliver'), count: activas.length },
          { value: 'entregadas', label: L('Entregadas', 'Delivered'), count: entregadas.length },
        ]}
      />

      <div className="space-y-5">
        {franjas.map(([franja, ps]) => (
          <div key={franja}>
            <div className="mb-2 flex items-center gap-2">
              <Clock size={15} className="text-secondary" />
              <h3 className="num text-[14px] font-semibold">{franja} hs</h3>
              <span className="text-[12px] text-muted">
                · {ps.length} {L('pedidos', 'orders')}
              </span>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {ps.map((p) => {
                const c = cm[p.clienteId]
                return (
                  <Card key={p.id} className={cn('p-4', p.nuevo && 'border-secondary/60')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5">
                          <span className="num text-[13px] font-semibold">#{p.codigo}</span>
                          {p.nuevo && <Badge tone="orange">{L('NUEVO', 'NEW')}</Badge>}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] font-medium">{c?.nombre}</p>
                        <p className="flex items-center gap-1 text-[12.5px] text-muted">
                          <MapPin size={12} /> {p.direccion} · {c?.barrio}
                        </p>
                      </div>
                      <EstadoBadge estado={p.estado} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[12.5px]">
                      <span className="text-muted">
                        {p.items.length} {L('productos', 'items')}
                      </span>
                      <span className="num font-semibold">{ars(p.total, lang)}</span>
                    </div>
                    {vista === 'activas' && (
                      <div className="mt-3 flex items-center gap-2">
                        <Select
                          aria-label={L('Repartidor', 'Courier')}
                          className="h-8 flex-1 text-[12.5px]"
                          value={p.repartidor ?? ''}
                          onChange={(e) => {
                            setRepartidor(p.id, e.target.value)
                            toast.success(L(`#${p.codigo} asignado a ${e.target.value}`, `#${p.codigo} assigned to ${e.target.value}`))
                          }}
                        >
                          <option value="" disabled>
                            {L('Asignar repartidor', 'Assign courier')}
                          </option>
                          {REPARTIDORES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </Select>
                        {p.estado === 'en_camino' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setEstado(p.id, 'entregado')
                              toast.success(L(`#${p.codigo} entregado ✓`, `#${p.codigo} delivered ✓`))
                            }}
                          >
                            <CheckCircle2 size={14} /> {L('Entregado', 'Delivered')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEstado(p.id, 'en_camino')
                              toast.success(L(`#${p.codigo} en camino. El cliente ya recibió el aviso.`, `#${p.codigo} on the way. The customer got the notice.`))
                            }}
                          >
                            <Bike size={14} /> {L('Despachar', 'Dispatch')}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
