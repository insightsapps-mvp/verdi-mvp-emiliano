import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, History, Lock, Pencil, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useL, useT } from '@/lib/i18n'
import { prodName, stockLevel, useData, useProductoMap } from '@/lib/data'
import { ars, dateTime, num, qty } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Categoria, Producto, TipoMov, Unidad } from '@/data/types'
import { Badge, Button, Card, EmptyState, Input, Label, Modal, PageHeader, ProductAvatar, Select, Tabs, Td, Th } from '@/components/ui'
import { PreviewBanner } from '@/components/notices'
import { useKicker } from '@/components/page'
import { ROLE_USER } from '@/lib/roles'

function LevelBadge({ p }: { p: Producto }) {
  const L = useL()
  const lv = stockLevel(p)
  if (lv === 'critico') return <Badge tone="red" dot>{L('Crítico', 'Critical')}</Badge>
  if (lv === 'bajo') return <Badge tone="amber" dot>{L('Bajo', 'Low')}</Badge>
  return <Badge tone="green" dot>OK</Badge>
}

function StockBar({ p }: { p: Producto }) {
  const lv = stockLevel(p)
  const pctv = Math.min(100, (p.stock / (p.minimo * 4)) * 100)
  return (
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line/70">
      <div className={cn('h-full rounded-full', lv === 'critico' ? 'bg-danger' : lv === 'bajo' ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.max(6, pctv)}%` }} />
    </div>
  )
}

function PriceModal({ p, onClose }: { p: Producto | null; onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const role = useApp((s) => s.role)
  const L = useL()
  const editPrice = useData((s) => s.editPrice)
  const [v, setV] = useState('')
  if (!p) return null
  const canEdit = role === 'admin'
  return (
    <Modal open={!!p} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <ProductAvatar icon={p.icon} size={40} />
          <div>
            <h3 className="text-[16px] font-semibold">{L('Editar precio', 'Edit price')}</h3>
            <p className="text-[13px] text-muted">
              {prodName(p, lang)} · <span className="num">{p.codigo}</span>
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Label>
            {L('Precio por', 'Price per')} {qty(1, p.unidad, lang).replace(/^1 /, '')}
          </Label>
          <Input className="num" type="number" disabled={!canEdit} placeholder={String(p.precio)} value={v} onChange={(e) => setV(e.target.value)} />
          {!canEdit && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted">
              <Lock size={13} /> {L('Solo el Admin (dueño) puede cambiar precios. El mostrador lo ve en modo lectura.', 'Only the Admin (owner) can change prices. The counter sees it read-only.')}
            </p>
          )}
          <p className="mt-2 text-[12.5px] text-muted">{L('El bot de WhatsApp usa el precio nuevo desde el próximo mensaje.', 'The WhatsApp bot uses the new price from the next message.')}</p>
        </div>
        <div className="mt-5">
          <p className="kicker mb-2 flex items-center gap-1.5 text-muted">
            <History size={13} /> {L('Historial de cambios', 'Change history')}
          </p>
          <div className="divide-y divide-line rounded-xl border border-line">
            {[...p.historialPrecios].reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
                <span className="text-muted">{dateTime(h.fecha, lang)}</span>
                <span className="text-muted">{h.usuario}</span>
                <span className="num font-medium">{ars(h.precio, lang)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {L('Cerrar', 'Close')}
          </Button>
          {canEdit && (
            <Button
              disabled={!v || Number(v) <= 0}
              onClick={() => {
                editPrice(p.id, Math.round(Number(v)), ROLE_USER.admin.nombre)
                toast.success(L(`${p.nombre}: nuevo precio ${ars(Number(v), 'es')}. El bot ya lo usa.`, `${p.nombreEn}: new price ${ars(Number(v), 'en')}. The bot already uses it.`))
                setV('')
                onClose()
              }}
            >
              {L('Guardar precio', 'Save price')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function AdjustModal({ p, onClose }: { p: Producto | null; onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const role = useApp((s) => s.role)
  const L = useL()
  const t = useT()
  const adjust = useData((s) => s.adjustStock)
  const [tipo, setTipo] = useState<TipoMov>('compra')
  const [cant, setCant] = useState('')
  const [motivo, setMotivo] = useState('')
  if (!p) return null
  const sign = tipo === 'compra' ? 1 : tipo === 'correccion' ? 1 : -1
  return (
    <Modal open={!!p} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <ProductAvatar icon={p.icon} size={40} />
          <div>
            <h3 className="text-[16px] font-semibold">{L('Ajuste de stock', 'Stock adjustment')}</h3>
            <p className="text-[13px] text-muted">
              {prodName(p, lang)} · {L('actual', 'current')} <span className="num font-medium text-fg">{qty(p.stock, p.unidad, lang)}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {(['compra', 'venta', 'merma', 'correccion'] as TipoMov[]).map((x) => (
            <button
              key={x}
              onClick={() => setTipo(x)}
              className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-medium', tipo === x ? 'border-primary bg-primary-soft text-primary' : 'border-line hover:bg-surface2')}
            >
              {x === 'compra' || x === 'correccion' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              {t(`mv.${x}` as 'mv.compra')}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>{L('Cantidad', 'Quantity')} ({qty(2, p.unidad, lang).replace(/^2 /, '')})</Label>
            <Input className="num" type="number" value={cant} onChange={(e) => setCant(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>{L('Stock resultante', 'Resulting stock')}</Label>
            <div className="num flex h-10 items-center rounded-lg border border-line bg-surface2 px-3 text-sm">{num(Math.max(0, p.stock + sign * (Number(cant) || 0)), lang, 1)}</div>
          </div>
        </div>
        <div className="mt-3">
          <Label>{L('Motivo', 'Reason')}</Label>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={L('ej. Compra Mercado Central', 'e.g. Central Market purchase')} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {L('Cancelar', 'Cancel')}
          </Button>
          <Button
            disabled={!Number(cant)}
            onClick={() => {
              const m = motivo || t(`mv.${tipo}` as 'mv.compra')
              adjust(p.id, tipo, sign * Number(cant), { es: m, en: motivo || t(`mv.${tipo}` as 'mv.compra') }, ROLE_USER[role].nombre)
              toast.success(L(`Stock de ${p.nombre} actualizado y sincronizado con el bot`, `${p.nombreEn} stock updated and synced with the bot`))
              setCant('')
              setMotivo('')
              onClose()
            }}
          >
            {L('Guardar ajuste', 'Save adjustment')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const L = useL()
  const t = useT()
  const add = useData((s) => s.addProducto)
  const [f, setF] = useState({ nombre: '', nombreEn: '', categoria: 'verduras' as Categoria, unidad: 'kg' as Unidad, precio: '', stock: '', minimo: '' })
  const ok = f.nombre && Number(f.precio) > 0
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-[16px] font-semibold">{L('Agregar producto', 'Add product')}</h3>
        <p className="text-[13px] text-muted">{L('Aparece en el catálogo del bot al instante.', "It shows up in the bot's catalog instantly.")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{L('Nombre', 'Name')}</Label>
            <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value, nombreEn: e.target.value })} placeholder={L('ej. Remolacha', 'e.g. Beetroot')} />
          </div>
          <div>
            <Label>{L('Categoría', 'Category')}</Label>
            <Select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}>
              {(['verduras', 'frutas', 'hojas', 'otros'] as Categoria[]).map((c) => (
                <option key={c} value={c}>
                  {t(`cat.${c}` as 'cat.frutas')}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{L('Unidad', 'Unit')}</Label>
            <Select value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value as Unidad })}>
              <option value="kg">kg</option>
              <option value="unidad">{L('unidad', 'piece')}</option>
              <option value="atado">{L('atado', 'bunch')}</option>
              <option value="maple">{L('maple', 'tray')}</option>
              <option value="bandeja">{L('bandeja', 'pack')}</option>
            </Select>
          </div>
          <div>
            <Label>{L('Precio (ARS)', 'Price (ARS)')}</Label>
            <Input className="num" type="number" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} />
          </div>
          <div>
            <Label>{L('Stock inicial', 'Initial stock')}</Label>
            <Input className="num" type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {L('Cancelar', 'Cancel')}
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              add({
                codigo: f.nombre.slice(0, 3).toUpperCase(),
                nombre: f.nombre,
                nombreEn: f.nombreEn,
                categoria: f.categoria,
                unidad: f.unidad,
                precio: Number(f.precio),
                stock: Number(f.stock) || 0,
                minimo: Math.max(1, Math.round((Number(f.stock) || 10) / 4)),
                icon: f.categoria === 'frutas' ? 'apple' : f.categoria === 'hojas' ? 'leaf' : 'carrot',
              })
              toast.success(L(`${f.nombre} agregado al catálogo`, `${f.nombre} added to the catalog`))
              setF({ nombre: '', nombreEn: '', categoria: 'verduras', unidad: 'kg', precio: '', stock: '', minimo: '' })
              onClose()
            }}
          >
            <Plus size={15} /> {L('Agregar', 'Add')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Stock() {
  const lang = useApp((s) => s.lang)
  const role = useApp((s) => s.role)
  const L = useL()
  const t = useT()
  const { kicker, tone } = useKicker()
  const productos = useData((s) => s.productos)
  const movimientos = useData((s) => s.movimientos)
  const pm = useProductoMap()
  const [tab, setTab] = useState<'catalogo' | 'movimientos'>('catalogo')
  const [cat, setCat] = useState<'todas' | Categoria>('todas')
  const [q, setQ] = useState('')
  const [priceP, setPriceP] = useState<Producto | null>(null)
  const [adjP, setAdjP] = useState<Producto | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const closePrice = useCallback(() => setPriceP(null), [])
  const closeAdj = useCallback(() => setAdjP(null), [])
  const closeAdd = useCallback(() => setAddOpen(false), [])

  const bajos = productos.filter((p) => stockLevel(p) !== 'ok')
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return productos
      .filter((p) => cat === 'todas' || p.categoria === cat)
      .filter((p) => !qq || p.nombre.toLowerCase().includes(qq) || p.nombreEn.toLowerCase().includes(qq) || p.codigo.toLowerCase().includes(qq))
  }, [productos, cat, q])

  return (
    <div>
      <PreviewBanner
        id="stock"
        bullets={[
          ['Catálogo con código, unidad, precio y stock en tiempo real.', 'Catalog with code, unit, price and real-time stock.'],
          ['Lo que vende el bot se descuenta solo; nunca vende lo que no hay.', 'What the bot sells is deducted automatically; it never sells what you do not have.'],
          ['Ajustes por compra, venta, merma o corrección, con historial por usuario.', 'Adjustments by purchase, sale, shrinkage or correction, with per-user history.'],
        ]}
      />
      <PageHeader
        kicker={kicker}
        kickerTone={tone}
        title={L('Stock y precios', 'Stock & prices')}
        subtitle={L(`${productos.length} productos en el catálogo`, `${productos.length} products in the catalog`)}
        actions={
          <>
            <Badge tone="green" className="py-1">
              <CheckCircle2 size={12} /> {L('Sincronizado con WhatsApp IA', 'Synced with WhatsApp AI')}
            </Badge>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={15} /> {L('Agregar producto', 'Add product')}
            </Button>
          </>
        }
      />

      {bajos.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {bajos.slice(0, 3).map((p) => (
            <Card key={p.id} data-trailer={`alert-${p.id}`} className="flex items-center gap-3 border-danger/25 p-3.5">
              <ProductAvatar icon={p.icon} size={38} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  <AlertTriangle size={13} className="text-danger" /> {prodName(p, lang)}
                </p>
                <p className="text-[12px] text-muted">
                  {L('Quedan', 'Left:')} <span className="num font-semibold text-danger">{qty(p.stock, p.unidad, lang)}</span> · {L('mín.', 'min.')} {qty(p.minimo, p.unidad, lang)}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setAdjP(p)}>
                {L('Cargar', 'Restock')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'catalogo', label: L('Catálogo', 'Catalog'), count: productos.length },
            { value: 'movimientos', label: L('Movimientos', 'Movements'), count: movimientos.length },
          ]}
        />
        {tab === 'catalogo' && (
          <>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {(['todas', 'verduras', 'frutas', 'hojas', 'otros'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium', cat === c ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted hover:text-fg')}
                >
                  {t(`cat.${c}` as 'cat.todas')}
                </button>
              ))}
            </div>
            <div className="relative lg:ml-auto lg:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Buscar producto o código', 'Search product or code')} className="pl-9" />
            </div>
          </>
        )}
      </div>

      {tab === 'catalogo' ? (
        <Card className="overflow-hidden">
          {/* Desktop: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-b border-line bg-surface2/60">
                <tr>
                  <Th>{L('Producto', 'Product')}</Th>
                  <Th>{L('Código', 'Code')}</Th>
                  <Th>{L('Unidad', 'Unit')}</Th>
                  <Th className="text-right">{L('Precio', 'Price')}</Th>
                  <Th>Stock</Th>
                  <Th className="text-right">{L('Mínimo', 'Minimum')}</Th>
                  <Th>{L('Estado', 'Status')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((p) => (
                  <tr key={p.id} data-trailer={`row-${p.id}`} className={cn('hover:bg-surface2/50', stockLevel(p) === 'critico' && 'bg-danger-soft/30')}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <ProductAvatar icon={p.icon} size={30} />
                        <span className="font-medium">{prodName(p, lang)}</span>
                      </span>
                    </Td>
                    <Td className="num text-muted">{p.codigo}</Td>
                    <Td className="text-muted">{qty(1, p.unidad, lang).replace(/^1 /, '')}</Td>
                    <Td className="num text-right font-medium">{ars(p.precio, lang)}</Td>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className={cn('num w-16 font-semibold', stockLevel(p) === 'critico' && 'text-danger')}>{num(p.stock, lang, p.stock % 1 ? 1 : 0)}</span>
                        <StockBar p={p} />
                      </span>
                    </Td>
                    <Td className="num text-right text-muted">{p.minimo}</Td>
                    <Td>
                      <LevelBadge p={p} />
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setAdjP(p)}>
                          <SlidersHorizontal size={14} /> {L('Ajustar', 'Adjust')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPriceP(p)} aria-label={L('Editar precio', 'Edit price')}>
                          {role === 'admin' ? <Pencil size={14} /> : <Lock size={14} />} {L('Precio', 'Price')}
                        </Button>
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: cards */}
          <div className="divide-y divide-line md:hidden">
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <ProductAvatar icon={p.icon} size={36} />
                <button className="min-w-0 flex-1 text-left" onClick={() => setAdjP(p)}>
                  <p className="truncate text-[14px] font-medium">{prodName(p, lang)}</p>
                  <p className="text-[12px] text-muted">
                    <span className="num">{p.codigo}</span> · <span className="num">{ars(p.precio, lang)}</span>/{qty(1, p.unidad, lang).replace(/^1 /, '')}
                  </p>
                </button>
                <div className="text-right">
                  <p className={cn('num text-[14px] font-semibold', stockLevel(p) === 'critico' && 'text-danger')}>{num(p.stock, lang, p.stock % 1 ? 1 : 0)}</p>
                  <LevelBadge p={p} />
                </div>
                <Button size="iconSm" variant="ghost" onClick={() => setPriceP(p)} aria-label={L('Editar precio', 'Edit price')}>
                  {role === 'admin' ? <Pencil size={15} /> : <Lock size={15} />}
                </Button>
              </div>
            ))}
          </div>
          {list.length === 0 && <EmptyState title={L('Sin resultados', 'No results')} body={L('Probá con otro nombre o categoría.', 'Try another name or category.')} />}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface2/60">
                <tr>
                  <Th>{L('Fecha', 'Date')}</Th>
                  <Th>{L('Producto', 'Product')}</Th>
                  <Th>{L('Tipo', 'Type')}</Th>
                  <Th className="text-right">{L('Cantidad', 'Quantity')}</Th>
                  <Th>{L('Motivo', 'Reason')}</Th>
                  <Th>{L('Usuario', 'User')}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movimientos.map((m) => {
                  const p = pm[m.productoId]
                  return (
                    <tr key={m.id} className="hover:bg-surface2/50">
                      <Td className="text-muted">{dateTime(m.fecha, lang)}</Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          {p && <ProductAvatar icon={p.icon} size={24} />}
                          {prodName(p, lang)}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={m.tipo === 'compra' ? 'green' : m.tipo === 'venta' ? 'blue' : m.tipo === 'merma' ? 'red' : 'neutral'}>{t(`mv.${m.tipo}` as 'mv.compra')}</Badge>
                      </Td>
                      <Td className={cn('num text-right font-medium', m.cantidad > 0 ? 'text-primary' : 'text-fg')}>
                        {m.cantidad > 0 ? '+' : ''}
                        {num(m.cantidad, lang, m.cantidad % 1 ? 1 : 0)}
                      </Td>
                      <Td className="text-muted">{L(m.motivo.es, m.motivo.en)}</Td>
                      <Td>
                        {m.usuario === 'IA WhatsApp' ? (
                          <Badge tone="green">{L('IA WhatsApp', 'WhatsApp AI')}</Badge>
                        ) : (
                          <span className="text-muted">{m.usuario}</span>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <PriceModal p={priceP} onClose={closePrice} />
      <AdjustModal p={adjP} onClose={closeAdj} />
      <AddModal open={addOpen} onClose={closeAdd} />
    </div>
  )
}
