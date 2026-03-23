/**
 * Tithonia Text Analyzer — "Roots"
 * Decomposes any pasted text into structured knowledge:
 * - Extracts key facts, concepts, and relationships
 * - Generates Q&A training pairs automatically
 * - Builds a knowledge graph of connected concepts
 * - Stores everything in Supabase for Sprout to learn from
 *
 * No external API needed — this runs entirely in the browser
 * using Sprout's own NLP capabilities.
 */

class TextAnalyzer {
  constructor(sproutEngine) {
    this.engine = sproutEngine;
    this.db = sproutEngine.db;
    this.name = 'Roots';
    this.version = '1.0';
    this.logs = [];
    this.maxLogs = 200;
    this.onLog = null;
    this.onProgress = null;
    this.totalAnalyzed = 0;
    this.totalKnowledgeExtracted = 0;
    this.totalConnectionsMade = 0;

    // ── NLP patterns for extraction ──
    this.definitionPatterns = [
      /(?:^|\.\s+)([A-Z][^.]*?)\s+(?:is|are|was|were|refers? to|means?|describes?|denotes?)\s+([^.]+\.)/gm,
      /(?:^|\.\s+)([A-Z][^.]*?),\s+(?:which|that)\s+(?:is|are|was|were)\s+([^.]+\.)/gm,
      /(?:^|\.\s+)(?:The\s+)?(\w[\w\s]*?)\s+(?:can be defined as|is defined as|is known as)\s+([^.]+\.)/gim
    ];

    this.causalPatterns = [
      /([^.]+?)\s+(?:because|since|due to|as a result of|owing to)\s+([^.]+)/gi,
      /([^.]+?)\s+(?:causes?|leads? to|results? in|produces?|triggers?)\s+([^.]+)/gi,
      /(?:If|When)\s+([^,]+),\s+(?:then\s+)?([^.]+)/gi
    ];

    this.comparisonPatterns = [
      /([^.]+?)\s+(?:unlike|compared to|in contrast to|whereas|while)\s+([^.]+)/gi,
      /([^.]+?)\s+(?:is similar to|resembles?|is like|parallels?)\s+([^.]+)/gi
    ];

    this.processPatterns = [
      /(?:First|Initially|To begin),?\s+([^.]+)\.\s*(?:Then|Next|After that|Subsequently),?\s+([^.]+)/gi,
      /(?:The process|The method|The procedure)\s+(?:involves?|includes?|consists? of)\s+([^.]+)/gi
    ];

    this.factPatterns = [
      /(\d[\d,.]*\s*(?:percent|%|million|billion|trillion|thousand|hundred))\s+(?:of\s+)?([^.]+)/gi,
      /(?:In|During|Around)\s+(\d{3,4}),?\s+([^.]+)/gi,
      /([A-Z][\w\s]+?)\s+(?:discovered|invented|created|founded|established|built|developed)\s+([^.]+)/gi
    ];

    // ── Category detection keywords ──
    this.categoryKeywords = {
      'science': ['atom', 'molecule', 'cell', 'energy', 'force', 'gravity', 'evolution', 'species', 'chemical', 'reaction', 'physics', 'biology', 'chemistry', 'experiment', 'hypothesis', 'theory', 'organism', 'dna', 'gene', 'protein', 'electron', 'proton', 'neutron', 'quantum', 'relativity'],
      'technology': ['computer', 'software', 'hardware', 'algorithm', 'data', 'internet', 'network', 'programming', 'code', 'server', 'database', 'api', 'machine learning', 'artificial intelligence', 'encryption', 'protocol', 'binary', 'processor', 'memory', 'bandwidth'],
      'history': ['war', 'empire', 'dynasty', 'revolution', 'ancient', 'medieval', 'century', 'civilization', 'king', 'queen', 'president', 'treaty', 'colony', 'independence', 'battle', 'era', 'period', 'archaeological'],
      'philosophy': ['ethics', 'morality', 'existence', 'consciousness', 'truth', 'knowledge', 'logic', 'reason', 'metaphysics', 'epistemology', 'ontology', 'virtue', 'justice', 'freedom', 'determinism', 'existentialism', 'empiricism', 'rationalism'],
      'mathematics': ['equation', 'theorem', 'proof', 'algebra', 'geometry', 'calculus', 'statistics', 'probability', 'function', 'variable', 'integral', 'derivative', 'matrix', 'vector', 'polynomial', 'logarithm', 'trigonometry'],
      'nature': ['ecosystem', 'habitat', 'climate', 'weather', 'ocean', 'forest', 'mountain', 'river', 'animal', 'plant', 'species', 'biodiversity', 'conservation', 'endangered', 'migration', 'photosynthesis'],
      'psychology': ['behavior', 'cognition', 'emotion', 'memory', 'perception', 'motivation', 'personality', 'therapy', 'anxiety', 'depression', 'consciousness', 'subconscious', 'neuroscience', 'stimulus', 'conditioning'],
      'health': ['nutrition', 'exercise', 'disease', 'immune', 'vitamin', 'protein', 'cardiovascular', 'mental health', 'sleep', 'metabolism', 'diagnosis', 'treatment', 'symptom', 'infection', 'vaccine'],
      'geography': ['continent', 'country', 'capital', 'population', 'territory', 'border', 'latitude', 'longitude', 'altitude', 'terrain', 'climate zone', 'tectonic', 'volcano', 'earthquake'],
      'space': ['planet', 'star', 'galaxy', 'universe', 'orbit', 'gravity', 'light year', 'nebula', 'black hole', 'supernova', 'asteroid', 'comet', 'telescope', 'spacecraft', 'cosmos', 'solar system'],
      'art-culture': ['painting', 'sculpture', 'music', 'literature', 'film', 'theater', 'architecture', 'dance', 'poetry', 'novel', 'artist', 'composer', 'renaissance', 'baroque', 'modernism', 'genre']
    };

    // ── Relationship types for knowledge graph ──
    this.relationshipTypes = [
      'is_a', 'part_of', 'causes', 'caused_by', 'similar_to',
      'opposite_of', 'related_to', 'depends_on', 'leads_to',
      'contains', 'used_for', 'created_by', 'discovered_by',
      'located_in', 'occurred_in', 'precedes', 'follows'
    ];
  }

