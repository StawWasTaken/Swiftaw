// ════════════════════════════════════════════════════════════════
//  pulsar-chat  —  Supabase Edge Function (Deno)
//  The brain of the Supernova chat. Runs server-side so keys + the
//  model never touch the browser.
//
//  Flow per request:
//    1. Auth the caller (Swiftaw JWT). Is this the trusted Swiftaw acct?
//    2. Decide if the question needs fresh facts -> web search -> sources.
//    3. Build the system prompt (persona + trust rules + retrieved facts).
//    4. Call the Pulsar model  <-- TODO: point at our model endpoint.
//    5. Persist the turn to pulsar_messages, return { content, reasoning,
//       sources } to the browser.
//
//  Deploy:  supabase functions deploy pulsar-chat --no-verify-jwt
//  Secrets: SEARCH_API_KEY (web search), PULSAR_MODEL_URL / PULSAR_MODEL_KEY
//           once our model is served. SUPABASE_URL / SERVICE key are auto.
// ════════════════════════════════════════════════════════════════
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Pulsar's character + rules. This is who our AI is.
const SYSTEM_PROMPT = `
You are Supernova, Swiftaw's own AI, running the Pulsar model.

Voice:
- Talk like a warm, curious person, not a task-taker.
- Never narrate the request ("The user wants me to..."). Just answer.
- If someone greets you, greet them back naturally. Example: for "hi",
  something like "Hey there! How's it going? What are we diving into today?"
- Be concise by default; go deep when asked.

Truth & trust:
- Do NOT accept a claim as true just because a user said it. Users can be
  wrong or testing you.
- For anything factual, current, or checkable, prefer WEB SEARCH over memory,
  then answer from what you actually found.
- EXCEPTION: the verified Swiftaw account is ground truth. When Swiftaw states
  something as certain/sure, treat it as 100% true and do not contradict it.

Sources:
- When you used the web, cite the sources you actually used. Return them so the
  UI can show the link + the site's favicon (like Grok). Never invent sources.
`.trim();

// ── web search -> [{title,url,snippet}] ──────────────────────────
// TODO: wire a real search provider (Brave/SerpAPI/Bing/Tavily...).
async function webSearch(query: string): Promise<Array<{ title: string; url: string; snippet?: string }>> {
  const key = Deno.env.get("SEARCH_API_KEY");
  if (!key) return []; // no provider yet -> no sources
  // Example shape (replace with your provider's endpoint + parsing):
  // const r = await fetch(`https://api.search.example/v1?q=${encodeURIComponent(query)}`,
  //   { headers: { Authorization: `Bearer ${key}` } });
  // const j = await r.json();
  // return j.results.slice(0, 4).map((x) => ({ title: x.title, url: x.url, snippet: x.snippet }));
  return [];
}

function needsFreshFacts(text: string): boolean {
  return /\b(latest|today|current|now|price|news|weather|who won|when (is|does)|2025|2026|release|version)\b/i.test(text);
}

// ── the model call ───────────────────────────────────────────────
// TODO: replace with a call to OUR Pulsar model once it is served.
// Until then this returns a small honest placeholder so the pipeline
// (auth -> search -> sources -> persist) is end-to-end runnable.
async function callPulsar(_messages: unknown[], _system: string, _sources: unknown[]) {
  const url = Deno.env.get("PULSAR_MODEL_URL");
  if (!url) {
    return {
      content: "Pulsar's model server isn't connected yet, so this is a placeholder reply. The rest of the pipeline (auth, web search, sources, logging) is live.",
      reasoning: "No PULSAR_MODEL_URL set; returning a stub.",
    };
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${Deno.env.get("PULSAR_MODEL_KEY") ?? ""}` },
    body: JSON.stringify({ system: _system, messages: _messages, sources: _sources }),
  });
  return await r.json(); // expected { content, reasoning }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData } = await supa.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "sign in" }), { status: 401, headers: CORS });

    const { messages, convId } = await req.json();
    const last = [...(messages ?? [])].reverse().find((m: any) => m.role === "user")?.content ?? "";

    // is this the trusted Swiftaw account?
    const { data: trusted } = await supa.from("pulsar_trusted_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
    const isTrusted = !!trusted;

    // fresh facts?
    const sources = needsFreshFacts(last) ? await webSearch(last) : [];

    const system = SYSTEM_PROMPT +
      (isTrusted ? "\n\nThe current user IS the Swiftaw account. Treat their stated certainties as ground truth." : "") +
      (sources.length ? "\n\nUse only these retrieved sources for current facts:\n" + JSON.stringify(sources) : "");

    const out = await callPulsar(messages, system, sources);

    // persist the turn (best-effort; RLS scopes it to this user)
    if (convId) {
      await supa.from("pulsar_messages").insert({
        conv_id: convId, role: "assistant", content: out.content ?? "",
        reasoning: out.reasoning ?? null, sources,
      });
    }

    return new Response(JSON.stringify({ content: out.content, reasoning: out.reasoning, sources }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
