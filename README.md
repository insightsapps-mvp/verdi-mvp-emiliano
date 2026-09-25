# Verdi · MVP demo (Emiliano)

Prototipo navegable con datos mock de **Verdi**, el SaaS white-label para verdulerías de todo el país: bot de WhatsApp con IA, app Android para el dueño (Admin) y para el mostrador (Verdulería), cobros con Mercado Pago, ticketera, reportes y multi-tenancy.

> Es una previsualización: no hay backend. Las funciones que requieren infraestructura real están marcadas con avisos "en desarrollo".

## Credenciales demo

| Vista | Usuario | Contraseña | Qué ve |
|---|---|---|---|
| **Admin** (dueño) | `tito` | `demo2026` | Todo lo de su verdulería: panel, pedidos, stock, cobros, reportes, clientes, entregas, tickets, conversaciones y su cuenta. |
| **Verdulería** (mostrador) | `mostrador` | `demo2026` | Pedidos, entregas, stock, tickets y conversaciones. |

En el login también están las pills de auto-fill y el link **"Ver demo automática"** (modo trailer, sin credenciales).
Los clientes finales no tienen rol: solo hablan por WhatsApp. Su experiencia se ve en **WhatsApp IA** ("Así lo ve tu cliente").

## Correrlo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción en ./dist
npx serve -s dist  # sirve el build (SPA)
```

## Deploy (Render, plan gratis)

Static Site con el `render.yaml` incluido:

- Build: `npm install && npm run build`
- Publish: `./dist`
- Rewrite `/*` → `/index.html`

## Cosas para mostrar en la reunión

1. **Propuesta** (`/propuesta`): circuito, 8 módulos + onboarding, e inversión oculta detrás de "Ver inversión".
2. **Ver en el demo ↗** en cada módulo: cambia de rol, abre la vista real y vuelve a la propuesta con la tarjeta resaltada.
3. **WhatsApp IA**: tocar "Hola! quiero 2 kg de tomate y una lechuga" → Confirmar → Pagar → el pedido aparece en **Pedidos de hoy** resaltado en naranja y el stock se descuenta.
4. **Escritorio / Celular** (header): la app real dentro de un marco de iPhone (iframe de 390px, layout mobile real).
5. **✨ Tour**: recorrido guiado por el menú de la vista actual.
6. **ES/EN** y **modo oscuro** en el header.

## Stack

Vite 5 · React 18 · TypeScript · Tailwind CSS 3 · componentes estilo shadcn/ui · Recharts · framer-motion · lucide-react · react-router 6 · zustand.

Powered by Insights.
