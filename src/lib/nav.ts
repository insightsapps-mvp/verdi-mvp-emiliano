import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from './store'
import { DEFAULT_ROUTE, type Role } from './roles'

/** Navegación "a mano" (menú): cancela cualquier previsualización abierta. */
export function useGo() {
  const navigate = useNavigate()
  const cancelPreview = useApp((s) => s.cancelPreview)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  return useCallback(
    (path: string) => {
      cancelPreview()
      setSheetOpen(false)
      navigate(path)
    },
    [navigate, cancelPreview, setSheetOpen],
  )
}

/** Cambio de rol en vivo desde el switcher: cancela preview y va a la vista default del rol. */
export function useSwitchRole() {
  const navigate = useNavigate()
  const setRole = useApp((s) => s.setRole)
  const cancelPreview = useApp((s) => s.cancelPreview)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  return useCallback(
    (r: Role) => {
      cancelPreview()
      setSheetOpen(false)
      setRole(r)
      navigate(DEFAULT_ROUTE[r])
    },
    [navigate, setRole, cancelPreview, setSheetOpen],
  )
}

/** "Ver en el demo": cambia de rol si hace falta, navega a la vista real y guarda el contexto de retorno. */
export function useAbrirPreview() {
  const navigate = useNavigate()
  const abrir = useApp((s) => s.abrirPreview)
  return useCallback(
    (modulo: number, view: string, role: Role | null, titulo: { es: string; en: string }) => {
      const current = useApp.getState().role
      abrir(modulo, view, role ?? current, titulo)
      navigate(view)
      window.scrollTo({ top: 0 })
    },
    [navigate, abrir],
  )
}

export function useCerrarPreview() {
  const navigate = useNavigate()
  const cerrar = useApp((s) => s.cerrarPreview)
  return useCallback(() => {
    cerrar()
    navigate('/propuesta')
  }, [navigate, cerrar])
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useApp((s) => s.logout)
  return useCallback(() => {
    logout()
    navigate('/login')
  }, [navigate, logout])
}
