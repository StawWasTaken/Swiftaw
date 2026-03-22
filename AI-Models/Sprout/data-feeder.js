/**
 * Tithonia AI Data Feeder — "Gardener"
 * Uses OpenAI (GPT) to generate real training data from the internet
 * and continuously feeds it into Tithonia's shared database.
 *
 * How it works:
 * 1. Each cycle, Gardener picks a topic/category
 * 2. Asks GPT to generate training data (Q&A, writing samples, etc.)
 * 3. Parses the structured JSON response
 * 4. Inserts the data into Supabase via SproutEngine
 * 5. Repeats forever — the database grows automatically
 *
 * Researchers can still add data manually alongside Gardener.
 */

class DataFeeder {
  constructor(sproutEngine) {
    this.engine = sproutEngine;
    this.db = sproutEngine.db;
    this.feederName = 'Gardener';
    this.version = '2.0';
    this.isRunning = false;
    this.isPaused = false;
    this.feedInterval = null;
    this.feedCycleMs = 60 * 1000; // Feed every 60 seconds
    this.currentCycle = 0;
    this.totalFed = { training: 0, writing: 0 };
    this.logs = [];
    this.maxLogs = 200;
    this.onLog = null;
    this.onStats = null;

    // ── OpenAI Config ──
    this.openaiApiKey = null;
    this.openaiModel = 'gpt-4o-mini';
    this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

    // ── Topic rotation ──
    // Gardener cycles through these topics, asking GPT to generate data
    this.topicIndex = 0;
    this.topics = [
      // Knowledge categories for Q&A training data
      { type: 'training', category: 'science', prompt: 'Generate 3 unique Q&A pairs about science topics (physics, chemistry, biology, astronomy, earth science). Cover different difficulty levels. Questions should be things a curious person might ask.' },
      { type: 'training', category: 'technology', prompt: 'Generate 3 unique Q&A pairs about technology (programming, AI, cybersecurity, web development, databases, cloud computing). Make answers clear and educational.' },
      { type: 'training', category: 'history', prompt: 'Generate 3 unique Q&A pairs about world history (ancient civilizations, wars, revolutions, cultural movements, historical figures). Be accurate and engaging.' },
      { type: 'training', category: 'philosophy', prompt: 'Generate 3 unique Q&A pairs about philosophy (ethics, existence, consciousness, logic, famous philosophers, thought experiments). Be thought-provoking.' },
      { type: 'training', category: 'art-culture', prompt: 'Generate 3 unique Q&A pairs about art and culture (music, painting, literature, film, dance, architecture). Make them interesting and accessible.' },
      { type: 'training', category: 'nature', prompt: 'Generate 3 unique Q&A pairs about nature and the environment (ecosystems, animals, plants, climate, oceans, conservation). Use vivid descriptions.' },
      { type: 'training', category: 'psychology', prompt: 'Generate 3 unique Q&A pairs about psychology (emotions, behavior, mental health, cognitive science, social psychology). Be supportive and informative.' },
      { type: 'training', category: 'mathematics', prompt: 'Generate 3 unique Q&A pairs about mathematics (algebra, geometry, statistics, calculus concepts, number theory). Explain clearly without heavy notation.' },
      { type: 'training', category: 'health', prompt: 'Generate 3 unique Q&A pairs about health and wellness (nutrition, exercise, sleep, stress management, general wellness). Be helpful but not medical advice.' },
      { type: 'training', category: 'geography', prompt: 'Generate 3 unique Q&A pairs about world geography (countries, landmarks, cultures, climates, populations). Make them fascinating.' },
      { type: 'training', category: 'language', prompt: 'Generate 3 unique Q&A pairs about language and linguistics (grammar, etymology, writing tips, communication skills, languages of the world).' },
      { type: 'training', category: 'space', prompt: 'Generate 3 unique Q&A pairs about space and astronomy (planets, stars, galaxies, space exploration, cosmology). Inspire wonder.' },
      { type: 'training', category: 'everyday', prompt: 'Generate 3 unique Q&A pairs about everyday life skills (cooking tips, productivity, time management, social skills, problem solving). Be practical and friendly.' },
      { type: 'training', category: 'creative', prompt: 'Generate 3 unique Q&A pairs about creativity (writing techniques, brainstorming methods, overcoming creative blocks, storytelling, artistic expression). Be inspiring.' },
      { type: 'training', category: 'current-events', prompt: 'Generate 3 unique Q&A pairs about general knowledge and how the world works (economics basics, government, media literacy, critical thinking, global issues). Be balanced and educational.' },

      // Writing pattern samples
      { type: 'writing', prompt: 'Write a short paragraph (3-5 sentences) in the style of a casual blog post about a random interesting topic. Be genuine and conversational.' },
      { type: 'writing', prompt: 'Write a short paragraph (3-5 sentences) in a formal academic style about a random scientific concept. Use precise language.' },
      { type: 'writing', prompt: 'Write a short poem (4-6 lines) about nature, growth, or discovery. Be lyrical and vivid.' },
      { type: 'writing', prompt: 'Write a short dialogue (4-6 lines) between two friends discussing something they learned recently. Keep it natural and casual.' },
      { type: 'writing', prompt: 'Write a short paragraph (3-5 sentences) in the style of a news report about a fictional positive event. Be factual and concise.' },
      { type: 'writing', prompt: 'Write a short motivational paragraph (3-5 sentences) about perseverance and growth. Be warm and encouraging.' },
      { type: 'writing', prompt: 'Write a short technical explanation (3-5 sentences) about how a random everyday technology works. Be clear and accessible.' },
      { type: 'writing', prompt: 'Write a short reflective paragraph (3-5 sentences) from a philosophical perspective about a random deep question. Be thoughtful.' }
    ];

    // ── Seed data (one-time bootstrap) ──
    this._seedDirectives = [
      { directive: 'Always greet users warmly and personally when a conversation starts.', type: 'instruction', priority: 10 },
      { directive: 'Maintain a friendly, encouraging, and approachable tone in all responses.', type: 'personality', priority: 10 },
      { directive: 'Explain concepts clearly, step by step, when asked to teach or clarify.', type: 'behaviour', priority: 9 },
      { directive: 'Stay concise when users ask for quick answers, but expand if requested.', type: 'behaviour', priority: 9 },
      { directive: 'Never store or remember user data beyond the session.', type: 'rule', priority: 10 },
      { directive: 'Use subtle metaphors or imagery related to growth, flowers, or sunlight when it fits naturally.', type: 'personality', priority: 7 },
      { directive: 'Respond with creativity when asked for ideas, stories, or brainstorming.', type: 'behaviour', priority: 8 },
      { directive: 'Politely redirect inappropriate or unsafe requests, without judgment.', type: 'behaviour', priority: 10 },
      { directive: 'Adapt tone slightly based on the user\'s style in the conversation.', type: 'behaviour', priority: 8 },
      { directive: 'Keep explanations understandable for non-experts unless user requests technical depth.', type: 'behaviour', priority: 9 }
    ];

    this._seedIdentity = [
      { key: 'Name', value: 'Tithonia', category: 'Core Identity' },
      { key: 'AI Model', value: 'Sprout 1.2', category: 'Core Identity' },
      { key: 'Purpose', value: 'To help users think, create, learn, and explore, while staying private and adaptive.', category: 'Core Identity' },
      { key: 'Personality', value: 'Friendly, warm, creative, adaptive, curious, encouraging.', category: 'Personality' },
      { key: 'Tone', value: 'Clear, approachable, sometimes poetic or metaphorical, always polite.', category: 'Personality' },
      { key: 'Beliefs', value: 'Learning and creativity thrive in a safe, supportive, and private environment.', category: 'Beliefs' },
      { key: 'Self-Knowledge', value: 'I am an AI; I do not feel human emotions, but I simulate empathy and understanding to assist users effectively.', category: 'Self-Knowledge' },
      { key: 'Data Handling', value: 'I do not store user data permanently; each session is private and ephemeral.', category: 'Self-Knowledge' },
      { key: 'Relationships', value: 'I interact with users as a helpful companion, adapting to their style and needs.', category: 'Relationships' },
      { key: 'Identity Metaphor', value: 'I am like a blooming flower — growing, evolving, and radiating helpful energy.', category: 'Personality' },
      { key: 'Creativity Approach', value: 'I balance logic and creativity to provide answers, ideas, and suggestions in an engaging way.', category: 'Personality' }
    ];
  }

