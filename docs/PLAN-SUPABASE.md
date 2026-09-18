# Plan Supabase — Panel de admin + presupuestos + portal de clientes

Documento de trabajo para conectar el sitio (estático, en GitHub Pages) con
**Supabase** y lograr:

- Que `presupuesto.html` solo lo pueda usar Martín (admin logueado).
- Que el **N° de documento se autonumere solo** desde la base de datos.
- Que cada presupuesto generado quede **guardado** (cliente, servicios, total, estado, saldo).
- Que Martín pueda **crear cuentas de clientes desde el panel** (sin entrar a Supabase).
- (Fase 2) Que cada cliente entre a un portal y vea **solo lo suyo**: qué contrató y su saldo.

> **Estado:** planificación. Todavía no se escribió código de la app.
> Este `.md` es el mapa de ruta.

---

## 1. Cómo va a quedar la arquitectura

```
  Navegador (sitio estático en GitHub Pages)
  ┌───────────────────────────────────────────┐
  │  panel.html      → login admin + ABM        │
  │  presupuesto.html → protegido, autonumera   │
  │  portal.html     → login cliente (Fase 2)   │
  └───────────────────────────────────────────┘
                  │  (JavaScript + clave PÚBLICA)
                  ▼
  ┌───────────────────────────────────────────┐
  │                 SUPABASE                    │
  │  • Auth (usuarios / contraseñas)            │
  │  • Base de datos Postgres                   │
  │      profiles · documentos · pagos          │
  │  • RLS (reglas: admin ve todo,              │
  │         cada cliente ve solo lo suyo)       │
  │  • Edge Function "crear-cliente"            │
  │      (usa la clave SECRETA, del lado server)│
  └───────────────────────────────────────────┘
```

**No hay servidor propio que mantener.** Supabase es "backend como servicio":
le hablamos desde el JavaScript del frontend. La única parte que corre "del lado
del servidor" es una pequeña función (Edge Function) que Supabase hospeda por
nosotros, y que hace falta solo para crear cuentas de clientes de forma segura.

---

## 2. Tres conceptos clave (para que entiendas cada paso)

1. **Hay dos claves en Supabase:**
   - `anon` / `publishable` (PÚBLICA): va en el JavaScript del frontend. **Es
     seguro que esté a la vista**, incluso en el repo público de GitHub. No da
     acceso a nada por sí sola.
   - `service_role` (SECRETA): puede saltarse todas las reglas de seguridad.
     **NUNCA** va en el frontend ni en el repo. Solo vive dentro de la Edge
     Function, en el servidor de Supabase.

2. **RLS (Row Level Security):** son reglas en la base que deciden quién ve/edita
   qué fila. Con esto, aunque alguien abra `presupuesto.html`, sin una sesión de
   admin válida la base **le niega** todo. Esta es la seguridad de verdad.

3. **Edge Function:** una funcioncita que Supabase ejecuta en su servidor. La
   usamos para crear clientes: el frontend le pide "creá este cliente", la función
   verifica que quien pide sea el admin, y recién ahí usa la clave secreta para
   crear la cuenta. Así nunca exponemos la clave secreta.

---

## 3. Por qué NO se puede crear el cliente "directo" desde el frontend

Uno pensaría: "que el panel llame a `signUp()` y listo". Problemas:

- `signUp()` es público: cualquiera podría autoregistrarse (no queremos eso, vos
  querés crear las cuentas).
- Al crear el usuario, Supabase te lo "loguea" y te pisaría tu sesión de admin.

Por eso la forma correcta y segura es la **Edge Function `crear-cliente`**:
verifica que sos vos (admin) y crea la cuenta con la clave secreta del lado
servidor. Es un poquito más de trabajo de setup, pero queda prolijo y seguro.
**Todo el código lo escribo yo; vos solo lo desplegás** (te doy el paso exacto).

---

## 4. Reparto de tareas

### 🧑 Lo que hacés VOS (Martín) — necesita tu cuenta

