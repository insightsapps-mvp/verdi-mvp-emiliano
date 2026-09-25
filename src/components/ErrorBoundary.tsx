import { Component, type ReactNode } from 'react'
import { ls } from '@/lib/utils'

/** Si algo explota en una vista, se muestra una salida digna en vez de pantalla en blanco */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[Verdi]', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    const es = (new URLSearchParams(location.search).get('lang') || ls.get('verdi_lang')) !== 'en'
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-pop">
          <p className="text-[17px] font-semibold">{es ? 'Algo no cargó bien' : "Something didn't load right"}</p>
          <p className="mt-1.5 text-[13.5px] text-muted">{es ? 'Recargá la vista y seguí donde estabas.' : 'Reload the view and pick up where you left off.'}</p>
          <button
            onClick={() => location.reload()}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white dark:text-zinc-950"
          >
            {es ? 'Recargar' : 'Reload'}
          </button>
        </div>
      </div>
    )
  }
}
