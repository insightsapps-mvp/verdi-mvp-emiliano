import { useCallback } from 'react'
import { useApp } from './store'

export type Lang = 'es' | 'en'

/** Diccionario central {clave: [es, en]}. Para copys puntuales se usa useL()(es, en). */
export const dict = {
  'brand.demo': ['DEMO PREVIEW', 'DEMO PREVIEW'],
  'brand.powered': ['Powered by Insights', 'Powered by Insights'],
  'act.start': ['Quiero arrancar', "Let's start"],
  'act.advanceWa': ['Avanzar por WhatsApp', 'Move forward on WhatsApp'],
  'act.close': ['Cerrar', 'Close'],
  'act.cancel': ['Cancelar', 'Cancel'],
  'act.save': ['Guardar', 'Save'],
  'act.confirm': ['Confirmar', 'Confirm'],
  'act.back': ['Atrás', 'Back'],
  'act.next': ['Siguiente', 'Next'],
  'act.search': ['Buscar…', 'Search…'],
  'act.view': ['Ver', 'View'],
  'act.logout': ['Cerrar sesión', 'Log out'],
  'act.more': ['Más', 'More'],
  'act.export': ['Exportar PDF', 'Export PDF'],
  'act.print': ['Imprimir', 'Print'],
  'act.tour': ['Tour', 'Tour'],
  'act.menu': ['Menú', 'Menu'],
  'hdr.switch': ['Cambiar vista', 'Switch view'],
  'hdr.commercial': ['COMERCIAL', 'COMMERCIAL'],
  'hdr.desktop': ['Escritorio', 'Desktop'],
  'hdr.mobile': ['Celular', 'Mobile'],
  'hdr.deviceTip': ['Ver cómo se ve en el teléfono', 'See how it looks on a phone'],
  'hdr.theme': ['Cambiar tema', 'Toggle theme'],
  'hdr.lang': ['Cambiar idioma', 'Change language'],
  'role.admin': ['Admin', 'Admin'],
  'role.admin.sub': ['Dueño · ve todo', 'Owner · sees everything'],
  'role.verduleria': ['Verdulería', 'Shop counter'],
  'role.verduleria.sub': ['Mostrador · pedidos y entregas', 'Counter · orders & deliveries'],
  'foot.liked': ['¿Te gustó lo que ves? Hablemos y arrancamos.', "Like what you see? Let's talk and get started."],
  'pb.nav': ['PREVIEW NAVEGABLE', 'NAVIGABLE PREVIEW'],
  'pb.mock': ['DATOS MOCK', 'MOCK DATA'],
  'pb.title': ['Qué hace este módulo cuando esté funcional', 'What this module does once it is live'],
  'pb.android': [
    'En producción esto es una app Android nativa; acá lo ves como previsualización web.',
    'In production this is a native Android app; here you see it as a web preview.',
  ],
  'pb.hide': ['Ocultar', 'Hide'],
  'pb.show': ['Qué hace este módulo', 'What this module does'],
  'dev.suffix': ['función en desarrollo', 'feature in development'],
  'dev.now': ['Ahora se simula:', 'Simulated now:'],
  'dev.later': ['Al desarrollar se activa:', 'Activated in development:'],
  'dev.pop': ['En desarrollo', 'In development'],
  'st.pendiente': ['Pendiente', 'Pending'],
  'st.confirmado': ['Confirmado', 'Confirmed'],
  'st.preparacion': ['En preparación', 'Preparing'],
  'st.en_camino': ['En camino', 'On the way'],
  'st.entregado': ['Entregado', 'Delivered'],
  'st.cancelado': ['Cancelado', 'Cancelled'],
  'pay.aprobado': ['Aprobado', 'Approved'],
  'pay.rechazado': ['Rechazado', 'Rejected'],
  'pay.pendiente': ['Pendiente', 'Pending'],
  'pay.reembolsado': ['Reembolsado', 'Refunded'],
  'mp.mercadopago': ['Mercado Pago', 'Mercado Pago'],
  'mp.efectivo': ['Efectivo', 'Cash'],
  'mp.transferencia': ['Transferencia', 'Bank transfer'],
  'cat.verduras': ['Verduras', 'Vegetables'],
  'cat.frutas': ['Frutas', 'Fruits'],
  'cat.hojas': ['Hojas', 'Leafy greens'],
  'cat.otros': ['Otros', 'Other'],
  'cat.todas': ['Todas', 'All'],
  'or.whatsapp': ['WhatsApp', 'WhatsApp'],
  'or.mostrador': ['Mostrador', 'Counter'],
  'mv.compra': ['Compra', 'Purchase'],
  'mv.venta': ['Venta', 'Sale'],
  'mv.merma': ['Merma', 'Shrinkage'],
  'mv.correccion': ['Corrección', 'Correction'],
  'toast.saved': ['Cambios guardados', 'Changes saved'],
  'toast.forgot': [
    'Te mandamos un link para restablecer la contraseña (mock).',
    'We sent you a password reset link (mock).',
  ],
} as const satisfies Record<string, readonly [string, string]>

export type DictKey = keyof typeof dict

export function tr(lang: Lang, key: DictKey): string {
  return dict[key][lang === 'es' ? 0 : 1]
}

/** Texto bilingüe fuera de React. */
export const l = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en)

export function useLang(): Lang {
  return useApp((s) => s.lang)
}

export function useT() {
  const lang = useLang()
  return useCallback((key: DictKey) => tr(lang, key), [lang])
}

export function useL() {
  const lang = useLang()
  return useCallback((es: string, en: string) => (lang === 'es' ? es : en), [lang])
}
