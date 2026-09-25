import { create } from 'zustand'
import { buildDB, DAY, MIN, MP_FEE, totalItems, type MockDB } from '@/data/mock'
import type { EstadoPedido, ItemPedido, Pedido, Producto, TipoMov } from '@/data/types'
import type { Lang } from './i18n'

export interface DataState extends MockDB {
  highlightPedidoId: string | null
  setHighlight: (id: string | null) => void
  setEstado: (pedidoId: string, estado: EstadoPedido) => void
  setRepartidor: (pedidoId: string, nombre: string) => void
  adjustStock: (productoId: string, tipo: TipoMov, cantidad: number, motivo: { es: string; en: string }, usuario: string) => void
  editPrice: (productoId: string, precio: number, usuario: string) => void
  addProducto: (p: Omit<Producto, 'id' | 'tenantId' | 'historialPrecios' | 'aliases' | 'aliasesEn'>) => void
  printTicket: (pedidoId: string, modo: 'local' | 'nube', usuario: string) => string
  retryTx: (txId: string) => void
  setImpresora: (id: string, estado: 'conectada' | 'sin_papel' | 'desconectada') => void
  toggleUsuario: (id: string) => void
  addBackup: () => void
  /** Crea el pedido que viene del simulador de WhatsApp: impacta pedidos, stock, cobros y conversación */
  addPedidoWhatsApp: (items: ItemPedido[], clienteId: string, chatLog: { from: 'cliente' | 'ia'; es: string; en: string }[]) => Pedido
  refundPedido: (pedidoId: string) => void
  swapItem: (pedidoId: string, fromId: string, toId: string) => number
  resetDemo: () => void
}

