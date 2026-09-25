import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  Apple,
  Banana,
  Carrot,
  Cherry,
  Citrus,
  Egg,
  Grape,
  Info,
  Leaf,
  Nut,
  Salad,
  Sprout,
  Wheat,
  X,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useL, useT } from '@/lib/i18n'
import type { ProductIcon } from '@/data/types'

/* ---------------- Button ---------------- */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-card dark:text-zinc-950',
        secondary: 'border border-line bg-surface text-fg hover:bg-surface2 shadow-card',
        ghost: 'text-fg hover:bg-surface2',
        soft: 'bg-primary-soft text-primary hover:bg-primary-soft/70',
        orange: 'bg-secondary text-white hover:bg-secondary/90',
        danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
        link: 'text-primary hover:underline underline-offset-4 px-0',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-[13px]',
        md: 'h-9 rounded-lg px-3.5 text-sm',
        lg: 'h-11 rounded-[10px] px-5 text-[15px]',
        icon: 'h-9 w-9 rounded-lg',
        iconSm: 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'

/* ---------------- Card ---------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface shadow-card', className)} {...props} />
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------------- Badge ---------------- */
const badgeTones = {
  neutral: 'bg-surface2 text-muted border-line',
  green: 'bg-primary-soft text-primary border-primary/20',
  orange: 'bg-secondary-soft text-secondary border-secondary/25',
  red: 'bg-danger-soft text-danger border-danger/20',
  amber: 'bg-warning-soft text-amber-700 dark:text-warning border-warning/30',
  blue: 'bg-info-soft text-info border-info/20',
} as const
export type Tone = keyof typeof badgeTones

export function Badge({ tone = 'neutral', className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4', badgeTones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ---------------- Inputs ---------------- */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted/80 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('mb-1.5 block text-[12.5px] font-medium text-muted', className)}>{children}</label>
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line')}
    >
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

/* ---------------- Modal (siempre centrado con inset-0 m-auto) ---------------- */
export function Modal({
  open,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  showClose = true,
  z = 'z-[200]',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  closeOnBackdrop?: boolean
  showClose?: boolean
  z?: string
}) {
  const t = useT()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdrop) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, closeOnBackdrop])
  if (!open) return null
  return createPortal(
    <div className={cn('fixed inset-0', z)}>
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={closeOnBackdrop ? onClose : undefined} />
      <div
        role="dialog"
        aria-modal="true"
        data-modal
        className={cn(
          'anim-modal fixed inset-0 m-auto h-fit max-h-[88vh] w-[calc(100%-32px)] max-w-md overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop',
          className,
        )}
      >
        {showClose && (
          <button onClick={onClose} aria-label={t('act.close')} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-fg">
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ---------------- Popover / Dropdown ---------------- */
export function Popover({
  trigger,
  children,
  align = 'right',
  className,
  open: controlled,
  onOpenChange,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  className?: string
  open?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const [inner, setInner] = useState(false)
  const open = controlled ?? inner
  const setOpen = useCallback((v: boolean) => (onOpenChange ? onOpenChange(v) : setInner(v)), [onOpenChange])
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])
  const close = useCallback(() => setOpen(false), [setOpen])
  const toggle = useCallback(() => setOpen(!open), [open, setOpen])
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle })}
      {open && (
        <div
          className={cn(
            'anim-pop absolute top-[calc(100%+6px)] z-[120] min-w-[200px] rounded-xl border border-line bg-surface p-1.5 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon: Icon, children, onClick, active, className }: { icon?: LucideIcon; children: React.ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-surface2', active && 'bg-primary-soft text-primary hover:bg-primary-soft', className)}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} />}
      {children}
    </button>
  )
}

