# Guía para cambiar precios

Los precios están escritos a mano en **3 archivos**. Si cambiás uno, hay que cambiarlo en todos los lugares de la tabla. Usá el buscador del editor (buscar en todo el proyecto) con el monto viejo, por ejemplo `179.000` y también `179000`.

> Regla de oro: buscá siempre **las dos formas** del número, con punto (`179.000`) y sin punto (`179000`). El presupuestador usa las dos.

## Dónde está cada precio

| Servicio | Monto actual | `index.html` | `planes.html` | `presupuesto.html` |
|---|---|---|---|---|
| Plan Presencia | $179.000 | link "Plan Presencia desde…" | tarjeta del plan | texto `$ 179.000` y `data-price="179000"` |
| Plan Negocio | $339.000 | link "Plan Negocio desde…" | tarjeta del plan | texto `$ 339.000` y `data-price="339000"` |
| Plan Catálogo Smart | $549.000 | link "Plan Catálogo Smart desde…" | tarjeta del plan | texto `$ 549.000` y `data-price="549000"` |
| WebApp (desde) | $599.000 | — | cartel "Desde" de WebApps | `data-min="599000"`, texto `Desde $ 599.000` (2 veces: `data-base` y el texto), aviso "arranca en $ 599.000" y placeholder `Desde 599000` |
| Gestión de dominio | $22.000 | link "Adicional desde…" | título del adicional **y** la tarjeta en Adicionales (2 lugares) | texto `$ 22.000` y `data-price="22000"` |
| Sitio bilingüe | $85.000 | — | Adicionales | texto `$ 85.000` y `data-price="85000"` |
| Sección extra | $35.000 | — | Adicionales | texto `$ 35.000` y `data-price="35000"` |
| Entrega express | $75.000 | — | Adicionales | texto `$ 75.000` y `data-price="75000"` |
| Perfil de Google Business | $65.000 | — | Adicionales | texto `$ 65.000` y `data-price="65000"` |
| Módulo interactivo (desde) | $45.000 | — | Adicionales ("Desde $45.000") | `data-min="45000"`, texto `Desde $ 45.000` (2 veces), aviso "arranca en $ 45.000" y placeholder `Desde 45000` |
| Mantenimiento & Base | $18.000 / mes | link "…desde $18.000/mes" | tarjeta del plan mensual | texto `$ 18.000` y `data-price="18000"` |
| Partner Digital Full | $38.000 / mes | link "…desde $38.000/mes" | tarjeta del plan mensual | texto `$ 38.000` y `data-price="38000"` |
| Plan Soporte WebApp | $44.000 / mes | — | tarjeta en la pestaña WebApps | — (en el presupuesto se menciona "valor vigente", sin monto) |

## Pasos

1. Elegí el servicio y anotá el monto viejo y el nuevo.
2. Buscá en todo el proyecto el monto viejo con punto (`179.000`) y sin punto (`179000`).
3. Reemplazá cada coincidencia **solo si es ese servicio** (cuidado: un mismo monto podría repetirse en otro servicio).
4. Volvé a buscar el monto viejo: no debe quedar ninguna coincidencia.
5. Actualizá la columna "Monto actual" de esta tabla, para que la guía siga al día.
6. Probá en el presupuestador: tildá el servicio y mirá que el total coincida con el nuevo precio.

## Otros lugares que pueden depender de un precio

- **Descuento por transferencia (10%):** está en `planes.html` (3 textos "10% de descuento") y en `presupuesto.html` (texto del total y las cuentas con `0.9`). Si cambiás el porcentaje, hay que cambiarlo en todos.
- **Presupuestos ya guardados:** no cambian. Conservan el precio con el que se emitieron aunque cambies la lista.
- **Instagram y otras redes:** si publicaste precios ahí, hay que actualizarlos a mano.