  // ══════════════════════════════════════════
  // MAIN ENTRY — Analyze a block of text
  // ══════════════════════════════════════════

  async analyze(text, options = {}) {
    const startTime = Date.now();
    const label = options.label || 'Manual paste';
    const forceCategory = options.category || null;

    this._log('info', `Analyzing text (${text.length} chars) — "${label}"`);
    if (this.onProgress) this.onProgress({ phase: 'starting', percent: 0 });

    // ── Phase 1: Clean and segment ──
    const cleaned = this._cleanText(text);
    const sentences = this._splitSentences(cleaned);
    const paragraphs = this._splitParagraphs(cleaned);

    this._log('info', `Found ${sentences.length} sentences in ${paragraphs.length} paragraphs`);
    if (this.onProgress) this.onProgress({ phase: 'segmented', percent: 10 });

    // ── Phase 2: Detect category/topic ──
    const detectedCategory = forceCategory || this._detectCategory(cleaned);
    this._log('info', `Detected category: ${detectedCategory}`);
    if (this.onProgress) this.onProgress({ phase: 'categorized', percent: 15 });

    // ── Phase 3: Extract entities and key concepts ──
    const entities = this._extractEntities(cleaned);
    const keyConcepts = this._extractKeyConcepts(cleaned, sentences);
    this._log('info', `Extracted ${entities.length} entities, ${keyConcepts.length} key concepts`);
    if (this.onProgress) this.onProgress({ phase: 'entities_extracted', percent: 25 });

    // ── Phase 4: Extract definitions and facts ──
    const definitions = this._extractDefinitions(cleaned);
    const facts = this._extractFacts(cleaned);
    const causalRelations = this._extractCausalRelations(cleaned);
    this._log('info', `Found ${definitions.length} definitions, ${facts.length} facts, ${causalRelations.length} causal relations`);
    if (this.onProgress) this.onProgress({ phase: 'knowledge_extracted', percent: 40 });

    // ── Phase 5: Generate Q&A training pairs ──
    const qaPairs = this._generateQAPairs(sentences, definitions, facts, keyConcepts, entities, detectedCategory);
    this._log('info', `Generated ${qaPairs.length} Q&A training pairs`);
    if (this.onProgress) this.onProgress({ phase: 'qa_generated', percent: 55 });

    // ── Phase 6: Build knowledge connections ──
    const connections = this._buildConnections(entities, keyConcepts, definitions, causalRelations, detectedCategory);
    this._log('info', `Built ${connections.length} knowledge connections`);
    if (this.onProgress) this.onProgress({ phase: 'connections_built', percent: 65 });

    // ── Phase 7: Analyze writing style ──
    const styleAnalysis = this.engine.analyzeText(cleaned);
    if (this.onProgress) this.onProgress({ phase: 'style_analyzed', percent: 70 });

    // ── Phase 8: Store everything in the database ──
    const stored = await this._storeKnowledge({
      qaPairs,
      connections,
      styleAnalysis,
      label,
      category: detectedCategory,
      originalText: cleaned,
      entities,
      keyConcepts
    });
    if (this.onProgress) this.onProgress({ phase: 'stored', percent: 90 });

    // ── Phase 9: Log the learning event ──
    await this._logLearningEvent({
      summary: `Analyzed "${label}" — ${qaPairs.length} facts learned, ${connections.length} connections made`,
      details: {
        textLength: cleaned.length,
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        category: detectedCategory,
        entities: entities.length,
        keyConcepts: keyConcepts.length,
        definitions: definitions.length,
        facts: facts.length,
        qaPairsGenerated: qaPairs.length,
        connectionsMade: connections.length,
        processingTimeMs: Date.now() - startTime
      },
      sourceType: options.sourceType || 'paste',
      knowledgeGained: stored.trainingAdded,
      connectionsMade: stored.connectionsAdded
    });

    this.totalAnalyzed++;
    this.totalKnowledgeExtracted += stored.trainingAdded;
    this.totalConnectionsMade += stored.connectionsAdded;

    if (this.onProgress) this.onProgress({ phase: 'complete', percent: 100 });

    const result = {
      category: detectedCategory,
      entities,
      keyConcepts,
      definitions,
      facts,
      causalRelations,
      qaPairs,
      connections,
      styleAnalysis,
      stored,
      processingTimeMs: Date.now() - startTime
    };

    this._log('success', `Analysis complete! ${stored.trainingAdded} knowledge entries + ${stored.connectionsAdded} connections stored (${result.processingTimeMs}ms)`);
    return result;
  }

