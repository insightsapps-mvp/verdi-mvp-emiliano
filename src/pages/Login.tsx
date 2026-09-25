import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, PlayCircle, ShieldCheck, Store, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/lib/store'
import { useL, useT } from '@/lib/i18n'
import { CREDENTIALS, type Role } from '@/lib/roles'
import { cn, openWhatsApp, ss } from '@/lib/utils'
import { Button, Input, Label } from '@/components/ui'
import { DemoBadge, DeviceToggle, LangToggle, Logo, ThemeToggle } from '@/components/controls'

export default function Login() {
  const L = useL()
  const t = useT()
  const navigate = useNavigate()
  const login = useApp((s) => s.login)
  const setWelcomeOpen = useApp((s) => s.setWelcomeOpen)
  const isFrame = useApp((s) => s.isFrame)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const pills: { role: Role; label: string; icon: typeof Store; tone: string }[] = [
    { role: 'admin', label: L('Admin (dueño)', 'Admin (owner)'), icon: ShieldCheck, tone: 'text-primary bg-primary-soft border-primary/25' },
    { role: 'verduleria', label: L('Verdulería (mostrador)', 'Shop (counter)'), icon: Store, tone: 'text-secondary bg-secondary-soft border-secondary/25' },
  ]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const c = CREDENTIALS.find((x) => x.user === user.trim().toLowerCase() && x.pass === pass)
    if (!c) {
      setError(true)
      return
    }
    setLoading(true)
    setTimeout(() => {
      login(c.role)
      navigate('/propuesta', { replace: true })
      if (!ss.get('verdi_welcome_seen')) setTimeout(() => setWelcomeOpen(true), 400)
    }, 450)
  }

  const trailer = () => {
    if (isFrame) {
      window.parent.postMessage({ source: 'verdi', type: 'startTrailer' }, location.origin)
      return
    }
    useApp.getState().setDevice('desktop')
    useApp.getState().setTrailer(true)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-surface2 via-bg to-bg">
      <div className="pointer-events-none absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full bg-primary/15 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[380px] w-[380px] rounded-full bg-secondary/10 blur-[100px]" />

      <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="sm:hidden">
          <Logo size="sm" />
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <DeviceToggle />
          <ThemeToggle />
          <LangToggle />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-5 flex flex-col items-center gap-2.5">
            <Logo size="lg" />
            <DemoBadge />
          </div>
          <div className="rounded-2xl border border-line bg-surface/90 p-6 shadow-pop backdrop-blur sm:p-7">
            <h1 className="text-[20px] font-bold tracking-tight">{L('Ingresá a tu verdulería', 'Sign in to your shop')}</h1>
            <p className="mt-1 text-[13.5px] text-muted">{L('Elegí una vista para probar la demo.', 'Pick a view to try the demo.')}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map((p) => {
                const c = CREDENTIALS.find((x) => x.role === p.role)!
                const I = p.icon
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => {
                      setUser(c.user)
                      setPass(c.pass)
                      setError(false)
                    }}
                    className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition hover:brightness-95', p.tone)}
                  >
                    <I size={14} strokeWidth={2} /> {p.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <div>
                <Label>{L('Usuario', 'Username')}</Label>
                <Input value={user} onChange={(e) => (setUser(e.target.value), setError(false))} autoComplete="username" placeholder={L('ej. tito', 'e.g. tito')} />
              </div>
              <div>
                <Label>{L('Contraseña', 'Password')}</Label>
                <div className="relative">
                  <Input type={show ? 'text' : 'password'} value={pass} onChange={(e) => (setPass(e.target.value), setError(false))} autoComplete="current-password" placeholder="••••••••" className="pr-10" />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={L('Mostrar contraseña', 'Show password')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-[12.5px] font-medium text-danger">{L('Usuario o contraseña incorrectos. Usá una de las vistas de arriba.', 'Wrong username or password. Use one of the views above.')}</p>}
              <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-muted">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
                  {L('Recordarme', 'Remember me')}
                </label>
                <button type="button" onClick={() => toast(t('toast.forgot'))} className="font-medium text-primary hover:underline">
                  {L('¿Olvidaste tu contraseña?', 'Forgot your password?')}
                </button>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                <LogIn size={17} />
                {loading ? L('Ingresando…', 'Signing in…') : L('Ingresar', 'Sign in')}
              </Button>
            </form>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2.5 text-[13px]">
            <button onClick={openWhatsApp} className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-fg">
              <MessageCircle size={15} className="text-primary" />
              {L('¿No tenés acceso? Hablemos por WhatsApp', "Don't have access? Let's talk on WhatsApp")}
            </button>
            <button onClick={trailer} className="inline-flex items-center gap-1.5 font-medium text-info hover:underline">
              <PlayCircle size={15} />
              {L('Ver demo automática de la plataforma', 'Watch the automatic platform demo')}
            </button>
          </div>
          <p className="mt-6 text-center text-[10px] text-muted">{t('brand.powered')}</p>
        </div>
      </div>
    </div>
  )
}
