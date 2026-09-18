// ─────────────────────────────────────────────────────────────
//  Edge Function: crear-cliente
//  Crea una cuenta de cliente de forma segura.
//  Solo funciona si quien la llama es un ADMIN logueado.
//  Usa la clave secreta (service_role) del lado del servidor,
//  que Supabase inyecta sola. Nunca se expone al frontend.
// ─────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Verificar que quien llama sea un admin logueado
  const authHeader = req.headers.get('Authorization') ?? '';
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await asUser.auth.getUser();
  if (userErr || !user) return json({ error: 'No autenticado' }, 401);

  const { data: perfil } = await asUser
    .from('profiles').select('rol').eq('id', user.id).single();
  if (!perfil || perfil.rol !== 'admin') return json({ error: 'No autorizado' }, 403);

  // 2) Leer los datos del nuevo cliente
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: 'Body inválido' }, 400); }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || password.length < 6)
    return json({ error: 'Email y contraseña (mín. 6) son obligatorios' }, 400);

  // 3) Crear la cuenta con la clave secreta (admin)
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: creado, error: crearErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // queda confirmado, sin mail de verificación
  });
  if (crearErr || !creado.user) {
    const msg = crearErr?.message?.includes('already') ? 'Ya existe un usuario con ese email' : (crearErr?.message ?? 'No se pudo crear');
    return json({ error: msg }, 400);
  }

  // 4) Guardar el perfil del cliente
  const { error: perfilErr } = await admin.from('profiles').insert({
    id: creado.user.id,
    rol: 'cliente',
    nombre: body.nombre ?? null,
    email,
    telefono: body.telefono ?? null,
    cuit_dni: body.cuit_dni ?? null,
    domicilio: body.domicilio ?? null,
  });
  if (perfilErr) {
    // Si falla el perfil, borramos el usuario para no dejar basura
    await admin.auth.admin.deleteUser(creado.user.id);
    return json({ error: 'No se pudo guardar el perfil: ' + perfilErr.message }, 400);
  }

  return json({ ok: true, id: creado.user.id, email });
});
