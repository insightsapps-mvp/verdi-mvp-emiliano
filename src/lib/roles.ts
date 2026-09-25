import {
  FileText,
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
  Package,
  Wallet,
  BarChart3,
  Users,
  Bike,
  Receipt,
  Bot,
  Settings2,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'admin' | 'verduleria'

export interface NavItem {
  id: string
  path: string
  es: string
  en: string
  icon: LucideIcon
  commercial?: boolean
}

export const NAV: Record<string, NavItem> = {
  propuesta: { id: 'propuesta', path: '/propuesta', es: 'Propuesta', en: 'Proposal', icon: FileText, commercial: true },
  panel: { id: 'panel', path: '/panel', es: 'Panel general', en: 'Overview', icon: LayoutDashboard },
  pedidos: { id: 'pedidos', path: '/pedidos', es: 'Pedidos de hoy', en: "Today's orders", icon: ClipboardList },
  whatsapp: { id: 'whatsapp', path: '/whatsapp', es: 'WhatsApp IA', en: 'WhatsApp AI', icon: MessageCircle },
  stock: { id: 'stock', path: '/stock', es: 'Stock y precios', en: 'Stock & prices', icon: Package },
  cobros: { id: 'cobros', path: '/cobros', es: 'Cobros', en: 'Payments', icon: Wallet },
  reportes: { id: 'reportes', path: '/reportes', es: 'Reportes', en: 'Reports', icon: BarChart3 },
  clientes: { id: 'clientes', path: '/clientes', es: 'Clientes', en: 'Customers', icon: Users },
  entregas: { id: 'entregas', path: '/entregas', es: 'Entregas', en: 'Deliveries', icon: Bike },
  tickets: { id: 'tickets', path: '/tickets', es: 'Tickets', en: 'Receipts', icon: Receipt },
  conversaciones: { id: 'conversaciones', path: '/conversaciones', es: 'Conversaciones IA', en: 'AI chats', icon: Bot },
  cuenta: { id: 'cuenta', path: '/cuenta', es: 'Mi cuenta', en: 'My account', icon: Settings2 },
}

/** Orden visual exacto del menú superior (izquierda → derecha) */
export const NAV_BY_ROLE: Record<Role, string[]> = {
  admin: ['propuesta', 'panel', 'pedidos', 'whatsapp', 'stock', 'cobros', 'reportes', 'clientes', 'entregas', 'tickets', 'conversaciones', 'cuenta'],
  verduleria: ['propuesta', 'pedidos', 'whatsapp', 'entregas', 'stock', 'tickets', 'conversaciones'],
}

export const DEFAULT_ROUTE: Record<Role, string> = {
  admin: '/panel',
  verduleria: '/pedidos',
}

export const ROLE_USER: Record<Role, { nombre: string; es: string; en: string; iniciales: string }> = {
  admin: { nombre: 'Tito Fernández', es: 'Dueño · Admin', en: 'Owner · Admin', iniciales: 'TF' },
  verduleria: { nombre: 'Marcos Acuña', es: 'Mostrador', en: 'Counter', iniciales: 'MA' },
}

export const CREDENTIALS: { role: Role; user: string; pass: string }[] = [
  { role: 'admin', user: 'tito', pass: 'demo2026' },
  { role: 'verduleria', user: 'mostrador', pass: 'demo2026' },
]

export function canSee(role: Role, path: string) {
  if (path.startsWith('/propuesta')) return true
  const first = '/' + (path.split('/')[1] ?? '')
  return NAV_BY_ROLE[role].some((id) => NAV[id].path === first)
}

export function navItems(role: Role) {
  return NAV_BY_ROLE[role].map((id) => NAV[id])
}
