# PROGRESO — Verdi MVP (Emiliano)

## Completado
- **Bloque 1 · Scaffold:** Vite 5 + React 18 + TS + Tailwind v3 (deps de build en `dependencies`), tokens light/dark, Inter + JetBrains Mono, anti-flash en `index.html`, `render.yaml` static.
- **Bloque 2 · Base:** i18n (`dict {clave:[es,en]}` + `useT` / `useL`), store zustand (auth, rol, tema, idioma, dispositivo, preview, tour, trailer), router con guard por rol y query params `?device=frame&theme=&lang=&role=`.
- **Bloque 3 · Mock:** catálogo de 36 productos con aliases coloquiales ES/EN, 40 clientes, 38 pedidos de hoy, ~64 transacciones MP, tickets, movimientos, 25 conversaciones, 30 días de historial, usuarios, backups. Edge cases: palta/frutilla/rúcula en stock bajo, pago pendiente hace 25 min, 3 pagos rechazados, impresora sin papel, bot que se reconectó.
- **Bloque 4 · Login + Welcome:** login centrado con blobs, pills de auto-fill, toggles, link a WhatsApp y al trailer. Welcome una vez por sesión, siempre redirige a `/propuesta`.
- **Bloque 5 · Shell:** top-nav con categoría COMERCIAL y overflow "Más" medido, role switcher, footer CTA, header mobile + bottom-nav + sheet, PreviewBanner y DevNotice.
- **Bloques 6-8 · Verdulería:** Pedidos de hoy, Entregas, Stock y precios, Tickets (80mm con código de barras), Conversaciones IA, Clientes, Cobros, Reportes (Recharts).
- **Bloques 9-10 · Admin:** Panel general, Mi cuenta (licencia, usuarios, bot, consumo, backups, datos aislados).
- **Bloque 11 · WOW WhatsApp:** motor por keywords (cantidades, coloquiales, stock, repetir pedido, cambios, cancelaciones con reembolso, fuera de catálogo), typewriter, tarjeta de pedido, checkout mock, sincronización en vivo con Pedidos/Stock/Cobros/Conversaciones.
- **Bloque 12 · Propuesta:** circuito de 6 pasos, 8 módulos + onboarding, inversión oculta (se renderiza solo al revelar), "Ver en el demo" con retorno señalizado y resaltado.
- **Bloque 13 · Dispositivo:** marco iPhone con iframe real de 390px, sincronización postMessage (tema, idioma, rol, sesión, navegación) validando `event.origin`.
- **Bloque 14 · Tour:** manual desde ✨ Tour, máscara SVG, glow verde + dot azul, pasos en el orden del menú, reinicio al cambiar rol/idioma, modal final.
- **Bloque 15 · Trailer:** 11 escenas (~82 s) en loop, cursor virtual con clicks reales, captions de vidrio, salida con X/Esc → login.
- **Bloque 16 · QA:** ver "Verificado".

## En curso
- Nada.

## Pendiente
- Deploy manual en Render (lo hace el equipo).

## Verificado
- `npm run build` limpio (tsc strict + vite), servido con `npx serve -s dist`: links profundos y marco de celular OK.
- i18n: barrido automático en EN de las 12 rutas: solo quedan nombres propios.
- 375px: sin scroll horizontal en ninguna ruta.
- Modales: centro del Welcome = centro del viewport (desvío 0px) en 1440×900, 1920×854 y 375×812; `transform: none`.
- Flujo WhatsApp completo: pedido → pago → pedido nuevo en la app, con descuento de stock.
- Trailer: las 11 escenas y el loop; la salida vuelve a /login sin sesión.
- Tour en escritorio y dentro del marco (apunta al bottom-nav).

## Decisiones
- **Roles (cambio pedido por el cliente durante la sesión):** 2 roles en la app.
  - **Admin** (dueño de la verdulería): ve TODO lo de *su* verdulería: números, estadísticas, stock, cobros, reportes, clientes, cuenta/licencia/datos aislados.
  - **Verdulería** (mostrador): pedidos, entregas, stock, tickets y conversaciones. Ve precios pero no los edita.
  - Los clientes finales NO tienen rol: solo hablan por WhatsApp. El simulador es la sección "WhatsApp IA · Así lo ve tu cliente", accesible desde ambos roles.
  - No hay panel de operador SaaS. Verdi se vende a verdulerías de todo el país; cada una aislada (módulo 08 → Admin · Mi cuenta).
  - Rutas planas (`/panel`, `/pedidos`, `/stock`…) en lugar de `/admin/*` y `/verduleria/*`, porque el Admin ve todo lo del mostrador.
- Credenciales: `tito / demo2026` (Admin) y `mostrador / demo2026` (Verdulería).
- Componentes estilo shadcn/ui escritos a mano (cva + tailwind-merge) para evitar el CLI interactivo.
- Animaciones de modales/marco con propiedades CSS individuales (`scale`, `translate`, `opacity`), nunca `transform`.
- Colores de Recharts resueltos por tema en JS (los atributos SVG no leen CSS vars).

## Bloqueos
- Ninguno.
