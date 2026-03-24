/**
 * Sprout 1.3 — AI Engine (Powered by Claude)
 * Routes conversations through Supabase Edge Function → Anthropic Claude API
 * Maintains full conversation history for real context awareness.
 *
 * The old engine tried to fake AI with regex and keyword matching.
 * This version uses a real language model — giving Tithonia actual intelligence.
 */

class SproutEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.modelVersion = '1.3';
    this.modelName = 'Tithonia';

    // ── Conversation State ──
    this.conversationHistory = [];   // Full message history: [{ role, content }]
    this.maxHistoryTurns = 50;       // Keep last 50 exchanges for context
    this.turnCount = 0;

    // ── Edge Function URL (same Supabase project) ──
    this.chatEndpoint = SUPABASE_URL + '/functions/v1/chat';
  }

  // ══════════════════════════════════════════════════════════════
  // CORE: Get a response from the AI
  // Sends the full conversation history to the Edge Function,
  // which proxies to the Anthropic Claude API.
  // ══════════════════════════════════════════════════════════════

  async getResponse(userMessage) {
    this.turnCount++;

    // Detect emotion for UI display only (not sent to the LLM)
    const emotion = this.detectEmotionForUI(userMessage);

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Trim history to keep within limits
    this.trimHistory();

    try {
      // Call the Supabase Edge Function
      const response = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Chat API error:', response.status, errorData);

        // Provide helpful error messages
        if (response.status === 500 && errorData.error?.includes('ANTHROPIC_API_KEY')) {
          throw new Error('API_KEY_MISSING');
        }
        throw new Error(errorData.detail || errorData.error || 'AI service unavailable');
      }

      const result = await response.json();
      const answer = result.answer;

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: answer });

      return {
        answer,
        confidence: 1.0,
        source_id: null,
        category: 'ai',
        emotion,
        mode: 'ai-engine',
      };
    } catch (err) {
      // Remove the user message we added since the call failed
      this.conversationHistory.pop();

      console.error('Sprout engine error:', err);

      // Helpful error messages
      if (err.message === 'API_KEY_MISSING') {
        return {
          answer: "I'm not fully set up yet — my AI backend needs an API key configured. The team at Swiftaw is working on it!",
          confidence: 0,
          source_id: null,
          category: 'error',
          emotion: 'neutral',
          mode: 'error',
        };
      }

      throw err; // Let the frontend handle other errors
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CONVERSATION MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  // Trim conversation history to stay within token limits
  trimHistory() {
    if (this.conversationHistory.length > this.maxHistoryTurns * 2) {
      // Keep the most recent exchanges
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryTurns * 2);
    }
  }

  // Clear conversation history (for new chats)
  clearHistory() {
    this.conversationHistory = [];
    this.turnCount = 0;
  }

  // Load conversation history from saved messages (for switching between chats)
  loadHistory(messages) {
    this.conversationHistory = [];
    this.turnCount = 0;

    if (!messages || !Array.isArray(messages)) return;

    for (const msg of messages) {
      if (msg.role === 'user' && msg.text) {
        this.conversationHistory.push({ role: 'user', content: msg.text });
        this.turnCount++;
      } else if (msg.role === 'assistant' && msg.text) {
        this.conversationHistory.push({ role: 'assistant', content: msg.text });
      }
    }

    this.trimHistory();
  }

  // ══════════════════════════════════════════════════════════════
  // EMOTION DETECTION (UI display only — lightweight)
  // ══════════════════════════════════════════════════════════════

  detectEmotionForUI(text) {
    const lower = text.toLowerCase().trim();

    if (/^(hi|hello|hey|howdy|sup|yo|greetings|hola|bonjour|hallo|ciao)\b/i.test(lower)) return 'greeting';
    if (/\b(bye|goodbye|see you|later|goodnight|farewell)\b/i.test(lower)) return 'farewell';
    if (/\b(thank|thanks|thx|appreciate|grateful)\b/i.test(lower)) return 'grateful';
    if (/\b(sad|depressed|upset|unhappy|crying|miserable|heartbroken)\b/i.test(lower)) return 'sad';
    if (/\b(angry|furious|mad|frustrated|annoyed|pissed)\b/i.test(lower)) return 'angry';
    if (/\b(haha|lol|lmao|rofl|funny|joke|😂|🤣|😄)\b/i.test(lower)) return 'playful';
    if (/\b(curious|wondering|wonder|interesting|fascinated)\b/i.test(lower)) return 'curious';
    if (/\b(happy|excited|great|awesome|amazing|wonderful|joy|love)\b/i.test(lower)) return 'happy';

    return 'neutral';
  }

  // ══════════════════════════════════════════════════════════════
  // SUPABASE DB METHODS — Training, Ratings, Conversations, etc.
  // These are preserved for the training dashboard and data collection.
  // ══════════════════════════════════════════════════════════════

  async addTrainingData({ question, answer, category, tags, created_by }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .insert({
        model: 'sprout-1.3',
        question,
        answer,
        category: category || 'general',
        tags: tags || [],
        created_by: created_by || 'researcher',
        active: true,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to add training data: ' + error.message);
    return data[0];
  }

  async updateTrainingData(id, updates) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw new Error('Failed to update training data: ' + error.message);
    return data[0];
  }

  async deleteTrainingData(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete training data: ' + error.message);
  }

  async getAllTrainingData() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .select('*')
      .eq('model', 'sprout-1.3')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Failed to fetch training data: ' + error.message);
    return data || [];
  }

  async rateResponse({ source_id, rating, feedback, conversation_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.RATINGS)
      .insert({
        model: 'sprout-1.3',
        source_id,
        rating,
        feedback: feedback || null,
        conversation_id: conversation_id || null,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to save rating: ' + error.message);
    return data[0];
  }

  async addTrainingMedia({ type, description, url, training_data_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.MEDIA)
      .insert({
        model: 'sprout-1.3',
        type,
        description: description || null,
        url,
        training_data_id: training_data_id || null,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to save media: ' + error.message);
    return data[0];
  }

  async saveConversation({ messages, session_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.CONVERSATIONS)
      .insert({
        model: 'sprout-1.3',
        messages,
        session_id: session_id || null,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to save conversation: ' + error.message);
    return data[0];
  }

  async getDirectives() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .select('*')
      .eq('model', 'sprout-1.3')
      .eq('active', true)
      .order('priority', { ascending: false });
    if (error) throw new Error('Failed to fetch directives: ' + error.message);
    return data || [];
  }

  async addDirective({ directive, type, priority }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .insert({
        model: 'sprout-1.3',
        directive,
        type: type || 'instruction',
        priority: priority || 0,
        active: true,
        created_by: 'researcher',
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to add directive: ' + error.message);
    return data[0];
  }

  async deleteDirective(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete directive: ' + error.message);
  }

  async getModelStats() {
    const [trainingResult, ratingsResult, convosResult, directivesResult] = await Promise.all([
      this.db.from(SPROUT_TABLES.TRAINING_DATA).select('id', { count: 'exact' }).eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.RATINGS).select('rating').eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.CONVERSATIONS).select('id', { count: 'exact' }).eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.DIRECTIVES).select('id', { count: 'exact' }).eq('model', 'sprout-1.3').eq('active', true),
    ]);

    const ratings = ratingsResult.data || [];
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 'N/A';

    return {
      totalTrainingEntries: trainingResult.count || 0,
      totalConversations: convosResult.count || 0,
      totalRatings: ratings.length,
      averageRating: avgRating,
      totalDirectives: directivesResult.count || 0,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // IDENTITY — Self-knowledge entries (used by training dashboard)
  // ══════════════════════════════════════════════════════════════

  async setIdentity({ key, value, category }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .insert({
        model: 'sprout-1.3',
        key,
        value,
        category: category || 'core',
        active: true,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to set identity: ' + error.message);
    return data[0];
  }

  async getIdentity() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .select('*')
      .eq('model', 'sprout-1.3')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Failed to fetch identity: ' + error.message);
    return data || [];
  }

  async deleteIdentity(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete identity: ' + error.message);
  }

  async buildSelfContext() {
    const [identity, directives] = await Promise.all([
      this.getIdentity(),
      this.getDirectives(),
    ]);
    const parts = ['[TITHONIA SELF-CONTEXT]'];
    if (identity.length > 0) {
      const grouped = {};
      identity.forEach(i => {
        if (!grouped[i.category]) grouped[i.category] = [];
        grouped[i.category].push(i);
      });
      for (const [cat, entries] of Object.entries(grouped)) {
        parts.push(`[${cat.toUpperCase()}]`);
        entries.forEach(e => parts.push(`  ${e.key}: ${e.value}`));
      }
    }
    if (directives.length > 0) {
      parts.push('[DIRECTIVES]');
      directives.forEach(d => parts.push(`  [${d.type}] ${d.directive}`));
    }
    return parts.join('\n');
  }

  // ══════════════════════════════════════════════════════════════
  // WRITING PATTERNS — Text analysis (used by training dashboard)
  // ══════════════════════════════════════════════════════════════

  analyzeText(text) {
    if (!text) return {};
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      style: {
        tone: 'neutral',
        formalityScore: 0.5,
      }
    };
  }

  async saveWritingPattern({ sourceLabel, sampleText }) {
    const analysis = this.analyzeText(sampleText);
    const { data, error } = await this.db
      .from(SPROUT_TABLES.WRITING_PATTERNS)
      .insert({
        model: 'sprout-1.3',
        source_label: sourceLabel,
        sample_text: sampleText,
        analysis,
        active: true,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to save writing pattern: ' + error.message);
    return data[0];
  }

  async getWritingPatterns() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.WRITING_PATTERNS)
      .select('*')
      .eq('model', 'sprout-1.3')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Failed to fetch writing patterns: ' + error.message);
    return data || [];
  }

  async deleteWritingPattern(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.WRITING_PATTERNS)
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete writing pattern: ' + error.message);
  }

  // ══════════════════════════════════════════════════════════════
  // TASK GOAL STATUS (used by training dashboard)
  // ══════════════════════════════════════════════════════════════

  getTaskGoalStatus() {
    return {
      currentTask: null,
      taskType: null,
      isComplete: false,
      successCount: this.turnCount,
      failCount: 0,
    };
  }
}
