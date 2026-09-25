import { Leaf, Monitor, Moon, Smartphone, Sun, Store, ShieldCheck, ChevronDown, Check, MessageCircle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { cn, openWhatsApp } from '@/lib/utils'
import { Button, Popover } from './ui'
import type { Role } from '@/lib/roles'

export function Logo({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: [26, 14, 'text-[17px]'], md: [30, 16, 'text-[19px]'], lg: [38, 20, 'text-[24px]'] }[size] as [number, number, string]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid place-items-center rounded-[9px] bg-primary text-white shadow-card dark:text-zinc-950" style={{ width: s[0], height: s[0] }}>
        <Leaf size={s[1]} strokeWidth={2.2} />
      </span>
      <span className={cn('font-extrabold tracking-tight', s[2])}>Verdi</span>
    </span>
  )
}

export function DemoBadge({ className }: { className?: string }) {
  const t = useT()
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary-soft px-2 py-0.5 text-[10px] font-bold tracking-wider text-secondary', className)}>
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-secondary" />
      {t('brand.demo')}
    </span>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  const t = useT()
  return (
    <Button variant="ghost" size="icon" className={className} aria-label={t('hdr.theme')} title={t('hdr.theme')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
    </Button>
  )
}

export function LangToggle({ className }: { className?: string }) {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const t = useT()
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      aria-label={t('hdr.lang')}
      title={t('hdr.lang')}
      className={cn('num flex h-9 items-center rounded-lg border border-line bg-surface p-0.5 text-[11px] font-semibold', className)}
    >
      <span className={cn('rounded-md px-1.5 py-1', lang === 'es' ? 'bg-primary-soft text-primary' : 'text-muted')}>ES</span>
      <span className={cn('rounded-md px-1.5 py-1', lang === 'en' ? 'bg-primary-soft text-primary' : 'text-muted')}>EN</span>
    </button>
  )
}

export function DeviceToggle({ className, onChange }: { className?: string; onChange?: (d: 'desktop' | 'mobile') => void }) {
  const device = useApp((s) => s.device)
  const setDevice = useApp((s) => s.setDevice)
  const isFrame = useApp((s) => s.isFrame)
  const t = useT()
  if (isFrame) return null
  const set = (d: 'desktop' | 'mobile') => {
    setDevice(d)
    onChange?.(d)
  }
  return (
    <div data-tour="device-toggle" title={t('hdr.deviceTip')} className={cn('hidden h-9 items-center rounded-lg border border-line bg-surface p-0.5 lg:flex', className)}>
      {(
        [
          ['desktop', Monitor, t('hdr.desktop')],
          ['mobile', Smartphone, t('hdr.mobile')],
        ] as const
      ).map(([d, Icon, label]) => (
        <button
          key={d}
          onClick={() => set(d)}
          aria-pressed={device === d}
          className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors', device === d ? 'bg-primary text-white dark:text-zinc-950' : 'text-muted hover:text-fg')}
        >
          <Icon size={14} strokeWidth={1.9} />
          <span className="hidden 2xl:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

export const ROLE_META: Record<Role, { icon: typeof Store; tone: string; soft: string }> = {
  admin: { icon: ShieldCheck, tone: 'text-primary', soft: 'bg-primary-soft' },
  verduleria: { icon: Store, tone: 'text-secondary', soft: 'bg-secondary-soft' },
}

export function RoleOptions({ onPick }: { onPick: (r: Role) => void }) {
  const role = useApp((s) => s.role)
  const t = useT()
  return (
    <div>
      <div className="kicker px-2.5 pb-1.5 pt-1 text-muted">{t('hdr.switch')}</div>
      {(['admin', 'verduleria'] as Role[]).map((r) => {
        const m = ROLE_META[r]
        const I = m.icon
        return (
          <button
            key={r}
            onClick={() => onPick(r)}
            className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface2', role === r && 'bg-surface2')}
          >
            <span className={cn('grid h-8 w-8 place-items-center rounded-lg', m.soft, m.tone)}>
              <I size={16} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">{t(`role.${r}` as 'role.admin')}</span>
              <span className="block text-[11.5px] text-muted">{t(`role.${r}.sub` as 'role.admin.sub')}</span>
            </span>
            {role === r && <Check size={15} className="text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

export function RoleSwitcher({ onPick }: { onPick: (r: Role) => void }) {
  const role = useApp((s) => s.role)
  const t = useT()
  const m = ROLE_META[role]
  const I = m.icon
  return (
    <Popover
      className="w-[260px]"
      trigger={({ toggle, open }) => (
        <button
          data-tour="switch-user"
          onClick={toggle}
          className={cn('flex h-9 items-center gap-2 rounded-lg border border-line bg-surface pl-1 pr-2 text-left transition-colors hover:bg-surface2', open && 'bg-surface2')}
        >
          <span className={cn('grid h-7 w-7 place-items-center rounded-md', m.soft, m.tone)}>
            <I size={15} strokeWidth={1.9} />
          </span>
          <span className="hidden leading-tight xl:block">
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted">{t('hdr.switch')}</span>
            <span className="block text-[12.5px] font-semibold">{t(`role.${role}` as 'role.admin')}</span>
          </span>
          <ChevronDown size={14} className="text-muted" />
        </button>
      )}
    >
      {(close) => (
        <RoleOptions
          onPick={(r) => {
            close()
            onPick(r)
          }}
        />
      )}
    </Popover>
  )
}

export function WhatsAppCTA({ className, label, size = 'md', tour = true }: { className?: string; label?: string; size?: 'sm' | 'md' | 'lg'; tour?: boolean }) {
  const t = useT()
  return (
    <Button size={size} data-tour={tour ? 'whatsapp-cta' : undefined} className={className} onClick={openWhatsApp}>
      <MessageCircle size={16} strokeWidth={2} />
      {label ?? t('act.start')}
    </Button>
  )
}
