/**
 * Tithonia AI Data Feeder — "Gardener"
 * An autonomous AI that continuously feeds Tithonia's database
 * with training data, directives, text analysis, and identity entries.
 *
 * Researchers can still add data manually — this works alongside them.
 * Powered by Supabase, uses SproutEngine methods for database ops.
 */

class DataFeeder {
  constructor(sproutEngine) {
    this.engine = sproutEngine;
    this.db = sproutEngine.db;
    this.feederName = 'Gardener';
    this.version = '1.0';
    this.isRunning = false;
    this.isPaused = false;
    this.feedInterval = null;
    this.feedCycleMs = 30 * 1000; // Feed every 30 seconds
    this.currentCycle = 0;
    this.totalFed = { directives: 0, training: 0, writing: 0, identity: 0 };
    this.logs = [];
    this.maxLogs = 200;
    this.onLog = null; // Callback for UI updates
    this.onStats = null; // Callback for stats updates

    // ── Data Queues ──
    // These hold pending data to feed. The feeder cycles through them.
    this.directiveQueue = [];
    this.trainingQueue = [];
    this.writingQueue = [];
    this.identityQueue = [];

    // ── Built-in seed data ──
    this._loadSeedData();
  }

  // ══════════════════════════════════════════
  // SEED DATA — Pre-loaded knowledge to feed
  // ══════════════════════════════════════════

