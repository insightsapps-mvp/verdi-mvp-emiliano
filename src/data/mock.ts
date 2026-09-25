import { rng } from '@/lib/utils'
import { buildCatalogo } from './catalogo'
import type {
  Backup,
  Cliente,
  Conversacion,
  DiaVentas,
  EstadoPedido,
  Impresora,
  MedioPago,
  Mensaje,
  MovimientoStock,
  Pedido,
  Plan,
  Producto,
  Tenant,
  Ticket,
  Transaccion,
  Usuario,
} from './types'

export const MIN = 60000
export const HOUR = 3600000
export const DAY = 86400000
export const MP_FEE = 0.0629 // comisión Mercado Pago acreditación inmediata

export const TENANT: Tenant = {
  id: 'vt-001',
  nombre: 'Verdulería Don Tito',
  barrio: 'Villa Crespo',
  ciudad: 'CABA',
  plan: 'pro',
  estado: 'activa',
  botOnline: true,
  pedidosMes: 0,
  gmvMes: 0,
  consumoApi: 0,
  creadoEl: Date.now() - 142 * DAY,
}

export const PLANES: Plan[] = [
  { id: 'basico', nombre: { es: 'Básico', en: 'Basic' }, precioUsd: 49, limites: { pedidosMes: 600, impresoras: 1, usuarios: 2, mensajesIA: 3000 } },
  { id: 'pro', nombre: { es: 'Pro', en: 'Pro' }, precioUsd: 89, limites: { pedidosMes: 1500, impresoras: 3, usuarios: 5, mensajesIA: 8000 } },
  { id: 'full', nombre: { es: 'Full', en: 'Full' }, precioUsd: 149, limites: { pedidosMes: 5000, impresoras: 10, usuarios: 15, mensajesIA: 25000 } },
]

export const REPARTIDORES = ['Lucía Paz', 'Ramiro Vega']

export const IMPRESORAS: Impresora[] = [
  { id: 'p1', nombre: { es: 'Térmica mostrador', en: 'Counter thermal' }, tipo: { es: 'USB · 80mm', en: 'USB · 80mm' }, estado: 'conectada' },
  { id: 'p2', nombre: { es: 'Térmica depósito', en: 'Storeroom thermal' }, tipo: { es: 'USB · 80mm', en: 'USB · 80mm' }, estado: 'sin_papel' },
]

const NOMBRES = [
  'Laura Giménez', 'Martín Acosta', 'Sofía Romero', 'Diego Ferreyra', 'Valentina Sosa', 'Gustavo Pereyra',
  'Camila Benítez', 'Julián Medina', 'Florencia Ruiz', 'Nicolás Herrera', 'Agustina Molina', 'Federico Castro',
  'Micaela Ortiz', 'Pablo Domínguez', 'Carolina Suárez', 'Lucas Álvarez', 'Rocío Torres', 'Matías Rojas',
  'Julieta Navarro', 'Hernán Gutiérrez', 'Paula Morales', 'Santiago Ríos', 'Belén Cabrera', 'Tomás Aguirre',
  'Natalia Vázquez', 'Facundo Luna', 'Daniela Figueroa', 'Ezequiel Correa', 'Lorena Quiroga', 'Maximiliano Ledesma',
  'Victoria Peralta', 'Ignacio Méndez', 'Marina Carrizo', 'Alejandro Blanco', 'Cecilia Juárez', 'Gonzalo Paz',
  'Andrea Villalba', 'Leandro Godoy', 'Graciela Ponce', 'Ricardo Silva',
]
const BARRIOS = ['Villa Crespo', 'Villa Crespo', 'Villa Crespo', 'Almagro', 'Palermo', 'Caballito', 'Chacarita', 'Villa Crespo', 'Paternal', 'Palermo']
const CALLES = ['Av. Corrientes', 'Thames', 'Loyola', 'Julián Álvarez', 'Serrano', 'Gurruchaga', 'Acevedo', 'Padilla', 'Vera', 'Camargo', 'Aguirre', 'Muñecas', 'Castillo', 'Av. Scalabrini Ortiz']
const FRANJAS = ['10-12', '12-14', '14-16', '16-18', '18-19', '19-20']

