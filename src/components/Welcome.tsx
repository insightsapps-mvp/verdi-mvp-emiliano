import { useCallback } from 'react'
import { ArrowRight, Leaf } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL } from '@/lib/i18n'
import { ss } from '@/lib/utils'
import { Button, Modal } from './ui'

export function WelcomeModal() {
  const open = useApp((s) => s.welcomeOpen)
  const trailer = useApp((s) => s.trailerActive)
  const setOpen = useApp((s) => s.setWelcomeOpen)
  const L = useL()
  const close = useCallback(() => {
    ss.set('verdi_welcome_seen', '1')
    setOpen(false)
  }, [setOpen])
  return (
    <Modal open={open && !trailer} onClose={close} closeOnBackdrop={false} showClose={false} className="max-w-[500px]" z="z-[300]">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft">
            <Leaf size={17} strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">Verdi</span>
        </div>
        <h2 className="mt-5 text-[26px] font-bold tracking-tight">{L('Hola Emiliano 👋', 'Hi Emiliano 👋')}</h2>
        <p className="mt-2 text-[15px] font-medium text-fg/90">
          {L(
            'Somos Juan y Fede de Insights. Construimos este MVP para que veas tu plataforma funcionando antes de invertir.',
            "We're Juan and Fede from Insights. We built this MVP so you can see your platform working before investing.",
          )}
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {L(
            'Verdi es tu SaaS para verdulerías de todo el país: cada local que te compra una licencia recibe un bot de WhatsApp que toma los pedidos, valida el stock y cobra con Mercado Pago solo. El dueño ve los números, las estadísticas y el stock de su verdulería; el mostrador maneja pedidos, entregas y tickets. Y los clientes no instalan nada: solo escriben por WhatsApp.',
            'Verdi is your SaaS for produce shops all over the country: every shop that buys a license gets a WhatsApp bot that takes orders, checks stock and collects payment with Mercado Pago on its own. The owner sees the numbers, stats and stock of their shop; the counter handles orders, deliveries and receipts. And customers install nothing: they just write on WhatsApp.',
          )}
        </p>
        <p className="mt-3 text-[14px] italic text-muted">
          {L("Si te gusta lo que ves, hacé clic en 'Quiero arrancar' y arrancamos.", "If you like what you see, click 'Let's start' and we'll get going.")}
        </p>
        <Button size="lg" className="mt-6 w-full" onClick={close}>
          {L('Ver la plataforma', 'See the platform')} <ArrowRight size={17} />
        </Button>
      </div>
    </Modal>
  )
}
