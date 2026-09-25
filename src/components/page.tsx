import { useApp } from '@/lib/store'
import { useL, useT } from '@/lib/i18n'
import type { EstadoPago, EstadoPedido, MedioPago } from '@/data/types'
import { Badge, type Tone } from './ui'

/** Kicker por rol: Admin en verde, Mostrador en naranja (identidad de la verdulería) */
export function useKicker() {
  const role = useApp((s) => s.role)
  const L = useL()
  return role === 'admin'
    ? { kicker: L('ADMIN · VERDULERÍA DON TITO', 'ADMIN · DON TITO PRODUCE SHOP'), tone: 'green' as const }
    : { kicker: L('MOSTRADOR · VERDULERÍA DON TITO · VILLA CRESPO', 'COUNTER · DON TITO PRODUCE SHOP · VILLA CRESPO'), tone: 'orange' as const }
}

const ESTADO_TONE: Record<EstadoPedido, Tone> = {
  pendiente: 'amber',
  confirmado: 'green',
  preparacion: 'blue',
  en_camino: 'blue',
  entregado: 'green',
  cancelado: 'red',
}
export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const t = useT()
  return (
    <Badge tone={ESTADO_TONE[estado]} dot>
      {t(`st.${estado}` as 'st.pendiente')}
    </Badge>
  )
}

const PAGO_TONE: Record<EstadoPago, Tone> = { aprobado: 'green', rechazado: 'red', pendiente: 'amber', reembolsado: 'neutral' }
export function PagoBadge({ estado }: { estado: EstadoPago }) {
  const t = useT()
  return <Badge tone={PAGO_TONE[estado]}>{t(`pay.${estado}` as 'pay.aprobado')}</Badge>
}

export function MedioLabel({ medio }: { medio: MedioPago }) {
  const t = useT()
  return <>{t(`mp.${medio}` as 'mp.efectivo')}</>
}