export const useData = create<DataState>((set, get) => ({
  ...buildDB(),
  highlightPedidoId: null,
  setHighlight: (highlightPedidoId) => set({ highlightPedidoId }),
  setEstado: (pedidoId, estado) =>
    set((s) => ({
      pedidos: s.pedidos.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              estado,
              nuevo: false,
              revisar: estado === 'pendiente' ? p.revisar : false,
              estadoPago: estado === 'entregado' && p.estadoPago === 'pendiente' ? 'aprobado' : p.estadoPago,
              repartidor: estado === 'en_camino' && !p.repartidor ? 'Lucía Paz' : p.repartidor,
            }
          : p,
      ),
    })),
  setRepartidor: (pedidoId, nombre) =>
    set((s) => ({ pedidos: s.pedidos.map((p) => (p.id === pedidoId ? { ...p, repartidor: nombre } : p)) })),
  adjustStock: (productoId, tipo, cantidad, motivo, usuario) =>
    set((s) => ({
      productos: s.productos.map((p) => (p.id === productoId ? { ...p, stock: Math.max(0, Math.round((p.stock + cantidad) * 10) / 10) } : p)),
      movimientos: [{ id: `m${Date.now()}`, productoId, tipo, cantidad, usuario, fecha: Date.now(), motivo }, ...s.movimientos],
    })),
  editPrice: (productoId, precio, usuario) =>
    set((s) => ({
      productos: s.productos.map((p) =>
        p.id === productoId ? { ...p, precio, historialPrecios: [...p.historialPrecios, { fecha: Date.now(), precio, usuario }] } : p,
      ),
    })),
  addProducto: (np) =>
    set((s) => ({
      productos: [
        ...s.productos,
        {
          ...np,
          id: `x${Date.now()}`,
          tenantId: 'vt-001',
          aliases: [np.nombre.toLowerCase()],
          aliasesEn: [np.nombreEn.toLowerCase()],
          historialPrecios: [{ fecha: Date.now(), precio: np.precio, usuario: 'Tito Fernández' }],
        },
      ],
    })),
  printTicket: (pedidoId, modo, usuario) => {
    const s = get()
    const existing = s.tickets.find((t) => t.pedidoId === pedidoId)
    if (existing) return existing.numero
    const p = s.pedidos.find((x) => x.id === pedidoId)!
    const numero = `0001-${String(s.ticketSeq).padStart(8, '0')}`
    set({
      ticketSeq: s.ticketSeq + 1,
      tickets: [
        { numero, pedidoId, pedidoCodigo: p.codigo, modo, impresora: modo === 'local' ? 'p1' : 'PDF', usuario, fecha: Date.now(), monto: p.total },
        ...s.tickets,
      ],
    })
    return numero
  },
  retryTx: (txId) =>
    set((s) => ({
      transacciones: s.transacciones.map((t) =>
        t.id === txId ? { ...t, estado: 'aprobado', reintentos: t.reintentos + 1, nota: { es: 'Aprobado en reintento manual', en: 'Approved on manual retry' } } : t,
      ),
    })),
  setImpresora: (id, estado) => set((s) => ({ impresoras: s.impresoras.map((p) => (p.id === id ? { ...p, estado } : p)) })),
  toggleUsuario: (id) => set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)) })),
  addBackup: () =>
    set((s) => ({
      backups: [{ id: `bk${Date.now()}`, fecha: Date.now(), tamanoMb: 48.4, tipo: { es: 'Manual', en: 'Manual' } }, ...s.backups],
    })),
  addPedidoWhatsApp: (items, clienteId, chatLog) => {
    const s = get()
    const now = Date.now()
    const codigo = `VT-${s.nextNum}`
    const id = `p${s.nextNum}`
    const total = totalItems(items)
    const pedido: Pedido = {
      id,
      codigo,
      tenantId: 'vt-001',
      clienteId,
      items,
      total,
      medioPago: 'mercadopago',
      estado: 'confirmado',
      estadoPago: 'aprobado',
      creadoEl: now,
      entregaFranja: '18-19',
      origen: 'whatsapp',
      direccion: 'Thames 1240',
      nuevo: true,
    }
    const comision = Math.round(total * MP_FEE)
    set({
      nextNum: s.nextNum + 1,
      pedidos: [pedido, ...s.pedidos],
      highlightPedidoId: id,
      productos: s.productos.map((p) => {
        const it = items.find((i) => i.productoId === p.id)
        return it ? { ...p, stock: Math.max(0, Math.round((p.stock - it.cantidad) * 10) / 10) } : p
      }),
      movimientos: [
        ...items.map((it, i) => ({
          id: `mw${now}${i}`,
          productoId: it.productoId,
          tipo: 'venta' as const,
          cantidad: -it.cantidad,
          usuario: 'IA WhatsApp',
          fecha: now,
          motivo: { es: `Pedido #${codigo}`, en: `Order #${codigo}` },
        })),
        ...s.movimientos,
      ],
      transacciones: [
        { id: `MP-${90500 + s.nextNum}`, pedidoId: id, pedidoCodigo: codigo, monto: total, comision, neto: total - comision, estado: 'aprobado', reintentos: 0, fecha: now },
        ...s.transacciones,
      ],
      conversaciones: [
        {
          id: `cvw${now}`,
          clienteId,
          resueltaPorIA: true,
          pedidoId: id,
          tema: { es: 'Pedido', en: 'Order' },
          mensajes: chatLog.map((m, i) => ({ ...m, hora: now - (chatLog.length - i) * 15000 })),
        },
        ...s.conversaciones,
      ],
      clientes: s.clientes.map((c) => (c.id === clienteId ? { ...c, pedidos: c.pedidos + 1, gastoMes: c.gastoMes + total, ultimoPedido: now } : c)),
    })
    return pedido
  },
  refundPedido: (pedidoId) =>
    set((s) => ({
      pedidos: s.pedidos.map((p) => (p.id === pedidoId ? { ...p, estado: 'cancelado', estadoPago: 'reembolsado', nuevo: false } : p)),
      transacciones: s.transacciones.map((t) =>
        t.pedidoId === pedidoId ? { ...t, estado: 'reembolsado', nota: { es: 'Reembolso iniciado por el cliente vía WhatsApp', en: 'Refund started by the customer via WhatsApp' } } : t,
      ),
      productos: s.productos.map((p) => {
        const ped = s.pedidos.find((x) => x.id === pedidoId)
        const it = ped?.items.find((i) => i.productoId === p.id)
        return it ? { ...p, stock: Math.round((p.stock + it.cantidad) * 10) / 10 } : p
      }),
    })),
  swapItem: (pedidoId, fromId, toId) => {
    const s = get()
    const to = s.productos.find((p) => p.id === toId)!
    let diff = 0
    set({
      pedidos: s.pedidos.map((p) => {
        if (p.id !== pedidoId) return p
        const items = p.items.map((it) => {
          if (it.productoId !== fromId) return it
          const nuevo = { productoId: toId, cantidad: it.cantidad, precio: to.precio }
          diff = nuevo.cantidad * nuevo.precio - it.cantidad * it.precio
          return nuevo
        })
        return { ...p, items, total: totalItems(items) }
      }),
    })
    return diff
  },
  resetDemo: () => set({ ...buildDB(), highlightPedidoId: null }),
}))

// ---------- Helpers de display ----------
export const prodName = (p: Pick<Producto, 'nombre' | 'nombreEn'> | undefined, lang: Lang) => (p ? (lang === 'es' ? p.nombre : p.nombreEn) : '—')

export function useProductoMap() {
  const productos = useData((s) => s.productos)
  return Object.fromEntries(productos.map((p) => [p.id, p])) as Record<string, Producto>
}

export function useClienteMap() {
  const clientes = useData((s) => s.clientes)
  return Object.fromEntries(clientes.map((c) => [c.id, c]))
}

export const stockLevel = (p: Producto): 'ok' | 'bajo' | 'critico' => (p.stock <= p.minimo * 0.5 ? 'critico' : p.stock <= p.minimo ? 'bajo' : 'ok')

/** KPIs del día calculados desde el store (coherencia entre pantallas) */
export function kpisHoy(pedidos: Pedido[]) {
  const validos = pedidos.filter((p) => p.estado !== 'cancelado')
  const facturado = validos.reduce((s, p) => s + p.total, 0)
  const wa = validos.filter((p) => p.origen === 'whatsapp').length
  return {
    pedidos: validos.length,
    facturado,
    ticket: validos.length ? Math.round(facturado / validos.length) : 0,
    pctWhatsapp: validos.length ? Math.round((wa / validos.length) * 100) : 0,
  }
}

export { DAY, MIN }