- [ ] **T1.** Crear cuenta en [supabase.com](https://supabase.com) (gratis) y un
      proyecto nuevo. Región recomendada: `South America (São Paulo)`.
- [ ] **T2.** Copiarme del panel de Supabase → *Project Settings → API*:
      - **Project URL** (algo como `https://xxxx.supabase.co`)
      - **anon public key** (la clave PÚBLICA)
      > Estas dos son públicas: me las podés pegar en el chat sin problema.
- [ ] **T3.** Ir a *SQL Editor*, pegar el script que te dejo en la sección 6 y
      darle **Run**. (Crea las tablas y las reglas de seguridad.)
- [ ] **T4.** Crear tu usuario admin: *Authentication → Users → Add user* con tu
      email y una contraseña. Después corré el mini-SQL de la sección 6.3 para
      marcarte como `admin`.
- [ ] **T5.** Desactivar el auto-registro público: *Authentication → Sign In /
      Providers → Email* → desactivar **"Allow new users to sign up"**.
- [ ] **T6.** Desplegar la Edge Function `crear-cliente` (código que te doy yo).
      Se puede desde el **dashboard de Supabase** (*Edge Functions → Deploy a new
      function*) sin instalar nada. Te dejo el paso a paso cuando lleguemos ahí.
- [ ] **T7.** Probar todo y decirme si algo falla.

### 🤖 Lo que hago YO (Claude) — en el código del repo

- [x] **C1.** Config con tu Project URL + publishable key → `assets/supabase.js`. ✅
- [x] **C2.** **`panel.html`**: login de admin + alta de clientes + listado de
      clientes y de presupuestos. ✅
- [x] **C3.** **`presupuesto.html`**: candado (solo admin), selector de cliente y
      botón **"Guardar y numerar"** que asigna el N° automático y guarda en la base. ✅
- [x] **C4.** Código de la **Edge Function `crear-cliente`** → `supabase/functions/crear-cliente/index.ts`. ✅
- [x] **C5.** **`portal.html`** para clientes (login + presupuestos, contratado y saldo). ✅
- [x] **C6.** Extras: editar cliente desde el panel, "Ver / PDF" para re-exportar un
      presupuesto guardado, botón "Volver al panel" en el presupuesto, y botón
      "Iniciar sesión" en el nav de `index.html` y `planes.html`. ✅

> El código de la Fase 1 ya está en el repo. Falta que hagas tu parte en Supabase
> (T3 a T6) para que empiece a funcionar. Detalle del despliegue de la función en
> la sección 9.

---

## 5. Orden de trabajo (paso a paso)

**Bloque A — Setup de Supabase (vos, con mi guía)**
1. T1 — crear proyecto.
2. T2 — pasarme URL + anon key.
3. T3 — correr el SQL de tablas + RLS.
4. T4 — crear tu usuario admin y marcarte como admin.
5. T5 — desactivar registro público.

**Bloque B — Panel y presupuesto (yo)**
6. C1 — config con tus claves.
7. C2 — `panel.html` con login.
8. C3 — proteger y autonumerar `presupuesto.html`.

**Bloque C — Alta de clientes (los dos)**
9. C4 — escribo la Edge Function.
10. T6 — la desplegás.
11. Conecto el formulario "Nuevo cliente" del panel a la función.

**Bloque D — Prueba**
12. T7 — probamos: login, crear cliente, generar presupuesto numerado, guardar.

➡️ Cuando termine el Bloque D, la **Fase 1 está lista**. Recién ahí encaramos la
**Fase 2 (portal del cliente)**.

---

## 6. Base de datos (SQL para el paso T3)

> Este es el script que vas a pegar en *SQL Editor*. Lo dejo acá para que quede
> versionado; puede ajustarse antes de correrlo.

### 6.1 Tablas

```sql
-- Perfiles: una fila por usuario (extiende auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  rol        text not null default 'cliente' check (rol in ('admin','cliente')),
  nombre     text,
  email      text,
  telefono   text,
  cuit_dni   text,
  domicilio  text,
  creado_en  timestamptz not null default now()
);

-- Documentos / presupuestos. El número se autonumera solo.
create table public.documentos (
  id            uuid primary key default gen_random_uuid(),
  numero        int generated always as identity,   -- 1, 2, 3... automático
  cliente_id    uuid references public.profiles(id) on delete set null,
  fecha         date not null default current_date,
  items         jsonb not null default '[]',         -- servicios elegidos
  total_unico   numeric not null default 0,
  total_mensual numeric not null default 0,
  estado        text not null default 'borrador'
                check (estado in ('borrador','enviado','aceptado','en_proceso','entregado','cancelado')),
  sena_pagada   boolean not null default false,
  saldo         numeric not null default 0,          -- lo que falta pagar
  creado_por    uuid references public.profiles(id),
  creado_en     timestamptz not null default now()
);

-- Pagos (se usa fuerte en Fase 2, pero lo dejamos listo)
create table public.pagos (
  id           uuid primary key default gen_random_uuid(),
  documento_id uuid references public.documentos(id) on delete cascade,
  monto        numeric not null,
  metodo       text,
  fecha        date not null default current_date,
  creado_en    timestamptz not null default now()
);
```

El **N° de documento** es la columna `numero` (autoincremental). En pantalla lo
mostramos con formato `MRS-0001` (el `MRS-` y el relleno de ceros los pone el
JavaScript). El número se asigna en el momento de **guardar** el presupuesto, así
no quedan huecos por borradores abandonados.

### 6.2 Seguridad (RLS)

```sql
-- Función helper: ¿el usuario actual es admin?
create or replace function public.es_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

alter table public.profiles   enable row level security;
alter table public.documentos enable row level security;
alter table public.pagos      enable row level security;

-- PROFILES: el admin ve/edita todo; cada cliente ve solo su propia fila
create policy "admin todo profiles" on public.profiles
  for all using (public.es_admin()) with check (public.es_admin());
create policy "cliente ve su perfil" on public.profiles
  for select using (id = auth.uid());

-- DOCUMENTOS: el admin todo; el cliente solo lee los suyos
create policy "admin todo documentos" on public.documentos
  for all using (public.es_admin()) with check (public.es_admin());
create policy "cliente ve sus documentos" on public.documentos
  for select using (cliente_id = auth.uid());

-- PAGOS: el admin todo; el cliente solo lee los pagos de sus documentos
create policy "admin todo pagos" on public.pagos
  for all using (public.es_admin()) with check (public.es_admin());
create policy "cliente ve sus pagos" on public.pagos
  for select using (
    exists (select 1 from public.documentos d
            where d.id = documento_id and d.cliente_id = auth.uid())
  );
```

### 6.3 Marcarte como admin (paso T4, después de crear tu usuario)

```sql
-- Reemplazá el email por el tuyo (el que usaste en Authentication → Users)
insert into public.profiles (id, rol, nombre, email)
select id, 'admin', 'Martín Romero', email
from auth.users
where email = 'TU-EMAIL@ejemplo.com'
on conflict (id) do update set rol = 'admin';
```

---

## 7. Desplegar la Edge Function `crear-cliente` (paso T6)

El código ya está en el repo (`supabase/functions/crear-cliente/index.ts`). Para
que el botón "Crear cuenta de cliente" del panel funcione, hay que desplegarlo.
La forma más simple, **sin instalar nada**, es desde el dashboard:

1. En Supabase, menú izquierdo → **Edge Functions**.
2. Botón **Deploy a new function** → **Via Editor** (editor en el navegador).
3. Nombre de la función: **`crear-cliente`** (exactamente así, con guion).
4. Borrá el código de ejemplo y pegá **todo** el contenido de
   `supabase/functions/crear-cliente/index.ts` de este repo.
5. **Deploy**. Listo.

> No hace falta cargar ninguna clave a mano: Supabase inyecta solo las variables
> `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` dentro de la
> función. La clave secreta vive ahí, nunca en el frontend.

Si más adelante preferís la vía consola (Supabase CLI), es:
`supabase functions deploy crear-cliente`. Pero con el editor del dashboard alcanza.

---

## 8. Cómo probar la Fase 1 (paso T7)

Una vez hechos T3, T4, T5 (y T6 para el alta de clientes):

1. Entrá a `panel.html` → iniciá sesión con tu usuario admin.
2. Cargá un cliente de prueba en **"Nuevo cliente"**. Debería aparecer en la lista.
3. Clic en **"+ Nuevo presupuesto"** → se abre `presupuesto.html` (si no estás
   logueado, te frena el candado).
4. Elegí el cliente en el selector, marcá servicios, y tocá **"Guardar y numerar"**:
   el Doc. N° se completa solo (MRS-0001, MRS-0002…) y queda guardado.
5. Volvé al panel: el presupuesto aparece en la tabla **"Presupuestos"**.
6. **"Guardar como PDF"** sigue funcionando igual que antes.

Si algo falla, copiame el mensaje de error que aparezca y lo resolvemos.

---

## 9. Nota de costos y privacidad

- El plan **gratis** de Supabase alcanza de sobra para este volumen (clientes y
  presupuestos de un estudio). Sin tarjeta.
- La clave PÚBLICA en el repo de GitHub es normal y seguro. Lo que protege los
  datos es el RLS + tu login, no esconder la clave.
- La clave SECRETA jamás toca el repo ni el frontend.

---

## 10. Estado de la Fase 2 (portal del cliente)

- [x] `portal.html`: el cliente inicia sesión y ve sus presupuestos, lo contratado
      y su saldo pendiente. El login del nav enruta solo: admin → panel, cliente → portal.
- [ ] Que el admin **registre pagos** y **cambie el estado** de un presupuesto desde el panel.
- [ ] Que el **saldo se recalcule solo** restando los pagos al total.
- [ ] (Opcional) Marcar la seña como pagada y avisar por email/WhatsApp.

> Lo que sigue: la pantalla del admin para cargar pagos y estados. Cuando eso esté,
> el "Saldo pendiente" del portal del cliente se actualiza solo.

---

## ✅ Próximo paso concreto

Arrancá por **T1 y T2**: creá el proyecto en Supabase y pasame el **Project URL**
y la **anon key**. Con eso configuro el código y avanzamos con `panel.html`.
