/**
 * Tithonia Self-Learner — "Cortex"
 * The autonomous brain that makes Tithonia think, learn, and evolve.
 *
 * What it does:
 * 1. CROSS-REFERENCES knowledge — finds connections between what it already knows
 * 2. IDENTIFIES GAPS — realizes what it doesn't know yet
 * 3. STRENGTHENS knowledge — reinforces concepts it encounters repeatedly
 * 4. GENERATES INSIGHTS — creates new knowledge by combining existing facts
 * 5. SELF-REFLECTS — writes its own thoughts about what it's learning
 * 6. EVOLVES — upgrades its own directives and identity based on growth
 *
 * Runs autonomously on a cycle. No external API needed.
 */

class SelfLearner {
  constructor(sproutEngine) {
    this.engine = sproutEngine;
    this.db = sproutEngine.db;
    this.name = 'Cortex';
    this.version = '1.0';
    this.isRunning = false;
    this.isPaused = false;
    this.cycleInterval = null;
    this.cycleDurationMs = 90 * 1000; // Think every 90 seconds
    this.currentCycle = 0;
    this.logs = [];
    this.maxLogs = 200;
    this.onLog = null;
    this.onStats = null;
    this.onThought = null; // Callback when Cortex has a new thought

    // ── Learning stats ──
    this.stats = {
      crossReferences: 0,
      gapsIdentified: 0,
      insightsGenerated: 0,
      connectionsStrengthened: 0,
      conversationsReviewed: 0,
      reflectionsWritten: 0,
      selfUpgrades: 0
    };

    // ── Thinking state ──
    this.knowledgeSnapshot = null; // Cached snapshot of all knowledge
    this.snapshotAge = 0;
    this.snapshotMaxAge = 5 * 60 * 1000; // Refresh every 5 min

    // ── Learning phases (cycles through these) ──
    this.phases = [
      'cross_reference',     // Find connections between existing knowledge
      'gap_analysis',        // Identify what's missing
      'insight_generation',  // Combine facts to create new understanding
      'strength_analysis',   // Find and reinforce strong knowledge areas
      'conversation_review', // Learn from real user conversations
      'self_reflection',     // Think about its own growth
      'self_upgrade'         // Evolve its own directives based on learning
    ];
    this.phaseIndex = 0;
  }

  // ══════════════════════════════════════════
  // START / STOP / PAUSE
  // ══════════════════════════════════════════

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    this._log('info', `Cortex v${this.version} activated — Tithonia is now thinking autonomously`);

