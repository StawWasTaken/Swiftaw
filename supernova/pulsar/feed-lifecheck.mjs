// ════════════════════════════════════════════════════════════════
//  feed-lifecheck.mjs
//  Pulls Lifecheck `session_summary` rows (the human-vs-bot feature
//  vectors) from the Lifecheck Supabase and loads them into the Pulsar
//  AI database as `pulsar_signals`. This gives Pulsar real behavioural
//  data to learn from, on top of chats + the open web.
//
//  Run it yourself (needs BOTH service_role keys — never ship these):
//
//    npm i @supabase/supabase-js
//    LIFECHECK_URL=https://mwszvynzzugbowdngzab.supabase.co \
//    LIFECHECK_SERVICE_KEY=... \
//    PULSAR_URL=https://xrmmedxbqmwjcucyjosl.supabase.co \
//    PULSAR_SERVICE_KEY=... \
//    node supernova/pulsar/feed-lifecheck.mjs
//
//  Idempotent: dedups on (source, session_key), so re-running only adds
//  new sessions. Egress-friendly: pulls in pages, only the columns used.
// ════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const LC_URL = process.env.LIFECHECK_URL;
const LC_KEY = process.env.LIFECHECK_SERVICE_KEY;
const AI_URL = process.env.PULSAR_URL;
const AI_KEY = process.env.PULSAR_SERVICE_KEY;

if (!LC_URL || !LC_KEY || !AI_URL || !AI_KEY) {
  console.error('Missing env: LIFECHECK_URL, LIFECHECK_SERVICE_KEY, PULSAR_URL, PULSAR_SERVICE_KEY');
  process.exit(1);
}

const lc = createClient(LC_URL, LC_KEY, { auth: { persistSession: false } });
const ai = createClient(AI_URL, AI_KEY, { auth: { persistSession: false } });

const PAGE = 500;

// map a raw lifecheck_events row (event = 'session_summary') to a training signal
function toSignal(row) {
  const d = row.data || row.payload || row; // schema-tolerant
  const f = {
    durationMs:        d.durationMs ?? null,
    via:               d.via ?? null,             // 'cursor' | 'touch' | 'timing'
    passed:            d.passed ?? null,          // 'passive' | 'challenge' | null
    touch:             d.touch ?? null,
    challengesShown:   d.challengesShown ?? null,
    wrongTaps:         d.wrongTaps ?? null,
    suspiciousSignals: d.suspiciousSignals ?? null,
    spotChecked:       d.spotChecked ?? null,
    cursorReason:      d.cursorReason ?? null,
    cursor:            d.cursor ?? null,          // { n, dist, jitter, elapsed }
  };
  // weak label: a clean passive pass with cursor motion reads human; heavy
  // suspicion / no motion reads bot. Left null when unsure (unsupervised).
  let label = null;
  if (f.passed === 'passive' && (f.suspiciousSignals ?? 0) === 0 && f.cursor && f.cursor.dist > 0) label = 'human';
  else if ((f.suspiciousSignals ?? 0) >= 3 || f.cursorReason === 'no-move') label = 'bot';

  return {
    source: 'lifecheck',
    session_key: String(row.session_id ?? row.id ?? d.session ?? crypto.randomUUID()),
    label,
    features: f,
  };
}

async function run() {
  let from = 0, total = 0, inserted = 0;
  for (;;) {
    const { data, error } = await lc
      .from('lifecheck_events')
      .select('id, session_id, event, data, created_at')
      .eq('event', 'session_summary')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error('read error:', error.message); process.exit(1); }
    if (!data || !data.length) break;

    const rows = data.map(toSignal);
    const { error: upErr, count } = await ai
      .from('pulsar_signals')
      .upsert(rows, { onConflict: 'source,session_key', ignoreDuplicates: true, count: 'exact' });
    if (upErr) { console.error('write error:', upErr.message); process.exit(1); }

    total += data.length;
    inserted += (count ?? 0);
    console.log(`  page @${from}: read ${data.length}, new ${count ?? 0}`);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`\nDone. Scanned ${total} session_summary rows, added ${inserted} new signals to Pulsar.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