  // ══════════════════════════════════════════
  // TEXT PROCESSING
  // ══════════════════════════════════════════

  _cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  _splitSentences(text) {
    // Split on sentence boundaries, keeping abbreviations intact
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }

  _splitParagraphs(text) {
    return text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 10);
  }

  // ══════════════════════════════════════════
  // CATEGORY DETECTION
  // ══════════════════════════════════════════

  _detectCategory(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      scores[category] = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
        const matches = lower.match(regex);
        if (matches) {
          scores[category] += matches.length;
        }
      }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : 'general';
  }

  // ══════════════════════════════════════════
  // ENTITY EXTRACTION
  // ══════════════════════════════════════════

  _extractEntities(text) {
    const entities = new Map();

    // Named entities (capitalized multi-word phrases)
    const namedEntityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let match;
    while ((match = namedEntityPattern.exec(text)) !== null) {
      const entity = match[1];
      // Skip common sentence starters
      if (['The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'It'].some(w => entity.startsWith(w + ' '))) continue;
      if (!entities.has(entity)) {
        entities.set(entity, { name: entity, type: 'named_entity', mentions: 0 });
      }
      entities.get(entity).mentions++;
    }

    // Single capitalized words that appear multiple times (likely important nouns)
    const singleCapPattern = /\b([A-Z][a-z]{2,})\b/g;
    const singleCounts = {};
    while ((match = singleCapPattern.exec(text)) !== null) {
      const word = match[1];
      if (['The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'It', 'In', 'On', 'At', 'For', 'With', 'But', 'And', 'Or', 'Not', 'So', 'If', 'As', 'By'].includes(word)) continue;
      singleCounts[word] = (singleCounts[word] || 0) + 1;
    }
    for (const [word, count] of Object.entries(singleCounts)) {
      if (count >= 2 && !entities.has(word)) {
        entities.set(word, { name: word, type: 'concept', mentions: count });
      }
    }

    // Numbers and dates
    const datePattern = /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4})\b/g;
    while ((match = datePattern.exec(text)) !== null) {
      const date = match[1];
      if (!entities.has(date)) {
        entities.set(date, { name: date, type: 'date', mentions: 1 });
      }
    }

    return Array.from(entities.values()).sort((a, b) => b.mentions - a.mentions);
  }

  // ══════════════════════════════════════════
  // KEY CONCEPT EXTRACTION
  // ══════════════════════════════════════════

  _extractKeyConcepts(text, sentences) {
    const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, '')).filter(w => w.length > 3);
    const stopWords = new Set([
      'that', 'this', 'with', 'from', 'they', 'been', 'have', 'were', 'being',
      'their', 'which', 'would', 'there', 'about', 'could', 'other', 'into',
      'more', 'some', 'than', 'them', 'very', 'when', 'what', 'your', 'also',
      'each', 'just', 'like', 'over', 'such', 'most', 'only', 'after', 'before',
      'does', 'made', 'these', 'those', 'then', 'will', 'much', 'both', 'well',
      'still', 'many', 'same', 'here', 'where', 'while', 'should', 'between',
      'every', 'often', 'through', 'during', 'without', 'around', 'first',
      'second', 'third', 'however', 'because', 'since', 'until'
    ]);

    // Word frequency
    const freq = {};
    words.forEach(w => {
      if (!stopWords.has(w) && w.length > 3) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });

    // Bigram frequency (two-word phrases)
    const bigrams = {};
    for (let i = 0; i < words.length - 1; i++) {
      if (stopWords.has(words[i]) || stopWords.has(words[i + 1])) continue;
      if (words[i].length < 3 || words[i + 1].length < 3) continue;
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }

    // Combine and score
    const concepts = [];

    // Top single words
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    for (const [word, count] of topWords) {
      if (count >= 2) {
        concepts.push({ concept: word, frequency: count, type: 'keyword' });
      }
    }

    // Top bigrams
    const topBigrams = Object.entries(bigrams)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [bigram, count] of topBigrams) {
      if (count >= 2) {
        concepts.push({ concept: bigram, frequency: count, type: 'phrase' });
      }
    }

    return concepts.sort((a, b) => b.frequency - a.frequency);
  }

  // ══════════════════════════════════════════
  // DEFINITION & FACT EXTRACTION
  // ══════════════════════════════════════════

  _extractDefinitions(text) {
    const definitions = [];

    for (const pattern of this.definitionPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (term.length > 2 && term.length < 100 && definition.length > 10) {
          definitions.push({ term, definition, fullSentence: match[0].trim() });
        }
      }
    }

    return definitions;
  }

  _extractFacts(text) {
    const facts = [];

    for (const pattern of this.factPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        facts.push({
          key: match[1].trim(),
          detail: match[2].trim(),
          fullMatch: match[0].trim()
        });
      }
    }

    return facts;
  }

  _extractCausalRelations(text) {
    const relations = [];

    for (const pattern of this.causalPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const cause = match[1].trim();
        const effect = match[2].trim();
        if (cause.length > 5 && effect.length > 5) {
          relations.push({ cause, effect, fullMatch: match[0].trim() });
        }
      }
    }

    return relations;
  }

  // ══════════════════════════════════════════
  // Q&A PAIR GENERATION
  // ══════════════════════════════════════════

  _generateQAPairs(sentences, definitions, facts, keyConcepts, entities, category) {
    const pairs = [];
    const usedTopics = new Set();

    // From definitions → "What is X?" questions
    for (const def of definitions) {
      const q = `What is ${def.term}?`;
      if (usedTopics.has(q.toLowerCase())) continue;
      usedTopics.add(q.toLowerCase());
      pairs.push({
        question: q,
        answer: `${def.term} ${def.definition}`,
        tags: [category, 'definition'],
        source: 'definition_extraction'
      });
    }

    // From facts → specific questions
    for (const fact of facts) {
      // Try to form a natural question
      const q = this._factToQuestion(fact);
      if (q && !usedTopics.has(q.toLowerCase())) {
        usedTopics.add(q.toLowerCase());
        pairs.push({
          question: q,
          answer: fact.fullMatch,
          tags: [category, 'fact'],
          source: 'fact_extraction'
        });
      }
    }

    // From important sentences → knowledge pairs
    const importantSentences = sentences.filter(s => {
      const lower = s.toLowerCase();
      // Sentences with key concepts are important
      return keyConcepts.some(c => lower.includes(c.concept)) && s.length > 30 && s.length < 500;
    });

    for (const sentence of importantSentences.slice(0, 15)) {
      const mainConcept = keyConcepts.find(c => sentence.toLowerCase().includes(c.concept));
      if (!mainConcept) continue;

      const q = this._sentenceToQuestion(sentence, mainConcept.concept);
      if (q && !usedTopics.has(q.toLowerCase())) {
        usedTopics.add(q.toLowerCase());

        // Make the answer feel like Tithonia
        let answer = sentence;
        if (!answer.endsWith('.') && !answer.endsWith('!')) answer += '.';

        pairs.push({
          question: q,
          answer,
          tags: [category, mainConcept.concept],
          source: 'sentence_extraction'
        });
      }
    }

    // From entity-rich sentences → "Tell me about X" questions
    for (const entity of entities.slice(0, 8)) {
      if (entity.type === 'date') continue;
      const relevantSentences = sentences.filter(s => s.includes(entity.name));
      if (relevantSentences.length === 0) continue;

      const q = `Tell me about ${entity.name}.`;
      if (usedTopics.has(q.toLowerCase())) continue;
      usedTopics.add(q.toLowerCase());

      // Combine up to 3 relevant sentences
      const answer = relevantSentences.slice(0, 3).join(' ');
      if (answer.length > 20) {
        pairs.push({
          question: q,
          answer,
          tags: [category, 'entity', entity.name.toLowerCase()],
          source: 'entity_extraction'
        });
      }
    }

    return pairs;
  }

  _factToQuestion(fact) {
    const key = fact.key;
    const detail = fact.detail;

    // Year-based facts
    if (/^\d{3,4}$/.test(key)) {
      return `What happened in ${key}?`;
    }

    // Percentage/number facts
    if (/percent|%|million|billion/.test(key.toLowerCase())) {
      const words = detail.split(/\s+/).slice(0, 5).join(' ');
      return `How much/many ${words}?`;
    }

    // Person-based facts
    if (/[A-Z][a-z]+\s+[A-Z][a-z]+/.test(key)) {
      return `What did ${key} do?`;
    }

    return null;
  }

  _sentenceToQuestion(sentence, concept) {
    const lower = sentence.toLowerCase();

    // "X is Y" → "What is X?"
    if (lower.includes(` is `) || lower.includes(` are `)) {
      return `What is ${concept}?`;
    }

    // "X causes Y" → "What does X cause?"
    if (lower.includes('cause') || lower.includes('lead') || lower.includes('result')) {
      return `What are the effects of ${concept}?`;
    }

    // "X works by Y" → "How does X work?"
    if (lower.includes('work') || lower.includes('function') || lower.includes('operat')) {
      return `How does ${concept} work?`;
    }

    // "X is important because" → "Why is X important?"
    if (lower.includes('important') || lower.includes('significant') || lower.includes('crucial')) {
      return `Why is ${concept} important?`;
    }

    // Default: "What can you tell me about X?"
    return `What can you tell me about ${concept}?`;
  }

  // ══════════════════════════════════════════
  // KNOWLEDGE GRAPH — Build connections
  // ══════════════════════════════════════════

  _buildConnections(entities, keyConcepts, definitions, causalRelations, category) {
    const connections = [];
    const seen = new Set();

    const addConnection = (concept, related, relationship, strength, sourceText) => {
      const key = `${concept}|${related}|${relationship}`;
      if (seen.has(key)) return;
      seen.add(key);
      connections.push({ concept, related_concept: related, relationship, strength, source_text: sourceText, category });
    };

    // From definitions: term → "is_a" → definition keywords
    for (const def of definitions) {
      const defKeywords = this.engine.extractKeywords(this.engine.normalize(def.definition));
      for (const kw of defKeywords.slice(0, 3)) {
        addConnection(def.term.toLowerCase(), kw, 'is_a', 0.8, def.fullSentence);
      }
    }

    // From causal relations: cause → "causes" → effect
    for (const rel of causalRelations) {
      const causeKey = this.engine.extractKeywords(this.engine.normalize(rel.cause))[0];
      const effectKey = this.engine.extractKeywords(this.engine.normalize(rel.effect))[0];
      if (causeKey && effectKey) {
        addConnection(causeKey, effectKey, 'causes', 0.7, rel.fullMatch);
      }
    }

    // From co-occurring entities: entities in the same sentence are related
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length && j < i + 5; j++) {
        addConnection(
          entities[i].name.toLowerCase(),
          entities[j].name.toLowerCase(),
          'related_to',
          0.5,
          null
        );
      }
    }

    // From key concepts: frequent co-occurrence implies relationship
    for (let i = 0; i < keyConcepts.length; i++) {
      for (let j = i + 1; j < keyConcepts.length && j < i + 4; j++) {
        const strength = Math.min(0.9, (keyConcepts[i].frequency + keyConcepts[j].frequency) / 20);
        addConnection(
          keyConcepts[i].concept,
          keyConcepts[j].concept,
          'related_to',
          strength,
          null
        );
      }
    }

    // Connect key concepts to the category
    for (const concept of keyConcepts.slice(0, 5)) {
      addConnection(concept.concept, category, 'part_of', 0.6, null);
    }

    return connections;
  }

  // ══════════════════════════════════════════
  // STORAGE — Save everything to Supabase
  // ══════════════════════════════════════════

  async _storeKnowledge({ qaPairs, connections, styleAnalysis, label, category, originalText, entities, keyConcepts }) {
    let trainingAdded = 0;
    let connectionsAdded = 0;
    let writingPatternAdded = 0;

    // Get existing training data to avoid duplicates
    let existingQs = new Set();
    try {
      const existing = await this.engine.getAllTrainingData();
      existingQs = new Set(existing.map(e => e.question.toLowerCase().trim()));
    } catch (e) { /* continue */ }

    // Store Q&A pairs as training data
    for (const pair of qaPairs) {
      if (existingQs.has(pair.question.toLowerCase().trim())) continue;
      try {
        await this.engine.addTrainingData({
          question: pair.question,
          answer: pair.answer,
          category,
          tags: pair.tags || [],
          created_by: 'roots-analyzer'
        });
        trainingAdded++;
        existingQs.add(pair.question.toLowerCase().trim());
      } catch (e) {
        this._log('warn', `Failed to store Q&A: ${e.message}`);
      }
    }

    // Store knowledge connections
    for (const conn of connections) {
      try {
        await this.db
          .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
          .insert({
            model: 'sprout-1.2',
            concept: conn.concept,
            related_concept: conn.related_concept,
            relationship: conn.relationship,
            strength: conn.strength,
            source_text: conn.source_text,
            category: conn.category,
            active: true,
            created_at: new Date().toISOString()
          });
        connectionsAdded++;
      } catch (e) {
        this._log('warn', `Failed to store connection: ${e.message}`);
      }
    }

    // Store as writing pattern too (so Sprout absorbs the style)
    if (originalText.length > 50) {
      try {
        await this.engine.saveWritingPattern({
          sourceLabel: `${label} (auto-analyzed)`,
          sampleText: originalText.substring(0, 2000) // Keep it reasonable
        });
        writingPatternAdded = 1;
      } catch (e) {
        this._log('warn', `Failed to store writing pattern: ${e.message}`);
      }
    }

    return { trainingAdded, connectionsAdded, writingPatternAdded };
  }

  // ══════════════════════════════════════════
  // LEARNING LOG
  // ══════════════════════════════════════════

  async _logLearningEvent({ summary, details, sourceType, knowledgeGained, connectionsMade }) {
    try {
      await this.db
        .from(SPROUT_TABLES.LEARNING_LOG)
        .insert({
          model: 'sprout-1.2',
          event_type: 'text_ingestion',
          summary,
          details,
          source_type: sourceType || 'paste',
          knowledge_gained: knowledgeGained || 0,
          connections_made: connectionsMade || 0,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      this._log('warn', `Failed to log learning event: ${e.message}`);
    }
  }

  // ══════════════════════════════════════════
  // STATS & LOGGING
  // ══════════════════════════════════════════

  getStats() {
    return {
      totalAnalyzed: this.totalAnalyzed,
      totalKnowledgeExtracted: this.totalKnowledgeExtracted,
      totalConnectionsMade: this.totalConnectionsMade
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