function startOfToday(now: number) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return +d
}

export interface MockDB {
  now: number
  productos: Producto[]
  clientes: Cliente[]
  pedidos: Pedido[]
  transacciones: Transaccion[]
  tickets: Ticket[]
  movimientos: MovimientoStock[]
  conversaciones: Conversacion[]
  historial: DiaVentas[]
  usuarios: Usuario[]
  backups: Backup[]
  impresoras: Impresora[]
  nextNum: number
  ticketSeq: number
}

function pickItems(r: () => number, productos: Producto[], n: number) {
  const pool = productos.filter((p) => p.stock > 5)
  const chosen = new Set<string>()
  const items = []
  while (items.length < n) {
    const p = pool[Math.floor(r() * pool.length)]
    if (chosen.has(p.id)) continue
    chosen.add(p.id)
    const cantidad =
      p.unidad === 'kg' ? [0.5, 1, 1, 1.5, 2, 2, 3][Math.floor(r() * 7)] : p.unidad === 'unidad' ? [1, 2, 2, 3, 4, 6][Math.floor(r() * 6)] : [1, 1, 2][Math.floor(r() * 3)]
    items.push({ productoId: p.id, cantidad, precio: p.precio })
  }
  return items
}

export const totalItems = (items: { cantidad: number; precio: number }[]) =>
  Math.round(items.reduce((s, it) => s + it.cantidad * it.precio, 0))

