/**
 * Sprout Smart Search — Web Knowledge Engine
 * When Sprout doesn't know something, it searches the web automatically
 * Uses Wikipedia API (free, no key, CORS-friendly) + Wikidata
 * Extracts knowledge, synthesizes answers, and stores what it learns
 */

class SproutSmartSearch {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.searchCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 min cache
    this.maxRetries = 2;

    // Wikipedia API endpoints (CORS-friendly)
    this.WIKI_API = 'https://en.wikipedia.org/api/rest_v1';
    this.WIKI_SEARCH_API = 'https://en.wikipedia.org/w/api.php';

    // Multilingual Wikipedia endpoints
    this.WIKI_LANG_APIS = {
      en: 'https://en.wikipedia.org',
      fr: 'https://fr.wikipedia.org',
      de: 'https://de.wikipedia.org',
      es: 'https://es.wikipedia.org',
      it: 'https://it.wikipedia.org'
    };
  }

  /**
   * Main entry point — search the web for an answer
   * SPROUT 1.4: Now with context awareness & local-first querying
   * Only searches web if local knowledge confidence is low
   */
  async search(query, keywords, language = 'en', localConfidence = 0) {
    if (!query || query.trim().length < 2) return null;

    // ── Block self-knowledge queries from hitting Wikipedia ──
    // Prevents "what is sprout" from returning Brussels sprouts, etc.
    const lower = query.toLowerCase();
    const selfTerms = /\b(sprout|tithonia|swiftaw)\b/i;
    if (selfTerms.test(lower)) return null;

    // ── SPROUT 1.4: Context-aware search threshold ──
    // If we already have decent local knowledge, don't search the web
    if (localConfidence > 0.6) {
      return null; // Trust local knowledge, don't web search
    }

    // Check cache first
    const cacheKey = `${language}:${query.toLowerCase().trim()}`;
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTimeout) {
        return cached.result;
      }
      this.searchCache.delete(cacheKey);
    }

    try {
      // Step 1: Search Wikipedia for relevant articles
      const searchResults = await this.searchWikipedia(query, keywords, language);
      if (!searchResults || searchResults.length === 0) return null;

      // Step 2: Get the summary of the best match
      const summary = await this.getArticleSummary(searchResults[0].title, language);
      if (!summary) return null;

      // Step 3: Extract key facts from the summary
      const facts = this.extractFacts(summary, keywords);
      if (facts.length === 0) return null;

      // Step 4: Synthesize a conversational answer from the facts
      const answer = this.synthesizeAnswer(query, facts, summary.title, language);

      const result = {
        answer,
        facts,
        source: summary.title,
        sourceUrl: summary.url,
        language,
        confidence: this.calculateConfidence(facts, keywords),
        model: 'sprout-1.4'
      };

      // Cache the result
      this.searchCache.set(cacheKey, { result, time: Date.now() });

      return result;
    } catch (e) {
      console.warn('Smart search failed:', e.message);
      return null;
    }
  }

  /**
   * Search Wikipedia for articles matching the query
   */
  async searchWikipedia(query, keywords, language = 'en') {
    const baseUrl = this.WIKI_LANG_APIS[language] || this.WIKI_LANG_APIS.en;
    const searchTerms = this.buildSearchQuery(query, keywords);

    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: searchTerms,
      srlimit: '5',
      format: 'json',
      origin: '*'
    });

    const response = await this.fetchWithRetry(`${baseUrl}/w/api.php?${params}`);
    if (!response) return null;

    const data = await response.json();
    if (!data.query || !data.query.search) return null;

    return data.query.search.map(result => ({
      title: result.title,
      snippet: this.stripHtml(result.snippet),
      wordcount: result.wordcount
    }));
  }

  /**
   * Get a concise summary of a Wikipedia article
   */
  async getArticleSummary(title, language = 'en') {
    const baseUrl = this.WIKI_LANG_APIS[language] || this.WIKI_LANG_APIS.en;
    const encodedTitle = encodeURIComponent(title);

    const response = await this.fetchWithRetry(
      `${baseUrl}/api/rest_v1/page/summary/${encodedTitle}`
    );
    if (!response) return null;

    const data = await response.json();
    if (!data.extract || data.extract.length < 20) return null;

    return {
      title: data.title || title,
      extract: data.extract,
      description: data.description || '',
      url: data.content_urls?.desktop?.page || `${baseUrl}/wiki/${encodedTitle}`
    };
  }

  /**
   * Build an optimized search query from user message and keywords
   */
  buildSearchQuery(query, keywords) {
    // Remove question words and common filler
    let cleaned = query
      .replace(/^(what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|tell me about|explain|define)\s+/i, '')
      .replace(/\b(the|a|an|is|are|of|in|for|to|and|or|but|it|its|this|that)\b/gi, '')
      .replace(/[?.!,;:'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If cleaned query is too short, use keywords
    if (cleaned.length < 3 && keywords.length > 0) {
      cleaned = keywords.slice(0, 4).join(' ');
    }

    return cleaned;
  }

  /**
   * Extract key facts from a Wikipedia summary
   */
  extractFacts(summary, keywords) {
    const text = summary.extract;
    if (!text) return [];

    // Split into sentences
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10)
      .slice(0, 8); // Max 8 sentences

    const facts = [];
    const keywordSet = new Set(keywords.map(k => k.toLowerCase()));

    for (const sentence of sentences) {
      const words = sentence.toLowerCase().split(/\s+/);
      const relevance = words.filter(w => keywordSet.has(w)).length;

      facts.push({
        text: sentence.trim(),
        relevance,
        isDefinition: /^[A-Z].*\b(is|are|was|were|refers to|defined as)\b/.test(sentence)
      });
    }

    // Sort by relevance, but keep first sentence (usually the definition) at top
    const first = facts[0];
    const rest = facts.slice(1).sort((a, b) => b.relevance - a.relevance);

    return [first, ...rest].filter(f => f && f.text.length > 0).slice(0, 5);
  }

  /**
   * Synthesize a conversational answer from extracted facts
   */
  synthesizeAnswer(query, facts, sourceTitle, language = 'en') {
    if (facts.length === 0) return null;

    const templates = this.getAnswerTemplates(language);
    const opener = templates.openers[Math.floor(Math.random() * templates.openers.length)];
    const closer = templates.closers[Math.floor(Math.random() * templates.closers.length)];

    // Use the first fact (usually the definition/intro) as the core
    let coreFact = facts[0].text;

    // Clean up Wikipedia-style writing for conversational tone
    coreFact = this.makeConversational(coreFact);

    // Build the answer
    let answer = `${opener} ${coreFact}`;

    // Add one or two more relevant facts if available
    if (facts.length > 1 && facts[1].relevance > 0) {
      const extraFact = this.makeConversational(facts[1].text);
      answer += ` ${extraFact}`;
    }

    if (facts.length > 2 && facts[2].relevance > 0) {
      const transition = templates.transitions[Math.floor(Math.random() * templates.transitions.length)];
      const extraFact = this.makeConversational(facts[2].text);
      answer += ` ${transition} ${extraFact}`;
    }

    // Add closer
    if (closer) {
      answer += ` ${closer}`;
    }

    return answer.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get answer templates by language
   */
  getAnswerTemplates(language) {
    const templates = {
      en: {
        openers: [
          "Here's what I know —",
          "From what I've gathered,",
          "So,",
          "Here's the deal —",
          "Right, so",
          "Here's a quick rundown —",
          "From what I know,"
        ],
        transitions: [
          "Also,",
          "On top of that,",
          "What's interesting is that",
          "Plus,",
          "And"
        ],
        closers: [
          "",
          "",
          "",
          "",
          "",
          "",
          ""
        ]
      },
      fr: {
        openers: [
          "Voici ce que j'ai trouvé —",
          "Bonne question ! D'après ce que j'ai appris,",
          "J'ai cherché ça pour toi !",
          "Laisse-moi te partager ce que j'ai découvert —",
          "J'ai fait quelques recherches et voici ce que j'ai trouvé :"
        ],
        transitions: [
          "En plus,",
          "De plus,",
          "Ce qui est intéressant, c'est que",
          "Il est aussi bon de savoir que"
        ],
        closers: [
          "Plutôt cool, non ?",
          "J'espère que ça t'aide !",
          "Tu veux en savoir plus ?",
          "Je viens de l'apprendre aussi !",
          ""
        ]
      },
      de: {
        openers: [
          "Hier ist, was ich gefunden habe —",
          "Gute Frage! Was ich gelernt habe:",
          "Ich habe das für dich nachgeschlagen!",
          "Lass mich dir erzählen, was ich entdeckt habe —"
        ],
        transitions: [
          "Außerdem,",
          "Darüber hinaus,",
          "Interessant ist auch, dass",
          "Es ist auch wissenswert, dass"
        ],
        closers: [
          "Ziemlich cool, oder?",
          "Ich hoffe, das hilft!",
          "Willst du mehr darüber wissen?",
          ""
        ]
      },
      es: {
        openers: [
          "Esto es lo que encontré —",
          "¡Buena pregunta! Según lo que aprendí,",
          "¡Busqué esto para ti!",
          "Déjame contarte lo que descubrí —"
        ],
        transitions: [
          "Además,",
          "Aparte de eso,",
          "Lo interesante es que",
          "También vale la pena saber que"
        ],
        closers: [
          "¿Bastante interesante, no?",
          "¡Espero que te ayude!",
          "¿Quieres saber más sobre esto?",
          ""
        ]
      },
      it: {
        openers: [
          "Ecco cosa ho trovato —",
          "Bella domanda! Da quello che ho imparato,",
          "Ho cercato questo per te!",
          "Lascia che ti racconti cosa ho scoperto —"
        ],
        transitions: [
          "Inoltre,",
          "In più,",
          "La cosa interessante è che",
          "Vale anche la pena sapere che"
        ],
        closers: [
          "Piuttosto interessante, no?",
          "Spero che ti sia d'aiuto!",
          "Vuoi saperne di più?",
          ""
        ]
      }
    };

    return templates[language] || templates.en;
  }

  /**
   * Make Wikipedia-style text more conversational
   */
  makeConversational(text) {
    if (!text) return '';

    return text
      // Remove citation brackets [1], [2], etc.
      .replace(/\[\d+\]/g, '')
      // Remove parenthetical birth/death dates
      .replace(/\(\s*born\s+[^)]+\)/gi, '')
      .replace(/\(\s*\d{4}\s*[-–]\s*\d{4}\s*\)/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate confidence based on fact relevance
   */
  calculateConfidence(facts, keywords) {
    if (facts.length === 0) return 0;

    const totalRelevance = facts.reduce((sum, f) => sum + f.relevance, 0);
    const hasDefinition = facts.some(f => f.isDefinition);

    let confidence = 0.4; // Base confidence for web search results
    confidence += Math.min(totalRelevance * 0.05, 0.3);
    if (hasDefinition) confidence += 0.1;
    if (facts.length >= 3) confidence += 0.05;

    return Math.min(confidence, 0.85);
  }

  /**
   * Store learned knowledge in Supabase for future queries
   * SPROUT 1.4: Updated model version
   */
  async storeLearnedKnowledge(question, answer, source, category = 'web-learned') {
    if (!this.db) return;

    try {
      await this.db
        .from('sprout_training_data')
        .insert({
          model: 'sprout-1.4',
          question,
          answer,
          category,
          tags: ['smart-search', 'auto-learned', source].filter(Boolean),
          created_by: 'smart-search',
          active: true,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      console.warn('Failed to store learned knowledge:', e.message);
    }
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
  }

  /**
   * Fetch with retry and timeout
   */
  async fetchWithRetry(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeout);

        if (response.ok) return response;
      } catch (e) {
        if (i === retries) return null;
        // Brief pause before retry
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }
    return null;
  }
}

// Export for use in sprout-engine.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SproutSmartSearch;
}
