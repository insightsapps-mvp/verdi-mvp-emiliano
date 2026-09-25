import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Database, HardDriveDownload, KeyRound, Loader2, Lock, MapPin, Plus, RefreshCw, RotateCcw, ShieldCheck, Smartphone, UserPlus, Wifi } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { useData } from '@/lib/data'
import { PLANES, TENANT } from '@/data/mock'
import { ago, date, dateTime, num, usd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Backup } from '@/data/types'
import { Badge, Button, Card, CardHeader, Input, Label, Modal, PageHeader, Select, Switch } from '@/components/ui'
import { DEV, DevNotice, PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'
import { ChartTooltip, useChartColors } from '@/components/charts'

function Uso({ label, v, max }: { label: string; v: number; max: number }) {
  const lang = useApp((s) => s.lang)
  const p = Math.min(100, (v / max) * 100)
  return (
    <div>
      <div className="flex justify-between text-[13px]">
        <span>{label}</span>
        <span className="num text-muted">
          {num(v, lang)} / {num(max, lang)}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/60">
        <div className={cn('h-full rounded-full', p > 85 ? 'bg-warning' : 'bg-primary')} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

export default function Cuenta() {
  const lang = useApp((s) => s.lang)
  const L = useL()
  const { kicker, tone } = useKicker()
  const C = useChartColors()
  const usuarios = useData((s) => s.usuarios)
  const toggleUsuario = useData((s) => s.toggleUsuario)
  const backups = useData((s) => s.backups)
  const addBackup = useData((s) => s.addBackup)
  const historial = useData((s) => s.historial)
  const pedidos = useData((s) => s.pedidos)
  const [plan, setPlan] = useState<'basico' | 'pro' | 'full'>(TENANT.plan)
  const [planOpen, setPlanOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [restore, setRestore] = useState<Backup | null>(null)
  const [botState, setBotState] = useState<'online' | 'restarting'>('online')
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', rol: 'mostrador' })
  const closePlan = useCallback(() => setPlanOpen(false), [])
  const closeUser = useCallback(() => setUserOpen(false), [])
  const closeRestore = useCallback(() => setRestore(null), [])

  const pl = PLANES.find((p) => p.id === plan)!
  const pedidosMes = historial.reduce((s, d) => s + d.pedidos, 0) + pedidos.length
  const mensajesMes = historial.reduce((s, d) => s + d.mensajesIA, 0)
  const serie = historial.slice(-14).map((d) => ({ label: date(d.fecha, lang, { day: 'numeric', month: 'numeric' }), mensajes: d.mensajesIA }))

  const restartBot = () => {
    setBotState('restarting')
    setTimeout(() => {
      setBotState('online')
      toast.success(L('Bot reiniciado. Ya está respondiendo de nuevo.', 'Bot restarted. It is answering again.'))
    }, 2200)
  }

  return (
    <div>
      <PreviewBanner
        id="cuenta"
        bullets={[
          ['Cada verdulería del país tiene sus datos aislados: nadie más los ve.', 'Every shop in the country has its data isolated: nobody else sees it.'],
          ['Usuarios con credenciales propias y permisos por rol.', 'Users with their own credentials and role permissions.'],
          ['Backups diarios, restauración y consumo del plan a la vista.', 'Daily backups, restore and plan usage in plain sight.'],
        ]}
      />
      <PageHeader kicker={kicker} kickerTone={tone} title={L('Mi cuenta', 'My account')} subtitle={L('Licencia, usuarios, bot y datos de tu verdulería', "Your shop's license, users, bot and data")} />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Datos aislados */}
        <Card data-trailer="cuenta-aislado" className="border-primary/30 bg-gradient-to-br from-primary-soft/60 to-surface p-5 xl:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white dark:text-zinc-950">
              <Lock size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold">{L('Tus datos están aislados 🔒', 'Your data is isolated 🔒')}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                {L(
                  'Verdi atiende verdulerías de todo el país, pero cada una es un espacio propio: tus pedidos, clientes, precios y stock no los ve ninguna otra verdulería, y vos tampoco ves los de ellas.',
                  "Verdi serves produce shops all over the country, but each one is its own space: no other shop sees your orders, customers, prices or stock, and you don't see theirs either.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              [Database, L('Espacio', 'Space'), TENANT.id.toUpperCase()],
              [MapPin, L('Región', 'Region'), 'Argentina'],
              [ShieldCheck, L('Cifrado', 'Encryption'), 'AES-256'],
              [KeyRound, L('Acceso', 'Access'), L('Credenciales propias', 'Own credentials')],
            ].map(([I, k, v], i) => {
              const Icon = I as typeof Lock
              return (
                <div key={i} className="rounded-xl border border-line bg-surface px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <Icon size={12} /> {k as string}
                  </p>
                  <p className="num mt-0.5 truncate text-[13px] font-semibold">{v as string}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Plan */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="kicker text-muted">{L('Tu licencia', 'Your license')}</p>
            <Badge tone="green" dot>
              {L('Activa', 'Active')}
            </Badge>
          </div>
          <p className="mt-2 text-[22px] font-bold">
            {L('Plan', 'Plan')} {L(pl.nombre.es, pl.nombre.en)}
          </p>
          <p className="num text-[13px] text-muted">
            {usd(pl.precioUsd, lang)} / {L('mes', 'month')} · {L('cliente desde', 'customer since')} {date(TENANT.creadoEl, lang, { month: 'short', year: 'numeric' })}
          </p>
          <div className="mt-4 space-y-3">
            <Uso label={L('Pedidos del mes', 'Orders this month')} v={pedidosMes} max={pl.limites.pedidosMes} />
            <Uso label={L('Mensajes de IA', 'AI messages')} v={mensajesMes} max={pl.limites.mensajesIA} />
            <Uso label={L('Impresoras', 'Printers')} v={2} max={pl.limites.impresoras} />
            <Uso label={L('Usuarios', 'Users')} v={usuarios.length} max={pl.limites.usuarios} />
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => setPlanOpen(true)}>
            {L('Cambiar plan', 'Change plan')}
          </Button>
        </Card>

        {/* Usuarios */}
        <Card className="xl:col-span-2">
          <CardHeader
            title={L('Usuarios y permisos', 'Users & permissions')}
            subtitle={L('Cada uno entra con su usuario; el mostrador no ve números del negocio.', "Everyone signs in with their own user; the counter can't see business numbers.")}
            action={
              <Button size="sm" onClick={() => setUserOpen(true)}>
                <UserPlus size={14} /> {L('Agregar', 'Add')}
              </Button>
            }
          />
          <div className="mt-3 divide-y divide-line border-t border-line">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface2 text-[12px] font-bold text-muted">
                  {u.nombre
                    .split(' ')
                    .map((x) => x[0])
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{u.nombre}</p>
                  <p className="truncate text-[12px] text-muted">{u.email}</p>
                </div>
                <Badge tone={u.id === 'u1' ? 'green' : u.id === 'u2' ? 'orange' : 'blue'}>{L(u.rol.es, u.rol.en)}</Badge>
                <span className="hidden w-28 text-right text-[12px] text-muted md:block">{ago(u.ultimoAcceso, lang)}</span>
                <Switch
                  checked={u.activo}
                  label={L('Acceso activo', 'Active access')}
                  onChange={() => {
                    if (u.id === 'u1') return toast.error(L('No podés desactivar al dueño.', "You can't deactivate the owner."))
                    toggleUsuario(u.id)
                    toast.success(u.activo ? L(`Acceso de ${u.nombre} suspendido`, `${u.nombre}'s access suspended`) : L(`Acceso de ${u.nombre} reactivado`, `${u.nombre}'s access restored`))
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Bot */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">{L('Bot de WhatsApp', 'WhatsApp bot')}</h3>
            {botState === 'online' ? (
              <Badge tone="green" dot>
                <Wifi size={11} /> {L('En línea', 'Online')}
              </Badge>
            ) : (
              <Badge tone="amber">
                <Loader2 size={11} className="animate-spin" /> {L('Reiniciando', 'Restarting')}
              </Badge>
            )}
          </div>
          <p className="num mt-2 flex items-center gap-1.5 text-[13px] text-muted">
            <Smartphone size={14} /> +54 9 11 ••••-2210
          </p>
          <p className="mt-1 text-[12.5px] text-muted">{L('Último mensaje: hace 1 min', 'Last message: 1 min ago')}</p>
          <DevNotice compact className="mt-3" {...DEV.bot} />
          <Button variant="secondary" className="mt-3 w-full" onClick={restartBot} disabled={botState === 'restarting'}>
            <RefreshCw size={15} className={cn(botState === 'restarting' && 'animate-spin')} /> {L('Reiniciar bot', 'Restart bot')}
          </Button>
        </Card>

        {/* Consumo */}
        <Card className="xl:col-span-2">
          <CardHeader title={L('Consumo de IA', 'AI usage')} subtitle={L('Mensajes procesados por día (últimos 14 días)', 'Messages processed per day (last 14 days)')} />
          <div className="h-[220px] px-2 pb-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip cursor={{ fill: C.primarySoft }} content={<ChartTooltip format={(v) => num(v, lang)} />} />
                <Bar dataKey="mensajes" name={L('Mensajes', 'Messages')} fill={C.info} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Backups */}
        <Card>
          <CardHeader
            title={L('Backups', 'Backups')}
            subtitle={L('Automáticos todos los días a las 03:00', 'Automatic every day at 3:00 AM')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  addBackup()
                  toast.success(L('Backup manual creado', 'Manual backup created'))
                }}
              >
                <Plus size={14} /> {L('Crear', 'Create')}
              </Button>
            }
          />
          <div className="mt-3 divide-y divide-line border-t border-line">
            {backups.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                <HardDriveDownload size={15} className="text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{dateTime(b.fecha, lang)}</p>
                  <p className="text-[11.5px] text-muted">
                    {L(b.tipo.es, b.tipo.en)} · <span className="num">{num(b.tamanoMb, lang, 1)} MB</span>
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setRestore(b)}>
                  <RotateCcw size={13} /> {L('Restaurar', 'Restore')}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modales */}
      <Modal open={planOpen} onClose={closePlan} className="max-w-2xl">
        <div className="p-6">
          <h3 className="text-[17px] font-semibold">{L('Cambiar plan', 'Change plan')}</h3>
          <p className="text-[13px] text-muted">{L('El cambio se aplica en la próxima factura.', 'The change applies on the next invoice.')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PLANES.map((p) => (
              <button key={p.id} onClick={() => setPlan(p.id)} className={cn('rounded-xl border p-4 text-left transition', plan === p.id ? 'border-primary bg-primary-soft/50 ring-2 ring-primary/20' : 'border-line hover:bg-surface2')}>
                <p className="flex items-center justify-between text-[15px] font-semibold">
                  {L(p.nombre.es, p.nombre.en)} {plan === p.id && <Check size={16} className="text-primary" />}
                </p>
                <p className="num mt-1 text-[18px] font-bold">
                  {usd(p.precioUsd, lang)}
                  <span className="text-[12px] font-normal text-muted">/{L('mes', 'mo')}</span>
                </p>
                <ul className="mt-3 space-y-1 text-[12.5px] text-muted">
                  <li>
                    {num(p.limites.pedidosMes, lang)} {L('pedidos/mes', 'orders/mo')}
                  </li>
                  <li>
                    {num(p.limites.mensajesIA, lang)} {L('mensajes IA', 'AI messages')}
                  </li>
                  <li>
                    {p.limites.impresoras} {L('impresoras', 'printers')}
                  </li>
                  <li>
                    {p.limites.usuarios} {L('usuarios', 'users')}
                  </li>
                </ul>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => {
                toast.success(L(`Plan ${PLANES.find((x) => x.id === plan)!.nombre.es} guardado`, `${PLANES.find((x) => x.id === plan)!.nombre.en} plan saved`))
                closePlan()
              }}
            >
              {L('Guardar', 'Save')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={userOpen} onClose={closeUser}>
        <div className="p-6">
          <h3 className="text-[17px] font-semibold">{L('Agregar usuario', 'Add user')}</h3>
          <DevNotice compact className="mt-3" {...DEV.users} />
          <div className="mt-4 space-y-3">
            <div>
              <Label>{L('Nombre', 'Name')}</Label>
              <Input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
            </div>
            <div>
              <Label>{L('Rol', 'Role')}</Label>
              <Select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
                <option value="mostrador">{L('Mostrador', 'Counter')}</option>
                <option value="reparto">{L('Reparto', 'Delivery')}</option>
                <option value="admin">{L('Admin', 'Admin')}</option>
              </Select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeUser}>
              {L('Cancelar', 'Cancel')}
            </Button>
            <Button
              disabled={!nuevo.nombre}
              onClick={() => {
                toast.success(L(`Invitación enviada a ${nuevo.nombre} (simulado)`, `Invite sent to ${nuevo.nombre} (simulated)`))
                setNuevo({ nombre: '', email: '', rol: 'mostrador' })
                closeUser()
              }}
            >
              {L('Enviar invitación', 'Send invite')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!restore} onClose={closeRestore}>
        <div className="p-6">
          <h3 className="text-[17px] font-semibold">{L('Restaurar backup', 'Restore backup')}</h3>
          <p className="mt-1 text-[13.5px] text-muted">
            {L('Vas a volver los datos de tu verdulería al', "You'll roll your shop's data back to")} <b className="text-fg">{restore && dateTime(restore.fecha, lang)}</b>.{' '}
            {L('Solo afecta a tu verdulería.', 'Only your shop is affected.')}
          </p>
          <DevNotice compact className="mt-3" {...DEV.backup} />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeRestore}>
              {L('Cancelar', 'Cancel')}
            </Button>
            <Button
              onClick={() => {
                toast.success(L('Restauración programada (simulada)', 'Restore scheduled (simulated)'))
                closeRestore()
              }}
            >
              <RotateCcw size={15} /> {L('Restaurar', 'Restore')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