export function buildDB(now = Date.now()): MockDB {
  const r = rng(20260925)
  const today = startOfToday(now)
  const productos = buildCatalogo(now)

  // --- Clientes
  const clientes: Cliente[] = NOMBRES.map((nombre, i) => ({
    id: `c${i + 1}`,
    tenantId: 'vt-001',
    nombre,
    barrio: i === 0 ? 'Villa Crespo' : BARRIOS[Math.floor(r() * BARRIOS.length)],
    telefono: `+54 9 11 ••••-${String(1000 + Math.floor(r() * 8999))}`,
    pedidos: 3 + Math.floor(r() * 40),
    gastoMes: 0,
    favorito: productos[Math.floor(r() * 24)].id,
    ultimoPedido: now - Math.floor(r() * 9) * DAY - Math.floor(r() * 10) * HOUR,
    desde: now - (40 + Math.floor(r() * 300)) * DAY,
  }))
  clientes[0].favorito = 'perita'
  clientes[0].pedidos = 27

  // --- Pedidos de hoy (38): la distribución por estado es fija para la demo
  const estados: EstadoPedido[] = [
    ...Array(15).fill('entregado'),
    ...Array(4).fill('en_camino'),
    ...Array(6).fill('preparacion'),
    ...Array(8).fill('confirmado'),
    ...Array(5).fill('pendiente'),
  ]
  const pedidos: Pedido[] = estados.map((estado, i) => {
    const items = pickItems(r, productos, 2 + Math.floor(r() * 4))
    const origen = r() < 0.84 ? 'whatsapp' : 'mostrador'
    const mr = r()
    const medioPago: MedioPago = origen === 'mostrador' ? (mr < 0.6 ? 'efectivo' : 'mercadopago') : mr < 0.8 ? 'mercadopago' : mr < 0.92 ? 'efectivo' : 'transferencia'
    const creado = today + 8 * HOUR + i * 14 * MIN + Math.floor(r() * 9) * MIN
    const franjaIdx = Math.min(FRANJAS.length - 1, Math.floor(i / 7))
    const cli = clientes[1 + Math.floor(r() * (clientes.length - 1))]
    return {
      id: `p${1010 + i}`,
      codigo: `VT-${1010 + i}`,
      tenantId: 'vt-001',
      clienteId: cli.id,
      items,
      total: totalItems(items),
      medioPago,
      estado,
      estadoPago: estado === 'pendiente' ? (medioPago === 'mercadopago' ? 'pendiente' : 'pendiente') : medioPago === 'efectivo' && estado !== 'entregado' ? 'pendiente' : 'aprobado',
      creadoEl: creado,
      entregaFranja: FRANJAS[franjaIdx],
      origen,
      repartidor: ['en_camino', 'entregado', 'preparacion'].includes(estado) ? REPARTIDORES[i % 2] : undefined,
      direccion: `${CALLES[Math.floor(r() * CALLES.length)]} ${100 + Math.floor(r() * 1900)}`,
    }
  })
  // Edge case: pedido con pago pendiente hace 25 min
  const rev = pedidos[pedidos.length - 1]
  rev.creadoEl = now - 25 * MIN
  rev.medioPago = 'mercadopago'
  rev.estadoPago = 'pendiente'
  rev.revisar = true
  rev.origen = 'whatsapp'
  // pendientes restantes con pago por MP también pendiente
  pedidos.forEach((p) => {
    if (p.creadoEl > now) p.creadoEl = now - Math.floor(r() * 50 + 30) * MIN
  })

  // --- Historial 30 días
  const historial: DiaVentas[] = []
  for (let d = 30; d >= 1; d--) {
    const fecha = today - d * DAY
    const dow = new Date(fecha).getDay()
    const base = dow === 0 ? 22 : dow === 6 ? 52 : dow === 5 ? 46 : 36
    const pedidosDia = Math.round(base + (r() - 0.4) * 10 + (30 - d) * 0.25)
    const ticket = 11800 + r() * 3600
    const ventas = Math.round(pedidosDia * ticket)
    historial.push({
      fecha,
      ventas,
      pedidos: pedidosDia,
      whatsapp: Math.round(pedidosDia * (0.78 + r() * 0.1)),
      mercadopago: Math.round(ventas * 0.71),
      efectivo: Math.round(ventas * 0.2),
      transferencia: Math.round(ventas * 0.09),
      mensajesIA: Math.round(pedidosDia * (5.5 + r() * 2)),
    })
  }

  // --- Transacciones MP (hoy + ayer ≈ 60)
  const transacciones: Transaccion[] = []
  let txn = 90412
  pedidos
    .filter((p) => p.medioPago === 'mercadopago')
    .forEach((p) => {
      const estado = p.estadoPago === 'aprobado' ? 'aprobado' : 'pendiente'
      const comision = Math.round(p.total * MP_FEE)
      transacciones.push({
        id: `MP-${txn++}`,
        pedidoId: p.id,
        pedidoCodigo: p.codigo,
        monto: p.total,
        comision,
        neto: p.total - comision,
        estado,
        reintentos: 0,
        fecha: p.creadoEl + 2 * MIN,
      })
    })
  // 3 rechazados de hoy
  const rechazos: { nota: { es: string; en: string }; reintentos: number }[] = [
    { nota: { es: 'Reintento automático programado · 16:30', en: 'Automatic retry scheduled · 4:30 PM' }, reintentos: 1 },
    { nota: { es: 'Fondos insuficientes · cliente avisado por WhatsApp', en: 'Insufficient funds · customer notified via WhatsApp' }, reintentos: 2 },
    { nota: { es: 'Tarjeta vencida · se reenvió el link de pago', en: 'Expired card · payment link resent' }, reintentos: 1 },
  ]
  rechazos.forEach((x, i) => {
    const p = pedidos[20 + i * 3]
    const comision = Math.round(p.total * MP_FEE)
    transacciones.push({
      id: `MP-${txn++}`,
      pedidoId: p.id,
      pedidoCodigo: p.codigo,
      monto: p.total,
      comision,
      neto: p.total - comision,
      estado: 'rechazado',
      reintentos: x.reintentos,
      fecha: p.creadoEl + MIN,
      nota: x.nota,
    })
  })
  // Ayer
  for (let i = 0; i < 30; i++) {
    const items = pickItems(r, productos, 2 + Math.floor(r() * 3))
    const monto = totalItems(items)
    const comision = Math.round(monto * MP_FEE)
    transacciones.push({
      id: `MP-${90300 + i}`,
      pedidoId: `h${i}`,
      pedidoCodigo: `VT-${970 + i}`,
      monto,
      comision,
      neto: monto - comision,
      estado: i === 11 ? 'reembolsado' : 'aprobado',
      reintentos: 0,
      fecha: today - DAY + 9 * HOUR + i * 20 * MIN,
    })
  }
  transacciones.sort((a, b) => b.fecha - a.fecha)

  // --- Tickets
  let ticketSeq = 4781
  const tickets: Ticket[] = pedidos
    .filter((p) => p.estado !== 'pendiente')
    .map((p, i) => ({
      numero: `0001-${String(ticketSeq++).padStart(8, '0')}`,
      pedidoId: p.id,
      pedidoCodigo: p.codigo,
      modo: i % 5 === 3 ? 'nube' : 'local',
      impresora: i % 5 === 3 ? 'PDF' : 'p1',
      usuario: i % 3 === 0 ? 'Tito Fernández' : 'Marcos Acuña',
      fecha: p.creadoEl + 6 * MIN,
      monto: p.total,
    }))
  tickets.reverse()

  // --- Movimientos de stock
  const movimientos: MovimientoStock[] = []
  let mv = 1
  const addMov = (productoId: string, tipo: MovimientoStock['tipo'], cantidad: number, usuario: string, fecha: number, es: string, en: string) =>
    movimientos.push({ id: `m${mv++}`, productoId, tipo, cantidad, usuario, fecha, motivo: { es, en } })
  addMov('papa', 'compra', 80, 'Tito Fernández', today + 6 * HOUR + 10 * MIN, 'Compra Mercado Central', 'Purchase at Central Market')
  addMov('tomate', 'compra', 40, 'Tito Fernández', today + 6 * HOUR + 12 * MIN, 'Compra Mercado Central', 'Purchase at Central Market')
  addMov('naranja', 'compra', 60, 'Tito Fernández', today + 6 * HOUR + 15 * MIN, 'Compra Mercado Central', 'Purchase at Central Market')
  addMov('lechuga', 'compra', 30, 'Tito Fernández', today + 6 * HOUR + 18 * MIN, 'Compra quinta La Plata', 'Purchase from La Plata farm')
  addMov('frutilla', 'merma', -1.5, 'Marcos Acuña', today + 9 * HOUR + 40 * MIN, 'Frutilla golpeada', 'Bruised strawberries')
  addMov('palta', 'venta', -6, 'IA WhatsApp', today + 11 * HOUR + 5 * MIN, 'Pedidos por WhatsApp', 'WhatsApp orders')
  addMov('rucula', 'venta', -8, 'IA WhatsApp', today + 12 * HOUR + 30 * MIN, 'Pedidos por WhatsApp', 'WhatsApp orders')
  addMov('banana', 'correccion', -2, 'Marcos Acuña', today + 13 * HOUR, 'Conteo de cierre de mañana', 'Morning closing count')
  addMov('tomate', 'venta', -14, 'IA WhatsApp', today + 13 * HOUR + 20 * MIN, 'Pedidos por WhatsApp', 'WhatsApp orders')
  addMov('papa', 'venta', -21, 'IA WhatsApp', today + 13 * HOUR + 25 * MIN, 'Pedidos por WhatsApp', 'WhatsApp orders')
  addMov('huevos', 'venta', -4, 'Marcos Acuña', today + 13 * HOUR + 50 * MIN, 'Venta de mostrador', 'Counter sale')
  addMov('acelga', 'merma', -2, 'Marcos Acuña', today + 14 * HOUR, 'Hojas amarillas', 'Yellowed leaves')
  addMov('cebolla', 'compra', 40, 'Tito Fernández', today - DAY + 6 * HOUR, 'Compra Mercado Central', 'Purchase at Central Market')
  addMov('manzana', 'compra', 30, 'Tito Fernández', today - DAY + 6 * HOUR + 5 * MIN, 'Compra Mercado Central', 'Purchase at Central Market')
  addMov('uva', 'merma', -1, 'Marcos Acuña', today - DAY + 18 * HOUR, 'Racimos pasados', 'Overripe bunches')
  addMov('zapallo', 'correccion', 3, 'Tito Fernández', today - DAY + 19 * HOUR, 'Error de carga', 'Data entry error')
  movimientos.sort((a, b) => b.fecha - a.fecha)

  // --- Conversaciones (~25, 92% resueltas por IA)
  const conversaciones: Conversacion[] = []
  const pWa = pedidos.filter((p) => p.origen === 'whatsapp').slice(0, 23)
  const nameOf = (id: string) => productos.find((p) => p.id === id)!
  pWa.forEach((p, i) => {
    const cli = clientes.find((c) => c.id === p.clienteId)!
    const first = cli.nombre.split(' ')[0]
    const it = p.items.slice(0, 2).map((x) => nameOf(x.productoId))
    const t0 = p.creadoEl - 4 * MIN
    const mensajes: Mensaje[] = [
      { from: 'cliente', es: `Hola! me mandás ${p.items[0].cantidad} de ${it[0].nombre.toLowerCase()} y ${it[1] ? it[1].nombre.toLowerCase() : 'nada más'}?`, en: `Hi! can you send me ${p.items[0].cantidad} of ${it[0].nombreEn.toLowerCase()} and ${it[1] ? it[1].nombreEn.toLowerCase() : 'nothing else'}?`, hora: t0 },
      { from: 'ia', es: `¡Hola ${first}! Te armé el pedido: ${p.items.length} productos por $ ${p.total.toLocaleString('es-AR')}. ¿Lo confirmo?`, en: `Hi ${first}! Here's your order: ${p.items.length} items for ARS ${p.total.toLocaleString('en-US')}. Shall I confirm it?`, hora: t0 + MIN },
      { from: 'cliente', es: 'Sí, dale 👍', en: 'Yes, go ahead 👍', hora: t0 + 2 * MIN },
      p.medioPago === 'mercadopago'
        ? { from: 'ia', es: `Listo. Te paso el link de Mercado Pago 👉 mpago.la/vt${p.codigo.slice(3)}`, en: `Done. Here's your Mercado Pago link 👉 mpago.la/vt${p.codigo.slice(3)}`, hora: t0 + 2 * MIN + 20000 }
        : { from: 'ia', es: `Perfecto, lo pagás en ${p.medioPago === 'efectivo' ? 'efectivo' : 'transferencia'} al recibir.`, en: `Perfect, you'll pay by ${p.medioPago === 'efectivo' ? 'cash' : 'bank transfer'} on delivery.`, hora: t0 + 2 * MIN + 20000 },
      { from: 'ia', es: `¡Confirmado! Pedido #${p.codigo}. Te lo llevamos entre las ${p.entregaFranja.replace('-', ' y las ')} hs.`, en: `Confirmed! Order #${p.codigo}. We'll deliver between ${p.entregaFranja.replace('-', ':00 and ')}:00.`, hora: t0 + 4 * MIN },
    ]
    conversaciones.push({ id: `cv${i + 1}`, clienteId: cli.id, mensajes, resueltaPorIA: true, pedidoId: p.id, tema: { es: 'Pedido', en: 'Order' } })
  })
  const derivadas: [string, Mensaje[], { es: string; en: string }][] = [
    [
      'c7',
      [
        { from: 'cliente', es: 'Hola, ayer la lechuga vino medio pasada 😕', en: 'Hi, yesterday the lettuce came a bit wilted 😕', hora: now - 3 * HOUR },
        { from: 'ia', es: 'Uy, perdón Camila. Le paso tu mensaje a Tito para que lo resuelva ya.', en: "Oh, sorry Camila. I'm passing your message to Tito so he can sort it out right away.", hora: now - 3 * HOUR + MIN },
        { from: 'verdulero', es: 'Hola Camila! Hoy te mando una lechuga de regalo con el pedido. Disculpá!', en: "Hi Camila! Today I'm sending you a free lettuce with your order. Sorry!", hora: now - 2 * HOUR - 40 * MIN },
      ],
      { es: 'Reclamo', en: 'Complaint' },
    ],
    [
      'c12',
      [
        { from: 'cliente', es: '¿Me pueden armar un pedido grande para un evento el sábado? 20 kg de papa y 10 de cebolla', en: 'Can you put together a big order for an event on Saturday? 20 kg of potatoes and 10 of onions', hora: now - 90 * MIN },
        { from: 'ia', es: 'Para pedidos mayoristas te comunico con Tito así te hace un precio especial 🙌', en: "For wholesale orders I'll connect you with Tito so he can give you a special price 🙌", hora: now - 89 * MIN },
      ],
      { es: 'Pedido mayorista', en: 'Wholesale order' },
    ],
  ]
  derivadas.forEach(([clienteId, mensajes, tema], i) =>
    conversaciones.push({ id: `cvd${i + 1}`, clienteId, mensajes, resueltaPorIA: false, tema }),
  )
  conversaciones.sort((a, b) => b.mensajes[b.mensajes.length - 1].hora - a.mensajes[a.mensajes.length - 1].hora)

  // gasto del mes por cliente (coherente con pedidos de hoy + base)
  clientes.forEach((c) => {
    const hoy = pedidos.filter((p) => p.clienteId === c.id).reduce((s, p) => s + p.total, 0)
    c.gastoMes = hoy + Math.round((20000 + r() * 90000) / 100) * 100
    const last = pedidos.filter((p) => p.clienteId === c.id).sort((a, b) => b.creadoEl - a.creadoEl)[0]
    if (last) c.ultimoPedido = last.creadoEl
  })
  clientes[0].gastoMes = 86400
  clientes[0].ultimoPedido = now - 7 * DAY

  const usuarios: Usuario[] = [
    { id: 'u1', nombre: 'Tito Fernández', rol: { es: 'Admin (dueño)', en: 'Admin (owner)' }, email: 'tito@dontito.com.ar', ultimoAcceso: now - 5 * MIN, activo: true },
    { id: 'u2', nombre: 'Marcos Acuña', rol: { es: 'Mostrador', en: 'Counter' }, email: 'marcos@dontito.com.ar', ultimoAcceso: now - 2 * MIN, activo: true },
    { id: 'u3', nombre: 'Lucía Paz', rol: { es: 'Reparto', en: 'Delivery' }, email: 'lucia@dontito.com.ar', ultimoAcceso: now - 40 * MIN, activo: true },
    { id: 'u4', nombre: 'Ramiro Vega', rol: { es: 'Reparto', en: 'Delivery' }, email: 'ramiro@dontito.com.ar', ultimoAcceso: now - 3 * HOUR, activo: true },
  ]

  const backups: Backup[] = Array.from({ length: 7 }, (_, i) => ({
    id: `bk${i}`,
    fecha: today - i * DAY + 3 * HOUR,
    tamanoMb: Math.round((48 - i * 0.6) * 10) / 10,
    tipo: i === 0 ? { es: 'Automático diario', en: 'Daily automatic' } : { es: 'Automático diario', en: 'Daily automatic' },
  }))

  return {
    now,
    productos,
    clientes,
    pedidos,
    transacciones,
    tickets,
    movimientos,
    conversaciones,
    historial,
    usuarios,
    backups,
    impresoras: IMPRESORAS.map((p) => ({ ...p })),
    nextNum: 1048,
    ticketSeq,
  }
}

/** Historial de compra de Laura (para "lo mismo que la semana pasada") */
export const LAURA_ULTIMO = [
  { productoId: 'perita', cantidad: 2 },
  { productoId: 'papa', cantidad: 1 },
  { productoId: 'lechuga', cantidad: 1 },
  { productoId: 'banana', cantidad: 1 },
  { productoId: 'huevos', cantidad: 1 },
]
