import type { Categoria, ProductIcon, Producto, Unidad } from './types'

type Row = [
  id: string,
  codigo: string,
  nombre: string,
  nombreEn: string,
  categoria: Categoria,
  unidad: Unidad,
  precio: number,
  stock: number,
  minimo: number,
  icon: ProductIcon,
  aliases: string[],
  aliasesEn: string[],
]

// Precios ARS de verdulería de barrio, proporcionales entre sí
const ROWS: Row[] = [
  ['tomate', 'TOM-R', 'Tomate redondo', 'Round tomato', 'verduras', 'kg', 2800, 42, 10, 'cherry', ['tomate redondo', 'tomates redondos', 'tomates', 'tomate'], ['round tomatoes', 'round tomato', 'tomatoes', 'tomato']],
  ['perita', 'TOM-P', 'Tomate perita', 'Plum tomato', 'verduras', 'kg', 2400, 36, 10, 'cherry', ['tomate perita', 'tomates perita', 'tomate p/salsa', 'tomate para salsa', 'perita'], ['plum tomatoes', 'plum tomato', 'sauce tomatoes']],
  ['papa', 'PAP', 'Papa', 'Potato', 'verduras', 'kg', 1200, 120, 30, 'nut', ['papa negra', 'papas', 'papa'], ['potatoes', 'potato']],
  ['cebolla', 'CEB', 'Cebolla', 'Onion', 'verduras', 'kg', 1100, 80, 20, 'nut', ['cebollas', 'cebolla'], ['onions', 'onion']],
  ['zanahoria', 'ZAN', 'Zanahoria', 'Carrot', 'verduras', 'kg', 1300, 45, 12, 'carrot', ['zanahorias', 'zanahoria', 'zana'], ['carrots', 'carrot']],
  ['zapallo', 'ZAP', 'Zapallo anco', 'Butternut squash', 'verduras', 'kg', 1500, 30, 8, 'nut', ['zapallo anco', 'anco', 'zapallo'], ['butternut squash', 'butternut', 'squash']],
  ['batata', 'BAT', 'Batata', 'Sweet potato', 'verduras', 'kg', 1800, 28, 8, 'carrot', ['batatas', 'batata'], ['sweet potatoes', 'sweet potato']],
  ['morron', 'MOR', 'Morrón rojo', 'Red bell pepper', 'verduras', 'kg', 5500, 14, 4, 'cherry', ['morrones', 'morrón', 'morron', 'pimiento'], ['red peppers', 'bell pepper', 'pepper']],
  ['berenjena', 'BER', 'Berenjena', 'Eggplant', 'verduras', 'kg', 2600, 12, 4, 'grape', ['berenjenas', 'berenjena'], ['eggplants', 'eggplant', 'aubergine']],
  ['zapallito', 'ZPT', 'Zapallito', 'Round zucchini', 'verduras', 'kg', 2200, 15, 5, 'nut', ['zapallitos', 'zapallito', 'zucchini'], ['zucchinis', 'zucchini', 'courgette']],
  ['pepino', 'PEP', 'Pepino', 'Cucumber', 'verduras', 'kg', 2400, 10, 4, 'leaf', ['pepinos', 'pepino'], ['cucumbers', 'cucumber']],
  ['choclo', 'CHO', 'Choclo', 'Corn cob', 'verduras', 'unidad', 900, 40, 10, 'wheat', ['choclos', 'choclo'], ['corn cobs', 'corn cob', 'corn']],
  ['verdeo', 'VER', 'Cebolla de verdeo', 'Green onion', 'verduras', 'atado', 1000, 18, 6, 'sprout', ['cebolla de verdeo', 'verdeo'], ['green onions', 'green onion', 'scallions']],
  ['ajo', 'AJO', 'Ajo', 'Garlic', 'verduras', 'unidad', 600, 60, 15, 'nut', ['cabezas de ajo', 'cabeza de ajo', 'ajos', 'ajo'], ['garlic']],
  ['jengibre', 'JEN', 'Jengibre', 'Ginger', 'verduras', 'kg', 9000, 3, 1, 'sprout', ['jengibre', 'kion'], ['ginger']],
  ['lechuga', 'LEC', 'Lechuga criolla', 'Lettuce', 'hojas', 'unidad', 1500, 24, 8, 'salad', ['lechuga criolla', 'lechugas', 'lechuga', 'lechu'], ['lettuces', 'lettuce']],
  ['rucula', 'RUC', 'Rúcula', 'Arugula', 'hojas', 'atado', 1400, 4, 8, 'leaf', ['rúcula', 'rucula', 'rúcula'], ['arugula', 'rocket']],
  ['acelga', 'ACE', 'Acelga', 'Chard', 'hojas', 'atado', 1600, 16, 5, 'leaf', ['acelgas', 'acelga'], ['swiss chard', 'chard']],
  ['espinaca', 'ESP', 'Espinaca', 'Spinach', 'hojas', 'atado', 1800, 12, 5, 'leaf', ['espinacas', 'espinaca'], ['spinach']],
  ['perejil', 'PER', 'Perejil', 'Parsley', 'hojas', 'atado', 800, 20, 6, 'sprout', ['perejil'], ['parsley']],
  ['albahaca', 'ALB', 'Albahaca', 'Basil', 'hojas', 'atado', 1200, 9, 4, 'sprout', ['albahaca'], ['basil']],
  ['banana', 'BAN', 'Banana', 'Banana', 'frutas', 'kg', 2200, 50, 12, 'banana', ['bananas', 'banana'], ['bananas', 'banana']],
  ['manzana', 'MAN', 'Manzana roja', 'Red apple', 'frutas', 'kg', 2900, 40, 10, 'apple', ['manzana roja', 'manzanas', 'manzana'], ['red apples', 'apples', 'apple']],
  ['naranja', 'NAR', 'Naranja', 'Orange', 'frutas', 'kg', 1500, 70, 15, 'citrus', ['naranjas', 'naranja'], ['oranges', 'orange']],
  ['mandarina', 'MDA', 'Mandarina', 'Tangerine', 'frutas', 'kg', 1900, 35, 10, 'citrus', ['mandarinas', 'mandarina'], ['tangerines', 'tangerine', 'mandarin']],
  ['limon', 'LIM', 'Limón', 'Lemon', 'frutas', 'kg', 2100, 25, 6, 'citrus', ['limones', 'limón', 'limon'], ['lemons', 'lemon']],
  ['palta', 'PAL', 'Palta', 'Avocado', 'frutas', 'unidad', 2600, 3, 10, 'apple', ['paltas', 'palta', 'aguacate'], ['avocados', 'avocado']],
  ['frutilla', 'FRU', 'Frutilla', 'Strawberry', 'frutas', 'kg', 6500, 2, 5, 'cherry', ['frutillas', 'frutilla'], ['strawberries', 'strawberry']],
  ['kiwi', 'KIW', 'Kiwi', 'Kiwi', 'frutas', 'kg', 4800, 8, 3, 'apple', ['kiwis', 'kiwi'], ['kiwis', 'kiwi']],
  ['pera', 'PRA', 'Pera', 'Pear', 'frutas', 'kg', 2700, 22, 6, 'apple', ['peras', 'pera'], ['pears', 'pear']],
  ['uva', 'UVA', 'Uva', 'Grapes', 'frutas', 'kg', 5200, 9, 3, 'grape', ['uvas', 'uva'], ['grapes', 'grape']],
  ['durazno', 'DUR', 'Durazno', 'Peach', 'frutas', 'kg', 3900, 14, 4, 'apple', ['duraznos', 'durazno'], ['peaches', 'peach']],
  ['pomelo', 'POM', 'Pomelo', 'Grapefruit', 'frutas', 'kg', 1800, 16, 5, 'citrus', ['pomelos', 'pomelo'], ['grapefruits', 'grapefruit']],
  ['huevos', 'HUE', 'Huevos (maple x30)', 'Eggs (tray of 30)', 'otros', 'maple', 6800, 18, 5, 'egg', ['maple de huevos', 'huevos', 'maple'], ['eggs', 'egg tray']],
  ['champi', 'CHA', 'Champiñones', 'Mushrooms', 'otros', 'bandeja', 3200, 10, 4, 'nut', ['champiñones', 'champignones', 'champis'], ['mushrooms']],
  ['secos', 'FSM', 'Mix de frutos secos', 'Mixed nuts', 'otros', 'kg', 14000, 6, 2, 'nut', ['frutos secos', 'mix de frutos secos'], ['mixed nuts', 'nuts']],
]

const DAY = 86400000

export function buildCatalogo(now: number): Producto[] {
  return ROWS.map(([id, codigo, nombre, nombreEn, categoria, unidad, precio, stock, minimo, icon, aliases, aliasesEn], i) => ({
    id,
    tenantId: 'vt-001',
    codigo,
    nombre,
    nombreEn,
    categoria,
    unidad,
    precio,
    stock,
    minimo,
    icon,
    aliases,
    aliasesEn,
    historialPrecios: [
      { fecha: now - 21 * DAY, precio: Math.round((precio * 0.88) / 50) * 50, usuario: 'Tito Fernández' },
      { fecha: now - 9 * DAY - (i % 5) * DAY, precio: Math.round((precio * 0.95) / 50) * 50, usuario: 'Tito Fernández' },
      { fecha: now - 2 * DAY, precio, usuario: 'Tito Fernández' },
    ],
  }))
}