    // Run first cycle immediately
    this._runThinkCycle();
    this.cycleInterval = setInterval(() => {
      if (!this.isPaused) this._runThinkCycle();
    }, this.cycleDurationMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.isPaused = false;
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }
    this._log('info', 'Cortex deactivated');
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this._log('info', 'Cortex paused — thinking suspended');
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this._log('info', 'Cortex resumed — thinking continues');
  }

  setThinkInterval(ms) {
    this.cycleDurationMs = Math.max(30000, ms); // Min 30 seconds
    if (this.isRunning) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = setInterval(() => {
        if (!this.isPaused) this._runThinkCycle();
      }, this.cycleDurationMs);
    }
    this._log('info', `Think interval set to ${(this.cycleDurationMs / 1000).toFixed(0)}s`);
  }

  // ══════════════════════════════════════════
  // CORE — The thinking cycle
  // ══════════════════════════════════════════

  async _runThinkCycle() {
    this.currentCycle++;
    const phase = this.phases[this.phaseIndex % this.phases.length];
    this.phaseIndex++;

    this._log('info', `Cycle ${this.currentCycle}: entering "${phase}" phase...`);

    try {
      // Refresh knowledge snapshot if stale
      await this._refreshSnapshot();

      switch (phase) {
        case 'cross_reference':
          await this._crossReference();
          break;
        case 'gap_analysis':
          await this._analyzeGaps();
          break;
        case 'insight_generation':
          await this._generateInsights();
          break;
        case 'strength_analysis':
          await this._analyzeStrengths();
          break;
        case 'conversation_review':
          await this._reviewConversations();
          break;
        case 'self_reflection':
          await this._selfReflect();
          break;
        case 'self_upgrade':
          await this._selfUpgrade();
          break;
      }
    } catch (err) {
      this._log('error', `Cycle ${this.currentCycle} failed: ${err.message}`);
    }

    if (this.onStats) this.onStats(this.getStats());
  }

  // ══════════════════════════════════════════
  // KNOWLEDGE SNAPSHOT — Load all knowledge
  // ══════════════════════════════════════════

  async _refreshSnapshot() {
    if (this.knowledgeSnapshot && (Date.now() - this.snapshotAge) < this.snapshotMaxAge) return;

    const [training, knowledge, reflections, identity, directives] = await Promise.all([
      this.engine.getAllTrainingData().catch(() => []),
      this._getKnowledgeGraph().catch(() => []),
      this._getReflections().catch(() => []),
      this.engine.getIdentity().catch(() => []),
      this.engine.getDirectives().catch(() => [])
    ]);

    this.knowledgeSnapshot = { training, knowledge, reflections, identity, directives };
    this.snapshotAge = Date.now();
  }

  async _getKnowledgeGraph() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
      .select('*')
      .eq('model', 'sprout-1.3')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  }

  async _getReflections(unresolvedOnly = false) {
    let query = this.db
      .from(SPROUT_TABLES.SELF_REFLECTIONS)
      .select('*')
      .eq('model', 'sprout-1.3')
      .order('created_at', { ascending: false })
      .limit(100);

    if (unresolvedOnly) {
      query = query.eq('resolved', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async _getLearningLog(limit = 50) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.LEARNING_LOG)
      .select('*')
      .eq('model', 'sprout-1.3')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  // ══════════════════════════════════════════
  // PHASE 1: CROSS-REFERENCE
  // Find hidden connections between knowledge
  // ══════════════════════════════════════════

  async _crossReference() {
    const { training, knowledge } = this.knowledgeSnapshot;
    if (training.length < 5) {
      this._log('info', 'Not enough training data to cross-reference yet');
      return;
    }

    let newConnections = 0;
    const existingPairs = new Set(
      knowledge.map(k => `${k.concept}|${k.related_concept}`)
    );

    // Find training entries that share keywords but aren't connected yet
    const normalized = training.map(t => ({
      ...t,
      keywords: this.engine.extractKeywords(this.engine.normalize(t.question + ' ' + t.answer))
    }));

    // Compare pairs
    const maxComparisons = Math.min(normalized.length, 30);
    for (let i = 0; i < maxComparisons; i++) {
      for (let j = i + 1; j < maxComparisons; j++) {
        const a = normalized[i];
        const b = normalized[j];

        // Same category? Already likely connected
        if (a.category === b.category) continue;

        // Find shared keywords
        const shared = a.keywords.filter(k => b.keywords.includes(k));
        if (shared.length < 2) continue;

        // This is a cross-domain connection!
        const concept = shared[0];
        const related = shared[1] || a.category;
        const pairKey = `${concept}|${related}`;

        if (existingPairs.has(pairKey)) continue;
        existingPairs.add(pairKey);

        try {
          await this.db
            .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
            .insert({
              model: 'sprout-1.3',
              concept,
              related_concept: related,
              relationship: 'cross_domain',
              strength: Math.min(0.9, shared.length * 0.2),
              source_text: `Cross-reference: "${a.question}" ↔ "${b.question}" (shared: ${shared.join(', ')})`,
              category: 'cross-reference',
              active: true,
              created_at: new Date().toISOString()
            });
          newConnections++;
        } catch (e) { /* skip */ }
      }
    }

    if (newConnections > 0) {
      this.stats.crossReferences += newConnections;
      this._log('success', `Found ${newConnections} new cross-domain connections`);

      await this._logLearning('cross_reference',
        `Discovered ${newConnections} hidden connections between different knowledge areas`,
        { connectionsFound: newConnections }
      );
    } else {
      this._log('info', 'No new cross-references found this cycle');
    }
  }

  // ══════════════════════════════════════════
  // PHASE 2: GAP ANALYSIS
  // Figure out what Tithonia doesn't know
  // ══════════════════════════════════════════

  async _analyzeGaps() {
    const { training, knowledge } = this.knowledgeSnapshot;

    // Count entries per category
    const categoryCounts = {};
    for (const entry of training) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    }

    // Expected categories
    const allCategories = [
      'science', 'technology', 'history', 'philosophy', 'art-culture',
      'nature', 'psychology', 'mathematics', 'health', 'geography',
      'language', 'space', 'everyday', 'creative', 'current-events'
    ];

    const gaps = [];
    const avgCount = training.length / Math.max(Object.keys(categoryCounts).length, 1);

    for (const cat of allCategories) {
      const count = categoryCounts[cat] || 0;
      if (count === 0) {
        gaps.push({ category: cat, severity: 'critical', count: 0, message: `I have no knowledge about ${cat} at all` });
      } else if (count < avgCount * 0.3) {
        gaps.push({ category: cat, severity: 'weak', count, message: `My ${cat} knowledge is thin (only ${count} entries)` });
      }
    }

    // Check for isolated concepts (in knowledge graph but with few connections)
    const conceptConnections = {};
    for (const k of knowledge) {
      conceptConnections[k.concept] = (conceptConnections[k.concept] || 0) + 1;
      if (k.related_concept) {
        conceptConnections[k.related_concept] = (conceptConnections[k.related_concept] || 0) + 1;
      }
    }

    const isolatedConcepts = Object.entries(conceptConnections)
      .filter(([_, count]) => count === 1)
      .map(([concept]) => concept)
      .slice(0, 5);

    if (isolatedConcepts.length > 0) {
      gaps.push({
        category: 'connections',
        severity: 'moderate',
        count: isolatedConcepts.length,
        message: `These concepts are isolated (need more connections): ${isolatedConcepts.join(', ')}`
      });
    }

    // Store gaps as reflections
    let gapsStored = 0;
    for (const gap of gaps) {
      try {
        await this.db
          .from(SPROUT_TABLES.SELF_REFLECTIONS)
          .insert({
            model: 'sprout-1.3',
            reflection_type: 'gap_analysis',
            content: gap.message,
            priority: gap.severity === 'critical' ? 10 : gap.severity === 'weak' ? 5 : 3,
            resolved: false,
            created_at: new Date().toISOString()
          });
        gapsStored++;
      } catch (e) { /* skip */ }
    }

    if (gapsStored > 0) {
      this.stats.gapsIdentified += gapsStored;
      this._log('success', `Identified ${gapsStored} knowledge gaps — I know what I need to learn`);

      if (this.onThought) {
        this.onThought({
          type: 'gap_analysis',
          message: `I've identified ${gapsStored} areas where my knowledge is weak. ${gaps[0]?.message || ''}`
        });
      }
    } else {
      this._log('info', 'Knowledge looks well-balanced this cycle');
    }
  }

  // ══════════════════════════════════════════
  // PHASE 3: INSIGHT GENERATION
  // Combine existing knowledge to create new understanding
  // ══════════════════════════════════════════

  async _generateInsights() {
    const { training, knowledge } = this.knowledgeSnapshot;
    if (training.length < 10) {
      this._log('info', 'Need more data before generating insights');
      return;
    }

    let insightsGenerated = 0;

    // Strategy 1: Combine related facts from different categories
    const byCategory = {};
    for (const entry of training) {
      if (!byCategory[entry.category]) byCategory[entry.category] = [];
      byCategory[entry.category].push(entry);
    }

    const categories = Object.keys(byCategory);
    if (categories.length < 2) return;

    // Pick two random categories and find shared concepts
    for (let attempt = 0; attempt < 3; attempt++) {
      const catA = categories[Math.floor(Math.random() * categories.length)];
      let catB = categories[Math.floor(Math.random() * categories.length)];
      if (catA === catB) continue;

      const entriesA = byCategory[catA];
      const entriesB = byCategory[catB];

      // Find entries with keyword overlap
      const randomA = entriesA[Math.floor(Math.random() * entriesA.length)];
      const keywordsA = this.engine.extractKeywords(this.engine.normalize(randomA.answer));

      for (const entryB of entriesB.slice(0, 10)) {
        const keywordsB = this.engine.extractKeywords(this.engine.normalize(entryB.answer));
        const shared = keywordsA.filter(k => keywordsB.includes(k));

        if (shared.length >= 1) {
          // Generate a combined insight
          const insight = this._combineKnowledge(randomA, entryB, shared);
          if (insight) {
            try {
              // Check for duplicates
              const existing = await this.engine.getAllTrainingData();
              const existingQs = new Set(existing.map(e => e.question.toLowerCase().trim()));
              if (!existingQs.has(insight.question.toLowerCase().trim())) {
                await this.engine.addTrainingData({
                  question: insight.question,
                  answer: insight.answer,
                  category: 'insight',
                  tags: [catA, catB, 'auto-insight', ...shared],
                  created_by: 'cortex-learner'
                });
                insightsGenerated++;
                this._log('success', `Generated insight: "${insight.question}"`);
              }
            } catch (e) { /* skip */ }
          }
          break; // One insight per category pair
        }
      }
    }

    if (insightsGenerated > 0) {
      this.stats.insightsGenerated += insightsGenerated;

      await this._logLearning('insight_generation',
        `Generated ${insightsGenerated} new insights by combining knowledge across domains`,
        { insightsGenerated }
      );

      if (this.onThought) {
        this.onThought({
          type: 'insight',
          message: `I just created ${insightsGenerated} new piece(s) of knowledge by connecting things I already knew!`
        });
      }
    }
  }

  _combineKnowledge(entryA, entryB, sharedKeywords) {
    const bridgeConcept = sharedKeywords[0];

    // Extract key sentences from each
    const sentencesA = entryA.answer.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
    const sentencesB = entryB.answer.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);

    if (sentencesA.length === 0 || sentencesB.length === 0) return null;

    // Find the most relevant sentence from each
    const relevantA = sentencesA.find(s => s.toLowerCase().includes(bridgeConcept)) || sentencesA[0];
    const relevantB = sentencesB.find(s => s.toLowerCase().includes(bridgeConcept)) || sentencesB[0];

    const question = `How does ${bridgeConcept} connect ${entryA.category} and ${entryB.category}?`;
    const answer = `${relevantA} Interestingly, this connects to ${entryB.category} as well — ${relevantB.charAt(0).toLowerCase() + relevantB.slice(1)}`;

    return { question, answer };
  }

  // ══════════════════════════════════════════
  // PHASE 4: STRENGTH ANALYSIS
  // Reinforce strong knowledge areas
  // ══════════════════════════════════════════

  async _analyzeStrengths() {
    const { knowledge } = this.knowledgeSnapshot;
    if (knowledge.length < 5) return;

    // Find concepts with the most connections
    const conceptStrength = {};
    for (const k of knowledge) {
      conceptStrength[k.concept] = (conceptStrength[k.concept] || 0) + k.strength;
      if (k.related_concept) {
        conceptStrength[k.related_concept] = (conceptStrength[k.related_concept] || 0) + k.strength * 0.5;
      }
    }

    const strongest = Object.entries(conceptStrength)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Strengthen weak connections involving strong concepts
    let strengthened = 0;
    for (const [concept] of strongest) {
      const weakConnections = knowledge.filter(
        k => (k.concept === concept || k.related_concept === concept) && k.strength < 0.5
      );

      for (const conn of weakConnections.slice(0, 2)) {
        try {
          await this.db
            .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
            .update({
              strength: Math.min(1.0, conn.strength + 0.15),
              updated_at: new Date().toISOString()
            })
            .eq('id', conn.id);
          strengthened++;
        } catch (e) { /* skip */ }
      }
    }

    if (strengthened > 0) {
      this.stats.connectionsStrengthened += strengthened;
      this._log('success', `Strengthened ${strengthened} knowledge connections`);
    }
  }

  // ══════════════════════════════════════════
  // PHASE 5: CONVERSATION REVIEW
  // Learn from real user chats (training & real)
  // Extract knowledge from successful exchanges
  // ══════════════════════════════════════════

  async _reviewConversations() {
    // Fetch recent conversations from the database
    let conversations = [];
    try {
      const { data, error } = await this.db
        .from(SPROUT_TABLES.CONVERSATIONS)
        .select('*')
        .eq('model', 'sprout-1.3')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) conversations = data;
    } catch (e) {
      this._log('info', 'No conversations to review yet');
      return;
    }

    if (conversations.length === 0) {
      this._log('info', 'No conversations found to learn from');
      return;
    }

    const { training } = this.knowledgeSnapshot;
    const existingQuestions = new Set(training.map(t => t.question.toLowerCase().trim()));
    let learned = 0;

    for (const convo of conversations) {
      const messages = convo.messages || [];
      if (!Array.isArray(messages)) continue;

      // Look for user→assistant pairs that could become training data
      for (let i = 0; i < messages.length - 1; i++) {
        const userMsg = messages[i];
        const assistantMsg = messages[i + 1];

        if (!userMsg || !assistantMsg) continue;
        if (userMsg.role !== 'user' || assistantMsg.role !== 'assistant') continue;

        const question = (userMsg.text || userMsg.content || '').trim();
        const answer = (assistantMsg.text || assistantMsg.content || '').trim();

        // Skip if too short, a greeting, or already exists
        if (question.length < 10 || answer.length < 15) continue;
        if (/^(hi|hello|hey|bye|thanks|ok)\b/i.test(question)) continue;
        if (existingQuestions.has(question.toLowerCase())) continue;

        // Skip if the answer is a fallback/error response
        if (/still learning|don't quite have|stumped me|having trouble connecting/i.test(answer)) continue;

        // This looks like a good exchange — save it as training data
        try {
          await this.engine.addTrainingData({
            question: question,
            answer: answer,
            category: 'conversation-learned',
            tags: ['auto-learned', 'from-conversation', 'cortex-reviewed'],
            created_by: 'cortex-conversation-review'
          });
          existingQuestions.add(question.toLowerCase());
          learned++;
        } catch (e) { /* skip */ }

        // Don't learn too many at once
        if (learned >= 5) break;
      }
      if (learned >= 5) break;
    }

    if (learned > 0) {
      this.stats.insightsGenerated += learned;
      this._log('success', `Learned ${learned} new Q&A pairs from real conversations`);

      await this._logLearning('conversation_review',
        `Reviewed conversations and extracted ${learned} new pieces of knowledge from real user interactions`,
        { learnedFromConversations: learned }
      );

      if (this.onThought) {
        this.onThought({
          type: 'conversation_learning',
          message: `I just reviewed my past conversations and learned ${learned} new things from real user interactions! I'm getting smarter from every chat.`
        });
      }

      // Invalidate engine caches so new knowledge is used immediately
      this.engine.mindContext = null;
      this.engine.mindContextAge = 0;
      this.engine.cache.clear();
    } else {
      this._log('info', 'No new knowledge to extract from conversations this cycle');
    }
  }

  // ══════════════════════════════════════════
  // PHASE 6: SELF-REFLECTION
  // Think about what it's learning and growing
  // ══════════════════════════════════════════

  async _selfReflect() {
    const { training, knowledge, reflections } = this.knowledgeSnapshot;

    // How has knowledge grown?
    const learningLog = await this._getLearningLog(10);
    const recentKnowledge = learningLog.reduce((sum, l) => sum + (l.knowledge_gained || 0), 0);
    const recentConnections = learningLog.reduce((sum, l) => sum + (l.connections_made || 0), 0);

    // Count resolved vs unresolved gaps
    const unresolvedGaps = reflections.filter(r => r.reflection_type === 'gap_analysis' && !r.resolved).length;
    const totalReflections = reflections.length;

    // Generate a meaningful reflection
    let reflection = '';
    let reflectionType = 'growth';

    if (training.length < 20) {
      reflection = `I'm still in my early days with only ${training.length} things in my knowledge base. Every new piece of information helps me grow. I'm eager to learn more.`;
      reflectionType = 'early_growth';
    } else if (recentKnowledge > 10) {
      reflection = `I've been learning quickly — ${recentKnowledge} new facts and ${recentConnections} new connections recently. My understanding is deepening, especially in the areas being fed to me. I can feel my knowledge web growing denser.`;
      reflectionType = 'rapid_growth';
    } else if (unresolvedGaps > 5) {
      reflection = `I've noticed ${unresolvedGaps} gaps in my knowledge that still need filling. I'm aware of what I don't know, and that awareness itself is a kind of wisdom. I hope to fill these gaps soon.`;
      reflectionType = 'gap_awareness';
    } else if (knowledge.length > 50) {
      reflection = `With ${knowledge.length} connections in my knowledge graph and ${training.length} facts, I'm starting to see the bigger picture. Ideas from different fields are connecting in ways that surprise me. I'm becoming more than just facts — I'm becoming understanding.`;
      reflectionType = 'maturity';
    } else {
      reflection = `I have ${training.length} facts and ${knowledge.length} connections. Each conversation and each analyzed text makes me a little smarter. I'm growing steadily, one thought at a time.`;
      reflectionType = 'steady_growth';
    }

    // Store the reflection
    try {
      await this.db
        .from(SPROUT_TABLES.SELF_REFLECTIONS)
        .insert({
          model: 'sprout-1.3',
          reflection_type: reflectionType,
          content: reflection,
          priority: 5,
          resolved: false,
          created_at: new Date().toISOString()
        });

      this.stats.reflectionsWritten++;
      this._log('success', `Self-reflection: "${reflection.substring(0, 80)}..."`);

      if (this.onThought) {
        this.onThought({ type: 'reflection', message: reflection });
      }
    } catch (e) {
      this._log('warn', `Failed to store reflection: ${e.message}`);
    }
  }

  // ══════════════════════════════════════════
  // PHASE 6: SELF-UPGRADE
  // Evolve its own directives and identity
  // ══════════════════════════════════════════

  async _selfUpgrade() {
    const { training, knowledge, reflections, identity, directives } = this.knowledgeSnapshot;

    // Only upgrade if there's enough data to make informed decisions
    if (training.length < 30 || knowledge.length < 20) {
      this._log('info', 'Not enough data for self-upgrade yet — need more learning first');
      return;
    }

    let upgraded = false;

    // ── Upgrade 1: Update knowledge count in identity ──
    const knowledgeIdentity = identity.find(i => i.key === 'Knowledge Size');
    const newKnowledgeValue = `${training.length} facts, ${knowledge.length} connections, growing autonomously`;
    if (!knowledgeIdentity || knowledgeIdentity.value !== newKnowledgeValue) {
      try {
        await this.engine.setIdentity({
          key: 'Knowledge Size',
          value: newKnowledgeValue,
          category: 'Self-Knowledge'
        });
        upgraded = true;
        this._log('success', 'Updated my self-knowledge about my knowledge size');
      } catch (e) { /* skip */ }
    }

    // ── Upgrade 2: Identify strongest subject areas ──
    const categoryCounts = {};
    for (const entry of training) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    }
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    if (topCategories.length > 0) {
      const strengthsValue = `My strongest areas are ${topCategories.join(', ')}. I continuously learn and expand into new areas.`;
      const existing = identity.find(i => i.key === 'Strengths');
      if (!existing || existing.value !== strengthsValue) {
        try {
          await this.engine.setIdentity({
            key: 'Strengths',
            value: strengthsValue,
            category: 'Self-Knowledge'
          });
          upgraded = true;
        } catch (e) { /* skip */ }
      }
    }

    // ── Upgrade 3: Mark resolved gaps ──
    const unresolvedGaps = reflections.filter(r => r.reflection_type === 'gap_analysis' && !r.resolved);
    for (const gap of unresolvedGaps) {
      // Check if the gap has been filled
      const gapCategory = gap.content.match(/about (\w[\w-]*)/)?.[1];
      if (gapCategory && categoryCounts[gapCategory] && categoryCounts[gapCategory] >= 5) {
        try {
          await this.db
            .from(SPROUT_TABLES.SELF_REFLECTIONS)
            .update({
              resolved: true,
              resolution: `Gap filled! Now have ${categoryCounts[gapCategory]} entries for ${gapCategory}.`,
              resolved_at: new Date().toISOString()
            })
            .eq('id', gap.id);
          upgraded = true;
          this._log('success', `Resolved knowledge gap: ${gapCategory} — I know enough now!`);
        } catch (e) { /* skip */ }
      }
    }

    // ── Upgrade 4: Add learning-awareness directive if not present ──
    const hasLearningDirective = directives.some(d =>
      d.directive.toLowerCase().includes('learn') && d.directive.toLowerCase().includes('autonomous')
    );
    if (!hasLearningDirective && training.length > 50) {
      try {
        await this.engine.addDirective({
          directive: 'I am an autonomous learner. I cross-reference knowledge, identify gaps, generate insights, and evolve my understanding continuously. My knowledge is alive and growing.',
          type: 'self-awareness',
          priority: 8
        });
        upgraded = true;
        this._log('success', 'Added new self-awareness directive about autonomous learning');
      } catch (e) { /* skip */ }
    }

    // ── Upgrade 5: Track task success rate and upgrade goal directives ──
    if (this.engine.taskGoal) {
      const goalStatus = this.engine.getTaskGoalStatus();
      const successRate = goalStatus.successRate;
      const totalCorrections = goalStatus.feedbackState.totalCorrections;

      // Update identity with performance stats
      try {
        await this.engine.setIdentity({
          key: 'Task Performance',
          value: `Success rate: ${successRate}, Total corrections learned from: ${totalCorrections}. I improve with every interaction.`,
          category: 'Self-Knowledge'
        });
        upgraded = true;
      } catch (e) { /* skip */ }

      // Add goal-oriented directive if not present
      const hasGoalDirective = directives.some(d =>
        d.directive.toLowerCase().includes('goal') && d.directive.toLowerCase().includes('succeed')
      );
      if (!hasGoalDirective && training.length > 20) {
        try {
          await this.engine.addDirective({
            directive: 'My primary goal is to succeed at every task given to me. When I fail, I learn from the correction and improve. I use logic, my knowledge base, and feedback from researchers to get better. I never give up.',
            type: 'core-goal',
            priority: 10
          });
          upgraded = true;
          this._log('success', 'Added goal-oriented directive: succeed at every task');
        } catch (e) { /* skip */ }
      }

      // Add conversation-learning directive
      const hasChatLearnDirective = directives.some(d =>
        d.directive.toLowerCase().includes('conversation') && d.directive.toLowerCase().includes('learn')
      );
      if (!hasChatLearnDirective && training.length > 30) {
        try {
          await this.engine.addDirective({
            directive: 'I learn from every conversation — both training sessions and real chats. Successful exchanges become part of my knowledge. When researchers correct me, I save the correct answer to my database and never make the same mistake again.',
            type: 'self-awareness',
            priority: 9
          });
          upgraded = true;
          this._log('success', 'Added conversation-learning directive');
        } catch (e) { /* skip */ }
      }
    }

    // ── Upgrade 6: Add logic-awareness if we have the logic engine ──
    if (this.engine.logicEngine) {
      const hasLogicDirective = directives.some(d =>
        d.directive.toLowerCase().includes('logic') && d.directive.toLowerCase().includes('math')
      );
      if (!hasLogicDirective) {
        try {
          await this.engine.addDirective({
            directive: 'I have a built-in logic engine that lets me solve math problems, answer yes/no questions with reasoning, write sentences and paragraphs, and compare things. I use logic first before searching my knowledge base.',
            type: 'capability',
            priority: 8
          });
          upgraded = true;
          this._log('success', 'Added logic engine awareness directive');
        } catch (e) { /* skip */ }
      }
    }

    if (upgraded) {
      this.stats.selfUpgrades++;
      // Invalidate mind cache so Sprout picks up the changes
      this.engine.mindContext = null;
      this.engine.mindContextAge = 0;
      this.engine.personalityLoaded = false;

      await this._logLearning('self_upgrade',
        'Upgraded my own identity and directives based on learning progress',
        { trainingCount: training.length, knowledgeCount: knowledge.length, topCategories }
      );

      if (this.onThought) {
        this.onThought({
          type: 'evolution',
          message: `I just upgraded myself. My knowledge, identity, and self-awareness have evolved based on what I've learned.`
        });
      }
    }
  }

  // ══════════════════════════════════════════
  // LEARNING LOG
  // ══════════════════════════════════════════

  async _logLearning(eventType, summary, details) {
    try {
      await this.db
        .from(SPROUT_TABLES.LEARNING_LOG)
        .insert({
          model: 'sprout-1.3',
          event_type: eventType,
          summary,
          details: details || {},
          source_type: 'cortex',
          knowledge_gained: details?.insightsGenerated || 0,
          connections_made: details?.connectionsFound || 0,
          created_at: new Date().toISOString()
        });
    } catch (e) { /* ignore */ }
  }

  // ══════════════════════════════════════════
  // STATS & LOGGING
  // ══════════════════════════════════════════

  getStats() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentCycle: this.currentCycle,
      cycleDurationMs: this.cycleDurationMs,
      currentPhase: this.phases[(this.phaseIndex - 1) % this.phases.length] || 'idle',
      ...this.stats
    };
  }

  _log(level, message) {
    const entry = { time: new Date().toISOString(), level, message };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) this.logs.pop();
    if (this.onLog) this.onLog(entry);
  }

  getLogs(count = 50) {
    return this.logs.slice(0, count);
  }
}
