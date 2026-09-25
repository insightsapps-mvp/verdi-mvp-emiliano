import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useApp } from '@/lib/store'
import { canSee, DEFAULT_ROUTE } from '@/lib/roles'
import { Shell } from '@/components/Shell'
import { WelcomeModal } from '@/components/Welcome'
import { Tour } from '@/components/Tour'
import { Trailer } from '@/components/Trailer'
import { DeviceStage, FrameBridge, useWide } from '@/components/Device'
import Login from '@/pages/Login'
import Propuesta from '@/pages/Propuesta'
import Panel from '@/pages/Panel'
import Pedidos from '@/pages/Pedidos'
import WhatsApp from '@/pages/WhatsApp'
import Stock from '@/pages/Stock'
import Cobros from '@/pages/Cobros'
import Reportes from '@/pages/Reportes'
import Clientes from '@/pages/Clientes'
import Entregas from '@/pages/Entregas'
import Tickets from '@/pages/Tickets'
import Conversaciones from '@/pages/Conversaciones'
import Cuenta from '@/pages/Cuenta'

function RequireAuth({ children }: { children: JSX.Element }) {
  const authed = useApp((s) => s.authed)
  const role = useApp((s) => s.role)
  const preview = useApp((s) => s.preview)
  const { pathname } = useLocation()
  if (!authed) return <Navigate to="/login" replace />
  if (!canSee(role, pathname) && !preview) return <Navigate to={DEFAULT_ROUTE[role]} replace />
  return children
}

function LoginRoute() {
  const authed = useApp((s) => s.authed)
  if (authed) return <Navigate to="/propuesta" replace />
  return <Login />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/propuesta" element={<Propuesta />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/cobros" element={<Cobros />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/entregas" element={<Entregas />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/conversaciones" element={<Conversaciones />} />
        <Route path="/cuenta" element={<Cuenta />} />
      </Route>
      <Route path="*" element={<Navigate to="/propuesta" replace />} />
    </Routes>
  )
}

function Root() {
  const device = useApp((s) => s.device)
  const isFrame = useApp((s) => s.isFrame)
  const trailer = useApp((s) => s.trailerActive)
  const theme = useApp((s) => s.theme)
  const wide = useWide()
  const staged = !isFrame && device === 'mobile' && wide && !trailer

  useEffect(() => {
    document.title = 'Verdi · Demo Preview'
  }, [])

  return (
    <>
      {isFrame && <FrameBridge />}
      {staged ? (
        <DeviceStage />
      ) : (
        <>
          <AppRoutes />
          <WelcomeModal />
          <Tour />
          <Trailer />
        </>
      )}
      <Toaster position={isFrame ? 'top-center' : 'bottom-right'} theme={theme} richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  )
}
