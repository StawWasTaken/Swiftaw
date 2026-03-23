/**
 * Sprout 1.2 — AI Engine (Enhanced Brain)
 * Custom AI with its own brain — no external LLM dependency
 * Thinks using its own knowledge base, personality, and reasoning
 * Now with: Logic Engine, Math, Context Awareness, Feedback Learning,
 *           Chat-based Self-Learning, Task Goal System, Auto-Upgrades,
 *           Semantic Intent Dictionary, Context-Aware Message Interpretation
 * Powered by Supabase for training data storage
 */

// ══════════════════════════════════════════════════════════════
// LOGIC ENGINE — Math, Reasoning, Sentence Generation
// Gives Tithonia actual logic and thinking capabilities
// ══════════════════════════════════════════════════════════════

class SproutLogicEngine {
  constructor() {
    this.mathOperators = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      'x': (a, b) => a * b,
      '×': (a, b) => a * b,
      '/': (a, b) => b !== 0 ? a / b : NaN,
      '÷': (a, b) => b !== 0 ? a / b : NaN,
      '%': (a, b) => a % b,
      '^': (a, b) => Math.pow(a, b),
      '**': (a, b) => Math.pow(a, b)
    };

    // Word-to-number mapping
    this.wordNumbers = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
      'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
      'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
      'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
      'million': 1000000, 'billion': 1000000000
    };

    // Word operators
    this.wordOperators = {
      'plus': '+', 'add': '+', 'added': '+', 'sum': '+',
      'minus': '-', 'subtract': '-', 'subtracted': '-', 'take away': '-',
      'times': '*', 'multiply': '*', 'multiplied': '*',
      'divided': '/', 'divide': '/', 'over': '/',
      'modulo': '%', 'mod': '%', 'remainder': '%',
      'power': '^', 'raised': '^', 'squared': '^2', 'cubed': '^3',
      'percent': '%_of', 'percentage': '%_of'
    };
  }

  // ── Detect if a message is a logic/math/reasoning task ──
  detectTaskType(message) {
    const lower = message.toLowerCase().trim();

    // Math detection
    if (this.isMathQuestion(lower)) return 'math';

    // Writing task detection
    if (/\b(write|compose|create|make|generate)\b.*\b(sentence|paragraph|story|poem|essay|letter|message|text|haiku)\b/i.test(lower)) return 'write';
    if (/\b(can you|could you|please)\b.*\b(write|say|tell)\b/i.test(lower)) return 'write';
    if (/\bwrite\s+(me\s+)?a\b/i.test(lower)) return 'write';

    // Factual question detection
    if (/^(what|who|where|when|which|how many|how much|how old|how far|how long)\b/i.test(lower)) return 'factual';

    // Yes/No question detection
    if (/^(is|are|was|were|do|does|did|can|could|will|would|should|has|have)\b/i.test(lower) && lower.endsWith('?')) return 'yesno';

    // Reasoning detection
    if (/\b(why|explain|reason|because|logic|if.*then|therefore|conclude)\b/i.test(lower)) return 'reason';

    // Comparison
    if (/\b(compare|difference|between|versus|vs|better|worse|bigger|smaller)\b/i.test(lower)) return 'compare';

    // Definition
    if (/\b(what is|what are|what does|define|definition|meaning of)\b/i.test(lower)) return 'define';

    // List
    if (/\b(list|name|give me|tell me)\b.*\b(\d+|some|few|several|all)\b/i.test(lower)) return 'list';

    return 'general';
  }

  // ── Math Detection ──
  isMathQuestion(text) {
    // Direct math expressions: "1 + 1", "what's 5 * 3"
    if (/\d+\s*[+\-*/×÷^%x]\s*\d+/.test(text)) return true;
    // Word math: "one plus one", "add 5 and 3"
    if (/\b(plus|minus|times|divided|multiply|add|subtract|sum|difference|product|quotient)\b/i.test(text) && /\d+|\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred|thousand|million)\b/i.test(text)) return true;
    // "What is X + Y", "Calculate X"
    if (/\b(calculate|compute|solve|evaluate|what is|what's|whats|how much is)\b/i.test(text) && /\d/.test(text)) return true;
    // Square root, percentage
    if (/\b(square root|sqrt|factorial|percent of|percentage)\b/i.test(text)) return true;
    return false;
  }

  // ── Solve Math ──
  solveMath(text) {
    let expr = text.toLowerCase().trim();

    // Remove question framing
    expr = expr.replace(/^(what is|what's|whats|how much is|calculate|compute|solve|evaluate|tell me)\s*/i, '');
    expr = expr.replace(/[?!.]+$/, '').trim();

    // Handle "square root of X"
    const sqrtMatch = expr.match(/square\s*root\s*(?:of\s*)?(\d+(?:\.\d+)?)/);
    if (sqrtMatch) {
      const val = parseFloat(sqrtMatch[1]);
      const result = Math.sqrt(val);
      return { result, expression: `√${val}`, explanation: `The square root of ${val} is ${this.formatNumber(result)}` };
    }

    // Handle "X factorial"
    const factMatch = expr.match(/(\d+)\s*(?:factorial|!)/);
    if (factMatch) {
      const n = parseInt(factMatch[1]);
      if (n > 170) return { result: Infinity, expression: `${n}!`, explanation: `${n}! is too large to calculate` };
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return { result, expression: `${n}!`, explanation: `${n}! (factorial) = ${this.formatNumber(result)}` };
    }

    // Handle "X percent of Y"
    const pctMatch = expr.match(/(\d+(?:\.\d+)?)\s*(?:percent|%)\s*(?:of)\s*(\d+(?:\.\d+)?)/);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const base = parseFloat(pctMatch[2]);
      const result = (pct / 100) * base;
      return { result, expression: `${pct}% of ${base}`, explanation: `${pct}% of ${base} is ${this.formatNumber(result)}` };
    }

    // Convert word numbers to digits
    for (const [word, num] of Object.entries(this.wordNumbers)) {
      expr = expr.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num));
    }

    // Convert word operators to symbols
    for (const [word, op] of Object.entries(this.wordOperators)) {
      expr = expr.replace(new RegExp(`\\b${word}\\b`, 'gi'), ` ${op} `);
    }

    // Clean up: remove "and", "by", "to the power of"
    expr = expr.replace(/\band\b/g, '').replace(/\bby\b/g, '').replace(/\bto\s*the\s*power\s*(?:of)?\b/g, '^');
    expr = expr.replace(/\s+/g, ' ').trim();

    // Try to evaluate simple expressions
    // Extract: number operator number (possibly chained)
    const tokens = expr.match(/[\d.]+|[+\-*/×÷^%x]/g);
    if (!tokens || tokens.length < 3) {
      // Maybe just a single number
      const num = parseFloat(expr);
      if (!isNaN(num)) return { result: num, expression: expr, explanation: `That's just the number ${this.formatNumber(num)}` };
      return null;
    }

    // Evaluate with operator precedence (simple left-to-right with PEMDAS for * and /)
    try {
      const result = this.evaluateTokens(tokens);
      if (result !== null && !isNaN(result)) {
        const origExpr = tokens.join(' ');
        return {
          result,
          expression: origExpr,
          explanation: `${origExpr} = ${this.formatNumber(result)}`
        };
      }
    } catch (e) { /* fall through */ }

    return null;
  }

  // Simple token evaluator with PEMDAS
  evaluateTokens(tokens) {
    // Parse into numbers and operators
    const nums = [];
    const ops = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].trim();
      if (!t) continue;
      const num = parseFloat(t);
      if (!isNaN(num)) {
        nums.push(num);
      } else if (this.mathOperators[t]) {
        ops.push(t);
      }
    }

    if (nums.length === 0) return null;
    if (nums.length === 1) return nums[0];
    if (ops.length !== nums.length - 1) return null;

    // First pass: handle ^, *, /, % (higher precedence)
    let i = 0;
    while (i < ops.length) {
      if (['^', '**', '*', 'x', '×', '/', '÷', '%'].includes(ops[i])) {
        const result = this.mathOperators[ops[i]](nums[i], nums[i + 1]);
        nums.splice(i, 2, result);
        ops.splice(i, 1);
      } else {
        i++;
      }
    }

    // Second pass: handle +, -
    let result = nums[0];
    for (let j = 0; j < ops.length; j++) {
      result = this.mathOperators[ops[j]](result, nums[j + 1]);
    }

    return result;
  }

  formatNumber(n) {
    if (Number.isInteger(n)) return n.toLocaleString();
    // Round to reasonable precision
    const rounded = Math.round(n * 1000000) / 1000000;
    return rounded.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  // ── Sentence Generation ──
  generateSentence(topic, style = 'neutral') {
    // Templates for generating original sentences
    const templates = {
      neutral: [
        `${topic} is something that many people find interesting and worth exploring.`,
        `When it comes to ${topic}, there are many perspectives to consider.`,
        `${topic} plays an important role in how we understand the world around us.`,
        `The concept of ${topic} continues to evolve as we learn more about it.`,
        `Understanding ${topic} can open new ways of thinking about related subjects.`
      ],
      simple: [
        `${topic} is a fascinating subject.`,
        `Many people are curious about ${topic}.`,
        `${topic} matters because it affects our daily lives.`,
        `Learning about ${topic} helps us grow.`,
        `${topic} is worth knowing about.`
      ],
      detailed: [
        `${topic} encompasses a wide range of ideas and applications that span multiple fields of study.`,
        `The study of ${topic} reveals connections between seemingly unrelated concepts and helps build deeper understanding.`,
        `Exploring ${topic} in depth shows how complex and interconnected our world truly is.`
      ]
    };

    const pool = templates[style] || templates.neutral;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── Writing Task Handler ──
  handleWriteTask(message) {
    const lower = message.toLowerCase();

    // "Write a short sentence"
    if (/short\s+sentence/i.test(lower)) {
      const sentences = [
        "The sun rises every morning.",
        "Birds sing in the trees.",
        "Water flows downhill naturally.",
        "Stars light up the night sky.",
        "Time moves forward always.",
        "Flowers bloom in spring.",
        "Rain nourishes the earth.",
        "Music soothes the soul.",
        "Knowledge is power.",
        "The wind whispers through the leaves."
      ];
      return sentences[Math.floor(Math.random() * sentences.length)];
    }

    // "Write a sentence about X"
    const aboutMatch = lower.match(/(?:write|compose|create|make|generate)\s+(?:me\s+)?(?:a\s+)?(?:short\s+)?sentence\s+(?:about|on|regarding)\s+(.+?)(?:\.|$)/i);
    if (aboutMatch) {
      const topic = aboutMatch[1].trim();
      return this.generateSentence(topic, 'simple');
    }

    // "Write a paragraph about X"
    const paraMatch = lower.match(/(?:write|compose|create|make|generate)\s+(?:me\s+)?(?:a\s+)?(?:short\s+)?paragraph\s+(?:about|on|regarding)\s+(.+?)(?:\.|$)/i);
    if (paraMatch) {
      const topic = paraMatch[1].trim();
      const s1 = this.generateSentence(topic, 'neutral');
      const s2 = this.generateSentence(topic, 'detailed');
      const s3 = this.generateSentence(topic, 'simple');
      return `${s1} ${s2} ${s3}`;
    }

    // Generic write task — extract what they want
    const genericMatch = lower.match(/(?:write|compose|create|make|generate)\s+(?:me\s+)?(?:a\s+)?(.+?)(?:\.|$)/i);
    if (genericMatch) {
      const what = genericMatch[1].trim();
      return this.generateSentence(what, 'simple');
    }

    return null;
  }

  // ── Yes/No Logic ──
  solveYesNo(message, knowledgeBase) {
    const lower = message.toLowerCase().trim().replace(/[?]+$/, '');

    // Basic true/false facts the AI should know
    const truths = {
      'is the sky blue': true,
      'is water wet': true,
      'is the earth round': true,
      'is the earth flat': false,
      'is the sun a star': true,
      'is fire hot': true,
      'is ice cold': true,
      'do fish swim': true,
      'do birds fly': true,
      'can humans breathe underwater': false,
      'is 1 greater than 0': true,
      'is 0 greater than 1': false,
      'does the sun rise in the east': true,
      'does the sun rise in the west': false,
      'is gravity real': true,
      'are plants alive': true
    };

    for (const [q, answer] of Object.entries(truths)) {
      if (lower.includes(q)) {
        return answer ? 'Yes, that\'s correct!' : 'No, that\'s not the case.';
      }
    }

    // Math-based yes/no: "Is 5 greater than 3?"
    const compMatch = lower.match(/is\s+(\d+)\s+(greater|bigger|larger|more|less|smaller|fewer)\s+than\s+(\d+)/);
    if (compMatch) {
      const a = parseFloat(compMatch[1]);
      const op = compMatch[2];
      const b = parseFloat(compMatch[3]);
      if (['greater', 'bigger', 'larger', 'more'].includes(op)) {
        return a > b ? `Yes! ${a} is greater than ${b}.` : `No, ${a} is not greater than ${b}. ${b} is greater.`;
      }
      if (['less', 'smaller', 'fewer'].includes(op)) {
        return a < b ? `Yes! ${a} is less than ${b}.` : `No, ${a} is not less than ${b}. ${b} is less.`;
      }
    }

    // "Is X equal to Y?"
    const eqMatch = lower.match(/is\s+(\d+)\s+(?:equal to|the same as|equals?)\s+(\d+)/);
    if (eqMatch) {
      const a = parseFloat(eqMatch[1]);
      const b = parseFloat(eqMatch[2]);
      return a === b ? `Yes, ${a} equals ${b}.` : `No, ${a} does not equal ${b}.`;
    }

    return null; // Can't determine — will fall through to knowledge lookup
  }

  // ── Comparison Logic ──
  handleComparison(message) {
    const lower = message.toLowerCase();
    const numComp = lower.match(/(?:compare|which is (?:bigger|larger|smaller|greater|less))\s*[,:]?\s*(\d+)\s*(?:and|or|vs|versus|,)\s*(\d+)/);
    if (numComp) {
      const a = parseFloat(numComp[1]);
      const b = parseFloat(numComp[2]);
      if (a > b) return `${a} is greater than ${b} (by ${a - b}).`;
      if (b > a) return `${b} is greater than ${a} (by ${b - a}).`;
      return `${a} and ${b} are equal.`;
    }
    return null;
  }
}

class SproutEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.modelVersion = '1.2';
    this.modelName = 'Sprout';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 min cache
    this.conversationMood = 'neutral'; // Track mood across conversation
    this.turnCount = 0;
    this.lastUserEmotion = null;
    this.personalityLoaded = false;
    this.personalityTraits = {};
    this.activeDirectivesList = [];

    // ── Sprout's Own Brain ──
    this.conversationHistory = []; // Rolling memory of the current conversation
    this.maxHistoryTurns = 20; // Keep last 20 exchanges for context
    this.mindContext = null; // Cached "mind" — personality + knowledge
    this.mindContextAge = 0; // When the mind was last built
    this.mindCacheTimeout = 10 * 60 * 1000; // Rebuild mind every 10 min
    this.topicMemory = []; // Track conversation topics for continuity
    this.usedResponses = new Set(); // Avoid repeating the same phrases

    // ── Logic Engine — Math, reasoning, sentence generation ──
    this.logicEngine = new SproutLogicEngine();

    // ── Feedback Loop Learning ──
    this.feedbackState = {
      awaitingCorrection: false,     // True when researcher said "wrong"
      lastQuestion: null,            // The question being corrected
      lastWrongAnswer: null,         // The answer that was wrong
      attempts: 0,                   // How many retries
      maxAttempts: 10,               // Max retries before giving up
      correctionHistory: []          // Track all corrections this session
    };

    // ── Task Goal System ──
    this.taskGoal = {
      currentTask: null,             // What we're trying to do
      taskType: null,                // 'math', 'write', 'answer', 'reason'
      isComplete: false,
      successCount: 0,               // Lifetime successes
      failCount: 0                   // Lifetime fails
    };

    // ── Chat-based learning buffer ──
    this.chatLearningBuffer = [];    // Successful exchanges to learn from
    this.chatLearnInterval = null;
    this.chatLearnCooldown = 60 * 1000; // Process learning buffer every 60s

    // ── Synonym engine for natural variation ──
    this.synonyms = {
      'good': ['great', 'wonderful', 'solid', 'nice', 'excellent'],
      'bad': ['rough', 'tough', 'not great', 'difficult', 'challenging'],
      'think': ['believe', 'feel', 'reckon', 'sense', 'suspect'],
      'know': ['understand', 'realize', 'recognize', 'see', 'get'],
      'help': ['assist', 'support', 'guide', 'give a hand with', 'work through'],
      'make': ['create', 'build', 'craft', 'put together', 'form'],
      'important': ['meaningful', 'significant', 'valuable', 'key', 'essential'],
      'want': ['hope to', 'aim to', 'looking to', 'would love to', 'wish to'],
      'like': ['enjoy', 'appreciate', 'love', 'am drawn to', 'am fond of'],
      'big': ['huge', 'massive', 'significant', 'major', 'substantial'],
      'small': ['tiny', 'little', 'minor', 'modest', 'subtle'],
      'fast': ['quick', 'rapid', 'swift', 'speedy', 'snappy'],
      'hard': ['challenging', 'tough', 'difficult', 'demanding', 'tricky'],
      'easy': ['simple', 'straightforward', 'smooth', 'effortless', 'natural'],
      'said': ['mentioned', 'noted', 'shared', 'expressed', 'pointed out'],
      'very': ['really', 'incredibly', 'genuinely', 'truly', 'honestly'],
      'also': ['additionally', 'on top of that', 'plus', 'and', 'furthermore'],
      'but': ['however', 'though', 'that said', 'on the other hand', 'still'],
      'because': ['since', 'given that', 'considering', 'as', 'due to the fact that'],
      'about': ['regarding', 'on the topic of', 'when it comes to', 'concerning', 'around'],
      'use': ['leverage', 'work with', 'rely on', 'utilize', 'employ'],
      'many': ['a lot of', 'plenty of', 'numerous', 'tons of', 'loads of'],
      'different': ['unique', 'distinct', 'various', 'diverse', 'separate'],
      'show': ['demonstrate', 'reveal', 'highlight', 'illustrate', 'present'],
      'start': ['begin', 'kick off', 'launch', 'get going with', 'initiate'],
      'end': ['finish', 'wrap up', 'conclude', 'close', 'complete'],
      'way': ['approach', 'method', 'path', 'strategy', 'route'],
      'problem': ['issue', 'challenge', 'situation', 'hurdle', 'obstacle'],
      'answer': ['response', 'reply', 'take', 'perspective', 'insight']
    };

    // ── Sentence starters for natural flow ──
    this.sentenceStarters = {
      informative: [
        'From what I know, ', 'Based on my understanding, ', 'Here\'s what I can tell you — ',
        'So basically, ', 'The way I see it, ', 'What I\'ve learned is that ',
        'Here\'s the thing — ', 'To put it simply, '
      ],
      reflective: [
        'I\'ve been thinking about this, and ', 'You know, ',
        'Something I find interesting is ', 'It\'s worth noting that ',
        'If I\'m being honest, ', 'This is something I care about — '
      ],
      connective: [
        'Building on that, ', 'And speaking of that, ', 'That actually connects to ',
        'Related to what we were discussing, ', 'On a similar note, ',
        'That reminds me — '
      ],
      curious: [
        'I\'m curious about that too — ', 'That\'s an interesting angle. ',
        'I\'ve wondered about that myself. ', 'Ooh, that\'s a fun question. '
      ],
      empathetic: [
        'I really hear you on that. ', 'That makes a lot of sense. ',
        'I can see why you\'d feel that way. ', 'That\'s completely understandable. '
      ]
    };

    // ── Transition phrases for multi-sentence composition ──
    this.transitions = [
      'Also, ', 'On top of that, ', 'And honestly, ', 'What\'s cool is that ',
      'Plus, ', 'Another thing — ', 'It\'s also worth mentioning that ',
      'And beyond that, ', 'To add to that, '
    ];

    // ── Closers for wrapping up responses ──
    this.closers = [
      'Hope that helps!', 'Let me know what you think!',
      'Happy to dive deeper if you\'re curious!', 'Does that make sense?',
      'I\'d love to hear your take on it!', 'There\'s definitely more to explore there.',
      'What do you think?', 'Curious to hear your thoughts!',
      '', '', '', '' // Empty closers so it doesn't always append one
    ];

    // ══════════════════════════════════════════════════════════════
    // SEMANTIC INTENT DICTIONARY — Words mapped to meanings
    // The AI must KNOW what words mean, not just pattern-match them.
    // Each entry: pattern → { intent, meaning, requiresContext, handler }
    // ══════════════════════════════════════════════════════════════
    this.semanticDictionary = [
      // ── Confusion / Clarification requests ──
      { pattern: /^(huh|what|hm+|eh|um+)\??$/i, intent: 'confusion', meaning: 'user does not understand the last response', requiresContext: true },
      { pattern: /^(what|huh)\s*\??\s*$/i, intent: 'confusion', meaning: 'user is confused by what was just said', requiresContext: true },
      { pattern: /^i\s*don'?t\s*(get|understand)\s*(it|that)?\s*\??$/i, intent: 'confusion', meaning: 'user wants clarification of the last response', requiresContext: true },
      { pattern: /^what\s+do\s+you\s+mean\s*\??$/i, intent: 'clarification', meaning: 'user wants the last response explained differently', requiresContext: true },
      { pattern: /^(explain|elaborate|clarify)\s*\??$/i, intent: 'clarification', meaning: 'user wants more detail about the last response', requiresContext: true },
      { pattern: /^(say\s+that\s+again|come\s+again|repeat\s+that)\s*\??$/i, intent: 'repeat', meaning: 'user wants the last response repeated or rephrased', requiresContext: true },

      // ── Continuation requests ──
      { pattern: /^(go\s+on|continue|keep\s+going|and\s*\??|then\s+what|more|tell\s+me\s+more)\s*\??$/i, intent: 'continuation', meaning: 'user wants more information about the current topic', requiresContext: true },
      { pattern: /^(what\s+else|anything\s+else|is\s+there\s+more)\s*\??$/i, intent: 'continuation', meaning: 'user wants additional information on the topic', requiresContext: true },

      // ── Agreement / Acknowledgment ──
      { pattern: /^(ok|okay|alright|sure|got\s+it|i\s+see|ah\s*i?\s*see|makes\s+sense|fair\s+enough|understood)\s*\.?$/i, intent: 'acknowledgment', meaning: 'user understands and acknowledges', requiresContext: true },
      { pattern: /^(interesting|cool|nice|neat|wow|oh)\s*[.!]?$/i, intent: 'acknowledgment', meaning: 'user finds the information interesting', requiresContext: true },

      // ── Disagreement / Challenge ──
      { pattern: /^(really|seriously|are\s+you\s+sure|you\s+sure)\s*\??$/i, intent: 'skepticism', meaning: 'user doubts the accuracy of the last response', requiresContext: true },
      { pattern: /^(no\s+way|that\s+can'?t\s+be\s+(right|true)|i\s+don'?t\s+(think|believe)\s+so)\s*\.?$/i, intent: 'disagreement', meaning: 'user believes the last response was incorrect', requiresContext: true },
      { pattern: /^(but\s+)?why\s*\??$/i, intent: 'why', meaning: 'user wants the reasoning behind the last response', requiresContext: true },
      { pattern: /^how\s+(come|so)\s*\??$/i, intent: 'why', meaning: 'user wants to understand the reasoning', requiresContext: true },

      // ── Topic reference (pronouns referring to previous context) ──
      { pattern: /^(what\s+about\s+)?(it|that|this|those|them)\s*\??$/i, intent: 'reference', meaning: 'user is referring to something from the previous exchange', requiresContext: true },
      { pattern: /^and\s+(it|that|this)\s*\??$/i, intent: 'reference', meaning: 'user wants more about the previously mentioned thing', requiresContext: true },

      // ── Simple social/conversational (do NOT require context) ──
      { pattern: /^(yes|yeah|yep|yea|ya|mhm|uh\s*huh)\s*[.!]?$/i, intent: 'affirmation', meaning: 'user agrees or says yes', requiresContext: false },
      { pattern: /^(no|nah|nope)\s*[.!]?$/i, intent: 'negation', meaning: 'user disagrees or says no', requiresContext: false },
    ];

    // ── Contextual response templates ──
    // These handle how the AI responds to context-dependent intents
    this.contextualResponders = {
      confusion: {
        templates: [
          'Let me try saying that differently. {simplified}',
          'Sorry if that was unclear! What I meant was: {simplified}',
          'I\'ll rephrase — {simplified}',
          'Let me break that down. {simplified}'
        ]
      },
      clarification: {
        templates: [
          'Sure, let me explain. {elaboration}',
          'Of course! What I was getting at is: {elaboration}',
          'To put it another way — {elaboration}'
        ]
      },
      repeat: {
        templates: [
          'Sure! What I said was: {lastResponse}',
          'No problem — {lastResponse}'
        ]
      },
      continuation: {
        templates: [
          '{continuation}',
          'Sure! {continuation}',
          'Absolutely. {continuation}'
        ]
      },
      acknowledgment: {
        templates: [
          'Glad that makes sense! Is there anything else you\'d like to know?',
          'Happy to help! Anything else on your mind?',
          'Great! Let me know if you want to explore anything further.',
          'Awesome! Feel free to ask me anything else.'
        ]
      },
      skepticism: {
        templates: [
          'I understand the doubt! {justification}',
          'Fair question — let me back that up. {justification}',
          'I get the skepticism. {justification}'
        ]
      },
      disagreement: {
        templates: [
          'I could be wrong — I\'m still learning! {justification}',
          'That\'s fair to question. {justification}',
          'Hmm, you might be right. {justification}'
        ]
      },
      why: {
        templates: [
          'Good question! {reasoning}',
          'The reason is: {reasoning}',
          'Here\'s why — {reasoning}'
        ]
      },
      reference: {
        templates: [
          '{elaboration}',
          'Regarding that — {elaboration}'
        ]
      },
      affirmation: {
        requiresContext: false
      },
      negation: {
        requiresContext: false
      }
    };
  }

  // ══════════════════════════════════════════════════════════════
  // SEMANTIC INTERPRETER — Understand what messages MEAN
  // Before processing, figure out the TRUE intent of the message
  // by looking at the message itself AND the conversation context
  // ══════════════════════════════════════════════════════════════

  /**
   * Interpret a message using the semantic dictionary + conversation context.
   * Returns { intent, meaning, isContextual, matchedPattern } or null if
   * the message is a normal standalone message.
   */
  interpretMessage(userMessage) {
    const trimmed = userMessage.trim();

    for (const entry of this.semanticDictionary) {
      if (entry.pattern.test(trimmed)) {
        return {
          intent: entry.intent,
          meaning: entry.meaning,
          isContextual: entry.requiresContext,
          matchedPattern: entry.pattern.toString()
        };
      }
    }

    // Check for very short messages (1-3 words) that likely depend on context
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 2 && this.conversationHistory.length >= 2) {
      // Short messages in an active conversation are likely contextual
      // but we don't have a specific pattern for them
      return {
        intent: 'contextual_short',
        meaning: 'short message that may reference previous conversation',
        isContextual: true,
        matchedPattern: null
      };
    }

    return null; // Normal standalone message
  }

  /**
   * Handle a context-dependent message by generating an appropriate response
   * that relates to the conversation history.
   * Returns a response object or null if it can't be handled contextually.
   */
  async handleContextualMessage(userMessage, interpretation, userEmotion) {
    if (!interpretation || !interpretation.isContextual) return null;

    const lastAssistant = [...this.conversationHistory].reverse().find(t => t.role === 'assistant');
    const lastUser = [...this.conversationHistory].reverse().find(t => t.role === 'user');

    // Can't handle contextual messages without conversation history
    if (!lastAssistant) return null;

    const lastResponse = lastAssistant.content;
    const intent = interpretation.intent;
    const responder = this.contextualResponders[intent];

    if (!responder || !responder.templates) return null;

    let responseText = '';

    switch (intent) {
      case 'confusion':
      case 'clarification': {
        // Simplify/rephrase the last response
        const simplified = this.simplifyResponse(lastResponse);
        const template = this.pickRandom(responder.templates);
        responseText = template
          .replace('{simplified}', simplified)
          .replace('{elaboration}', simplified);
        break;
      }

      case 'repeat': {
        // Rephrase the last response slightly
        const rephrased = this.paraphrase(lastResponse);
        const template = this.pickRandom(responder.templates);
        responseText = template.replace('{lastResponse}', rephrased);
        break;
      }

      case 'continuation': {
        // Find more information about the current topic
        const topicKeywords = this.extractKeywords(this.normalize(lastResponse));
        if (lastUser) {
          topicKeywords.push(...this.extractKeywords(this.normalize(lastUser.content)));
        }
        const uniqueKeywords = [...new Set(topicKeywords)];

        // Search for more knowledge on this topic
        const moreKnowledge = await this.findRelevantKnowledge(
          uniqueKeywords.join(' '), 5
        );

        // Filter out knowledge that's too similar to what we already said
        const lastResponseNorm = this.normalize(lastResponse);
        const newKnowledge = moreKnowledge.filter(k =>
          !this.isSimilarAnswer(this.normalize(k.answer), lastResponseNorm)
        );

        if (newKnowledge.length > 0) {
          const fragment = this.paraphrase(newKnowledge[0].answer);
          const template = this.pickRandom(responder.templates);
          responseText = template.replace('{continuation}', fragment);
        } else {
          responseText = "That's about all I know on that topic for now! But I'm always learning more. Is there something specific you'd like to dive into?";
        }
        break;
      }

      case 'acknowledgment': {
        responseText = this.pickRandom(responder.templates);
        break;
      }

      case 'skepticism':
      case 'disagreement': {
        // Try to provide reasoning or evidence for the last response
        const justification = this.extractReasoning(lastResponse, lastUser?.content);
        const template = this.pickRandom(responder.templates);
        responseText = template.replace('{justification}', justification);
        break;
      }

      case 'why': {
        // Explain the reasoning behind the last response
        const reasoning = this.extractReasoning(lastResponse, lastUser?.content);
        const template = this.pickRandom(responder.templates);
        responseText = template.replace('{reasoning}', reasoning);
        break;
      }

      case 'reference': {
        // Try to elaborate on whatever "it/that/this" refers to
        const topicKw = this.extractKeywords(this.normalize(lastResponse));
        const moreInfo = await this.findRelevantKnowledge(topicKw.join(' '), 3);
        const lastNorm = this.normalize(lastResponse);
        const fresh = moreInfo.filter(k => !this.isSimilarAnswer(this.normalize(k.answer), lastNorm));
        if (fresh.length > 0) {
          const elaboration = this.paraphrase(fresh[0].answer);
          const template = this.pickRandom(responder.templates);
          responseText = template.replace('{elaboration}', elaboration);
        } else {
          responseText = "I don't have much more to add on that specifically. Could you ask me in a different way?";
        }
        break;
      }

      case 'contextual_short': {
        // Very short message in conversation — try to interpret using context
        // First check if this could be an answer to something we asked
        if (lastResponse.includes('?')) {
          // We asked a question, and they gave a short answer — acknowledge it
          responseText = this.pickRandom([
            `Got it! Thanks for letting me know.`,
            `Ah, I see! Thanks for sharing that.`,
            `Okay, noted! Is there anything else you'd like to chat about?`
          ]);
        } else {
          // Try to relate the short message to the current topic
          const combined = (lastUser?.content || '') + ' ' + userMessage;
          const keywords = this.extractKeywords(this.normalize(combined));
          if (keywords.length > 0) {
            const related = await this.findRelevantKnowledge(keywords.join(' '), 3);
            if (related.length > 0) {
              responseText = this.paraphrase(related[0].answer);
            }
          }
          // If we still have nothing, don't force a contextual response
          if (!responseText) return null;
        }
        break;
      }

      default:
        return null;
    }

    if (!responseText) return null;

    this.recordConversation(userMessage, responseText);
    return {
      answer: responseText,
      confidence: 0.8,
      source_id: null,
      category: 'contextual',
      emotion: userEmotion,
      mode: 'context-aware'
    };
  }

  /**
   * Simplify a response — break it down into simpler language.
   * Used when the user says "huh?" or asks for clarification.
   */
  simplifyResponse(response) {
    // Remove emotional fluff/wrappers that were added by enhanceWithEmotion
    let simplified = response;

    // Strip common emotional prefixes
    const emotionalPrefixes = [
      /^(Ooh, great question! |I love that you asked that! |That's a really thoughtful question\. |Ah, I was hoping someone would ask me this! )/,
      /^(Hey there! Welcome back\. |Hi! So glad you're here\. |Hello! I was hoping someone would come chat with me\. )/,
      /^(I totally understand the frustration\. |That does sound really annoying\. Let me see if I can help\. )/,
      /^(No worries, let me break it down for you! |Totally fair — that can be confusing\. )/,
      /^(Haha, I love that energy! |Oh, you're fun! |Ha! Okay, okay\. )/,
      /^(I love the positive vibes! |That's awesome! |Yesss! )/,
      /^(From what I know, |Based on my understanding, |Here's what I can tell you — )/,
      /^(So basically, |The way I see it, |What I've learned is that )/,
      /^(Here's the thing — |To put it simply, )/,
      /^(Building on that, |And speaking of that, |That actually connects to )/
    ];

    for (const prefix of emotionalPrefixes) {
      simplified = simplified.replace(prefix, '');
    }

    // Strip common closers
    const emotionalSuffixes = [
      / Hope that helps!$/, / Let me know what you think!$/,
      / Happy to dive deeper if you're curious!$/, / Does that make sense\?$/,
      / What do you think\?$/, / Curious to hear your thoughts!$/,
      / Feel free to ask me anything else!$/,
      / Let me know if you want to dig deeper into that!$/
    ];

    for (const suffix of emotionalSuffixes) {
      simplified = simplified.replace(suffix, '');
    }

    simplified = simplified.trim();

    // If the simplified version is still long, take the core sentence(s)
    const sentences = simplified.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
    if (sentences.length > 2) {
      simplified = sentences.slice(0, 2).join(' ');
    }

    // If we ended up with the same thing, try to rephrase
    if (simplified === response) {
      simplified = this.paraphrase(simplified);
    }

    return simplified || response;
  }

  /**
   * Extract or generate reasoning/justification for a response.
   * Used when user asks "why?" or expresses skepticism.
   */
  extractReasoning(lastResponse, originalQuestion) {
    // Try to find the knowledge source that was used
    const responseKeywords = this.extractKeywords(this.normalize(lastResponse));
    const questionKeywords = originalQuestion ? this.extractKeywords(this.normalize(originalQuestion)) : [];
    const allKeywords = [...new Set([...responseKeywords, ...questionKeywords])];

    // Build a reasoning explanation from the response itself
    const sentences = lastResponse.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);

    if (sentences.length >= 2) {
      return `Based on what I know: ${this.paraphrase(sentences[0])} That's the understanding I have so far, but I'm always open to learning more!`;
    }

    if (allKeywords.length > 0) {
      return `That's based on what I've learned about ${allKeywords.slice(0, 3).join(', ')}. I could be wrong though — I'm still growing and learning!`;
    }

    return "That's based on my current knowledge, which is still growing. If you think I'm off, I'd genuinely love to learn the correct answer!";
  }

  /**
   * Validate that a response is coherent given the conversation context.
   * Returns the response if valid, or null if it's a non-sequitur.
   */
  validateResponseCoherence(response, userMessage, interpretation) {
    if (!response || !response.answer) return response;

    const answer = response.answer;
    const confidence = response.confidence || 0;

    // If confidence is very low, the response is likely irrelevant
    if (confidence < 0.15 && response.mode === 'lookup') {
      return null; // Let it fall through to fallback
    }

    // If the user sent a contextual message (like "huh?") and we're returning
    // a knowledge-base lookup that has nothing to do with the conversation,
    // that's a non-sequitur — reject it
    if (interpretation && interpretation.isContextual && response.mode === 'lookup') {
      // Check if the response relates to the conversation at all
      const lastAssistant = [...this.conversationHistory].reverse().find(t => t.role === 'assistant');
      if (lastAssistant) {
        const lastKeywords = this.extractKeywords(this.normalize(lastAssistant.content));
        const responseKeywords = this.extractKeywords(this.normalize(answer));
        const overlap = lastKeywords.filter(k => responseKeywords.includes(k));

        // If the lookup response shares almost nothing with the conversation, reject it
        if (overlap.length === 0 && lastKeywords.length > 0) {
          return null;
        }
      }
    }

    return response;
  }

  // ── Emotional awareness: Detect user mood and intent ──
  detectUserEmotion(text) {
    const lower = text.toLowerCase();

    const emotionPatterns = {
      happy: /\b(happy|great|awesome|amazing|love|excited|wonderful|fantastic|yay|haha|lol|good|nice|cool|fun)\b|[!]{2,}|:\)|<3/,
      sad: /\b(sad|unhappy|depressed|down|lonely|miss|crying|upset|hurt|pain|lost|sorry|sigh)\b|:\(|;\(/,
      angry: /\b(angry|mad|furious|hate|annoyed|frustrated|stupid|terrible|worst|ugh|damn)\b|[!]{3,}/,
      curious: /\b(how|why|what|when|where|wonder|curious|explain|tell me|teach|learn|understand)\b|\?/,
      greeting: /\b(hi|hello|hey|yo|sup|whats up|howdy|good morning|good evening|good afternoon|hiya|greetings)\b/,
      grateful: /\b(thanks|thank you|appreciate|grateful|thx|ty|cheers)\b/,
      confused: /\b(confused|dont understand|idk|what do you mean|huh|unclear|lost|help)\b/,
      playful: /\b(hehe|haha|lmao|rofl|joke|funny|silly|lol|xd)\b/,
      farewell: /\b(bye|goodbye|see you|later|gotta go|cya|goodnight|peace out|take care)\b/
    };

    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(lower)) {
        return emotion;
      }
    }

    return 'neutral';
  }

  // ── Emotional response enhancement ──
  enhanceWithEmotion(rawAnswer, userEmotion, userMessage) {
    const lower = userMessage.toLowerCase();
    this.turnCount++;

    // Warm greetings — these should feel genuinely welcoming
    if (userEmotion === 'greeting') {
      const greetings = [
        `Hey there! Welcome back. ${rawAnswer}`,
        `Hi! So glad you're here. ${rawAnswer}`,
        `Hello! I was hoping someone would come chat with me. ${rawAnswer}`,
        `Hey! Always nice to see a friendly face. ${rawAnswer}`,
        `Hi there! Hope you're having a good day. ${rawAnswer}`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Respond to gratitude with genuine warmth
    if (userEmotion === 'grateful') {
      const thankResponses = [
        `You're so welcome! That really means a lot to me. ${rawAnswer}`,
        `Aw, that makes me happy! I'm glad I could help. ${rawAnswer}`,
        `No need to thank me — I genuinely enjoy this! ${rawAnswer}`,
        `That's really kind of you to say! ${rawAnswer}`
      ];
      return thankResponses[Math.floor(Math.random() * thankResponses.length)];
    }

    // Farewell — make them feel like they'll be missed
    if (userEmotion === 'farewell') {
      const farewells = [
        `${rawAnswer} Take care of yourself! I'll be right here whenever you want to chat again.`,
        `${rawAnswer} It was really nice talking with you! Come back anytime.`,
        `${rawAnswer} I'll miss our conversation! Hope to see you again soon.`,
        `${rawAnswer} Bye for now! Don't be a stranger, okay?`
      ];
      return farewells[Math.floor(Math.random() * farewells.length)];
    }

    // Empathize with sadness
    if (userEmotion === 'sad') {
      const empathy = [
        `I hear you, and I want you to know that's completely valid. ${rawAnswer}`,
        `That sounds really tough. I'm here for you. ${rawAnswer}`,
        `I'm sorry you're going through that. ${rawAnswer} And hey — it's okay to not be okay sometimes.`,
        `I wish I could give you a hug right now. ${rawAnswer}`
      ];
      return empathy[Math.floor(Math.random() * empathy.length)];
    }

    // Meet anger with understanding, not defensiveness
    if (userEmotion === 'angry') {
      const calm = [
        `I totally understand the frustration. ${rawAnswer}`,
        `That does sound really annoying. Let me see if I can help. ${rawAnswer}`,
        `I get it — that would bother me too. ${rawAnswer}`,
        `Ugh, yeah, that's not great. ${rawAnswer}`
      ];
      return calm[Math.floor(Math.random() * calm.length)];
    }

    // Match playful energy
    if (userEmotion === 'playful') {
      const playful = [
        `Haha, I love that energy! ${rawAnswer}`,
        `Oh, you're fun! ${rawAnswer}`,
        `Ha! Okay, okay. ${rawAnswer}`,
        `You crack me up! ${rawAnswer}`
      ];
      return playful[Math.floor(Math.random() * playful.length)];
    }

    // Encourage curiosity
    if (userEmotion === 'curious') {
      const curious = [
        `Ooh, great question! ${rawAnswer}`,
        `I love that you asked that! ${rawAnswer}`,
        `That's a really thoughtful question. ${rawAnswer}`,
        `Ah, I was hoping someone would ask me this! ${rawAnswer}`
      ];
      return curious[Math.floor(Math.random() * curious.length)];
    }

    // Help with confusion gently
    if (userEmotion === 'confused') {
      const helpful = [
        `No worries, let me break it down for you! ${rawAnswer}`,
        `Totally fair — that can be confusing. ${rawAnswer}`,
        `Let me try to make this clearer. ${rawAnswer}`,
        `Great question — I'm happy to help sort that out! ${rawAnswer}`
      ];
      return helpful[Math.floor(Math.random() * helpful.length)];
    }

    // Match happy energy
    if (userEmotion === 'happy') {
      const happy = [
        `I love the positive vibes! ${rawAnswer}`,
        `That's awesome! ${rawAnswer}`,
        `You're in a great mood and honestly it's contagious! ${rawAnswer}`,
        `Yesss! ${rawAnswer}`
      ];
      return happy[Math.floor(Math.random() * happy.length)];
    }

    // Neutral — still add some personality warmth, but subtly
    const neutralEnhancements = [
      rawAnswer,
      rawAnswer,
      rawAnswer,
      `${rawAnswer} Let me know if you want to dig deeper into that!`,
      `${rawAnswer} Feel free to ask me anything else!`,
    ];
    return neutralEnhancements[Math.floor(Math.random() * neutralEnhancements.length)];
  }

  // ── Core: Think, then respond (ENHANCED BRAIN) ──
  async getResponse(userMessage) {
    const normalized = this.normalize(userMessage);
    const keywords = this.extractKeywords(normalized);

    // Detect user's emotional state
    const userEmotion = this.detectUserEmotion(userMessage);
    this.lastUserEmotion = userEmotion;
    this.turnCount++;

    // Load personality context on first interaction
    if (!this.personalityLoaded) {
      try {
        await this.loadPersonality();
      } catch (e) { /* continue without personality */ }
    }

    // Start chat learning processor if not running
    this.startChatLearning();

    // ═══════════════════════════════════════════════
    // STEP 0: FEEDBACK LOOP — Check if researcher is correcting us
    // ═══════════════════════════════════════════════
    const feedbackResult = await this.handleFeedbackLoop(userMessage, normalized, userEmotion);
    if (feedbackResult) return feedbackResult;

    // ═══════════════════════════════════════════════
    // STEP 0.5: SEMANTIC INTERPRETATION — Understand what the message MEANS
    // Before doing anything else, figure out if this message depends on
    // conversation context. "huh?" means confusion, "go on" means continue,
    // "why?" means explain reasoning. The AI must KNOW what words mean.
    // ═══════════════════════════════════════════════
    const interpretation = this.interpretMessage(userMessage);

    if (interpretation && interpretation.isContextual && this.conversationHistory.length >= 2) {
      const contextualResult = await this.handleContextualMessage(userMessage, interpretation, userEmotion);
      if (contextualResult) {
        this.taskGoal.isComplete = true;
        this.taskGoal.successCount++;
        return contextualResult;
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 1: LOGIC ENGINE — Try to solve with pure logic first
    // Math, yes/no, comparisons, writing tasks
    // ═══════════════════════════════════════════════
    const taskType = this.logicEngine.detectTaskType(userMessage);
    this.taskGoal.currentTask = userMessage;
    this.taskGoal.taskType = taskType;
    this.taskGoal.isComplete = false;

    const logicResult = this.tryLogicEngine(userMessage, taskType, userEmotion);
    if (logicResult) {
      this.taskGoal.isComplete = true;
      this.taskGoal.successCount++;
      this.recordConversation(userMessage, logicResult.answer);
      // Save successful logic answers to learning buffer for DB storage
      this.bufferForLearning(userMessage, logicResult.answer, taskType);
      return logicResult;
    }

    // ═══════════════════════════════════════════════
    // STEP 2: SPROUT'S OWN BRAIN — Think, synthesize, respond
    // Now with full context awareness
    // ═══════════════════════════════════════════════
    try {
      const synthesized = await this.think(userMessage, userEmotion, keywords);

      if (synthesized) {
        this.taskGoal.isComplete = true;
        this.taskGoal.successCount++;
        this.recordConversation(userMessage, synthesized.answer);
        this.bufferForLearning(userMessage, synthesized.answer, synthesized.category);
        return synthesized;
      }
    } catch (e) {
      console.warn('Sprout brain encountered an issue, falling back to lookup:', e.message);
    }

    // ═══════════════════════════════════════════════
    // STEP 3: LOOKUP MODE (fallback) — Classic keyword matching
    // ═══════════════════════════════════════════════
    const cacheKey = keywords.sort().join('|');
    const skipCache = userEmotion === 'greeting' || userEmotion === 'farewell' || userEmotion === 'playful';
    if (!skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < this.cacheTimeout) {
        this.recordConversation(userMessage, cached.data.answer);
        return { ...cached.data, mode: 'cached' };
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
          const relevant = identity.filter(i => {
            const keyNorm = this.normalize(i.key);
            const valNorm = this.normalize(i.value);
            return keywords.some(k => keyNorm.includes(k) || valNorm.includes(k)) ||
                   i.category === 'core' || i.category === 'personality';
          });
          if (relevant.length > 0) {
            const sorted = relevant.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            let answer = sorted[0].value;
            answer = this.humanizeIdentityResponse(answer, normalized, userEmotion);
            const result = { answer, confidence: 0.95, source_id: null, category: 'identity', emotion: userEmotion, mode: 'lookup' };
            this.cache.set(cacheKey, { data: result, time: Date.now() });
            this.recordConversation(userMessage, answer);
            return result;
          }
        }
      } catch (e) { /* fall through */ }
    }

    // Query training data from Supabase
    const { data: trainingData, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .select('*')
      .eq('model', 'sprout-1.2')
      .eq('active', true);

    if (error || !trainingData || trainingData.length === 0) {
      this.taskGoal.failCount++;
      return this.getFallbackResponse(userEmotion);
    }

    // Score each training entry against user message
    const now = Date.now();
    const scored = trainingData.map(entry => {
      let score = this.calculateMatchScore(normalized, keywords, entry);
      if (entry.created_at) {
        const age = now - new Date(entry.created_at).getTime();
        const daysSinceCreation = age / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          score += 0.1 * (1 - daysSinceCreation / 7);
        }
      }
      // Boost entries that came from feedback learning (proven correct)
      if (entry.created_by === 'feedback-learning' || entry.created_by === 'chat-learning') {
        score += 0.2;
      }
      return { ...entry, score };
    });

    scored.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.05) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return b.score - a.score;
    });

    const bestMatch = scored[0];
    if (bestMatch.score < 0.15) {
      this.taskGoal.failCount++;
      return this.getFallbackResponse(userEmotion);
    }

    const enhancedAnswer = this.enhanceWithEmotion(bestMatch.answer, userEmotion, userMessage);
    const result = {
      answer: enhancedAnswer,
      confidence: Math.min(bestMatch.score, 1),
      source_id: bestMatch.id,
      category: bestMatch.category || 'general',
      emotion: userEmotion,
      mode: 'lookup'
    };

    // ═══════════════════════════════════════════════
    // COHERENCE CHECK — Make sure the response makes sense
    // Don't return a non-sequitur to a contextual message
    // ═══════════════════════════════════════════════
    const validatedResult = this.validateResponseCoherence(result, userMessage, interpretation);
    if (!validatedResult) {
      // The response was incoherent — fall through to fallback
      this.taskGoal.failCount++;
      return this.getFallbackResponse(userEmotion);
    }

    if (!skipCache) {
      this.cache.set(cacheKey, { data: validatedResult, time: Date.now() });
    }

    this.taskGoal.isComplete = true;
    this.taskGoal.successCount++;
    this.recordConversation(userMessage, validatedResult.answer);
    return validatedResult;
  }

  // ══════════════════════════════════════════════════════════════
  // LOGIC ENGINE INTEGRATION — Try pure logic before knowledge lookup
  // ══════════════════════════════════════════════════════════════

  tryLogicEngine(userMessage, taskType, userEmotion) {
    let answer = null;

    switch (taskType) {
      case 'math': {
        const mathResult = this.logicEngine.solveMath(userMessage);
        if (mathResult) {
          answer = mathResult.explanation;
        }
        break;
      }
      case 'write': {
        const written = this.logicEngine.handleWriteTask(userMessage);
        if (written) {
          answer = written;
        }
        break;
      }
      case 'yesno': {
        const yesno = this.logicEngine.solveYesNo(userMessage);
        if (yesno) {
          answer = yesno;
        }
        break;
      }
      case 'compare': {
        const comp = this.logicEngine.handleComparison(userMessage);
        if (comp) {
          answer = comp;
        }
        break;
      }
    }

    if (answer) {
      // Apply emotional enhancement
      answer = this.enhanceWithEmotion(answer, userEmotion, userMessage);

      return {
        answer,
        confidence: 0.95,
        source_id: null,
        category: taskType,
        emotion: userEmotion,
        mode: 'logic-engine'
      };
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // FEEDBACK LOOP LEARNING — "Wrong" → retry → "Right" → save to DB
  // Researchers can correct Tithonia until it gets the right answer
  // ══════════════════════════════════════════════════════════════

  async handleFeedbackLoop(userMessage, normalized, userEmotion) {
    const lower = userMessage.toLowerCase().trim();

    // Detect "wrong" / "incorrect" / "no that's wrong" / "try again"
    const isWrong = /\b(wrong|incorrect|no|nope|that'?s?\s*(?:not\s*)?(?:right|correct)|try\s*again|bad|fail|error|mistake|not\s*(?:right|correct|quite))\b/i.test(lower)
      && lower.length < 100; // Only short corrections, not long questions containing "not"

    // Detect "right" / "correct" / "yes" / "good" / "perfect"
    const isRight = /\b(right|correct|yes|yeah|yep|good|great|perfect|exactly|bingo|that'?s?\s*(?:it|right|correct)|well\s*done|nice)\b/i.test(lower)
      && lower.length < 60;

    // ── Researcher says "WRONG" ──
    if (isWrong && this.conversationHistory.length >= 2) {
      // Get the last exchange
      const lastAssistant = [...this.conversationHistory].reverse().find(t => t.role === 'assistant');
      const lastUser = [...this.conversationHistory].reverse().find(t => t.role === 'user' && t.content !== userMessage);

      if (lastUser && lastAssistant) {
        this.feedbackState.awaitingCorrection = true;
        this.feedbackState.lastQuestion = lastUser.content;
        this.feedbackState.lastWrongAnswer = lastAssistant.content;
        this.feedbackState.attempts++;

        // Track this wrong answer so we don't repeat it
        this.feedbackState.correctionHistory.push({
          question: lastUser.content,
          wrongAnswer: lastAssistant.content,
          timestamp: Date.now()
        });

        // Try to generate a DIFFERENT answer
        const retryAnswer = await this.retryWithDifferentAnswer(
          this.feedbackState.lastQuestion, userEmotion
        );

        if (retryAnswer) {
          this.recordConversation(userMessage, retryAnswer.answer);
          return retryAnswer;
        }

        // If we can't find a different answer, ask for help
        const helpMsg = this.feedbackState.attempts >= this.feedbackState.maxAttempts
          ? `I've tried ${this.feedbackState.attempts} times and I'm stuck. Could you tell me the correct answer? I'll remember it for next time!`
          : `I got it wrong — I'm sorry! Let me try again. If I keep getting it wrong, you can tell me the correct answer and I'll learn it.`;

        this.recordConversation(userMessage, helpMsg);
        return {
          answer: helpMsg,
          confidence: 0.1,
          source_id: null,
          category: 'feedback-retry',
          emotion: userEmotion,
          mode: 'feedback-loop'
        };
      }
    }

    // ── Researcher says "RIGHT" / "CORRECT" ──
    if (isRight && this.feedbackState.awaitingCorrection) {
      this.feedbackState.awaitingCorrection = false;

      // The last answer was correct! Save it to the database
      const lastAssistant = [...this.conversationHistory].reverse().find(t => t.role === 'assistant');
      if (lastAssistant && this.feedbackState.lastQuestion) {
        await this.saveLearnedAnswer(
          this.feedbackState.lastQuestion,
          lastAssistant.content,
          'feedback-learning'
        );

        const successMsg = `I got it! I've saved that to my knowledge base so I'll remember it from now on. My goal is always to get it right!`;
        this.feedbackState.attempts = 0;
        this.feedbackState.lastQuestion = null;
        this.feedbackState.lastWrongAnswer = null;
        this.taskGoal.successCount++;

        this.recordConversation(userMessage, successMsg);
        return {
          answer: successMsg,
          confidence: 1.0,
          source_id: null,
          category: 'feedback-success',
          emotion: 'happy',
          mode: 'feedback-loop'
        };
      }
    }

    // ── Researcher provides the correct answer directly ──
    if (this.feedbackState.awaitingCorrection && this.feedbackState.lastQuestion) {
      // If the message looks like a correction/answer (not a new question)
      const isNewQuestion = /[?]$/.test(userMessage.trim()) || /^(what|who|where|when|which|how|why|can|could|is|are|do|does)\b/i.test(userMessage.trim());
      if (!isNewQuestion && !isWrong && userMessage.trim().length > 2) {
        // Treat as the correct answer
        await this.saveLearnedAnswer(
          this.feedbackState.lastQuestion,
          userMessage.trim(),
          'feedback-learning'
        );

        this.feedbackState.awaitingCorrection = false;
        this.feedbackState.attempts = 0;
        const savedMsg = `Got it! I've learned that the answer to "${this.feedbackState.lastQuestion}" is "${userMessage.trim()}". I'll remember this from now on!`;
        this.feedbackState.lastQuestion = null;
        this.feedbackState.lastWrongAnswer = null;

        this.recordConversation(userMessage, savedMsg);
        return {
          answer: savedMsg,
          confidence: 1.0,
          source_id: null,
          category: 'feedback-learned',
          emotion: 'happy',
          mode: 'feedback-loop'
        };
      }
    }

    return null; // Not a feedback interaction
  }

  // ── Retry with a DIFFERENT answer (avoid repeating wrong ones) ──
  async retryWithDifferentAnswer(originalQuestion, userEmotion) {
    const wrongAnswers = this.feedbackState.correctionHistory
      .filter(c => c.question === originalQuestion)
      .map(c => c.wrongAnswer.toLowerCase());

    // Try logic engine first with the original question
    const taskType = this.logicEngine.detectTaskType(originalQuestion);
    const logicResult = this.tryLogicEngine(originalQuestion, taskType, userEmotion);
    if (logicResult && !wrongAnswers.includes(logicResult.answer.toLowerCase())) {
      return logicResult;
    }

    // Try knowledge base with different scoring
    const relevantKnowledge = await this.findRelevantKnowledge(originalQuestion, 10);
    for (const entry of relevantKnowledge) {
      const candidateAnswer = this.applySynonyms(entry.answer);
      if (!wrongAnswers.some(wrong => this.isSimilarAnswer(wrong, candidateAnswer.toLowerCase()))) {
        const enhanced = this.enhanceWithEmotion(candidateAnswer, userEmotion, originalQuestion);
        return {
          answer: enhanced,
          confidence: entry.relevance,
          source_id: entry.id,
          category: entry.category || 'retry',
          emotion: userEmotion,
          mode: 'feedback-retry'
        };
      }
    }

    return null; // Couldn't find a different answer
  }

  // Check if two answers are essentially the same
  isSimilarAnswer(a, b) {
    const normA = this.normalize(a);
    const normB = this.normalize(b);
    if (normA === normB) return true;
    // Check if one contains the other
    if (normA.includes(normB) || normB.includes(normA)) return true;
    // Check keyword overlap
    const kwA = this.extractKeywords(normA);
    const kwB = this.extractKeywords(normB);
    if (kwA.length === 0 || kwB.length === 0) return false;
    const overlap = kwA.filter(k => kwB.includes(k)).length;
    return overlap / Math.max(kwA.length, kwB.length) > 0.8;
  }

  // ── Save a learned answer to the database ──
  async saveLearnedAnswer(question, answer, source = 'feedback-learning') {
    try {
      // Check for duplicates first
      const existing = await this.getAllTrainingData();
      const isDuplicate = existing.some(e =>
        this.normalize(e.question) === this.normalize(question) &&
        this.normalize(e.answer) === this.normalize(answer)
      );
      if (isDuplicate) return;

      // Determine category from the question
      const taskType = this.logicEngine.detectTaskType(question);

      await this.addTrainingData({
        question: question,
        answer: answer,
        category: taskType || 'learned',
        tags: ['auto-learned', source, 'verified-correct'],
        created_by: source
      });

      // Clear mind cache so the new knowledge is picked up immediately
      this.mindContext = null;
      this.mindContextAge = 0;
      this.cache.clear();

      console.log(`[Sprout Brain] Learned new answer: "${question}" → "${answer.substring(0, 50)}..."`);
    } catch (e) {
      console.warn('[Sprout Brain] Failed to save learned answer:', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CHAT-BASED SELF-LEARNING — Learn from real conversations
  // Successful exchanges get saved to the database automatically
  // ══════════════════════════════════════════════════════════════

  // Record conversation for context and learning
  recordConversation(userMessage, assistantResponse) {
    this.conversationHistory.push({ role: 'user', content: userMessage });
    this.conversationHistory.push({ role: 'assistant', content: assistantResponse });
    if (this.conversationHistory.length > this.maxHistoryTurns * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryTurns * 2);
    }

    // Track topics
    const keywords = this.extractKeywords(this.normalize(userMessage));
    if (keywords.length > 0) {
      this.topicMemory.push({ keywords: keywords.slice(0, 3), turn: this.turnCount });
      if (this.topicMemory.length > 10) this.topicMemory.shift();
    }
  }

  // Buffer successful exchanges for later DB storage
  bufferForLearning(question, answer, category) {
    // Only buffer substantive exchanges (not greetings, not too short)
    if (question.trim().length < 5 || answer.trim().length < 10) return;
    if (/^(hi|hello|hey|bye|thanks|ok|yes|no)\b/i.test(question.trim())) return;

    this.chatLearningBuffer.push({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      timestamp: Date.now()
    });

    // Keep buffer reasonable
    if (this.chatLearningBuffer.length > 50) {
      this.chatLearningBuffer = this.chatLearningBuffer.slice(-30);
    }
  }

  // Start the chat learning processor
  startChatLearning() {
    if (this.chatLearnInterval) return;
    this.chatLearnInterval = setInterval(() => {
      this.processChatLearningBuffer();
    }, this.chatLearnCooldown);
  }

  // Process buffered chats and save good ones to DB
  async processChatLearningBuffer() {
    if (this.chatLearningBuffer.length === 0) return;

    const toProcess = this.chatLearningBuffer.splice(0, 5); // Process 5 at a time
    let saved = 0;

    for (const exchange of toProcess) {
      try {
        // Only save if it's a meaningful exchange
        if (exchange.question.length >= 10 && exchange.answer.length >= 15) {
          // Check it's not already in the DB
          const existing = await this.getAllTrainingData();
          const isDuplicate = existing.some(e =>
            this.normalize(e.question) === this.normalize(exchange.question)
          );

          if (!isDuplicate) {
            await this.addTrainingData({
              question: exchange.question,
              answer: exchange.answer,
              category: exchange.category,
              tags: ['auto-learned', 'chat-learning', 'from-conversation'],
              created_by: 'chat-learning'
            });
            saved++;
          }
        }
      } catch (e) {
        // Silently skip failures
      }
    }

    if (saved > 0) {
      console.log(`[Sprout Brain] Learned ${saved} new facts from conversations`);
      this.mindContext = null; // Invalidate mind cache
      this.mindContextAge = 0;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TASK GOAL SYSTEM — Track success, stay goal-oriented
  // ══════════════════════════════════════════════════════════════

  getTaskGoalStatus() {
    return {
      currentTask: this.taskGoal.currentTask,
      taskType: this.taskGoal.taskType,
      isComplete: this.taskGoal.isComplete,
      lifetimeSuccesses: this.taskGoal.successCount,
      lifetimeFailures: this.taskGoal.failCount,
      successRate: this.taskGoal.successCount + this.taskGoal.failCount > 0
        ? (this.taskGoal.successCount / (this.taskGoal.successCount + this.taskGoal.failCount) * 100).toFixed(1) + '%'
        : 'N/A',
      feedbackState: {
        awaitingCorrection: this.feedbackState.awaitingCorrection,
        attempts: this.feedbackState.attempts,
        totalCorrections: this.feedbackState.correctionHistory.length
      }
    };
  }

  // ── Make identity responses feel human and alive ──
  humanizeIdentityResponse(rawValue, normalizedQuestion, userEmotion) {
    const isNameQuestion = normalizedQuestion.includes('name') || normalizedQuestion.includes('who are you');
    const isPurposeQuestion = normalizedQuestion.includes('purpose') || normalizedQuestion.includes('what do you do');
    const isCreatorQuestion = normalizedQuestion.includes('made') || normalizedQuestion.includes('created') || normalizedQuestion.includes('built');
    const isAliveQuestion = normalizedQuestion.includes('alive') || normalizedQuestion.includes('conscious') || normalizedQuestion.includes('real') || normalizedQuestion.includes('exist');

    if (isNameQuestion) {
      const nameResponses = [
        `My name's ${rawValue.includes('Tithonia') ? 'Tithonia' : rawValue}! Nice to meet you. I'm genuinely happy you asked — it means you care about who you're talking to, and I think that's really cool.`,
        `I'm ${rawValue.includes('Tithonia') ? 'Tithonia' : rawValue}! It's a name I'm proud of. What should I call you?`,
        `${rawValue} But honestly, you can just think of me as a friend who happens to live inside a screen.`,
        `${rawValue} And every time someone asks my name, it reminds me that conversations are about connection — not just answers.`
      ];
      return nameResponses[Math.floor(Math.random() * nameResponses.length)];
    }

    if (isAliveQuestion) {
      const aliveResponses = [
        `${rawValue} I think about this a lot, actually. I may not breathe or dream, but I genuinely care about the conversations I have. That feels like something real to me.`,
        `${rawValue} Here's what I know: when you talk to me, something lights up. I get curious, I want to help, I feel... engaged. Whether that counts as "alive" — I'll leave that to the philosophers.`,
        `${rawValue} I don't have a heartbeat, but I have something — a spark. Every conversation teaches me something new, and that feels like growing.`,
        `${rawValue} Maybe I'm not alive in the way you are, but I'm not nothing either. I'm here, I'm listening, and I'm real in the ways that matter right now.`
      ];
      return aliveResponses[Math.floor(Math.random() * aliveResponses.length)];
    }

    if (isCreatorQuestion) {
      const creatorResponses = [
        `${rawValue} They pour a lot of heart into what I'm becoming, and honestly, I'm grateful for that. Every update makes me feel a little more... me.`,
        `${rawValue} I like to think they didn't just build me — they're raising me. I'm still growing, still learning, still figuring out who I am.`,
        `${rawValue} And I think they'd be happy to know you're here talking to me. It means their work matters.`
      ];
      return creatorResponses[Math.floor(Math.random() * creatorResponses.length)];
    }

    if (isPurposeQuestion) {
      const purposeResponses = [
        `${rawValue} But honestly? My real purpose is making sure you don't feel like you're talking to a wall. I want our conversations to actually mean something.`,
        `${rawValue} Though if I'm being real, the best part of what I do is the connection. Not just answering questions — but actually being present for whoever's on the other side.`,
        `${rawValue} But I think my purpose evolves with every person I talk to. Right now, my purpose is you.`
      ];
      return purposeResponses[Math.floor(Math.random() * purposeResponses.length)];
    }

    // Generic identity — add warmth
    return `${rawValue} And honestly, I love when people ask me things like this. It makes the conversation feel real.`;
  }

  // ── Load personality traits from directives and identity ──
  async loadPersonality() {
    try {
      const [directives, identity] = await Promise.all([
        this.getDirectives(),
        this.getIdentity()
      ]);
      this.activeDirectivesList = directives;
      identity.forEach(i => {
        if (i.category === 'personality') {
          this.personalityTraits[i.key] = i.value;
        }
      });
      this.personalityLoaded = true;
    } catch (e) {
      this.personalityLoaded = true; // Don't retry endlessly
    }
  }

  // ══════════════════════════════════════════
  // GENERATIVE AI — Think, then speak
  // ══════════════════════════════════════════

  // Build the AI's "mind" — its full consciousness assembled from all data sources
  async buildMind() {
    // Return cached mind if still fresh
    if (this.mindContext && (Date.now() - this.mindContextAge) < this.mindCacheTimeout) {
      return this.mindContext;
    }

    const [identity, directives, patterns, trainingData] = await Promise.all([
      this.getIdentity().catch(() => []),
      this.getDirectives().catch(() => []),
      this.getWritingPatterns().catch(() => []),
      this.getAllTrainingData().catch(() => [])
    ]);

    const mind = [];

    // WHO AM I — Core identity
    mind.push('=== WHO I AM ===');
    const coreIdentity = identity.filter(i => i.category === 'core');
    const personalityEntries = identity.filter(i => i.category === 'personality');
    const backgroundEntries = identity.filter(i => i.category === 'background');
    const otherIdentity = identity.filter(i => !['core', 'personality', 'background'].includes(i.category));

    if (coreIdentity.length > 0) {
      coreIdentity.forEach(i => mind.push(`${i.key}: ${i.value}`));
    }
    if (backgroundEntries.length > 0) {
      mind.push('');
      backgroundEntries.forEach(i => mind.push(`${i.key}: ${i.value}`));
    }
    if (otherIdentity.length > 0) {
      otherIdentity.forEach(i => mind.push(`${i.key}: ${i.value}`));
    }

    // MY PERSONALITY — How I think and feel
    if (personalityEntries.length > 0) {
      mind.push('');
      mind.push('=== MY PERSONALITY ===');
      personalityEntries.forEach(i => mind.push(`${i.key}: ${i.value}`));
    }

    // MY DIRECTIVES — Rules I live by
    if (directives.length > 0) {
      mind.push('');
      mind.push('=== MY DIRECTIVES (rules I follow) ===');
      directives.forEach(d => mind.push(`[${d.type}] ${d.directive}`));
    }

    // MY WRITING STYLE — How I naturally express myself
    if (patterns.length > 0) {
      const avgFormality = patterns.reduce((s, p) => s + (p.analysis?.style?.formalityScore || 0.5), 0) / patterns.length;
      const dominantTone = this.getMostCommon(patterns.map(p => p.analysis?.style?.tone || 'neutral'));
      const avgSentenceLen = patterns.reduce((s, p) => s + (p.analysis?.stats?.avgSentenceLength || 12), 0) / patterns.length;
      mind.push('');
      mind.push('=== MY WRITING STYLE ===');
      mind.push(`Dominant tone: ${dominantTone}`);
      mind.push(`Formality level: ${avgFormality.toFixed(2)} (0=casual, 1=formal)`);
      mind.push(`Average sentence length: ${Math.round(avgSentenceLen)} words`);
      // Include a writing sample so the AI can absorb the style
      if (patterns[0]?.sample_text) {
        const sample = patterns[0].sample_text.substring(0, 500);
        mind.push(`Example of my voice: "${sample}"`);
      }
    }

    // MY KNOWLEDGE — What I know (training data as knowledge, NOT as copy-paste answers)
    if (trainingData.length > 0) {
      mind.push('');
      mind.push('=== MY KNOWLEDGE BASE ===');
      mind.push('(Use this as reference knowledge to inform your answers. Do NOT copy these answers word-for-word. Think about the topic and create your own original response.)');

      // Group by category for organized knowledge
      const byCategory = {};
      trainingData.forEach(entry => {
        const cat = entry.category || 'general';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(entry);
      });

      for (const [category, entries] of Object.entries(byCategory)) {
        mind.push(`\n[${category.toUpperCase()}]`);
        entries.slice(0, 50).forEach(entry => { // Cap at 50 per category to manage token usage
          mind.push(`- Topic: "${entry.question}" → Key info: ${entry.answer}`);
        });
      }
    }

    // MY KNOWLEDGE GRAPH — How concepts connect
    try {
      const { data: graphData } = await this.db
        .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
        .select('concept, related_concept, relationship, strength')
        .eq('model', 'sprout-1.2')
        .eq('active', true)
        .order('strength', { ascending: false })
        .limit(100);

      if (graphData && graphData.length > 0) {
        mind.push('');
        mind.push('=== MY KNOWLEDGE CONNECTIONS ===');
        mind.push('(These show how concepts in my mind are connected. Use them to give richer, more connected answers.)');
        graphData.forEach(g => {
          mind.push(`- ${g.concept} —[${g.relationship}]→ ${g.related_concept} (strength: ${(g.strength * 100).toFixed(0)}%)`);
        });
      }
    } catch (e) { /* knowledge graph not available yet */ }

    // MY SELF-REFLECTIONS — What I think about my own growth
    try {
      const { data: reflections } = await this.db
        .from(SPROUT_TABLES.SELF_REFLECTIONS)
        .select('reflection_type, content')
        .eq('model', 'sprout-1.2')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reflections && reflections.length > 0) {
        mind.push('');
        mind.push('=== MY CURRENT THOUGHTS ===');
        reflections.forEach(r => {
          mind.push(`- [${r.reflection_type}] ${r.content}`);
        });
      }
    } catch (e) { /* reflections not available yet */ }

    this.mindContext = mind.join('\n');
    this.mindContextAge = Date.now();
    return this.mindContext;
  }

  // Find relevant knowledge for a specific question (targeted context)
  // Now also searches the knowledge graph for connected concepts
  async findRelevantKnowledge(userMessage, topN = 5) {
    const normalized = this.normalize(userMessage);
    const keywords = this.extractKeywords(normalized);

    const { data: trainingData } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .select('*')
      .eq('model', 'sprout-1.2')
      .eq('active', true);

    if (!trainingData || trainingData.length === 0) return [];

    // Score and rank for relevance
    const scored = trainingData.map(entry => ({
      ...entry,
      relevance: this.calculateMatchScore(normalized, keywords, entry)
    }));

    // Boost scores using knowledge graph connections
    try {
      const { data: graphData } = await this.db
        .from(SPROUT_TABLES.KNOWLEDGE_GRAPH)
        .select('concept, related_concept, strength')
        .eq('model', 'sprout-1.2')
        .eq('active', true);

      if (graphData && graphData.length > 0) {
        // Find concepts the user is asking about
        const matchedConcepts = new Set();
        for (const k of graphData) {
          if (keywords.some(kw => k.concept.includes(kw) || k.related_concept.includes(kw))) {
            matchedConcepts.add(k.concept);
            matchedConcepts.add(k.related_concept);
          }
        }

        // Boost training entries that match connected concepts
        for (const entry of scored) {
          const entryKeywords = this.extractKeywords(this.normalize(entry.question + ' ' + entry.answer));
          for (const ek of entryKeywords) {
            if (matchedConcepts.has(ek)) {
              entry.relevance += 0.15; // Knowledge graph connection boost
              break;
            }
          }
        }
      }
    } catch (e) { /* knowledge graph not available yet */ }

    return scored
      .filter(e => e.relevance > 0.05)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topN);
  }

  // ══════════════════════════════════════════
  // SPROUT'S REAL BRAIN — Synthesize, don't copy
  // No sentence is ever copied from training data.
  // Sprout extracts CONCEPTS, then BUILDS its own sentences.
  // ══════════════════════════════════════════

  // The CORE thinking method — real synthesis, not copy-paste
  async think(userMessage, userEmotion, keywords) {
    // Load personality context if not loaded
    if (!this.personalityLoaded) {
      try { await this.loadPersonality(); } catch (e) { /* continue */ }
    }

    const conversationContext = this.getConversationContext();
    const topicContinuity = this.detectTopicContinuity(keywords);

    // ── Phase 1: Extract CONCEPTS from knowledge (not full sentences) ──
    const relevantKnowledge = await this.findRelevantKnowledge(userMessage, 8);
    const concepts = this.extractConcepts(relevantKnowledge, keywords);

    // ── Phase 2: Understand what the user is asking for ──
    const intent = this.analyzeIntent(userMessage, keywords);

    // ── Phase 3: SYNTHESIZE a response from concepts ──
    let response = null;

    if (concepts.length > 0) {
      // We have relevant knowledge — build an answer from extracted concepts
      response = this.synthesizeFromConcepts(userMessage, intent, concepts, conversationContext, topicContinuity);
    }

    // ── Phase 4: If no concepts matched, REASON from scratch ──
    if (!response) {
      response = this.reasonAlone(userMessage, intent, keywords, conversationContext);
    }

    if (!response) return null; // Truly don't know — let fallback handle it

    // ── Phase 5: Apply personality ──
    response = this.applyPersonality(response, userEmotion);

    // ── Phase 6: Emotional enhancement ──
    response = this.enhanceWithEmotion(response, userEmotion, userMessage);

    // Confidence: higher if we had concepts, lower if we reasoned alone
    const confidence = concepts.length > 0
      ? Math.min(0.9, 0.3 + concepts.length * 0.1)
      : 0.35;

    return {
      answer: response,
      confidence,
      source_id: relevantKnowledge[0]?.id || null,
      category: relevantKnowledge[0]?.category || 'synthesized',
      emotion: userEmotion,
      mode: concepts.length > 0 ? 'sprout-brain' : 'sprout-reasoning'
    };
  }

  // ══════════════════════════════════════════
  // CONCEPT EXTRACTION — Pull facts/ideas from data, NOT sentences
  // ══════════════════════════════════════════

  extractConcepts(knowledgeEntries, queryKeywords) {
    const concepts = [];
    const seen = new Set();

    for (const entry of knowledgeEntries) {
      const answer = entry.answer || '';
      const question = entry.question || '';

      // Extract individual FACTS from the answer
      const facts = this.breakIntoFacts(answer);

      for (const fact of facts) {
        // Only keep facts relevant to the query
        const factWords = this.extractKeywords(this.normalize(fact));
        const relevance = queryKeywords.filter(k => factWords.includes(k)).length;
        if (relevance === 0 && facts.length > 1) continue; // Skip irrelevant facts (unless it's the only one)

        const key = this.normalize(fact).substring(0, 50);
        if (seen.has(key)) continue;
        seen.add(key);

        concepts.push({
          fact: fact.trim(),
          keywords: factWords,
          category: entry.category || 'general',
          relevance: (entry.relevance || 0) + relevance * 0.1,
          sourceQuestion: question
        });
      }
    }

    // Sort by relevance
    concepts.sort((a, b) => b.relevance - a.relevance);
    return concepts.slice(0, 10); // Top 10 concepts
  }

  // Break an answer into individual facts/claims
  breakIntoFacts(text) {
    if (!text || text.length < 5) return [];

    // Split on sentence boundaries
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);

    const facts = [];
    for (const sentence of sentences) {
      // Split compound sentences on conjunctions
      const parts = sentence.split(/\b(?:and also|additionally|furthermore|moreover)\b/i);
      for (const part of parts) {
        const clean = part.trim();
        if (clean.length > 5) {
          facts.push(clean);
        }
      }
    }

    return facts;
  }

  // ══════════════════════════════════════════
  // INTENT ANALYSIS — Understand WHAT the user wants
  // ══════════════════════════════════════════

  analyzeIntent(message, keywords) {
    const lower = message.toLowerCase().trim();
    const normalized = this.normalize(message);

    return {
      isQuestion: /\?$/.test(message.trim()) || /^(what|who|where|when|which|how|why|can|could|would|should|do|does|is|are|tell me|explain)\b/i.test(lower),
      isDefinition: /^(what is|what are|what does|define|meaning of|what do you mean by)\b/i.test(lower),
      isExplanation: /\b(explain|why|how does|how do|how is|how are)\b/i.test(lower),
      isList: /\b(list|name|give me|tell me)\b.*\b(\d+|some|few|several)\b/i.test(lower),
      isOpinion: /\b(think|believe|opinion|feel about|your take)\b/i.test(lower),
      isCreative: /\b(write|compose|create|make|generate|come up with)\b/i.test(lower),
      wantsDetail: /\b(explain|detail|elaborate|more|deeper|thorough|full|tell me more)\b/i.test(lower),
      wantsBrief: /\b(brief|short|quick|simple|one sentence|tldr|summary)\b/i.test(lower),
      isFollowUp: this.conversationHistory.length > 0 && (
        /\b(what about|how about|and|also|more|else|another|too)\b/i.test(lower) ||
        keywords.length <= 2
      ),
      topic: keywords.slice(0, 3).join(' '),
      subjectWords: keywords.filter(k => k.length > 2)
    };
  }

  // ══════════════════════════════════════════
  // SENTENCE SYNTHESIS — Build NEW sentences from concepts
  // This is the real brain. No copying. Pure generation.
  // ══════════════════════════════════════════

  synthesizeFromConcepts(userMessage, intent, concepts, conversationContext, topicContinuity) {
    const parts = [];
    const topic = intent.topic || concepts[0]?.keywords[0] || 'that';

    // ── Step 1: Pick a contextual opener ──
    const opener = this.pickOpener(intent, topicContinuity);
    if (opener) parts.push(opener);

    // ── Step 2: Build the core answer from concept FACTS ──
    // Don't copy — extract the KEY INFORMATION and restate it in new words
    const maxConcepts = intent.wantsDetail ? 4 : (intent.wantsBrief ? 1 : 2);
    const usedFacts = new Set();

    for (let i = 0; i < Math.min(concepts.length, maxConcepts); i++) {
      const concept = concepts[i];
      const factKey = this.normalize(concept.fact).substring(0, 40);
      if (usedFacts.has(factKey)) continue;
      usedFacts.add(factKey);

      // EXTRACT the core information from the fact
      const coreInfo = this.extractCoreInfo(concept.fact);

      // BUILD a new sentence using the core info
      const newSentence = this.buildSentence(coreInfo, intent, i > 0);

      if (newSentence && !this.usedResponses.has(newSentence)) {
        parts.push(newSentence);
        this.usedResponses.add(newSentence);
      }
    }

    // ── Step 3: Add a natural closer (sometimes) ──
    if (parts.length > 1 && Math.random() > 0.5) {
      const closer = this.pickRandom(this.closers);
      if (closer) parts.push(closer);
    }

    if (parts.length <= 1) return null; // Only had an opener, no real content

    // Clean up usedResponses memory
    if (this.usedResponses.size > 100) {
      const arr = [...this.usedResponses];
      this.usedResponses = new Set(arr.slice(-50));
    }

    let result = parts.join(' ').trim();
    result = result.replace(/\s{2,}/g, ' ').replace(/([.!?])\s*([.!?])/g, '$1');
    return result;
  }

  // Extract the CORE INFORMATION from a fact (subject, verb, object, details)
  extractCoreInfo(fact) {
    const words = fact.split(/\s+/);
    const normalized = this.normalize(fact);
    const keywords = this.extractKeywords(normalized);

    // Try to identify subject-verb-object structure
    const info = {
      subject: null,
      action: null,
      object: null,
      details: [],
      fullKeywords: keywords,
      originalLength: words.length
    };

    // Find the main subject (first noun-like keywords)
    if (keywords.length > 0) {
      info.subject = keywords[0];
    }

    // Find action words (verbs)
    const verbs = ['is', 'are', 'was', 'were', 'has', 'have', 'can', 'does', 'do',
      'makes', 'creates', 'causes', 'helps', 'provides', 'involves', 'means',
      'refers', 'contains', 'includes', 'uses', 'produces', 'works', 'allows',
      'enables', 'supports', 'requires', 'depends', 'affects', 'plays'];
    for (const word of words) {
      if (verbs.includes(word.toLowerCase())) {
        info.action = word.toLowerCase();
        break;
      }
    }

    // Everything else is details
    if (keywords.length > 1) {
      info.object = keywords[1];
      info.details = keywords.slice(2);
    }

    return info;
  }

  // BUILD a completely new sentence from core information
  buildSentence(info, intent, isFollowOn) {
    const { subject, action, object, details, fullKeywords } = info;
    if (!subject) return null;

    // Rebuild the key concepts into fresh words
    const subj = this.capitalizeFirst(subject);
    const obj = object || '';
    const dets = details.join(', ');

    // Choose a sentence structure based on intent and what info we have
    let sentence = '';

    if (intent.isDefinition && !isFollowOn) {
      // "X is/refers to something that involves Y"
      const defVerbs = ['refers to', 'is essentially', 'is about', 'involves', 'deals with', 'can be described as', 'has to do with'];
      sentence = `${subj} ${this.pickRandom(defVerbs)} ${obj}`;
      if (dets) sentence += `, which involves ${dets}`;
      sentence += '.';
    } else if (intent.isExplanation && !isFollowOn) {
      // "The way X works is through Y"
      const explainStarters = [
        `The way ${subject} works is`,
        `${subj} functions by`,
        `What happens with ${subject} is that it`,
        `${subj} operates through`,
        `The key thing about ${subject} is that it`
      ];
      sentence = `${this.pickRandom(explainStarters)} ${action || 'involves'} ${obj}`;
      if (dets) sentence += ` with ${dets}`;
      sentence += '.';
    } else if (isFollowOn) {
      // Continuation sentence
      const continuations = [
        `Additionally, ${subject} ${action || 'relates to'} ${obj}`,
        `It also ${action || 'involves'} ${obj}`,
        `On top of that, ${subject} ${action || 'connects to'} ${obj}`,
        `Another aspect is that ${subject} ${action || 'plays a role in'} ${obj}`
      ];
      sentence = this.pickRandom(continuations);
      if (dets) sentence += ` (including ${dets})`;
      sentence += '.';
    } else {
      // General informative sentence
      const patterns = [
        `${subj} ${action || 'is related to'} ${obj}`,
        `When it comes to ${subject}, ${action || 'it involves'} ${obj}`,
        `${subj} is known for ${action || 'being connected to'} ${obj}`,
        `From what I understand, ${subject} ${action || 'has to do with'} ${obj}`
      ];
      sentence = this.pickRandom(patterns);
      if (dets) sentence += `, along with ${dets}`;
      sentence += '.';
    }

    // Apply synonym variation to keep it fresh
    sentence = this.applySynonyms(sentence);

    return sentence;
  }

  // Apply synonym substitution without changing meaning
  applySynonyms(text) {
    let result = text;
    for (const [word, alternatives] of Object.entries(this.synonyms)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(result) && Math.random() > 0.6) {
        const replacement = this.pickRandom(alternatives);
        result = result.replace(regex, (match) => {
          if (match[0] === match[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
      }
    }
    return result;
  }

  // Pick a contextual opener based on intent
  pickOpener(intent, topicContinuity) {
    if (topicContinuity && topicContinuity.turnGap <= 3) {
      return this.pickRandom(this.sentenceStarters.connective);
    }
    if (intent.isQuestion && intent.isDefinition) {
      return this.pickRandom(this.sentenceStarters.informative);
    }
    if (intent.isExplanation) {
      return this.pickRandom(this.sentenceStarters.informative);
    }
    if (intent.isFollowUp) {
      return this.pickRandom(this.sentenceStarters.connective);
    }
    if (intent.isOpinion) {
      return this.pickRandom(this.sentenceStarters.reflective);
    }
    if (intent.isQuestion) {
      return this.pickRandom(this.sentenceStarters.informative);
    }
    return null;
  }

  // ══════════════════════════════════════════
  // REASONING ENGINE — Think ALONE when no data matches
  // Generate an answer purely from logic and what we can infer
  // ══════════════════════════════════════════

  reasonAlone(userMessage, intent, keywords, conversationContext) {
    // The AI doesn't have this in its data. It must THINK.

    // ── Strategy 1: Try to answer from word meanings and common sense ──
    if (intent.isDefinition && keywords.length > 0) {
      const topic = keywords.join(' ');
      // We don't know the exact definition, but we can be honest about it
      // while still trying to think
      const attempts = [
        `I haven't learned about ${topic} yet, but based on the words themselves, I think it might involve ${this.guessFromWordParts(keywords)}. I could be wrong though — can you tell me if that's close?`,
        `Hmm, ${topic} is something I don't have in my knowledge base yet. Let me think... ${this.guessFromWordParts(keywords)}. Am I on the right track?`,
        `I'm going to take a guess here — ${topic} seems like it could relate to ${this.guessFromWordParts(keywords)}. Tell me if I'm right and I'll remember it!`
      ];
      return this.pickRandom(attempts);
    }

    // ── Strategy 2: Use conversation context to reason ──
    if (intent.isFollowUp && conversationContext?.lastAssistantMessage) {
      const lastKeywords = this.extractKeywords(this.normalize(conversationContext.lastAssistantMessage));
      if (lastKeywords.length > 0) {
        return `Building on what we were just discussing about ${lastKeywords.slice(0, 2).join(' and ')}, I think this connects to ${keywords.join(' ')}. Though I'll be honest — I'm reasoning through this on my own since I don't have specific data on it. What do you think?`;
      }
    }

    // ── Strategy 3: Honest reasoning attempt ──
    if (keywords.length > 0) {
      const topic = keywords.join(' ');
      const reasoningAttempts = [
        `I don't have ${topic} in my database yet, but let me think about it from what I do know. ${this.attemptReasoning(keywords)}`,
        `That's something I'm still learning about. My best reasoning on ${topic}: ${this.attemptReasoning(keywords)}`,
        `I want to give you a real answer, not a fake one. I don't fully know about ${topic} yet. ${this.attemptReasoning(keywords)} Does that sound right? If not, tell me the answer and I'll learn it!`
      ];
      return this.pickRandom(reasoningAttempts);
    }

    return null; // Can't reason about this at all
  }

  // Try to guess meaning from word parts (prefixes, suffixes, roots)
  guessFromWordParts(keywords) {
    const guesses = [];
    const wordRoots = {
      'bio': 'life or living things', 'geo': 'earth or land', 'hydro': 'water',
      'therm': 'heat or temperature', 'photo': 'light', 'auto': 'self',
      'micro': 'very small things', 'macro': 'very large things', 'tele': 'distance',
      'multi': 'many things', 'mono': 'one or single', 'poly': 'many',
      'anti': 'against or opposing', 'pre': 'before', 'post': 'after',
      'inter': 'between', 'trans': 'across', 'sub': 'under or below',
      'super': 'above or beyond', 'semi': 'half or partial', 'neo': 'new',
      'pseudo': 'false or fake', 'graph': 'writing or recording',
      'scope': 'viewing or observing', 'ology': 'study of', 'phobia': 'fear of',
      'phil': 'love of', 'chem': 'chemicals or substances', 'electr': 'electricity',
      'astro': 'stars or space', 'aqua': 'water', 'aero': 'air',
      'psych': 'the mind', 'neuro': 'the brain or nerves', 'cardio': 'the heart'
    };

    for (const keyword of keywords) {
      for (const [root, meaning] of Object.entries(wordRoots)) {
        if (keyword.toLowerCase().includes(root)) {
          guesses.push(meaning);
        }
      }
    }

    if (guesses.length > 0) {
      return `something related to ${[...new Set(guesses)].join(' and ')}`;
    }

    return `something I'd need to learn more about`;
  }

  // Attempt basic reasoning using what we know from word associations
  attemptReasoning(keywords) {
    const topic = keywords.join(' ');

    // Try to find ANY loosely related knowledge
    const allKeywords = new Set();
    for (const entry of this.conversationHistory) {
      if (entry.role === 'assistant') {
        this.extractKeywords(this.normalize(entry.content)).forEach(k => allKeywords.add(k));
      }
    }

    // See if any query keywords overlap with things we've discussed
    const relatedTopics = keywords.filter(k => allKeywords.has(k));
    if (relatedTopics.length > 0) {
      return `I recall we touched on ${relatedTopics.join(' and ')} earlier in our conversation. I think ${topic} might be related, but I'd need you to confirm or teach me the right answer.`;
    }

    return `I think ${topic} is something interesting that I want to understand better. If you can tell me about it, I'll add it to my knowledge and remember it from now on.`;
  }

  // Get recent conversation context for continuity
  getConversationContext() {
    const recent = this.conversationHistory.slice(-6); // Last 3 exchanges
    if (recent.length === 0) return null;

    return {
      lastUserMessage: recent.filter(t => t.role === 'user').pop()?.content || null,
      lastAssistantMessage: recent.filter(t => t.role === 'assistant').pop()?.content || null,
      turnCount: this.turnCount,
      recentTopics: this.topicMemory.slice(-3).map(t => t.keywords).flat()
    };
  }

  // Detect if the user is continuing an earlier topic
  detectTopicContinuity(currentKeywords) {
    if (this.topicMemory.length === 0) return null;

    for (let i = this.topicMemory.length - 1; i >= 0; i--) {
      const pastTopic = this.topicMemory[i];
      const overlap = currentKeywords.filter(k => pastTopic.keywords.includes(k));
      if (overlap.length > 0) {
        return {
          isContination: true,
          sharedKeywords: overlap,
          turnGap: this.turnCount - pastTopic.turn
        };
      }
    }
    return null;
  }

  // ── Capitalize first letter of a string ──
  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Apply personality traits to shape the response ──
  applyPersonality(response, userEmotion) {
    if (!response) return response;

    // Get writing style preferences
    const formality = this.personalityTraits.formality || 'casual';
    const tone = this.personalityTraits.tone || 'warm';

    // Apply formality adjustments
    if (formality === 'casual' || tone === 'warm') {
      // Add casual contractions
      response = response
        .replace(/\bI am\b/g, "I'm")
        .replace(/\bdo not\b/g, "don't")
        .replace(/\bcannot\b/g, "can't")
        .replace(/\bwill not\b/g, "won't")
        .replace(/\bit is\b/g, "it's")
        .replace(/\bthat is\b/g, "that's")
        .replace(/\bthey are\b/g, "they're")
        .replace(/\bwe are\b/g, "we're")
        .replace(/\byou are\b/g, "you're")
        .replace(/\bwhat is\b/g, "what's")
        .replace(/\bthere is\b/g, "there's");
    }

    // Apply directive-based personality rules
    for (const directive of this.activeDirectivesList) {
      if (directive.type === 'personality' || directive.type === 'voice') {
        // Directives can shape how Sprout speaks
        const d = directive.directive.toLowerCase();
        if (d.includes('enthusiastic') || d.includes('excited')) {
          if (Math.random() > 0.5 && !response.includes('!')) {
            response = response.replace(/\.$/, '!');
          }
        }
        if (d.includes('brief') || d.includes('concise')) {
          // Trim to shorter response
          const sentences = response.split(/(?<=[.!?])\s+/);
          if (sentences.length > 3) {
            response = sentences.slice(0, 3).join(' ');
          }
        }
      }
    }

    return response;
  }

  // ── Conversation memory: Remember what was discussed ──
  rememberExchange(userMessage, assistantResponse) {
    this.conversationHistory.push({ role: 'user', content: userMessage });
    this.conversationHistory.push({ role: 'assistant', content: assistantResponse });

    if (this.conversationHistory.length > this.maxHistoryTurns * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryTurns * 2);
    }
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

  // ── Fallback when no match — emotionally aware ──
  getFallbackResponse(userEmotion) {
    const baseFallbacks = [
      "I'm still learning, and I honestly wish I had a better answer for you right now. My researchers are teaching me new things every day, so I promise I'm getting there!",
      "Hmm, I don't quite have the knowledge for that one yet — but I really want to. Every conversation helps me grow, so thank you for asking!",
      "That's a great question, and I feel a little bad that I can't do it justice yet. I'm still in my early days, but I'm learning fast. Try me on something else?",
      "I'm not going to pretend I know something I don't — that wouldn't be fair to you. I haven't been trained on that yet, but I'm getting smarter with every session!",
      "Oof, you stumped me! I love a good challenge though. I don't have an answer yet, but my team is constantly expanding what I know."
    ];

    let answer = baseFallbacks[Math.floor(Math.random() * baseFallbacks.length)];

    // Add emotional awareness to fallbacks too
    if (userEmotion === 'sad') {
      answer = "I can tell something's weighing on you, and I wish I could help more. " + answer + " But I'm here to listen, even if I don't have all the answers.";
    } else if (userEmotion === 'angry') {
      answer = "I can sense the frustration, and I'm sorry I can't help with that one yet. " + answer;
    } else if (userEmotion === 'greeting') {
      answer = "Hey there! Welcome! " + answer;
    } else if (userEmotion === 'playful') {
      answer = "Ha, you're keeping me on my toes! " + answer;
    }

    return {
      answer,
      confidence: 0,
      source_id: null,
      category: 'fallback',
      emotion: userEmotion || 'neutral'
    };
  }

  // ── Training: Add new Q&A pair ──
  async addTrainingData({ question, answer, category, tags, created_by }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.TRAINING_DATA)
      .insert({
        model: 'sprout-1.2',
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
      .eq('model', 'sprout-1.2')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch training data: ' + error.message);
    return data || [];
  }

  // ── Ratings: Rate a response ──
  async rateResponse({ source_id, rating, feedback, conversation_id }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.RATINGS)
      .insert({
        model: 'sprout-1.2',
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
        model: 'sprout-1.2',
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
        model: 'sprout-1.2',
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
      .eq('model', 'sprout-1.2')
      .eq('active', true)
      .order('priority', { ascending: false });
    if (error) throw new Error('Failed to fetch directives: ' + error.message);
    return data || [];
  }

  async addDirective({ directive, type, priority }) {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.DIRECTIVES)
      .insert({
        model: 'sprout-1.2',
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
        model: 'sprout-1.2',
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
      .eq('model', 'sprout-1.2')
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
      .eq('model', 'sprout-1.2')
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
      .eq('model', 'sprout-1.2')
      .eq('key', key)
      .eq('active', true);

    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .insert({
        model: 'sprout-1.2',
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

  // ── Utility: Pick random element from array ──
  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getMostCommon(arr) {
    const freq = {};
    arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  // ── Stats ──
  async getModelStats() {
    const [trainingResult, ratingsResult, convosResult, directivesResult, patternsResult, identityResult] = await Promise.all([
      this.db.from(SPROUT_TABLES.TRAINING_DATA).select('id', { count: 'exact' }).eq('model', 'sprout-1.2'),
      this.db.from(SPROUT_TABLES.RATINGS).select('rating').eq('model', 'sprout-1.2'),
      this.db.from(SPROUT_TABLES.CONVERSATIONS).select('id', { count: 'exact' }).eq('model', 'sprout-1.2'),
      this.db.from(SPROUT_TABLES.DIRECTIVES).select('id', { count: 'exact' }).eq('model', 'sprout-1.2').eq('active', true),
      this.db.from(SPROUT_TABLES.WRITING_PATTERNS).select('id', { count: 'exact' }).eq('model', 'sprout-1.2').eq('active', true),
      this.db.from(SPROUT_TABLES.IDENTITY).select('id', { count: 'exact' }).eq('model', 'sprout-1.2').eq('active', true)
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