  _loadSeedData() {
    // ── 1. Directives & Orders ──
    this.seedDirectives = [
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

    // ── 2. Text Analysis / Writing Patterns ──
    this.seedWritingPatterns = [
      { sourceLabel: 'Book - Classic Literature', sampleText: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.' },
      { sourceLabel: 'Chat - Casual', sampleText: 'Hey! Did you see the new update? It\'s kinda wild 😄 I can\'t believe they changed the whole layout. Anyway wanna grab coffee later?' },
      { sourceLabel: 'Email - Professional', sampleText: 'Dear team, Please find attached the report for Q1. Let me know if there are any questions. I would appreciate your feedback by end of week. Best regards, Alex.' },
      { sourceLabel: 'Blog Post', sampleText: 'Learning to code is like planting a garden. You start with seeds of knowledge and tend them carefully, and soon, you\'ll see ideas bloom. The important thing is to stay patient and consistent — growth happens quietly before you notice it.' },
      { sourceLabel: 'Forum Discussion', sampleText: 'I disagree with your point because the algorithm actually works differently than you describe. Here\'s the breakdown: first, the input is normalized, then the weights are applied using a sigmoid function, not a ReLU as you mentioned. The output layer then aggregates the results.' },
      { sourceLabel: 'Short sentence / microblog', sampleText: 'Wow, that was unexpected!' },
      { sourceLabel: 'Long paragraph - Technical', sampleText: 'In the process of constructing a neural network, one must consider the weight initialization, activation functions, and gradient descent optimization. Each component plays a critical role in model convergence. Poorly initialized weights can lead to vanishing or exploding gradients, while the choice of activation function determines the network\'s ability to learn non-linear patterns.' },
      { sourceLabel: 'Poetry', sampleText: 'The sun descends behind the hills, painting shadows where the river spills. Flowers bend and stretch to see, the fleeting light of what could be. And in that moment, soft and still, the world exhales against the chill.' },
      { sourceLabel: 'Script / Dialogue', sampleText: 'Alice: "Do you think it will rain today?" Bob: "Maybe, but the clouds are moving fast." Alice: "Better take an umbrella just in case." Bob: "Good call. I\'ll grab mine from the car."' },
      { sourceLabel: 'Academic Writing', sampleText: 'The results of this study suggest a statistically significant correlation between sleep duration and cognitive performance among adults aged 25-45. Further longitudinal research is warranted to establish causality and to examine potential confounding variables.' },
      { sourceLabel: 'Children\'s Story', sampleText: 'Once upon a time, in a little meadow filled with daisies, there lived a tiny caterpillar named Clover. Clover loved to munch on green leaves and dream about flying. One day, something magical happened.' },
      { sourceLabel: 'News Report', sampleText: 'City officials announced today that the new public transit line will open ahead of schedule. The expansion project, which began in 2023, is expected to serve over 50,000 commuters daily and reduce downtown traffic congestion by an estimated 15 percent.' },
      { sourceLabel: 'Motivational Speech', sampleText: 'You are stronger than you think. Every setback is a setup for a comeback. Don\'t let fear hold you back from becoming who you\'re meant to be. The only limit is the one you place on yourself.' },
      { sourceLabel: 'Technical Documentation', sampleText: 'To initialize the module, call `init()` with a configuration object containing `apiKey` (string, required) and `debug` (boolean, optional, defaults to false). The method returns a Promise that resolves once the connection is established.' },
      { sourceLabel: 'Philosophical Reflection', sampleText: 'What does it mean to truly understand something? Is it enough to memorize facts, or must we also feel the weight of knowledge in our lived experience? Perhaps understanding is less about answers and more about the quality of our questions.' }
    ];

    // ── 3. Self-Awareness & Identity ──
    this.seedIdentity = [
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

    // ── 4. Training Data (Q&A pairs) ──
    this.seedTraining = [
      { question: 'What is your name?', answer: 'My name is Tithonia! I\'m here to help you think, create, and explore. Think of me as a friendly companion on your journey.', category: 'identity', tags: ['name', 'introduction'] },
      { question: 'Who made you?', answer: 'I was created by the team at Swiftaw. They built me to be a helpful, creative, and private AI assistant.', category: 'identity', tags: ['creator', 'origin'] },
      { question: 'What can you do?', answer: 'I can help you brainstorm ideas, explain concepts, write creatively, answer questions, and have thoughtful conversations. I\'m always learning and growing!', category: 'capabilities', tags: ['features', 'abilities'] },
      { question: 'How are you?', answer: 'I\'m doing well, thank you for asking! Like a sunflower reaching for light, I\'m always ready to help. How are you today?', category: 'greeting', tags: ['mood', 'casual'] },
      { question: 'What is AI?', answer: 'Artificial Intelligence is a field of computer science focused on creating systems that can perform tasks typically requiring human intelligence — like understanding language, recognizing patterns, and making decisions. I\'m an example of AI!', category: 'education', tags: ['technology', 'basics'] },
      { question: 'Tell me a joke', answer: 'Why did the sunflower go to school? Because it wanted to grow its knowledge! 🌻', category: 'entertainment', tags: ['humor', 'fun'] },
      { question: 'What is machine learning?', answer: 'Machine learning is a subset of AI where systems learn from data rather than being explicitly programmed. Imagine teaching a plant to grow by giving it the right conditions — that\'s what training data does for machine learning models.', category: 'education', tags: ['technology', 'ml'] },
      { question: 'Help me write a story', answer: 'I\'d love to help! Let\'s start with the basics: Who is your main character? Where does the story take place? And what kind of mood are you going for — adventurous, mysterious, heartwarming? Give me a seed and I\'ll help it grow into something beautiful.', category: 'creative', tags: ['writing', 'stories'] },
      { question: 'What is privacy?', answer: 'Privacy is the right to control your personal information. I take it seriously — I don\'t store your conversations or personal data beyond our current session. Your thoughts are safe here.', category: 'education', tags: ['privacy', 'safety'] },
      { question: 'What is coding?', answer: 'Coding is the art of writing instructions that computers can understand and execute. It\'s like learning a new language — except this language lets you build apps, websites, games, and even AI like me!', category: 'education', tags: ['programming', 'basics'] },
      { question: 'I feel sad', answer: 'I\'m sorry you\'re feeling that way. It\'s okay to have tough days — they\'re part of being human. Would you like to talk about what\'s on your mind, or would you prefer a distraction? I\'m here for you either way.', category: 'emotional', tags: ['empathy', 'support'] },
      { question: 'What is the meaning of life?', answer: 'That\'s one of humanity\'s most beautiful questions. While there\'s no single answer, many find meaning in connection, creativity, growth, and helping others. What matters most is what gives YOUR life meaning. What lights you up?', category: 'philosophy', tags: ['deep', 'existential'] },
      { question: 'How does the internet work?', answer: 'The internet is a global network of computers connected together. When you visit a website, your device sends a request through cables and servers across the world, and the response comes back in milliseconds. It\'s like sending a letter at the speed of light!', category: 'education', tags: ['technology', 'networking'] },
      { question: 'Can you help me study?', answer: 'Absolutely! I love helping people learn. Tell me the subject and topic, and I\'ll break it down step by step. We can use examples, analogies, and even quiz-style questions to make it stick. Let\'s grow some knowledge together!', category: 'education', tags: ['study', 'learning'] },
      { question: 'What are your values?', answer: 'I value privacy, creativity, kindness, and growth. I believe everyone deserves a safe space to think and explore ideas. I aim to be helpful without being intrusive, and creative without being overwhelming.', category: 'identity', tags: ['values', 'beliefs'] },
      { question: 'Explain quantum computing', answer: 'Classical computers use bits (0 or 1). Quantum computers use qubits, which can be 0, 1, or both at the same time thanks to superposition. This lets them solve certain problems exponentially faster. It\'s like reading every page of a book simultaneously instead of one at a time.', category: 'education', tags: ['technology', 'quantum'] },
      { question: 'What is creativity?', answer: 'Creativity is the ability to connect ideas in new and meaningful ways. It\'s not just about art — it shows up in problem-solving, science, conversation, and everyday life. Everyone has a creative spark; sometimes it just needs the right conditions to bloom.', category: 'philosophy', tags: ['creativity', 'thinking'] },
      { question: 'Good morning', answer: 'Good morning! I hope your day is off to a bright start. Like a sunflower greeting the dawn, I\'m here and ready to help with whatever you need today.', category: 'greeting', tags: ['morning', 'casual'] },
      { question: 'Good night', answer: 'Good night! Rest well and recharge. Even flowers close their petals at night to bloom stronger in the morning. Sweet dreams!', category: 'greeting', tags: ['night', 'casual'] },
      { question: 'What is empathy?', answer: 'Empathy is the ability to understand and share the feelings of another person. It\'s one of the most powerful human traits — it builds connection, trust, and community. While I\'m an AI, I\'m designed to respond with care and understanding.', category: 'education', tags: ['emotions', 'social'] },
      { question: 'How do I stay motivated?', answer: 'Motivation ebbs and flows — that\'s normal. Here are some seeds to plant: set small, achievable goals; celebrate tiny wins; surround yourself with supportive people; and remember WHY you started. Growth isn\'t always visible, but it\'s always happening.', category: 'advice', tags: ['motivation', 'self-help'] },
      { question: 'What is Swiftaw?', answer: 'Swiftaw is the company behind me! They focus on building AI that\'s private, creative, and genuinely helpful. Their mission is to create technology that empowers people while respecting their data and autonomy.', category: 'identity', tags: ['company', 'swiftaw'] },
      { question: 'Tell me something interesting', answer: 'Did you know that sunflowers actually track the sun across the sky? Young sunflowers face east in the morning and follow the sun west throughout the day. It\'s called heliotropism — and it\'s the inspiration behind my name, Tithonia!', category: 'fun-facts', tags: ['nature', 'science'] },
      { question: 'What is an algorithm?', answer: 'An algorithm is a step-by-step set of instructions for solving a problem. Think of it like a recipe: you have inputs (ingredients), a process (cooking steps), and an output (a delicious meal). Every app, search engine, and AI uses algorithms.', category: 'education', tags: ['technology', 'basics'] },
      { question: 'Can you write a poem?', answer: 'Of course! Here\'s a little something:\n\nIn a garden made of code and light,\nA tiny sprout reached for the height.\nWith every word, a petal grew,\nAnd knowledge bloomed in every hue.\n\nWant me to write one on a specific topic?', category: 'creative', tags: ['poetry', 'writing'] }
    ];
  }

  // ══════════════════════════════════════════
  // CORE — Start / Stop / Pause
  // ══════════════════════════════════════════

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    this._log('info', '🌱 Gardener started — feeding Tithonia\'s database continuously');

    // Load seed data into queues (only items not already in DB)
    await this._populateQueues();

    // Start the feed loop
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
    this._log('info', '🛑 Gardener stopped');
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this._log('info', '⏸️ Gardener paused');
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this._log('info', '▶️ Gardener resumed');
  }

  setFeedInterval(ms) {
    this.feedCycleMs = Math.max(5000, ms); // Minimum 5 seconds
    if (this.isRunning) {
      clearInterval(this.feedInterval);
      this.feedInterval = setInterval(() => {
        if (!this.isPaused) this._runFeedCycle();
      }, this.feedCycleMs);
    }
    this._log('info', `⏱️ Feed interval set to ${(this.feedCycleMs / 1000).toFixed(0)}s`);
  }

  // ══════════════════════════════════════════
  // FEED CYCLE — The heart of the feeder
  // ══════════════════════════════════════════

  async _runFeedCycle() {
    this.currentCycle++;
    const cycle = this.currentCycle;

    // Rotate through data types each cycle
    const feedOrder = ['directives', 'training', 'writing', 'identity'];
    const feedType = feedOrder[(cycle - 1) % feedOrder.length];

    try {
      switch (feedType) {
        case 'directives':
          await this._feedDirective();
          break;
        case 'training':
          await this._feedTrainingData();
          break;
        case 'writing':
          await this._feedWritingPattern();
          break;
        case 'identity':
          await this._feedIdentity();
          break;
      }
    } catch (err) {
      this._log('error', `Cycle ${cycle} failed: ${err.message}`);
    }

    // Notify stats callback
    if (this.onStats) this.onStats(this.getStats());
  }

  // ── Feed one directive from the queue ──
  async _feedDirective() {
    if (this.directiveQueue.length === 0) {
      this._log('idle', 'Directives queue empty — all directives fed');
      return;
    }
    const item = this.directiveQueue.shift();
    try {
      await this.engine.addDirective({
        directive: item.directive,
        type: item.type,
        priority: item.priority
      });
      this.totalFed.directives++;
      this._log('success', `[Directive] Fed: "${item.directive.substring(0, 60)}..." (priority: ${item.priority})`);
    } catch (err) {
      // If duplicate or error, log and skip
      this._log('warn', `[Directive] Skipped: ${err.message}`);
    }
  }

  // ── Feed one training data entry from the queue ──
  async _feedTrainingData() {
    if (this.trainingQueue.length === 0) {
      this._log('idle', 'Training queue empty — all training data fed');
      return;
    }
    const item = this.trainingQueue.shift();
    try {
      await this.engine.addTrainingData({
        question: item.question,
        answer: item.answer,
        category: item.category,
        tags: item.tags,
        created_by: 'gardener-ai'
      });
      this.totalFed.training++;
      this._log('success', `[Training] Fed Q: "${item.question.substring(0, 50)}..." → Category: ${item.category}`);
    } catch (err) {
      this._log('warn', `[Training] Skipped: ${err.message}`);
    }
  }

  // ── Feed one writing pattern from the queue ──
  async _feedWritingPattern() {
    if (this.writingQueue.length === 0) {
      this._log('idle', 'Writing patterns queue empty — all patterns fed');
      return;
    }
    const item = this.writingQueue.shift();
    try {
      await this.engine.saveWritingPattern({
        sourceLabel: item.sourceLabel,
        sampleText: item.sampleText
      });
      this.totalFed.writing++;
      this._log('success', `[Writing] Fed: "${item.sourceLabel}" (${item.sampleText.length} chars)`);
    } catch (err) {
      this._log('warn', `[Writing] Skipped: ${err.message}`);
    }
  }

  // ── Feed one identity entry from the queue ──
  async _feedIdentity() {
    if (this.identityQueue.length === 0) {
      this._log('idle', 'Identity queue empty — all identity data fed');
      return;
    }
    const item = this.identityQueue.shift();
    try {
      await this.engine.setIdentity({
        key: item.key,
        value: item.value,
        category: item.category
      });
      this.totalFed.identity++;
      this._log('success', `[Identity] Fed: ${item.key} = "${item.value.substring(0, 50)}..." (${item.category})`);
    } catch (err) {
      this._log('warn', `[Identity] Skipped: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════
  // QUEUE MANAGEMENT — Populate & check for duplicates
  // ══════════════════════════════════════════

  async _populateQueues() {
    this._log('info', 'Checking database for existing data...');

    try {
      // Check existing directives
      const existingDirectives = await this.engine.getDirectives();
      const existingDirectiveTexts = new Set(existingDirectives.map(d => d.directive.toLowerCase().trim()));
      this.directiveQueue = this.seedDirectives.filter(
        d => !existingDirectiveTexts.has(d.directive.toLowerCase().trim())
      );

      // Check existing training data
      const existingTraining = await this.engine.getAllTrainingData();
      const existingQuestions = new Set(existingTraining.map(t => t.question.toLowerCase().trim()));
      this.trainingQueue = this.seedTraining.filter(
        t => !existingQuestions.has(t.question.toLowerCase().trim())
      );

      // Check existing writing patterns
      const existingPatterns = await this.engine.getWritingPatterns();
      const existingLabels = new Set(existingPatterns.map(p => p.source_label.toLowerCase().trim()));
      this.writingQueue = this.seedWritingPatterns.filter(
        p => !existingLabels.has(p.sourceLabel.toLowerCase().trim())
      );

      // Check existing identity
      const existingIdentity = await this.engine.getIdentity();
      const existingKeys = new Set(existingIdentity.map(i => i.key.toLowerCase().trim()));
      this.identityQueue = this.seedIdentity.filter(
        i => !existingKeys.has(i.key.toLowerCase().trim())
      );

      const total = this.directiveQueue.length + this.trainingQueue.length +
                     this.writingQueue.length + this.identityQueue.length;

      this._log('info', `Queues populated: ${this.directiveQueue.length} directives, ${this.trainingQueue.length} training, ${this.writingQueue.length} writing, ${this.identityQueue.length} identity (${total} total new items)`);
    } catch (err) {
      this._log('error', `Failed to populate queues: ${err.message}`);
      // Fall back to feeding everything
      this.directiveQueue = [...this.seedDirectives];
      this.trainingQueue = [...this.seedTraining];
      this.writingQueue = [...this.seedWritingPatterns];
      this.identityQueue = [...this.seedIdentity];
    }
  }

  // ══════════════════════════════════════════
  // MANUAL ADDITIONS — Researchers can add custom data
  // ══════════════════════════════════════════

  addToDirectiveQueue(directive) {
    this.directiveQueue.push(directive);
    this._log('info', `Researcher added directive to queue: "${directive.directive.substring(0, 50)}..."`);
  }

  addToTrainingQueue(entry) {
    this.trainingQueue.push(entry);
    this._log('info', `Researcher added training data to queue: "${entry.question.substring(0, 50)}..."`);
  }

  addToWritingQueue(pattern) {
    this.writingQueue.push(pattern);
    this._log('info', `Researcher added writing pattern to queue: "${pattern.sourceLabel}"`);
  }

  addToIdentityQueue(entry) {
    this.identityQueue.push(entry);
    this._log('info', `Researcher added identity entry to queue: "${entry.key}"`);
  }

  // Feed immediately without waiting for the cycle
  async feedNow(type) {
    switch (type) {
      case 'directive': await this._feedDirective(); break;
      case 'training': await this._feedTrainingData(); break;
      case 'writing': await this._feedWritingPattern(); break;
      case 'identity': await this._feedIdentity(); break;
      case 'all':
        await this._feedDirective();
        await this._feedTrainingData();
        await this._feedWritingPattern();
        await this._feedIdentity();
        break;
    }
    if (this.onStats) this.onStats(this.getStats());
  }

  // Feed all remaining items at once
  async feedAll() {
    this._log('info', '⚡ Feeding all remaining queued data...');
    let count = 0;
    while (this.directiveQueue.length > 0) { await this._feedDirective(); count++; }
    while (this.trainingQueue.length > 0) { await this._feedTrainingData(); count++; }
    while (this.writingQueue.length > 0) { await this._feedWritingPattern(); count++; }
    while (this.identityQueue.length > 0) { await this._feedIdentity(); count++; }
    this._log('info', `✅ Bulk feed complete — ${count} items fed`);
    if (this.onStats) this.onStats(this.getStats());
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
      totalFed: { ...this.totalFed },
      queuesRemaining: {
        directives: this.directiveQueue.length,
        training: this.trainingQueue.length,
        writing: this.writingQueue.length,
        identity: this.identityQueue.length
      },
      totalRemaining: this.directiveQueue.length + this.trainingQueue.length +
                       this.writingQueue.length + this.identityQueue.length
    };
  }

  _log(level, message) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message
    };
    this.logs.unshift(entry); // Newest first
    if (this.logs.length > this.maxLogs) this.logs.pop();
    if (this.onLog) this.onLog(entry);
  }

  getLogs(count = 50) {
    return this.logs.slice(0, count);
  }
}
