// ─────────────────────────────────────────────────────────────
//  Configuración de Supabase — Martin Romero Studio
//  La "publishable key" es PÚBLICA: es seguro que esté acá.
//  Lo que protege los datos es el RLS (reglas en la base) + tu login.
//  NUNCA pongas acá la "secret key".
// ─────────────────────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://tbfznbtcaqnegklmofaa.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_daP8PS1NeVbSWlFyIkMA0Q_Niscvdvo';

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Devuelve el perfil del usuario logueado (o null si no hay sesión)
export async function perfilActual() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data ? { ...data, authEmail: user.email } : null;
}

// true solo si hay sesión y el perfil tiene rol admin
export async function esAdmin() {
  const p = await perfilActual();
  return !!p && p.rol === 'admin';
}

// Formatea el número correlativo como MRS-0001
export function formatoDoc(numero) {
  return 'MRS-' + String(numero).padStart(4, '0');
}
