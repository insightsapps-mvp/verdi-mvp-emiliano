export interface Bi {
  es: string
  en: string
}

export type Categoria = 'verduras' | 'frutas' | 'hojas' | 'otros'
export type Unidad = 'kg' | 'unidad' | 'atado' | 'maple' | 'bandeja'
export type EstadoPedido = 'pendiente' | 'confirmado' | 'preparacion' | 'en_camino' | 'entregado' | 'cancelado'
export type EstadoPago = 'aprobado' | 'rechazado' | 'pendiente' | 'reembolsado'
export type MedioPago = 'mercadopago' | 'efectivo' | 'transferencia'
export type TipoMov = 'compra' | 'venta' | 'merma' | 'correccion'
export type ProductIcon =
  | 'apple'
  | 'carrot'
  | 'citrus'
  | 'leaf'
  | 'cherry'
  | 'grape'
  | 'salad'
  | 'banana'
  | 'egg'
  | 'sprout'
  | 'nut'
  | 'wheat'

export interface Tenant {
  id: string
  nombre: string
  barrio: string
  ciudad: string
  plan: 'basico' | 'pro' | 'full'
  estado: 'activa' | 'suspendida' | 'prueba'
  botOnline: boolean
  pedidosMes: number
  gmvMes: number
  consumoApi: number
  creadoEl: number
}

export interface Producto {
  id: string
  tenantId: string
  codigo: string
  nombre: string
  nombreEn: string
  categoria: Categoria
  unidad: Unidad
  precio: number
  stock: number
  minimo: number
  aliases: string[]
  aliasesEn: string[]
  icon: ProductIcon
  historialPrecios: { fecha: number; precio: number; usuario: string }[]
}

export interface ItemPedido {
  productoId: string
  cantidad: number
  precio: number
}

export interface Pedido {
  id: string
  codigo: string
  tenantId: string
  clienteId: string
  items: ItemPedido[]
  total: number
  medioPago: MedioPago
  estado: EstadoPedido
  estadoPago: EstadoPago
  creadoEl: number
  entregaFranja: string
  origen: 'whatsapp' | 'mostrador'
  repartidor?: string
  direccion: string
  nuevo?: boolean
  revisar?: boolean
}

export interface Cliente {
  id: string
  tenantId: string
  nombre: string
  barrio: string
  telefono: string
  pedidos: number
  gastoMes: number
  favorito: string
  ultimoPedido: number
  desde: number
}

export interface Transaccion {
  id: string
  pedidoId: string
  pedidoCodigo: string
  monto: number
  comision: number
  neto: number
  estado: EstadoPago
  reintentos: number
  fecha: number
  nota?: Bi
}

export interface Ticket {
  numero: string
  pedidoId: string
  pedidoCodigo: string
  modo: 'local' | 'nube'
  impresora: string
  usuario: string
  fecha: number
  monto: number
}

export interface MovimientoStock {
  id: string
  productoId: string
  tipo: TipoMov
  cantidad: number
  usuario: string
  fecha: number
  motivo: Bi
}

export interface Mensaje {
  from: 'cliente' | 'ia' | 'verdulero'
  es: string
  en: string
  hora: number
}

export interface Conversacion {
  id: string
  clienteId: string
  mensajes: Mensaje[]
  resueltaPorIA: boolean
  pedidoId?: string
  tema: Bi
}

export interface Plan {
  id: 'basico' | 'pro' | 'full'
  nombre: Bi
  precioUsd: number
  limites: { pedidosMes: number; impresoras: number; usuarios: number; mensajesIA: number }
}

export interface Impresora {
  id: string
  nombre: Bi
  tipo: Bi
  estado: 'conectada' | 'sin_papel' | 'desconectada'
}

export interface DiaVentas {
  fecha: number
  ventas: number
  pedidos: number
  whatsapp: number
  mercadopago: number
  efectivo: number
  transferencia: number
  mensajesIA: number
}

export interface Usuario {
  id: string
  nombre: string
  rol: Bi
  email: string
  ultimoAcceso: number
  activo: boolean
}

export interface Backup {
  id: string
  fecha: number
  tamanoMb: number
  tipo: Bi
}
