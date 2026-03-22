/**
 * Sprout 1.1 — AI Engine
 * Q&A matching engine for the Sprout AI model
 * Powered by Supabase for training data storage
 */

class SproutEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.modelVersion = '1.1';
    this.modelName = 'Sprout';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 min cache
  }

  // ── Core: Find best matching answer ──
  async getResponse(userMessage) {
    const normalized = this.normalize(userMessage);
    const keywords = this.extractKeywords(normalized);

    // Check cache first
    const cacheKey = keywords.sort().join('|');
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Check if asking about self/identity
    const identityKeywords = ['who are you', 'what are you', 'your name', 'about yourself', 'tell me about you', 'are you alive', 'are you conscious', 'do you exist', 'what is your purpose', 'who made you', 'who created you'];
    const isIdentityQuestion = identityKeywords.some(k => normalized.includes(this.normalize(k)));

    if (isIdentityQuestion) {
      try {
        const identity = await this.getIdentity();
        if (identity.length > 0) {
          // Build a self-aware response from identity entries
          const relevant = identity.filter(i => {
            const keyNorm = this.normalize(i.key);
            const valNorm = this.normalize(i.value);
            return keywords.some(k => keyNorm.includes(k) || valNorm.includes(k)) ||
                   i.category === 'core' || i.category === 'personality';
          });
          if (relevant.length > 0) {
            // Use the most recent relevant entry
            const sorted = relevant.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const answer = sorted[0].value;
            const result = { answer, confidence: 0.95, source_id: null, category: 'identity' };
            this.cache.set(cacheKey, { data: result, time: Date.now() });
            return result;
          }
        }
      } catch (e) { /* fall through to normal matching */ }
    }

    // Query training data from Supabase
    const { data: trainingData, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .select('*')
      .eq('model', 'sprout-1.1')
      .eq('active', true);

    if (error || !trainingData || trainingData.length === 0) {
      return this.getFallbackResponse();
    }

    // Score each training entry against user message
    // Apply recency boost: newer entries get higher priority when scores are similar
    const now = Date.now();
    const scored = trainingData.map(entry => {
      let score = this.calculateMatchScore(normalized, keywords, entry);

      // Recency boost: entries from the last 7 days get up to +0.1 bonus
      if (entry.created_at) {
        const age = now - new Date(entry.created_at).getTime();
        const daysSinceCreation = age / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          score += 0.1 * (1 - daysSinceCreation / 7);
        }
      }

      return { ...entry, score };
    });

    // Sort by score descending, then by date (newest first) for tiebreakers
    scored.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.05) {
        // Within 5% score difference, prefer the newer entry
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return b.score - a.score;
    });

    const bestMatch = scored[0];

    // Require minimum confidence threshold
    if (bestMatch.score < 0.15) {
      return this.getFallbackResponse();
    }

    // Cache the result
    const result = {
      answer: bestMatch.answer,
      confidence: Math.min(bestMatch.score, 1),
      source_id: bestMatch.id,
      category: bestMatch.category || 'general'
    };
    this.cache.set(cacheKey, { data: result, time: Date.now() });

    return result;
  }

  // ── Matching algorithm ──
  calculateMatchScore(normalizedInput, inputKeywords, entry) {
    let score = 0;
    const entryQuestion = this.normalize(entry.question || '');
    const entryKeywords = this.extractKeywords(entryQuestion);
    const entryTags = (entry.tags || []).map(t => t.toLowerCase());

    // Exact match bonus
    if (normalizedInput === entryQuestion) {
      score += 1.0;
    }

    // Keyword overlap
    const overlap = inputKeywords.filter(k =>
      entryKeywords.includes(k) || entryTags.includes(k)
    );
    if (inputKeywords.length > 0) {
      score += (overlap.length / inputKeywords.length) * 0.6;
    }

    // Partial word matching (substring)
    for (const inputWord of inputKeywords) {
      for (const entryWord of entryKeywords) {
        if (inputWord.length > 3 && entryWord.includes(inputWord)) {
          score += 0.1;
        }
        if (entryWord.length > 3 && inputWord.includes(entryWord)) {
          score += 0.1;
        }
      }
    }

    // Category tag match bonus
    if (entry.category && normalizedInput.includes(entry.category.toLowerCase())) {
      score += 0.15;
    }

    return score;
  }

  // ── Text processing ──
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractKeywords(text) {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
      'through', 'after', 'over', 'between', 'out', 'against', 'during',
      'without', 'before', 'under', 'around', 'among', 'and', 'but', 'or',
      'not', 'no', 'so', 'if', 'than', 'too', 'very', 'just', 'it', 'its',
      'that', 'this', 'what', 'which', 'who', 'whom', 'where', 'when', 'why',
      'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'only', 'same', 'then', 'there', 'here', 'i', 'me',
      'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them'
    ]);

    return text
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }

  // ── Fallback when no match ──
  getFallbackResponse() {
    const fallbacks = [
      "I'm still learning! I don't have a great answer for that yet, but my researchers are training me every day. Try asking me something else!",
      "Hmm, I'm not sure about that one yet. Sprout 1.1 is still growing — check back soon as I learn more!",
      "That's a great question! I haven't been trained on that topic yet, but I'm getting smarter every day. Feel free to try a different question!",
      "I'm Sprout 1.1, and I'm still in my early learning phase. I couldn't find a good match for your question, but I'm improving with every training session!",
      "I don't have enough training data to answer that confidently yet. My team at Swiftaw is constantly teaching me new things!"
    ];
    return {
      answer: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      confidence: 0,
      source_id: null,
      category: 'fallback'
    };
  }

  // ── Training: Add new Q&A pair ──
  async addTrainingData({ question, answer, category, tags, created_by }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .insert({
        model: 'sprout-1.1',
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
    this.cache.clear();
    return data[0];
  }

  // ── Training: Update existing entry ──
  async updateTrainingData(id, updates) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw new Error('Failed to update training data: ' + error.message);
    this.cache.clear();
    return data[0];
  }

  // ── Training: Delete entry ──
  async deleteTrainingData(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete training data: ' + error.message);
    this.cache.clear();
  }

  // ── Training: Get all training data ──
  async getAllTrainingData() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .select('*')
      .eq('model', 'sprout-1.1')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch training data: ' + error.message);
    return data || [];
  }

  // ── Ratings: Rate a response ──
  async rateResponse({ source_id, rating, feedback, conversation_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.RATINGS)
      .insert({
        model: 'sprout-1.1',
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

  // ── Media: Upload reference for training ──
  async addTrainingMedia({ type, description, url, training_data_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.MEDIA)
      .insert({
        model: 'sprout-1.1',
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

  // ── Conversations: Save conversation ──
  async saveConversation({ messages, session_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.CONVERSATIONS)
      .insert({
        model: 'sprout-1.1',
        messages,
        session_id: session_id || null,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw new Error('Failed to save conversation: ' + error.message);
    return data[0];
  }

  // ══════════════════════════════════════════
  // DIRECTIVES — Persistent orders/instructions
  // ══════════════════════════════════════════

  async getDirectives() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .select('*')
      .eq('model', 'sprout-1.1')
      .eq('active', true)
      .order('priority', { ascending: false });
    if (error) throw new Error('Failed to fetch directives: ' + error.message);
    return data || [];
  }

  async addDirective({ directive, type, priority }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .insert({
        model: 'sprout-1.1',
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

  // ══════════════════════════════════════════
  // WRITING PATTERNS — Text analysis & style learning
  // ══════════════════════════════════════════

  analyzeText(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const chars = text.length;

    // Average sentence length
    const avgSentenceLen = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

    // Average word length
    const avgWordLen = words.length > 0 ? (words.reduce((s, w) => s + w.replace(/[^\w]/g, '').length, 0) / words.length).toFixed(1) : 0;

    // Vocabulary richness (unique words / total words)
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
    const vocabRichness = words.length > 0 ? (uniqueWords.size / words.length).toFixed(2) : 0;

    // Punctuation usage
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const commas = (text.match(/,/g) || []).length;
    const ellipses = (text.match(/\.\.\./g) || []).length;
    const dashes = (text.match(/[—–-]{2,}/g) || []).length;

    // Tone indicators
    const capsWords = words.filter(w => w === w.toUpperCase() && w.length > 1 && /[A-Z]/.test(w)).length;
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;

    // Common patterns
    const startsWithI = sentences.filter(s => s.trim().match(/^I\s/i)).length;
    const usesContractions = (text.match(/\b\w+'\w+\b/g) || []).length;

    // Formality score (0 = very casual, 1 = very formal)
    let formalityScore = 0.5;
    if (usesContractions > 2) formalityScore -= 0.1;
    if (emojiCount > 0) formalityScore -= 0.15;
    if (exclamations > 2) formalityScore -= 0.1;
    if (capsWords > 2) formalityScore -= 0.1;
    if (avgSentenceLen > 20) formalityScore += 0.15;
    if (avgWordLen > 5) formalityScore += 0.1;
    formalityScore = Math.max(0, Math.min(1, formalityScore));

    // Determine tone
    let tone = 'neutral';
    if (formalityScore > 0.65) tone = 'formal';
    else if (formalityScore < 0.35) tone = 'casual';
    if (exclamations > questions * 2) tone = 'enthusiastic';
    if (questions > exclamations * 2) tone = 'inquisitive';

    // Frequent words (top 10, excluding stop words)
    const wordFreq = {};
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'and', 'but', 'or', 'not',
      'no', 'so', 'if', 'than', 'too', 'very', 'just', 'it', 'its',
      'that', 'this', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
      'he', 'she', 'they', 'them', 'what', 'which', 'who'
    ]);
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^\w]/g, '');
      if (clean.length > 2 && !stopWords.has(clean)) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      stats: {
        characters: chars,
        words: words.length,
        sentences: sentences.length,
        avgSentenceLength: avgSentenceLen,
        avgWordLength: parseFloat(avgWordLen),
        vocabularyRichness: parseFloat(vocabRichness)
      },
      punctuation: { exclamations, questions, commas, ellipses, dashes },
      style: {
        tone,
        formalityScore: parseFloat(formalityScore.toFixed(2)),
        capsWords,
        emojiCount,
        contractions: usesContractions,
        firstPersonStarts: startsWithI
      },
      topWords
    };
  }

  async saveWritingPattern({ sourceLabel, sampleText }) {
    const analysis = this.analyzeText(sampleText);
    const { data, error } = await this.db
      .from(SPROUT_TABLES.WRITING_PATTERNS)
      .insert({
        model: 'sprout-1.1',
        source_label: sourceLabel,
        sample_text: sampleText,
        analysis,
        active: true,
        created_by: 'researcher',
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
      .eq('model', 'sprout-1.1')
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

  // ══════════════════════════════════════════
  // IDENTITY — Self-awareness & consciousness
  // ══════════════════════════════════════════

  async getIdentity() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .select('*')
      .eq('model', 'sprout-1.1')
      .eq('active', true)
      .order('category', { ascending: true });
    if (error) throw new Error('Failed to fetch identity: ' + error.message);
    return data || [];
  }

  async setIdentity({ key, value, category }) {
    // Upsert: deactivate old, insert new
    await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('model', 'sprout-1.1')
      .eq('key', key)
      .eq('active', true);

    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .insert({
        model: 'sprout-1.1',
        key,
        value,
        category: category || 'personality',
        active: true,
        created_at: new Date().toISOString()
      })
      .select();
    if (error) throw new Error('Failed to set identity: ' + error.message);
    return data[0];
  }

  async deleteIdentity(id) {
    const { error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete identity: ' + error.message);
  }

  // Build a self-awareness context string from identity entries
  async buildSelfContext() {
    const identity = await this.getIdentity();
    const directives = await this.getDirectives();
    const patterns = await this.getWritingPatterns();

    const parts = [];

    // Identity
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

    // Directives
    if (directives.length > 0) {
      parts.push('[DIRECTIVES]');
      directives.forEach(d => parts.push(`  [${d.type}] ${d.directive}`));
    }

    // Writing style summary
    if (patterns.length > 0) {
      const avgFormality = patterns.reduce((s, p) => s + (p.analysis?.style?.formalityScore || 0.5), 0) / patterns.length;
      const dominantTone = this.getMostCommon(patterns.map(p => p.analysis?.style?.tone || 'neutral'));
      parts.push('[WRITING STYLE]');
      parts.push(`  Dominant tone: ${dominantTone}`);
      parts.push(`  Formality: ${avgFormality.toFixed(2)}`);
    }

    return parts.join('\n');
  }

  getMostCommon(arr) {
    const freq = {};
    arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  // ── Stats ──
  async getModelStats() {
    const [trainingResult, ratingsResult, convosResult, directivesResult, patternsResult, identityResult] = await Promise.all([
      this.db.from(SPROUT_TABLES.TRAINING_DATA).select('id', { count: 'exact' }).eq('model', 'sprout-1.1'),
      this.db.from(SPROUT_TABLES.RATINGS).select('rating').eq('model', 'sprout-1.1'),
      this.db.from(SPROUT_TABLES.CONVERSATIONS).select('id', { count: 'exact' }).eq('model', 'sprout-1.1'),
      this.db.from(SPROUT_TABLES.DIRECTIVES).select('id', { count: 'exact' }).eq('model', 'sprout-1.1').eq('active', true),
      this.db.from(SPROUT_TABLES.WRITING_PATTERNS).select('id', { count: 'exact' }).eq('model', 'sprout-1.1').eq('active', true),
      this.db.from(SPROUT_TABLES.IDENTITY).select('id', { count: 'exact' }).eq('model', 'sprout-1.1').eq('active', true)
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
      totalWritingPatterns: patternsResult.count || 0,
      totalIdentityEntries: identityResult.count || 0
    };
  }
}