/* ---------------- Tabs ---------------- */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: React.ReactNode; count?: number }[]
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface2 p-1', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
            value === it.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className={cn('num rounded-md px-1.5 text-[11px]', value === it.value ? 'bg-primary-soft text-primary' : 'bg-line/60 text-muted')}>{it.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ---------------- KPI ---------------- */
export function Kpi({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  accent = 'green',
  className,
  ...rest
}: {
  label: string
  value: React.ReactNode
  delta?: number
  hint?: React.ReactNode
  icon?: LucideIcon
  accent?: 'green' | 'orange' | 'blue' | 'amber'
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const acc = { green: 'text-primary bg-primary-soft', orange: 'text-secondary bg-secondary-soft', blue: 'text-info bg-info-soft', amber: 'text-warning bg-warning-soft' }[accent]
  return (
    <Card className={cn('p-4', className)} {...rest}>
      <div className="flex items-center justify-between gap-2">
        <span className="kicker text-muted">{label}</span>
        {Icon && (
          <span className={cn('grid h-7 w-7 place-items-center rounded-lg', acc)}>
            <Icon size={15} strokeWidth={1.9} />
          </span>
        )}
      </div>
      <div className="num mt-2 whitespace-nowrap text-[19px] font-semibold leading-none tracking-tight sm:text-[26px]">{value}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
        {delta !== undefined && (
          <span className={cn('num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', delta >= 0 ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger')}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        )}
        {hint}
      </div>
    </Card>
  )
}

/* ---------------- Íconos de producto ---------------- */
const PICONS: Record<ProductIcon, LucideIcon> = {
  apple: Apple,
  carrot: Carrot,
  citrus: Citrus,
  leaf: Leaf,
  cherry: Cherry,
  grape: Grape,
  salad: Salad,
  banana: Banana,
  egg: Egg,
  sprout: Sprout,
  nut: Nut,
  wheat: Wheat,
}
const PTONES: Record<ProductIcon, string> = {
  apple: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  cherry: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  carrot: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  citrus: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  banana: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10',
  leaf: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  salad: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  sprout: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  grape: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
  egg: 'text-stone-500 bg-stone-100 dark:bg-stone-500/10',
  nut: 'text-amber-700 bg-amber-50 dark:bg-amber-700/15',
  wheat: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10',
}
export function ProductAvatar({ icon, size = 32 }: { icon: ProductIcon; size?: number }) {
  const I = PICONS[icon]
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-lg', PTONES[icon])} style={{ width: size, height: size }}>
      <I size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </span>
  )
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ title, body, icon: Icon = Salad }: { title: string; body?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="max-w-xs text-[13px] text-muted">{body}</p>}
    </div>
  )
}

/* ---------------- ⓘ En desarrollo ---------------- */
export function InfoDev({ text }: { text: string }) {
  const t = useT()
  return (
    <Popover
      align="right"
      className="w-64"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label={t('dev.pop')} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-amber-700 hover:bg-warning-soft dark:text-warning">
          <Info size={13} /> {t('dev.pop')}
        </button>
      )}
    >
      {() => <p className="p-2 text-[12.5px] leading-relaxed text-muted">{text}</p>}
    </Popover>
  )
}

/* ---------------- Page header ---------------- */
export function PageHeader({
  kicker,
  kickerTone = 'green',
  title,
  subtitle,
  actions,
}: {
  kicker?: string
  kickerTone?: 'green' | 'orange' | 'chat'
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  const tone = { green: 'text-primary', orange: 'text-secondary', chat: 'text-[rgb(var(--chat))]' }[kickerTone]
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <div className={cn('kicker mb-1.5', tone)}>{kicker}</div>}
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------- Table helpers ---------------- */
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted', className)}>{children}</th>
}
export function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-[13.5px]', className)} {...rest}>
      {children}
    </td>
  )
}

/* ---------------- Search ---------------- */
export function useDebounced<T>(v: T, ms = 150) {
  const [d, setD] = useState(v)
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms)
    return () => clearTimeout(id)
  }, [v, ms])
  return d
}

/* ---------------- Mini helper: texto bilingüe como componente ---------------- */
export function T({ es, en }: { es: string; en: string }) {
  const L = useL()
  return <>{L(es, en)}</>
}
