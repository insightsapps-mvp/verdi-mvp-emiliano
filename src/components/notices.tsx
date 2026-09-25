import { ChevronDown, ChevronUp, Eye, Smartphone, Wrench, Check } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useT, useL } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Bi = [string, string]

/** Banner de previsualización arriba de cada módulo. Colapsable en memoria (vuelve abierto al recargar). */
export function PreviewBanner({ id, bullets, android = true }: { id: string; bullets: Bi[]; android?: boolean }) {
  const t = useT()
  const L = useL()
  const collapsed = useApp((s) => !!s.bannersCollapsed[id])
  const toggle = useApp((s) => s.toggleBanner)
  return (
    <div className="no-print mb-5 overflow-hidden rounded-card border border-line bg-gradient-to-br from-primary-soft/60 via-surface to-surface">
      <button onClick={() => toggle(id)} className="flex w-full flex-wrap items-center gap-2 px-4 py-2.5 text-left">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-white dark:text-zinc-950">
          <Eye size={11} /> {t('pb.nav')}
        </span>
        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted">{t('pb.mock')}</span>
        <span className="order-last min-w-0 basis-full truncate text-[13px] font-semibold sm:order-none sm:ml-1 sm:basis-auto sm:flex-1">{collapsed ? t('pb.show') : t('pb.title')}</span>
        <span className="ml-auto flex items-center gap-1 text-[12px] text-muted sm:ml-0">
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          <span className="hidden sm:inline">{collapsed ? L('Mostrar', 'Show') : t('pb.hide')}</span>
        </span>
      </button>
      {!collapsed && (
        <div className="border-t border-line/70 px-4 pb-3 pt-2.5">
          <ul className="grid gap-1.5 sm:grid-cols-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug text-fg/85">
                <Check size={15} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.2} />
                {L(b[0], b[1])}
              </li>
            ))}
          </ul>
          {android && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
              <Smartphone size={13} /> {t('pb.android')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Aviso amber arriba de funciones simuladas que necesitan infraestructura real. */
export function DevNotice({ feature, now, later, compact, className }: { feature: Bi; now: Bi; later: Bi; compact?: boolean; className?: string }) {
  const t = useT()
  const L = useL()
  return (
    <div className={cn('flex gap-2.5 rounded-xl border border-warning/35 bg-warning-soft/70 text-amber-900 dark:text-amber-100', compact ? 'px-3 py-2' : 'mb-4 px-4 py-3', className)}>
      <Wrench size={compact ? 14 : 16} className="mt-0.5 shrink-0 text-warning" strokeWidth={2} />
      <div className={cn('min-w-0', compact ? 'text-[11.5px]' : 'text-[13px]')}>
        <p className="font-semibold">
          {L(feature[0], feature[1])} · {t('dev.suffix')}
        </p>
        {!compact && (
          <p className="mt-0.5 leading-relaxed text-amber-900/80 dark:text-amber-100/75">
            <b className="font-medium">{t('dev.now')}</b> {L(now[0], now[1])} <b className="font-medium">{t('dev.later')}</b> {L(later[0], later[1])}
          </p>
        )}
      </div>
    </div>
  )
}

/** Catálogo cerrado de DevNotices para reusar el mismo copy en toda la app */
export const DEV = {
  whatsapp: {
    feature: ['WhatsApp Business API', 'WhatsApp Business API'] as Bi,
    now: ['un chat local con respuestas pre-programadas.', 'a local chat with pre-programmed replies.'] as Bi,
    later: ['la conexión real del número de la verdulería y la IA atendiendo 24/7.', "the real connection of the shop's number and the AI answering 24/7."] as Bi,
  },
  mp: {
    feature: ['Link de pago y webhooks de Mercado Pago', 'Mercado Pago payment link & webhooks'] as Bi,
    now: ['un checkout de prueba que siempre aprueba.', 'a test checkout that always approves.'] as Bi,
    later: ['links reales por pedido y confirmación automática por webhook.', 'real per-order links and automatic webhook confirmation.'] as Bi,
  },
  print: {
    feature: ['Impresión térmica USB', 'USB thermal printing'] as Bi,
    now: ['la vista previa del ticket de 80mm.', 'the 80mm receipt preview.'] as Bi,
    later: ['la impresión directa desde el Android a la térmica del local.', 'direct printing from the Android device to the shop printer.'] as Bi,
  },
  pdf: {
    feature: ['Generación y almacenamiento de PDFs', 'PDF generation & storage'] as Bi,
    now: ['una descarga simulada.', 'a simulated download.'] as Bi,
    later: ['el PDF real con código de barras guardado en la nube.', 'the real PDF with barcode stored in the cloud.'] as Bi,
  },
  bot: {
    feature: ['Reinicio remoto del bot', 'Remote bot restart'] as Bi,
    now: ['el cambio de estado en pantalla.', 'the on-screen status change.'] as Bi,
    later: ['el reinicio real de la sesión de WhatsApp del local.', "the real restart of the shop's WhatsApp session."] as Bi,
  },
  backup: {
    feature: ['Backups y restauración de datos', 'Data backups & restore'] as Bi,
    now: ['la lista de backups y la confirmación.', 'the backup list and the confirmation.'] as Bi,
    later: ['backups diarios cifrados y restauración aislada de tu verdulería.', "encrypted daily backups and isolated restore of your shop's data."] as Bi,
  },
  users: {
    feature: ['Alta real de usuarios y credenciales', 'Real user & credential provisioning'] as Bi,
    now: ['el alta en pantalla.', 'the on-screen sign-up.'] as Bi,
    later: ['credenciales propias por usuario con permisos por rol.', 'per-user credentials with role permissions.'] as Bi,
  },
}
