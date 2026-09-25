# PROGRESO — Verdi MVP (Emiliano)

## Completado
- Bloque 1 · Scaffold: Vite 5 + React 18 + TS + Tailwind v3 (deps de build en `dependencies`), tokens de diseño, fuentes, anti-flash, render.yaml.

## En curso
- Bloque 2 · i18n + store + router

## Pendiente
- Bloques 3 a 16

## Decisiones
- **Roles (cambio pedido por el cliente durante la sesión):** 2 roles en la app.
  - **Admin** (dueño de la verdulería): ve TODO lo de *su* verdulería: números, estadísticas, stock, cobros, reportes, cuenta/licencia/datos aislados.
  - **Verdulería** (mostrador): pedidos, entregas, stock, tickets.
  - Los clientes finales NO tienen rol: solo hablan por WhatsApp. El simulador de WhatsApp es una sección "Así lo ve tu cliente" accesible desde ambos roles.
  - No hay panel de operador SaaS. Verdi se vende a verdulerías de todo el país; cada una aislada (multi-tenancy = módulo 08, visible en Admin → Mi cuenta).
- Componentes estilo shadcn/ui escritos a mano (cva + tailwind-merge) para evitar el CLI interactivo.
- Animaciones de modales/marco con propiedades CSS individuales (`scale`, `translate`, `opacity`), nunca `transform`.

## Bloqueos
- Ninguno.
