// ════════════════════════════════════════════════════════════
//  Lifecheck · lifecheck-verify  (Supabase Edge Function)
//
//  Why this exists
//  ───────────────
//  Verification must consume the token with the account's SECRET key. You
//  can't do that safely from a browser — the secret would be exposed, and a
//  direct browser fetch to the verify RPC hits CORS anyway (that's the error
//  you saw, and it's the correct, intended behaviour).
//
//  This function is the fix for sites with NO backend of their own: the
//  browser POSTs only the public site key + the token; the function looks up
//  the secret server-side (service-role, never shipped to the client), calls
//  the verify RPC, and returns a CORS-enabled JSON verdict. The secret never
//  leaves Supabase.
//
//  Deploy
//  ──────
//    supabase functions deploy lifecheck-verify --no-verify-jwt
//  (--no-verify-jwt lets anonymous browsers call it. SUPABASE_URL and
//   SUPABASE_SERVICE_ROLE_KEY are injected by Supabase automatically.)
//
//  Call from a browser / static page
//  ─────────────────────────────────
//    const r = await fetch(
//      'https://<PROJECT>.supabase.co/functions/v1/lifecheck-verify',
//      { method:'POST', headers:{ 'content-type':'application/json' },
//        body: JSON.stringify({ sitekey:'lc_site_...', token:'LC1.3_...' }) });
//    const verdict = await r.json();   // { success:true, score, passed, mode, ... }
//
//  `score` is a real 0..1 human-confidence reading as of v1.3 — the widget
//  computes it from nine signals and it rides along on the token. Before
//  v1.3 this field was the constant 0.9, so tokens minted by an older widget
//  still answer 0.9. Gate on `success`; use `score` for softer decisions.
//
//  Tradeoff: this endpoint takes the PUBLIC site key (not the secret), so it
//  trades a little strictness for browser-callability. It's safe because a
//  token is single-use, short-lived (~2 min) and only minted by a real pass —
//  verifying just consumes it. Sites that want strict server-only checks
//  should keep calling lifecheck_verify_token directly from their backend
//  with the secret key.
// ════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return json({ success: false, v: '1.3', 'error-codes': ['method-not-allowed'] }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, v: '1.3', 'error-codes': ['bad-json'] }, 400);
  }

  const token = String(body.token ?? '');
  const sitekey = String(body.sitekey ?? '');
  if (!token || !sitekey) {
    return json({ success: false, v: '1.3', 'error-codes': ['missing-input'] }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // service role bypasses RLS to read the secret paired with this public key
  const { data: key, error: keyErr } = await admin
    .from('lifecheck_keys')
    .select('secret_key')
    .eq('site_key', sitekey)
    .maybeSingle();

  if (keyErr || !key) {
    return json({ success: false, v: '1.3', 'error-codes': ['invalid-input-sitekey'] }, 200);
  }

  const { data, error } = await admin.rpc('lifecheck_verify_token', {
    p_secret: (key as { secret_key: string }).secret_key,
    p_token: token,
  });

  if (error) {
    return json({ success: false, v: '1.3', 'error-codes': ['verify-failed'] }, 200);
  }
  return json(data, 200);
});