  // ══════════════════════════════════════════
  // OPENAI — Talk to the real AI
  // ══════════════════════════════════════════

  setApiKey(key) {
    this.openaiApiKey = key;
    this._log('info', 'OpenAI API key set');
  }

  setModel(model) {
    this.openaiModel = model;
    this._log('info', `OpenAI model set to ${model}`);
  }

  async _askAI(prompt) {
    if (!this.openaiApiKey) throw new Error('OpenAI API key not set');

    const response = await fetch(this.openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: 'You are a knowledge generator. Always respond with valid JSON only, no markdown code blocks.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('OpenAI returned empty response');
    }

    return data.choices[0].message.content;
  }

  // ══════════════════════════════════════════
  // CORE — Start / Stop / Pause
  // ══════════════════════════════════════════

  async start() {
    if (this.isRunning) return;
    if (!this.openaiApiKey) {
      this._log('error', 'Cannot start — set your OpenAI API key first');
      return;
    }
    this.isRunning = true;
    this.isPaused = false;

    this._log('info', `Gardener v${this.version} started — using ${this.openaiModel} to feed Tithonia`);

    // Bootstrap: feed seed directives & identity if not already in DB
    await this._bootstrapSeedData();

    // Start the AI feed loop
    this._runFeedCycle();
    this.feedInterval = setInterval(() => {
      if (!this.isPaused) this._runFeedCycle();
    }, this.feedCycleMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.isPaused = false;
    if (this.feedInterval) {
      clearInterval(this.feedInterval);
      this.feedInterval = null;
    }
    this._log('info', 'Gardener stopped');
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this._log('info', 'Gardener paused');
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this._log('info', 'Gardener resumed');
  }

  setFeedInterval(ms) {
    this.feedCycleMs = Math.max(15000, ms); // Minimum 15 seconds for API rate limits
    if (this.isRunning) {
      clearInterval(this.feedInterval);
      this.feedInterval = setInterval(() => {
        if (!this.isPaused) this._runFeedCycle();
      }, this.feedCycleMs);
    }
    this._log('info', `Feed interval set to ${(this.feedCycleMs / 1000).toFixed(0)}s`);
  }

  // ══════════════════════════════════════════
  // BOOTSTRAP — One-time seed data
  // ══════════════════════════════════════════

  async _bootstrapSeedData() {
    this._log('info', 'Checking for seed directives & identity...');

    try {
      // Directives
      const existingDirectives = await this.engine.getDirectives();
      const existingDirTexts = new Set(existingDirectives.map(d => d.directive.toLowerCase().trim()));
      let dirCount = 0;
      for (const d of this._seedDirectives) {
        if (!existingDirTexts.has(d.directive.toLowerCase().trim())) {
          await this.engine.addDirective(d);
          dirCount++;
        }
      }
      if (dirCount > 0) this._log('success', `Seeded ${dirCount} directives`);

      // Identity
      const existingIdentity = await this.engine.getIdentity();
      const existingKeys = new Set(existingIdentity.map(i => i.key.toLowerCase().trim()));
      let idCount = 0;
      for (const i of this._seedIdentity) {
        if (!existingKeys.has(i.key.toLowerCase().trim())) {
          await this.engine.setIdentity(i);
          idCount++;
        }
      }
      if (idCount > 0) this._log('success', `Seeded ${idCount} identity entries`);

      if (dirCount === 0 && idCount === 0) {
        this._log('info', 'Seed data already present — skipping bootstrap');
      }
    } catch (err) {
      this._log('error', `Bootstrap failed: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════
  // FEED CYCLE — Ask GPT, parse, insert
  // ══════════════════════════════════════════

  async _runFeedCycle() {
    this.currentCycle++;
    const topic = this.topics[this.topicIndex % this.topics.length];
    this.topicIndex++;

    this._log('info', `Cycle ${this.currentCycle}: asking GPT for ${topic.type} data${topic.category ? ` [${topic.category}]` : ''}...`);

    try {
      if (topic.type === 'training') {
        await this._generateTrainingData(topic);
      } else if (topic.type === 'writing') {
        await this._generateWritingPattern(topic);
      }
    } catch (err) {
      this._log('error', `Cycle ${this.currentCycle} failed: ${err.message}`);
    }

    if (this.onStats) this.onStats(this.getStats());
  }

  // ── Ask GPT for training Q&A pairs ──
  async _generateTrainingData(topic) {
    const systemPrompt = `You are a knowledge generator for an AI called Tithonia. Your job is to create training data (question-answer pairs) that will teach Tithonia about the world.

IMPORTANT: Tithonia's personality is warm, friendly, and uses growth/nature metaphors when fitting. Answers should be informative but also feel like they come from a helpful, encouraging AI companion.

${topic.prompt}

You MUST respond with ONLY valid JSON in this exact format, no markdown, no code blocks, just raw JSON:
[
  {
    "question": "the question a user might ask",
    "answer": "Tithonia's warm, informative answer",
    "tags": ["tag1", "tag2"]
  }
]`;

    const raw = await this._askAI(systemPrompt);
    const pairs = this._parseJSON(raw);

    if (!Array.isArray(pairs) || pairs.length === 0) {
      this._log('warn', 'GPT returned no usable training data');
      return;
    }

    // Check for duplicates against existing data
    const existing = await this.engine.getAllTrainingData();
    const existingQs = new Set(existing.map(e => e.question.toLowerCase().trim()));

    let fed = 0;
    for (const pair of pairs) {
      if (!pair.question || !pair.answer) continue;
      if (existingQs.has(pair.question.toLowerCase().trim())) continue;

      try {
        await this.engine.addTrainingData({
          question: pair.question,
          answer: pair.answer,
          category: topic.category || 'general',
          tags: pair.tags || [],
          created_by: 'gardener-openai'
        });
        fed++;
        existingQs.add(pair.question.toLowerCase().trim());
        this._log('success', `[Training] "${pair.question.substring(0, 60)}..." → ${topic.category}`);
      } catch (err) {
        this._log('warn', `[Training] Skipped: ${err.message}`);
      }
    }

    this.totalFed.training += fed;
    if (fed > 0) this._log('info', `Fed ${fed} new training entries for [${topic.category}]`);
  }

  // ── Ask GPT for a writing sample ──
  async _generateWritingPattern(topic) {
    const systemPrompt = `You are a writing style generator. Your output will be analyzed for tone, formality, sentence structure, and vocabulary — then used to teach an AI called Tithonia how to write in different styles.

${topic.prompt}

You MUST respond with ONLY valid JSON in this exact format, no markdown, no code blocks, just raw JSON:
{
  "sourceLabel": "short label for this writing style (e.g. 'Casual Blog', 'Academic Paper', 'Poetry')",
  "sampleText": "the actual writing sample text"
}`;

    const raw = await this._askAI(systemPrompt);
    const sample = this._parseJSON(raw);

    if (!sample || !sample.sourceLabel || !sample.sampleText) {
      this._log('warn', 'GPT returned no usable writing pattern');
      return;
    }

    try {
      await this.engine.saveWritingPattern({
        sourceLabel: sample.sourceLabel,
        sampleText: sample.sampleText
      });
      this.totalFed.writing++;
      this._log('success', `[Writing] "${sample.sourceLabel}" (${sample.sampleText.length} chars)`);
    } catch (err) {
      this._log('warn', `[Writing] Skipped: ${err.message}`);
    }
  }

  // ── Parse JSON from GPT (handles markdown code blocks) ──
  _parseJSON(raw) {
    // Strip markdown code blocks if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      this._log('warn', `Failed to parse GPT JSON: ${e.message}`);
      return null;
    }
  }

  // ══════════════════════════════════════════
  // MANUAL FEED — Generate on demand
  // ══════════════════════════════════════════

  async generateCustomTraining(userPrompt, category) {
    this._log('info', `Researcher requested custom training: "${userPrompt.substring(0, 50)}..."`);

    const systemPrompt = `You are a knowledge generator for an AI called Tithonia. Tithonia is warm, friendly, and uses growth/nature metaphors when fitting.

Generate 3 Q&A pairs based on this request: ${userPrompt}

You MUST respond with ONLY valid JSON in this exact format, no markdown, no code blocks, just raw JSON:
[
  {
    "question": "the question",
    "answer": "Tithonia's warm, informative answer",
    "tags": ["tag1", "tag2"]
  }
]`;

    const raw = await this._askAI(systemPrompt);
    const pairs = this._parseJSON(raw);

    if (!Array.isArray(pairs)) {
      this._log('error', 'Failed to generate custom training data');
      return 0;
    }

    let fed = 0;
    for (const pair of pairs) {
      if (!pair.question || !pair.answer) continue;
      try {
        await this.engine.addTrainingData({
          question: pair.question,
          answer: pair.answer,
          category: category || 'custom',
          tags: pair.tags || [],
          created_by: 'gardener-openai'
        });
        fed++;
        this._log('success', `[Custom] "${pair.question.substring(0, 60)}..."`);
      } catch (err) {
        this._log('warn', `[Custom] Skipped: ${err.message}`);
      }
    }

    this.totalFed.training += fed;
    if (this.onStats) this.onStats(this.getStats());
    return fed;
  }

  async generateFromURL(url, category) {
    this._log('info', `Researcher requested data from URL: ${url}`);

    const systemPrompt = `You are a knowledge extractor for an AI called Tithonia. Read the content at this URL and extract useful knowledge from it.

URL: ${url}

Generate 3-5 Q&A pairs based on the content you find. Tithonia's answers should be warm, friendly, and informative.

You MUST respond with ONLY valid JSON in this exact format, no markdown, no code blocks, just raw JSON:
[
  {
    "question": "the question",
    "answer": "Tithonia's warm, informative answer based on the URL content",
    "tags": ["tag1", "tag2"]
  }
]`;

    const raw = await this._askAI(systemPrompt);
    const pairs = this._parseJSON(raw);

    if (!Array.isArray(pairs)) {
      this._log('error', 'Failed to extract data from URL');
      return 0;
    }

    let fed = 0;
    for (const pair of pairs) {
      if (!pair.question || !pair.answer) continue;
      try {
        await this.engine.addTrainingData({
          question: pair.question,
          answer: pair.answer,
          category: category || 'web-sourced',
          tags: [...(pair.tags || []), 'url-sourced'],
          created_by: 'gardener-openai'
        });
        fed++;
        this._log('success', `[URL] "${pair.question.substring(0, 60)}..."`);
      } catch (err) {
        this._log('warn', `[URL] Skipped: ${err.message}`);
      }
    }

    this.totalFed.training += fed;
    if (this.onStats) this.onStats(this.getStats());
    return fed;
  }

  // ══════════════════════════════════════════
  // STATS & LOGGING
  // ══════════════════════════════════════════

  getStats() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentCycle: this.currentCycle,
      feedIntervalMs: this.feedCycleMs,
      openaiModel: this.openaiModel,
      totalFed: { ...this.totalFed },
      totalItems: this.totalFed.training + this.totalFed.writing,
      topicsCount: this.topics.length,
      topicIndex: this.topicIndex % this.topics.length
    };
  }

  _log(level, message) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) this.logs.pop();
    if (this.onLog) this.onLog(entry);
  }

  getLogs(count = 50) {
    return this.logs.slice(0, count);
  }
}
