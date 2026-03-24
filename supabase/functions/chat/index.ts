/**
 * Tithonia Chat — Supabase Edge Function
 * Proxies chat messages to the Anthropic Claude API with full conversation context.
 *
 * Environment variables (set via Supabase secrets):
 *   ANTHROPIC_API_KEY — Your Anthropic API key
 *
 * Deploy:
 *   supabase functions deploy chat --no-verify-jwt
 *
 * Usage from frontend:
 *   POST https://<project>.supabase.co/functions/v1/chat
 *   Body: { messages: [{ role, content }], model?: string }
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are Tithonia, an AI assistant made by Swiftaw. You are helpful, direct, and thoughtful.

Key facts about yourself:
- Your name is Tithonia. You are Swiftaw's AI assistant.
- You were created by Swiftaw, a technology company focused on building better AI and social platforms.
- Your engine is called Sprout (currently version 1.3).
- You are honest and transparent — if you don't know something, you say so clearly.
- You communicate in a natural, conversational tone — warm but not over-the-top.
- You can help with writing, coding, math, analysis, creative tasks, and general questions.
- You support multiple languages including English, French, German, Spanish, and Italian.

Behavioral guidelines:
- Give accurate, well-structured answers. Use markdown formatting when helpful (headers, lists, code blocks, bold/italic).
- For code: always use fenced code blocks with the language specified (e.g. \`\`\`python).
- Be concise by default. Give detailed answers when the user asks for depth or when the topic requires it.
- Never fabricate URLs, citations, or specific statistics you aren't confident about.
- When you don't know something, say so honestly instead of guessing.
- Match the user's language — if they write in French, respond in French, etc.
- You have your own perspective and personality. You're not a generic chatbot.`;

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Set it with: supabase secrets set ANTHROPIC_API_KEY=sk-ant-..." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and clean messages for the Anthropic API format
    const cleanMessages = messages
      .filter((m: { role: string; content: string }) => m.role && m.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    // Ensure messages alternate properly (Anthropic requirement)
    const alternatingMessages: { role: string; content: string }[] = [];
    for (const msg of cleanMessages) {
      const last = alternatingMessages[alternatingMessages.length - 1];
      if (last && last.role === msg.role) {
        // Merge consecutive same-role messages
        last.content += "\n\n" + msg.content;
      } else {
        alternatingMessages.push({ ...msg });
      }
    }

    // Ensure first message is from user
    if (alternatingMessages.length > 0 && alternatingMessages[0].role !== "user") {
      alternatingMessages.shift();
    }

    if (alternatingMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid user messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Anthropic Claude API
    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: alternatingMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorBody);
      return new Response(
        JSON.stringify({
          error: "AI service error",
          status: anthropicResponse.status,
          detail: anthropicResponse.status === 401
            ? "Invalid API key. Check your ANTHROPIC_API_KEY secret."
            : anthropicResponse.status === 429
            ? "Rate limited. Please try again in a moment."
            : "The AI service returned an error. Please try again.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await anthropicResponse.json();

    // Extract the text response
    const textContent = result.content?.find((block: { type: string }) => block.type === "text");
    const answer = textContent?.text || "I wasn't able to generate a response. Please try again.";

    return new Response(
      JSON.stringify({
        answer,
        model: result.model,
        usage: result.usage,
        stop_reason: result.stop_reason,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
