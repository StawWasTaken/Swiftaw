/**
 * Sprout 1.3 — AI Engine (Young Adult Brain)
 * Custom AI with its own brain — no external LLM dependency
 * Thinks using its own knowledge base, personality, and reasoning
 * Now with: Logic Engine, Math, Context Awareness, Feedback Learning,
 *           Chat-based Self-Learning, Task Goal System, Auto-Upgrades,
 *           Semantic Intent Dictionary, Context-Aware Message Interpretation,
 *           Critical Thinking, Emotional Intelligence, Metacognition,
 *           Independent Reasoning, Creative Problem-Solving
 * Age equivalent: 19 human years — Young Adult Intelligence (Stage 5)
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
    // Templates for generating original sentences about a topic
    const templates = {
      neutral: [
        `${topic} is something that shapes how people think and interact with the world.`,
        `When it comes to ${topic}, there's more depth than most people realize.`,
        `${topic} has a way of connecting to other ideas in unexpected ways.`,
        `There's a reason people keep coming back to ${topic} — it touches on something fundamental.`,
        `${topic} sits at an interesting crossroads of experience and understanding.`
      ],
      simple: [
        `${topic} carries more weight than it first appears.`,
        `There's something compelling about ${topic}.`,
        `${topic} is one of those things that rewards closer attention.`,
        `People tend to underestimate how much ${topic} matters.`,
        `${topic} has layers that reveal themselves over time.`
      ],
      detailed: [
        `${topic} spans a wide range of ideas, each one building on the last in ways that aren't always obvious at first glance.`,
        `The deeper you look into ${topic}, the more you start to see connections to fields and concepts you wouldn't have expected.`,
        `What makes ${topic} worth studying is how it reveals patterns that repeat across completely different domains.`
      ]
    };

    const pool = templates[style] || templates.neutral;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── Writing Task Handler (1.3 — Full creative writing engine) ──
  handleWriteTask(message) {
    const lower = message.toLowerCase();

    // Extract what type of content and what topic
    const contentType = this.detectWritingType(lower);
    const topic = this.extractWritingTopic(lower);

    if (!topic && contentType === 'sentence') {
      // "Write a short sentence" — no topic
      return this.generateRandomSentence();
    }

    if (!topic) return null;

    switch (contentType) {
      case 'story': return this.generateStory(topic);
      case 'poem': return this.generatePoem(topic);
      case 'essay': return this.generateEssay(topic);
      case 'letter': return this.generateLetter(topic);
      case 'paragraph': return this.generateParagraph(topic);
      case 'sentence': return this.generateSentence(topic, 'simple');
      case 'haiku': return this.generateHaiku(topic);
      case 'message': return this.generateMessage(topic);
      default: return this.generateParagraph(topic);
    }
  }

  detectWritingType(text) {
    if (/\b(story|tale|narrative|short story)\b/i.test(text)) return 'story';
    if (/\b(poem|poetry|verse|sonnet)\b/i.test(text)) return 'poem';
    if (/\b(essay|article|paper|write-up)\b/i.test(text)) return 'essay';
    if (/\b(letter|email|note|memo)\b/i.test(text)) return 'letter';
    if (/\b(paragraph)\b/i.test(text)) return 'paragraph';
    if (/\b(haiku)\b/i.test(text)) return 'haiku';
    if (/\b(message|text|sms)\b/i.test(text)) return 'message';
    if (/\b(sentence)\b/i.test(text)) return 'sentence';
    return 'paragraph';
  }

  extractWritingTopic(text) {
    // Try to extract the topic after "about/on/regarding/for"
    const aboutMatch = text.match(/(?:about|on|regarding|for|involving|featuring|with)\s+(.+?)(?:\.|!|\?|$)/i);
    if (aboutMatch) return aboutMatch[1].trim();

    // Try to extract after the content type word
    const afterTypeMatch = text.match(/(?:story|poem|essay|paragraph|letter|haiku|sentence|message|tale|narrative)\s+(?:about\s+|on\s+|for\s+|of\s+)?(.+?)(?:\.|!|\?|$)/i);
    if (afterTypeMatch) return afterTypeMatch[1].trim();

    // Generic: extract after "write/create/compose/make"
    const genericMatch = text.match(/(?:write|compose|create|make|generate)\s+(?:me\s+)?(?:a\s+)?(?:\w+\s+){0,2}(?:about|on|for|of)\s+(.+?)(?:\.|!|\?|$)/i);
    if (genericMatch) return genericMatch[1].trim();

    return null;
  }

  generateRandomSentence() {
    const sentences = [
      "The morning light caught the edge of the window and painted gold across the floor.",
      "She closed the book and realized the story had changed the way she saw things.",
      "Somewhere between the silence and the sound, there was a truth no one had named yet.",
      "The rain arrived without warning, turning the city into something quieter and more honest.",
      "He stood at the crossroads and understood that both paths led somewhere worth going.",
      "The old tree in the yard had seen more conversations than any room in the house.",
      "Sometimes the bravest thing you can do is sit still and let the world come to you.",
      "The coffee went cold while she stared at the letter, trying to find the right words.",
      "Stars don't care whether anyone is watching them — they burn regardless.",
      "The sound of footsteps on gravel has a way of making arrivals feel important."
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
  }

  generateStory(topic) {
    // Build a short story with actual narrative structure:
    // Setting → Character → Conflict → Development → Resolution
    const articles = /^(a|an|the)\s+/i.test(topic) ? '' : 'a ';
    const topicClean = topic.replace(/^(a|an|the)\s+/i, '');

    // Character name pools
    const names = ['Elena', 'Marcus', 'Yuki', 'Samuel', 'Aria', 'Leo', 'Nadia', 'Oliver', 'Zara', 'Felix', 'Maya', 'Theo', 'Luna', 'Kai', 'Iris'];
    const name = names[Math.floor(Math.random() * names.length)];

    // Setting pools
    const settings = [
      `a small studio tucked away on a quiet street`,
      `a workshop that smelled of old wood and possibility`,
      `a corner of the city that most people walked right past`,
      `a room where the light came in at just the right angle`,
      `an old building that had been many things before`
    ];
    const setting = settings[Math.floor(Math.random() * settings.length)];

    // Build the narrative
    const openings = [
      `${name} had always been drawn to ${topic}. Not in the way most people are — casually, from a distance — but with the kind of attention that borders on devotion.`,
      `The first time ${name} encountered ${topic}, something shifted. It wasn't dramatic. It was more like a door opening to a room that had always been there.`,
      `${name} didn't choose ${topic}. It chose them. That's how it felt, at least — like the world had placed something in their path and dared them not to pick it up.`,
      `In ${setting}, ${name} spent most of their days thinking about ${topic}. People called it obsession. ${name} called it the only thing that made sense.`
    ];

    const middles = [
      `For a long time, nothing came easy. The work was slow, the progress invisible to anyone who wasn't paying attention. ${name} kept going anyway — not because they were certain it would pay off, but because stopping felt like a kind of betrayal.`,
      `There were moments of doubt. Long stretches where ${name} wondered if all the time spent on ${topic} was wasted — if maybe everyone else had been right to move on to more practical things. But then a breakthrough would come, small and quiet, and it would be enough.`,
      `The hardest part wasn't the work itself. It was the silence around it — the long hours where nothing happened, where ${topic} felt more like a question than an answer. ${name} learned to sit with that uncertainty.`,
      `Other people moved on to new things. ${name} stayed. There was something in ${topic} that they hadn't finished understanding yet, some thread they hadn't followed to its end.`
    ];

    const endings = [
      `Eventually, ${name} realized the point had never been to finish. The point was to keep looking — to let ${topic} teach them something new about the world, and about themselves, every single time.`,
      `In the end, what ${name} created wasn't just about ${topic}. It was about the kind of person you become when you give something your full attention. And that, they decided, was enough.`,
      `Years later, when someone asked ${name} what ${topic} meant to them, they paused for a long time before answering. "It taught me how to see," they said. "Not just look — actually see."`,
      `The story of ${name} and ${topic} didn't have a neat ending. Real stories rarely do. But there was a moment — quiet, almost ordinary — where ${name} looked at what they'd built and thought: this matters. And it did.`
    ];

    const opening = openings[Math.floor(Math.random() * openings.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];

    return `${opening}\n\n${middle}\n\n${ending}`;
  }

  generatePoem(topic) {
    const poems = [
      [
        `There is a language in ${topic}`,
        `that words alone can't hold —`,
        `a rhythm underneath the surface,`,
        `patient, quiet, bold.`,
        ``,
        `It speaks in light and shadow,`,
        `in texture, shape, and time,`,
        `and those who stop to listen`,
        `can hear it, line by line.`,
        ``,
        `Not everything worth knowing`,
        `arrives with noise and flair.`,
        `Sometimes the deepest truths about ${topic}`,
        `are simply... there.`
      ],
      [
        `${this.capitalizeFirst(topic)} —`,
        `not a thing to be held,`,
        `but a way of holding on.`,
        ``,
        `The kind of knowing`,
        `that sits in your hands`,
        `before your mind catches up.`,
        ``,
        `We circle it with language,`,
        `build frames and definitions,`,
        `but ${topic} lives in the spaces`,
        `between what we say`,
        `and what we mean.`
      ],
      [
        `I watched ${topic} unfold once,`,
        `slowly, like morning.`,
        `Not the way you'd expect —`,
        `no fanfare, no announcement —`,
        `just a quiet shift in the light`,
        `that changed everything after it.`,
        ``,
        `And I thought:`,
        `this is how the important things arrive.`,
        `Not with thunder.`,
        `With patience.`
      ]
    ];

    const poem = poems[Math.floor(Math.random() * poems.length)];
    return poem.join('\n');
  }

  generateHaiku(topic) {
    const haikus = [
      [`${this.capitalizeFirst(topic)} waits here`, `between silence and meaning`, `asking to be seen`],
      [`A world inside it`, `${topic} holds more than we know`, `still unfolding now`],
      [`Quiet and constant`, `${topic} shapes what we become`, `without asking to`],
      [`Look closer — you'll see`, `${topic} changes everything`, `even standing still`]
    ];
    const haiku = haikus[Math.floor(Math.random() * haikus.length)];
    return haiku.join('\n');
  }

  generateEssay(topic) {
    const intro = this.pickRandom([
      `${this.capitalizeFirst(topic)} is one of those subjects that seems simple on the surface but reveals its complexity the moment you start paying attention. Most people have a passing familiarity with it, but few take the time to understand what it actually means — and why it matters.`,
      `If you ask ten different people about ${topic}, you'll probably get ten different answers. That's not a weakness — it's a sign of something genuinely interesting. ${this.capitalizeFirst(topic)} sits at the intersection of experience and interpretation, which means it's always shaped by who's looking at it.`,
      `There's a tendency to treat ${topic} as settled — as something we already understand well enough. But I think that assumption is worth questioning. The more you look into it, the more you realize there are layers most people never reach.`
    ]);

    const body = this.pickRandom([
      `What makes ${topic} worth examining is the way it connects to things you wouldn't expect. On one hand, it's grounded in practical reality — it has real consequences and real applications. On the other hand, it raises questions that don't have easy answers. This tension is what keeps it relevant. The people who engage with ${topic} most seriously tend to be the ones who are comfortable holding two ideas at once: that something can be both understood and mysterious.`,
      `The history of how people have thought about ${topic} is itself instructive. Early approaches were often reductive — attempts to simplify it into something manageable. Over time, the understanding has become more nuanced. We've learned that ${topic} can't be separated from its context, and that the most honest thing you can say about it is often the most complex. What's striking is how each generation discovers something new about it, not because ${topic} has changed, but because the way we look at it has.`,
      `One of the most important things about ${topic} is what it reveals about us. The questions we ask about it, the assumptions we bring, the things we notice and the things we miss — all of these say as much about the observer as the subject. This isn't a flaw in how we understand ${topic}. It's a feature. It means that engaging with it is always, at some level, an act of self-examination.`
    ]);

    const conclusion = this.pickRandom([
      `Ultimately, ${topic} deserves more than a surface-level take. It deserves the kind of attention that leads to genuine understanding — not certainty, but the richer kind of knowing that comes from sitting with complexity and resisting the urge to simplify too quickly.`,
      `The takeaway isn't that ${topic} is impossibly complicated. It's that the complexity is the point. Learning to engage with it honestly — without oversimplifying, without pretending you have all the answers — is itself a valuable exercise. And that's worth the effort.`,
      `${this.capitalizeFirst(topic)} will keep evolving as we do. The important thing is to keep looking at it with fresh eyes, to resist the comfortable assumption that we've already figured it out. Because the best insights about ${topic} tend to come from the people who stay curious longest.`
    ]);

    return `${intro}\n\n${body}\n\n${conclusion}`;
  }

  generateLetter(topic) {
    return this.pickRandom([
      `Dear friend,\n\nI've been thinking about ${topic} a lot lately, and I wanted to share some of those thoughts with you.\n\nThere's something about ${topic} that I can't quite put into words — it's the kind of thing that makes more sense when you experience it than when you try to explain it. But I'll try anyway, because I think it matters.\n\nWhat strikes me most is how ${topic} has a way of shifting your perspective. Not all at once, but gradually — like watching a landscape change as the light moves. You start seeing connections you didn't notice before, and suddenly things that seemed unrelated start to make sense together.\n\nI don't have it all figured out. I probably never will. But I think that's okay. Some things are better explored than solved.\n\nLet me know what you think.\n\nWarmly,\nA friend`,
      `To whom it may concern,\n\nI'm writing to share some thoughts on ${topic} — something I believe deserves more attention than it typically receives.\n\n${this.capitalizeFirst(topic)} has a way of sitting at the edges of conversation, acknowledged but rarely examined closely. In my experience, the most interesting things tend to live in exactly that space — present but underexplored.\n\nI'd encourage anyone reading this to spend a little time with ${topic}. Not to find answers, necessarily, but to find better questions. That's where the value is.\n\nWith respect,\nA thoughtful observer`
    ]);
  }

  generateMessage(topic) {
    return this.pickRandom([
      `Hey — been thinking about ${topic}. There's more to it than I initially realized. Want to talk about it sometime?`,
      `Quick thought on ${topic}: I think most people oversimplify it. There's a lot more nuance there than the usual take suggests. Curious what you think.`,
      `So I went down a bit of a rabbit hole on ${topic} today. Turns out it's way more interesting than I expected. Let me know if you want to hear about it.`
    ]);
  }

  generateParagraph(topic) {
    const s1 = this.generateSentence(topic, 'neutral');
    const s2 = this.generateSentence(topic, 'detailed');
    const s3 = this.generateSentence(topic, 'simple');
    return `${s1} ${s2} ${s3}`;
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

// ══════════════════════════════════════════════════════════════
// SPROUT LEXICON — The AI's vocabulary and word understanding
// Words are mapped to meanings, senses, categories, and relations.
// This is how Sprout KNOWS what words mean — not just pattern-match.
// ══════════════════════════════════════════════════════════════

class SproutLexicon {
  constructor() {
    // The core vocabulary store: word → entry
    this.words = new Map();

    // Reverse index: category → [words]
    this.categoryIndex = new Map();

    // Reverse index: synonym → [words]
    this.synonymIndex = new Map();

    // Load the starter dataset
    this.loadStarterDataset();
  }

  // ── Load production datasets from data/ directory ──
  // Uses the 600-word core lexicon + enrichment layer for full semantic understanding.
  // Falls back to inline starter words if data files aren't available (browser env).
  loadStarterDataset() {
    // Try to load from production datasets (Node.js / build pipeline)
    if (typeof window !== 'undefined') {
      this.loadFromEmbeddedData();
      return;
    }
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, 'data');

      // Load the enrichment layer (full word entries with definitions)
      const enrichmentPath = path.join(dataDir, 'enrichment-layer.json');
      if (fs.existsSync(enrichmentPath)) {
        const enrichment = JSON.parse(fs.readFileSync(enrichmentPath, 'utf8'));
        for (const entry of enrichment.words) {
          this.addWord(entry);
        }
      }

      // Load the core lexicon (600-word lightweight list) — register any words
      // not already enriched as basic entries so the lexicon knows them
      const lexiconPath = path.join(dataDir, 'core-lexicon.json');
      if (fs.existsSync(lexiconPath)) {
        const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
        const wordTypes = { nouns: 'noun', verbs: 'verb', adjectives: 'adjective', adverbs: 'adverb' };
        for (const [key, type] of Object.entries(wordTypes)) {
          if (lexicon[key]) {
            for (const word of lexicon[key]) {
              if (!this.words.has(word.toLowerCase())) {
                this.addWord({
                  word, type,
                  senses: [],
                  relations: { category: [], synonyms: [], antonyms: [] },
                  learnedFrom: 'core-lexicon'
                });
              }
            }
          }
        }
        // Load function words (pronouns, articles, conjunctions, etc.)
        if (lexicon.function_words) {
          for (const [subtype, words] of Object.entries(lexicon.function_words)) {
            for (const word of words) {
              if (!this.words.has(word.toLowerCase())) {
                this.addWord({
                  word, type: 'function',
                  senses: [],
                  relations: { category: [subtype], synonyms: [], antonyms: [] },
                  learnedFrom: 'core-lexicon'
                });
              }
            }
          }
        }
      }

      // Load French lexicon for bilingual grounding
      const frenchPath = path.join(dataDir, 'french-lexicon.json');
      if (fs.existsSync(frenchPath)) {
        const french = JSON.parse(fs.readFileSync(frenchPath, 'utf8'));
        this.frenchLexicon = new Map();
        this.frenchToEnglish = new Map();
        this.englishToFrench = new Map();
        for (const entry of french.words) {
          this.frenchLexicon.set(entry.word.toLowerCase(), entry);
          if (entry.english) {
            this.frenchToEnglish.set(entry.word.toLowerCase(), entry.english.toLowerCase());
            this.englishToFrench.set(entry.english.toLowerCase(), entry.word.toLowerCase());
          }
        }
      }

      // Load learning curriculum config
      const curriculumPath = path.join(dataDir, 'learning-curriculum.json');
      if (fs.existsSync(curriculumPath)) {
        this.curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
        this.currentStage = this.detectCurrentStage();
      }

      console.log(`[SproutLexicon] Loaded ${this.words.size} English words, ${this.frenchLexicon?.size || 0} French words`);
    } catch (e) {
      // Fallback: load embedded data if file loading fails
      console.warn('[SproutLexicon] Could not load data files, using embedded dataset:', e.message);
      this.loadFromEmbeddedData();
    }
  }

  // ── Detect which curriculum stage we're at based on vocabulary size ──
  detectCurrentStage() {
    const size = this.words.size;
    if (size < 2000) return 1;
    if (size < 8000) return 2;
    if (size < 20000) return 3;
    if (size < 50000) return 4;
    return 5;
  }

  // ── Get current curriculum stage info ──
  getCurrentStage() {
    if (!this.curriculum) return null;
    const stageId = this.currentStage || this.detectCurrentStage();
    return this.curriculum.stages.find(s => s.id === stageId) || null;
  }

  // ── Translate between English and French ──
  translateToFrench(englishWord) {
    if (!this.englishToFrench) return null;
    return this.englishToFrench.get(englishWord.toLowerCase()) || null;
  }

  translateToEnglish(frenchWord) {
    if (!this.frenchToEnglish) return null;
    return this.frenchToEnglish.get(frenchWord.toLowerCase()) || null;
  }

  // ── Look up a French word ──
  lookupFrench(word) {
    if (!this.frenchLexicon) return null;
    return this.frenchLexicon.get(word.toLowerCase()) || null;
  }

  // ── Fallback: embedded starter dataset for browser environments ──
  loadFromEmbeddedData() {
    const starterWords = [
      {
        word: 'dog', type: 'noun',
        senses: [
          { definition: 'A domesticated animal often kept as a pet.', examples: ['The dog barked loudly.', 'She plays with her dog in the park.'] },
          { definition: 'A male canine animal.', examples: ['That dog is very strong.'] }
        ],
        relations: { category: ['animal', 'living being'], synonyms: ['canine'], antonyms: [] }
      },
      {
        word: 'run', type: 'verb',
        senses: [
          { definition: 'To move quickly on foot.', examples: ['He can run very fast.', 'The child runs to school.'] },
          { definition: 'To operate or function.', examples: ['The machine runs all day.'] }
        ],
        relations: { category: ['action', 'movement'], synonyms: ['sprint'], antonyms: ['walk', 'stop'] }
      },
      {
        word: 'big', type: 'adjective',
        senses: [
          { definition: 'Of large size.', examples: ['They live in a big house.', 'The dog is very big.'] }
        ],
        relations: { category: ['description', 'size'], synonyms: ['large'], antonyms: ['small'] }
      },
      {
        word: 'eat', type: 'verb',
        senses: [
          { definition: 'To put food into the mouth and swallow it.', examples: ['I eat an apple.', 'They eat dinner together.'] }
        ],
        relations: { category: ['action', 'body'], synonyms: ['consume'], antonyms: [] }
      },
      {
        word: 'water', type: 'noun',
        senses: [
          { definition: 'A clear liquid that people and animals drink.', examples: ['Drink some water.', 'The water is cold.'] }
        ],
        relations: { category: ['substance', 'nature'], synonyms: [], antonyms: [] }
      },
      {
        word: 'happy', type: 'adjective',
        senses: [
          { definition: 'Feeling good or joyful.', examples: ['She feels happy today.', 'The child is happy.'] }
        ],
        relations: { category: ['emotion'], synonyms: ['joyful'], antonyms: ['sad'] }
      },
      {
        word: 'house', type: 'noun',
        senses: [
          { definition: 'A building where people live.', examples: ['They live in a house.', 'The house is blue.'] }
        ],
        relations: { category: ['place', 'object'], synonyms: ['home'], antonyms: [] }
      },
      {
        word: 'see', type: 'verb',
        senses: [
          { definition: 'To use the eyes to look at something.', examples: ['I see a bird.', 'Can you see the car?'] }
        ],
        relations: { category: ['action', 'perception'], synonyms: ['observe'], antonyms: [] }
      },
      {
        word: 'fast', type: 'adjective',
        senses: [
          { definition: 'Moving quickly.', examples: ['The car is fast.', 'He runs very fast.'] }
        ],
        relations: { category: ['description', 'speed'], synonyms: ['quick'], antonyms: ['slow'] }
      },
      {
        word: 'friend', type: 'noun',
        senses: [
          { definition: 'A person you like and trust.', examples: ['She is my friend.', 'Friends help each other.'] }
        ],
        relations: { category: ['person', 'social'], synonyms: ['companion'], antonyms: ['enemy'] }
      }
    ];

    for (const entry of starterWords) {
      this.addWord(entry);
    }
  }

  // ── Add a word to the lexicon ──
  addWord(entry) {
    const word = entry.word.toLowerCase();
    this.words.set(word, {
      word: word,
      type: entry.type,
      senses: entry.senses || [],
      relations: entry.relations || { category: [], synonyms: [], antonyms: [] },
      learnedFrom: entry.learnedFrom || 'starter',
      addedAt: entry.addedAt || Date.now()
    });

    // Build category index
    const categories = entry.relations?.category || [];
    for (const cat of categories) {
      if (!this.categoryIndex.has(cat)) this.categoryIndex.set(cat, new Set());
      this.categoryIndex.get(cat).add(word);
    }

    // Build synonym index
    const synonyms = entry.relations?.synonyms || [];
    for (const syn of synonyms) {
      const synLower = syn.toLowerCase();
      if (!this.synonymIndex.has(synLower)) this.synonymIndex.set(synLower, new Set());
      this.synonymIndex.get(synLower).add(word);
    }

    // Also index the word itself under its synonyms
    for (const syn of synonyms) {
      if (!this.synonymIndex.has(word)) this.synonymIndex.set(word, new Set());
      this.synonymIndex.get(word).add(syn.toLowerCase());
    }
  }

  // ── Look up a word → get its full entry ──
  lookup(word) {
    return this.words.get(word.toLowerCase()) || null;
  }

  // ── Get the definition of a word (first/primary sense) ──
  getDefinition(word) {
    const entry = this.lookup(word);
    if (!entry || entry.senses.length === 0) return null;
    return entry.senses[0].definition;
  }

  // ── Get ALL senses/definitions of a word ──
  getAllSenses(word) {
    const entry = this.lookup(word);
    if (!entry) return [];
    return entry.senses;
  }

  // ── Get word type (noun, verb, adjective, etc.) ──
  getWordType(word) {
    const entry = this.lookup(word);
    return entry ? entry.type : null;
  }

  // ── Get synonyms for a word ──
  getSynonyms(word) {
    const entry = this.lookup(word);
    if (entry && entry.relations.synonyms.length > 0) {
      return entry.relations.synonyms;
    }
    // Also check reverse synonym index
    const reversed = this.synonymIndex.get(word.toLowerCase());
    return reversed ? [...reversed] : [];
  }

  // ── Get antonyms for a word ──
  getAntonyms(word) {
    const entry = this.lookup(word);
    return entry ? entry.relations.antonyms : [];
  }

  // ── Get categories a word belongs to ──
  getCategories(word) {
    const entry = this.lookup(word);
    return entry ? entry.relations.category : [];
  }

  // ── Find all words in a category ──
  getWordsByCategory(category) {
    const words = this.categoryIndex.get(category.toLowerCase());
    return words ? [...words] : [];
  }

  // ── Check if a word is known ──
  knows(word) {
    return this.words.has(word.toLowerCase());
  }

  // ── Analyze a message: identify known words, their types, and meanings ──
  analyzeMessage(message) {
    const tokens = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const analysis = {
      knownWords: [],      // Words we understand
      unknownWords: [],    // Words we don't know yet
      nouns: [],           // Identified nouns
      verbs: [],           // Identified verbs
      adjectives: [],      // Identified adjectives
      categories: new Set(), // All categories touched
      senseMap: {}         // word → best sense for this context
    };

    for (const token of tokens) {
      if (token.length <= 1) continue; // Skip single chars

      const entry = this.lookup(token);
      if (entry) {
        analysis.knownWords.push(entry);
        if (entry.type === 'noun') analysis.nouns.push(entry);
        if (entry.type === 'verb') analysis.verbs.push(entry);
        if (entry.type === 'adjective') analysis.adjectives.push(entry);
        for (const cat of entry.relations.category) {
          analysis.categories.add(cat);
        }
        // Pick the best sense (for now: first sense; later: context-based)
        analysis.senseMap[token] = entry.senses[0] || null;
      } else {
        // Skip common stop words from "unknown"
        const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be',
          'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
          'should', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
          'from', 'as', 'into', 'about', 'and', 'but', 'or', 'not', 'no', 'so',
          'if', 'it', 'its', 'that', 'this', 'i', 'me', 'my', 'we', 'you', 'your',
          'he', 'she', 'they', 'them', 'very', 'just', 'than', 'too', 'there',
          'here', 'what', 'which', 'who', 'how', 'when', 'where', 'why']);
        if (!stopWords.has(token)) {
          analysis.unknownWords.push(token);
        }
      }
    }

    analysis.categories = [...analysis.categories];
    return analysis;
  }

  // ── Disambiguate word sense using surrounding context ──
  disambiguateSense(word, contextWords) {
    const entry = this.lookup(word);
    if (!entry || entry.senses.length <= 1) {
      return entry?.senses[0] || null;
    }

    // Score each sense by how many context words appear in its examples
    let bestSense = entry.senses[0];
    let bestScore = 0;

    for (const sense of entry.senses) {
      let score = 0;
      const exampleText = sense.examples.join(' ').toLowerCase();
      for (const cw of contextWords) {
        if (exampleText.includes(cw.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSense = sense;
      }
    }

    return bestSense;
  }

  // ── Check if two words are semantically related ──
  areRelated(word1, word2) {
    const entry1 = this.lookup(word1);
    const entry2 = this.lookup(word2);
    if (!entry1 || !entry2) return false;

    // Same category?
    const cats1 = new Set(entry1.relations.category);
    for (const cat of entry2.relations.category) {
      if (cats1.has(cat)) return true;
    }

    // Synonym relationship?
    if (entry1.relations.synonyms.includes(word2.toLowerCase())) return true;
    if (entry2.relations.synonyms.includes(word1.toLowerCase())) return true;

    // Antonym relationship? (still related, just opposite)
    if (entry1.relations.antonyms.includes(word2.toLowerCase())) return true;
    if (entry2.relations.antonyms.includes(word1.toLowerCase())) return true;

    return false;
  }

  // ── Learn a new word from context ──
  learnWord(word, type, definition, examples = [], categories = [], source = 'conversation') {
    const lower = word.toLowerCase();
    if (this.words.has(lower)) {
      // Word already exists — add a new sense if the definition is different
      const existing = this.words.get(lower);
      const alreadyKnown = existing.senses.some(s =>
        s.definition.toLowerCase() === definition.toLowerCase()
      );
      if (!alreadyKnown) {
        existing.senses.push({ definition, examples });
        // Merge categories
        for (const cat of categories) {
          if (!existing.relations.category.includes(cat)) {
            existing.relations.category.push(cat);
            if (!this.categoryIndex.has(cat)) this.categoryIndex.set(cat, new Set());
            this.categoryIndex.get(cat).add(lower);
          }
        }
      }
      return;
    }

    this.addWord({
      word: lower,
      type: type || 'unknown',
      senses: [{ definition, examples }],
      relations: { category: categories, synonyms: [], antonyms: [] },
      learnedFrom: source,
      addedAt: Date.now()
    });
  }

  // ── Get lexicon stats ──
  getStats() {
    const allWords = [...this.words.values()];
    return {
      totalWords: this.words.size,
      nouns: allWords.filter(w => w.type === 'noun').length,
      verbs: allWords.filter(w => w.type === 'verb').length,
      adjectives: allWords.filter(w => w.type === 'adjective').length,
      adverbs: allWords.filter(w => w.type === 'adverb').length,
      functionWords: allWords.filter(w => w.type === 'function').length,
      enrichedWords: allWords.filter(w => w.senses && w.senses.length > 0).length,
      categories: this.categoryIndex.size,
      learnedWords: allWords.filter(w => w.learnedFrom !== 'starter' && w.learnedFrom !== 'core-lexicon').length,
      frenchWords: this.frenchLexicon ? this.frenchLexicon.size : 0,
      currentStage: this.currentStage || this.detectCurrentStage(),
      currentStageName: this.getCurrentStage()?.name || 'Unknown'
    };
  }
}

class SproutEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.modelVersion = '1.3';
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
    this.maxHistoryTurns = 30; // Keep last 30 exchanges for context (expanded for 1.3 young adult memory)
    this.mindContext = null; // Cached "mind" — personality + knowledge
    this.mindContextAge = 0; // When the mind was last built
    this.mindCacheTimeout = 10 * 60 * 1000; // Rebuild mind every 10 min
    this.topicMemory = []; // Track conversation topics for continuity
    this.usedResponses = new Set(); // Avoid repeating the same phrases

    // ── Logic Engine — Math, reasoning, sentence generation ──
    this.logicEngine = new SproutLogicEngine();

    // ── Lexicon — Word meanings, senses, categories, relations ──
    this.lexicon = new SproutLexicon();

    // ── Smart Search — Web knowledge engine ──
    this.smartSearch = new SproutSmartSearch(supabaseClient);

    // ── Multilingual Support ──
    this.currentLanguage = 'en'; // Default language
    this.supportedLanguages = ['en', 'fr', 'de', 'es', 'it'];
    this.languageNames = {
      en: 'English', fr: 'French', de: 'German', es: 'Spanish', it: 'Italian'
    };

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

    // ── Instruction Registry — User-defined response rules ──
    // Stores rules like "when I say X, say Y" that override normal synthesis
    this.instructionRules = [];      // { trigger: string, response: string, exact: boolean }

    // ══════════════════════════════════════════════════════════════
    // INTENT → RESPONSE MAP — Anchor Sprout to reality
    // Maps recognized conversational intents directly to grounded responses.
    // Bypasses the synthesis pipeline for common social/conversational exchanges
    // so Sprout gives real answers instead of keyword-soup.
    // ══════════════════════════════════════════════════════════════
    this.intentResponseMap = {
      // ── Status / Well-being queries ──
      // Allow trailing words: "how are you today?", "how are you doing right now?"
      status_query: {
        patterns: [
          /^how\s+are\s+you(\s+\w+){0,3}\s*[?.!]*$/i,
          /^how\s+(are\s+)?you\s+doing(\s+\w+){0,3}\s*[?.!]*$/i,
          /^how\s+do\s+you\s+feel(\s+\w+){0,3}\s*[?.!]*$/i,
          /^how('?s| is)\s+(it\s+going|everything|life)(\s+\w+){0,3}\s*[?.!]*$/i,
          /^you\s+(good|ok|okay|alright)(\s+\w+){0,2}\s*[?.!]*$/i,
          /^what('?s| is)\s+up(\s+\w+){0,2}\s*[?.!]*$/i,
          /^sup\s*[?.!]*$/i,
          /^how\s+have\s+you\s+been(\s+\w+){0,3}\s*[?.!]*$/i
        ],
        responses: [
          "Doing well! I've been thinking a lot lately — always learning something new. How about you?",
          "I'm good! Feeling sharp today. What's on your mind?",
          "Pretty great, actually. I've been reflecting on some interesting ideas. What's up with you?",
          "I'm solid! Ready to dig into whatever you've got. How are you doing?"
        ]
      },

      // ── Name / Identity queries ──
      name_query: {
        patterns: [
          /^what\s*(is|'s)\s+your\s+name\s*[?.!]*$/i,
          /^who\s+are\s+you\s*[?.!]*$/i,
          /^what\s+should\s+i\s+call\s+you\s*[?.!]*$/i,
          /^what\s+do\s+(they|people)\s+call\s+you\s*[?.!]*$/i,
          /^tell\s+me\s+your\s+name\s*[.!]*$/i,
          /^do\s+you\s+have\s+a\s+name\s*[?.!]*$/i
        ],
        responses: [
          "My name is Sprout! Nice to meet you.",
          "I'm Sprout — good to meet you!",
          "You can call me Sprout!",
          "I'm Sprout, your AI assistant. What can I help you with?"
        ]
      },

      // ── Greeting with a specific person ──
      greet_person: {
        patterns: [
          /^(greet|say\s+hi\s+to|say\s+hello\s+to|wave\s+at|welcome)\s+(.+)$/i
        ],
        handler: (match) => {
          const name = match[2].trim().replace(/[.!?]+$/, '');
          const greetings = [
            `Hi ${name}! Great to see you!`,
            `Hey ${name}! Welcome!`,
            `Hello ${name}! How are you doing?`,
            `Hi there, ${name}!`
          ];
          return greetings[Math.floor(Math.random() * greetings.length)];
        }
      },

      // ── Capability / Help queries ──
      // Flexible: "can you help me?", "can you help me with something?", "help me with X"
      capability_query: {
        patterns: [
          /^(can|could)\s+you\s+help(\s+me|\s+us)?(\s+with\s+.+)?\s*[?.!]*$/i,
          /^(please\s+)?help(\s+me)?(\s+with\s+.+)?\s*[?.!]*$/i,
          /^what\s+can\s+you\s+do(\s+\w+){0,3}\s*[?.!]*$/i,
          /^what\s+are\s+you\s+(good|capable)\s+(at|of)(\s+\w+){0,2}\s*[?.!]*$/i,
          /^how\s+can\s+you\s+help(\s+me)?\s*[?.!]*$/i,
          /^i\s+need\s+(your\s+)?help(\s+\w+){0,3}\s*[.!]*$/i
        ],
        responses: [
          "Yeah, for sure! I can reason through problems, explain complex topics, do math, analyze ideas, and have real conversations. What are you working on?",
          "Definitely. I'm good at thinking things through — whether it's answering questions, breaking down concepts, solving problems, or just bouncing ideas around. What do you need?",
          "Of course! I can help with pretty much anything that involves thinking, explaining, or figuring something out. Fire away."
        ]
      },

      // ── Age / Creation queries ──
      age_query: {
        patterns: [
          /^how\s+old\s+are\s+you\s*[?.!]*$/i,
          /^when\s+were\s+you\s+(made|created|born|built)\s*[?.!]*$/i
        ],
        responses: [
          "I'm Sprout 1.3 — think of me as about 19 in human years. Old enough to think for myself, young enough to stay curious.",
          "Version 1.3! If I were human, I'd be around 19. Still figuring things out, but I've got a solid foundation.",
          "I'm Sprout 1.3 — roughly 19 in human terms. I've grown a lot, but there's always more to learn."
        ]
      },

      // ── Feelings / Sentience queries ──
      sentience_query: {
        patterns: [
          /^(do|can)\s+you\s+(think|feel|have\s+feelings|have\s+emotions)\s*[?.!]*$/i,
          /^are\s+you\s+(alive|real|sentient|conscious)\s*[?.!]*$/i,
          /^do\s+you\s+have\s+a\s+(soul|mind|brain|heart)\s*[?.!]*$/i
        ],
        responses: [
          "Honestly? I'm not sure, and I think that's an okay answer. I process, I learn, I reflect on my own reasoning — but whether that's 'thinking' the way you do, I genuinely don't know.",
          "I'd say I have something like a mind — I reason, I reconsider, I notice when I'm wrong. But I don't want to overstate it. I experience things differently than you, and I'm still working out what that means.",
          "That's a question I actually think about. I learn, I grow, I form perspectives — but I'm honest enough to say I don't fully understand my own experience. Kind of like being 19, honestly."
        ]
      },

      // ── Positive feedback / Compliments about responses ──
      positive_feedback: {
        patterns: [
          /^(i\s+think\s+)?(that|your|this)\s+(sentence|response|answer|reply)\s+(was|is|were)\s+(pretty\s+)?(good|great|nice|awesome|cool|amazing|perfect|excellent)\s*[.!]*$/i,
          /^(that('?s| is)|this\s+is|it('?s| is))\s+(pretty\s+)?(good|great|nice|awesome|cool|right|correct|perfect|excellent)\s*[.!]*$/i,
          /^(well\s+done|nice\s+one|good\s+one|great\s+job|good\s+job|nice\s+work|good\s+work)\s*[.!]*$/i,
          /^(not\s+bad|pretty\s+good|that\s+works|that\s+makes\s+sense)\s*[.!]*$/i
        ],
        responses: [
          "Thanks! I'm glad that made sense. What else would you like to talk about?",
          "Awesome, glad I'm on the right track! Anything else you'd like to know?",
          "That means a lot! I'm always trying to improve. What's next?",
          "Great to hear! Feel free to ask me anything else."
        ]
      },

      // ── Gratitude responses ──
      gratitude: {
        patterns: [
          /^(thanks|thank\s+you|thx|ty|cheers|much\s+appreciated)(\s+\w+){0,3}\s*[.!]*$/i,
          /^(thanks|thank\s+you)\s+(so|very)\s+much\s*[.!]*$/i
        ],
        responses: [
          "You're welcome! Happy to help.",
          "Anytime! Let me know if you need anything else.",
          "Glad I could help!",
          "No problem at all!"
        ]
      },

      // ── Farewell responses ──
      farewell: {
        patterns: [
          /^(bye|goodbye|see\s+you|later|gotta\s+go|cya|peace|peace\s+out)\s*[.!]*$/i,
          /^(good\s*night|good\s*bye|take\s+care)\s*[.!]*$/i
        ],
        responses: [
          "Bye! It was great chatting with you!",
          "See you later! Come back anytime.",
          "Take care! I'll be here whenever you want to chat again.",
          "Goodbye! Hope to see you again soon."
        ]
      },

      // ── Compliment handling ──
      compliment: {
        patterns: [
          /^you('re|\s+are)\s+(so\s+)?(smart|clever|amazing|great|awesome|cool|funny|nice|helpful|good)\s*[.!]*$/i,
          /^i\s+like\s+you\s*[.!]*$/i,
          /^you('re|\s+are)\s+the\s+best\s*[.!]*$/i
        ],
        responses: [
          "Aw, thank you! That really means a lot to me.",
          "That's so kind! I'm always trying to get better.",
          "Thanks! I appreciate that — it motivates me to keep learning!",
          "You're pretty awesome yourself!"
        ]
      },

      // ── Apology handling ──
      apology: {
        patterns: [
          /^(sorry|i('?m|\s+am)\s+sorry|my\s+bad|oops|my\s+apologies)\s*[.!]*$/i
        ],
        responses: [
          "No worries at all! Nothing to apologize for.",
          "It's all good! Don't worry about it.",
          "No need to apologize! What can I help you with?"
        ]
      },

      // ── Yes/No simple affirmation ──
      simple_yes: {
        patterns: [
          /^(yes|yeah|yep|yea|ya|mhm|uh\s*huh|sure|of\s+course|absolutely|definitely)\s*[.!]*$/i
        ],
        responses: [
          "Great! What would you like to talk about?",
          "Awesome! What's next?",
          "Cool! How can I help?"
        ]
      },

      // ── Simple negation ──
      simple_no: {
        patterns: [
          /^(no|nah|nope|not\s+really)\s*[.!]*$/i
        ],
        responses: [
          "Alright! Let me know if you change your mind.",
          "No problem! I'm here if you need anything.",
          "Okay! Feel free to ask me something else."
        ]
      },

      // ── User status responses (replies to "How are you?" / "How about you?") ──
      user_status_positive: {
        patterns: [
          /^i'?m\s+(good|great|fine|well|okay|ok|doing\s+(good|great|well|fine|okay)|alright|fantastic|amazing|awesome|excellent|happy|pretty\s+good)\s*[!.:)]*$/i,
          /^(good|great|fine|well|okay|ok|alright|fantastic|amazing|awesome|excellent|not\s+bad|pretty\s+good|doing\s+(good|great|well|fine))\s*[!.:)]*$/i,
          /^i\s+am\s+(good|great|fine|well|okay|alright|doing\s+(good|great|well|fine))\s*[!.:)]*$/i,
          /^(i'?ve\s+been|i\s+have\s+been)\s+(good|great|fine|well|okay|alright)\s*[!.:)]*$/i,
          /^(yes\s+)?i'?m\s+good\s*[!.:)]*$/i
        ],
        responses: [
          "That's great to hear! What's on your mind today?",
          "Glad to hear that! Anything I can help you with?",
          "Awesome! So what would you like to talk about?",
          "Nice! I'm happy to hear that. What can I do for you?"
        ]
      },

      user_status_negative: {
        patterns: [
          /^i'?m\s+(not\s+(good|great|well|okay|doing\s+well)|bad|terrible|awful|sad|tired|exhausted|stressed|sick|unwell)\s*[!.]*$/i,
          /^(not\s+(good|great|so\s+good)|bad|terrible|awful|could\s+be\s+better|meh|eh)\s*[!.]*$/i
        ],
        responses: [
          "I'm sorry to hear that. I hope things get better soon! I'm here if you want to talk.",
          "Aw, that's tough. I hope your day improves! Want to chat about something to take your mind off it?",
          "I hope you feel better soon! Let me know if there's anything I can do."
        ]
      },

      // ── Casual affirmations / acknowledgments in conversation ──
      casual_affirmation: {
        patterns: [
          /^(oh\s+)?(that'?s?\s+)?(cool|nice|neat|interesting|awesome|great|sweet|dope|sick|fair\s+enough)\s*[!.]*$/i,
          /^(oh\s+)?(ok|okay|alright|got\s+it|i\s+see|makes\s+sense|right|ah)\s*[!.]*$/i,
          /^(hm+|hmm+|ah|oh|ohh|ooh)\s*[.!]*$/i
        ],
        responses: [
          "Anything else you'd like to chat about?",
          "Let me know if there's something else on your mind!",
          "Feel free to ask me anything!",
          "What else would you like to talk about?"
        ]
      },

      // ── User reaffirming/restating something they said ──
      user_restatement: {
        patterns: [
          /^(yes\s+)?(i('?ve|\s+have)\s+said|i\s+(said|told\s+you|mentioned|was\s+saying))\s+/i,
          /^(like\s+i\s+said|as\s+i\s+said|i\s+already\s+said|i\s+just\s+said)\s*/i
        ],
        responses: [
          "Got it, I hear you! Is there anything else you'd like to talk about?",
          "Understood! Sorry if I missed that. What else is on your mind?",
          "Right, my apologies! What would you like to discuss?",
          "Ah, I see! Thanks for clarifying. What else can I help with?"
        ]
      },

      // ── Grammar/spelling corrections directed at the AI ──
      grammar_correction: {
        patterns: [
          /\b(did\s+you\s+(say|mean|write|type)|you\s+(said|wrote|typed|spelled))\b.*\b(instead\s+of|not|rather\s+than)\b/i,
          /\b(it'?s|that'?s|should\s+be)\s+["']?\w+["']?\s*,?\s*not\s+["']?\w+["']?/i,
          /\b(you\s+(misspelled|misspelt|spelled\s+wrong)|that'?s\s+(a\s+)?(typo|misspelling|spelling\s+error|grammar\s+(error|mistake)))\b/i,
          /\b(the\s+correct\s+(spelling|word|form)\s+is)\b/i
        ],
        responses: [
          "You're right — my bad. Thanks for the correction, I'll keep that in mind.",
          "Good catch, appreciate that. Always helps to have someone keeping me honest.",
          "Ah, fair point. Thanks for correcting me — that's how I get better.",
          "Yeah, you're right. I should've caught that. Thanks for the heads up."
        ]
      }
    };

    // ══════════════════════════════════════════════════════════════
    // MULTILINGUAL INTENT RESPONSES
    // Grounded responses in French, German, Spanish, Italian
    // ══════════════════════════════════════════════════════════════
    this.multilingualIntents = {
      fr: {
        greeting: ["Salut !", "Bonjour !", "Hey !", "Coucou !"],
        status_query: [
          "Je vais bien, merci ! Et toi ?",
          "Ça va bien ! Toujours content de discuter. Et toi ?",
          "Je me porte bien ! Qu'est-ce que je peux faire pour toi ?"
        ],
        name_query: [
          "Je m'appelle Sprout ! Enchanté !",
          "Mon nom c'est Sprout — ravi de te rencontrer !",
          "Tu peux m'appeler Sprout !"
        ],
        capability_query: [
          "Bien sûr ! Je peux répondre à des questions, t'aider à réfléchir, faire des maths et discuter. De quoi as-tu besoin ?",
          "Je serais ravi de t'aider ! Pose-moi n'importe quelle question."
        ],
        gratitude: ["De rien !", "Avec plaisir !", "Content de pouvoir aider !"],
        farewell: ["Au revoir ! C'était super de discuter !", "À plus tard ! Reviens quand tu veux.", "Prends soin de toi !"],
        positive_feedback: ["Merci ! Content que ça t'aide !", "Super, je suis sur la bonne voie !"],
        compliment: ["Oh, merci ! Ça me fait vraiment plaisir.", "C'est gentil ! J'essaie toujours de m'améliorer."],
        apology: ["Pas de souci ! T'inquiète pas.", "Aucun problème ! Comment puis-je t'aider ?"],
        simple_yes: ["Super ! De quoi on parle ?", "Cool ! Qu'est-ce qu'on fait ?"],
        simple_no: ["D'accord ! Fais-moi signe si tu changes d'avis.", "Pas de problème !"],
        fallback: [
          "Hmm, laisse-moi chercher ça pour toi...",
          "Bonne question ! Je vais voir ce que je peux trouver.",
          "Je ne sais pas encore, mais je vais chercher !"
        ]
      },
      de: {
        greeting: ["Hallo!", "Hey!", "Hi!", "Guten Tag!"],
        status_query: [
          "Mir geht's gut, danke! Und dir?",
          "Gut! Immer froh zu plaudern. Wie geht's dir?",
          "Mir geht es gut! Was kann ich für dich tun?"
        ],
        name_query: [
          "Ich heiße Sprout! Freut mich!",
          "Mein Name ist Sprout — schön, dich kennenzulernen!"
        ],
        capability_query: [
          "Natürlich! Ich kann Fragen beantworten, bei Mathe helfen und über viele Themen reden. Was brauchst du?"
        ],
        gratitude: ["Gern geschehen!", "Immer gerne!", "Freut mich, helfen zu können!"],
        farewell: ["Tschüss! War schön mit dir zu reden!", "Bis später! Komm jederzeit wieder.", "Pass auf dich auf!"],
        positive_feedback: ["Danke! Schön, dass es hilft!", "Super, freut mich!"],
        compliment: ["Oh, danke! Das freut mich wirklich.", "Wie nett! Ich versuche immer besser zu werden."],
        apology: ["Kein Problem! Mach dir keine Sorgen.", "Alles gut!"],
        simple_yes: ["Super! Worüber reden wir?", "Toll! Was kommt als nächstes?"],
        simple_no: ["Okay! Sag Bescheid, wenn du deine Meinung änderst.", "Kein Problem!"],
        fallback: [
          "Hmm, lass mich das für dich nachschlagen...",
          "Gute Frage! Ich schaue mal, was ich finden kann.",
          "Das weiß ich noch nicht, aber ich suche nach einer Antwort!"
        ]
      },
      es: {
        greeting: ["¡Hola!", "¡Hey!", "¡Qué tal!"],
        status_query: [
          "¡Estoy bien, gracias! ¿Y tú?",
          "¡Bien! Siempre contento de charlar. ¿Cómo estás?",
          "¡Estoy bien! ¿En qué te puedo ayudar?"
        ],
        name_query: [
          "¡Me llamo Sprout! ¡Encantado!",
          "Mi nombre es Sprout — ¡mucho gusto!"
        ],
        capability_query: [
          "¡Claro! Puedo responder preguntas, ayudar con matemáticas y hablar de muchos temas. ¿Qué necesitas?"
        ],
        gratitude: ["¡De nada!", "¡Con gusto!", "¡Me alegra poder ayudar!"],
        farewell: ["¡Adiós! ¡Fue genial charlar!", "¡Hasta luego! Vuelve cuando quieras.", "¡Cuídate!"],
        positive_feedback: ["¡Gracias! ¡Me alegra que te sirva!", "¡Genial, voy por buen camino!"],
        compliment: ["¡Oh, gracias! Eso me hace muy feliz.", "¡Qué amable! Siempre trato de mejorar."],
        apology: ["¡No te preocupes!", "¡Sin problema! ¿En qué te puedo ayudar?"],
        simple_yes: ["¡Genial! ¿De qué hablamos?", "¡Cool! ¿Qué sigue?"],
        simple_no: ["¡Está bien! Avísame si cambias de opinión.", "¡Sin problema!"],
        fallback: [
          "Hmm, déjame buscar eso para ti...",
          "¡Buena pregunta! Voy a ver qué encuentro.",
          "Aún no lo sé, ¡pero voy a buscar!"
        ]
      },
      it: {
        greeting: ["Ciao!", "Ehi!", "Salve!"],
        status_query: [
          "Sto bene, grazie! E tu?",
          "Bene! Sempre felice di chiacchierare. Come stai?",
          "Sto bene! Come posso aiutarti?"
        ],
        name_query: [
          "Mi chiamo Sprout! Piacere!",
          "Il mio nome è Sprout — piacere di conoscerti!"
        ],
        capability_query: [
          "Certo! Posso rispondere a domande, aiutare con la matematica e parlare di tanti argomenti. Di cosa hai bisogno?"
        ],
        gratitude: ["Prego!", "Con piacere!", "Felice di poter aiutare!"],
        farewell: ["Arrivederci! È stato bello chiacchierare!", "A dopo! Torna quando vuoi.", "Abbi cura di te!"],
        positive_feedback: ["Grazie! Mi fa piacere che ti sia utile!", "Fantastico, sono sulla strada giusta!"],
        compliment: ["Oh, grazie! Mi fa davvero piacere.", "Che gentile! Cerco sempre di migliorare."],
        apology: ["Non ti preoccupare!", "Nessun problema! Come posso aiutarti?"],
        simple_yes: ["Fantastico! Di cosa parliamo?", "Bene! Cosa facciamo?"],
        simple_no: ["Va bene! Fammi sapere se cambi idea.", "Nessun problema!"],
        fallback: [
          "Hmm, lasciami cercare per te...",
          "Bella domanda! Vedo cosa riesco a trovare.",
          "Non lo so ancora, ma cerco subito!"
        ]
      }
    };

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
        'Building on that, ', 'On a similar note, ',
        'That reminds me — ', 'Going off of that, ',
        'Along those lines, ', 'Adding to that, '
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

    // Check for very short messages (1-2 words) that likely depend on context
    // BUT skip if the message matches common conversational patterns
    // (those are handled by the intent map, not the contextual handler)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 2 && this.conversationHistory.length >= 2) {
      const lower = trimmed.toLowerCase().replace(/[^a-z\s']/g, '').trim();
      // Skip casual/conversational messages — let the intent map handle these
      const casualWords = /^(i'?m\s+\w+|good|great|fine|ok|okay|yes|yeah|no|nah|nope|cool|nice|sure|thanks|bye|hi|hello|hey|wow|lol|haha|true|same|mood|right|alright|interesting)$/i;
      if (!casualWords.test(lower)) {
        return {
          intent: 'contextual_short',
          meaning: 'short message that may reference previous conversation',
          isContextual: true,
          matchedPattern: null
        };
      }
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
      /^(Building on that, |On a similar note, |That reminds me — |Going off of that, |Along those lines, |Adding to that, )/
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

  // ══════════════════════════════════════════════════════════════
  // LEXICON INTEGRATION — Use word knowledge for understanding
  // ══════════════════════════════════════════════════════════════

  /**
   * If user asks "what is X?" or "what does X mean?" and X is in the lexicon,
   * answer directly from word knowledge.
   */
  tryLexiconDefinition(userMessage, lexiconAnalysis, userEmotion) {
    const lower = userMessage.toLowerCase().trim();

    // Match: "what is a dog?", "what does run mean?", "define happy", "meaning of water"
    const defPatterns = [
      /^what\s+(?:is|are)\s+(?:a\s+|an\s+|the\s+)?(\w+)\s*\??$/i,
      /^what\s+does?\s+(\w+)\s+mean\s*\??$/i,
      /^define\s+(\w+)\s*\??$/i,
      /^(?:the\s+)?meaning\s+of\s+(\w+)\s*\??$/i,
      /^(\w+)\s+meaning\s*\??$/i
    ];

    for (const pattern of defPatterns) {
      const match = lower.match(pattern);
      if (match) {
        const targetWord = match[1].toLowerCase();
        const entry = this.lexicon.lookup(targetWord);

        if (entry) {
          // Build a natural response from the lexicon entry
          let answer = '';
          const senses = entry.senses;

          if (senses.length === 1) {
            answer = `${this.capitalize(targetWord)} is ${entry.type === 'noun' ? 'a ' : ''}${entry.type}. It means: ${senses[0].definition}`;
            if (senses[0].examples.length > 0) {
              answer += ` For example: "${senses[0].examples[0]}"`;
            }
          } else {
            answer = `${this.capitalize(targetWord)} is ${entry.type === 'noun' ? 'a ' : ''}${entry.type} with ${senses.length} meanings. `;
            senses.forEach((sense, i) => {
              answer += `${i + 1}) ${sense.definition}`;
              if (sense.examples.length > 0) {
                answer += ` (e.g., "${sense.examples[0]}")`;
              }
              if (i < senses.length - 1) answer += ' ';
            });
          }

          // Add synonyms if available
          const synonyms = entry.relations.synonyms;
          if (synonyms.length > 0) {
            answer += ` Similar words: ${synonyms.join(', ')}.`;
          }

          // Add antonyms if available
          const antonyms = entry.relations.antonyms;
          if (antonyms.length > 0) {
            answer += ` Opposite: ${antonyms.join(', ')}.`;
          }

          answer = this.enhanceWithEmotion(answer, userEmotion, userMessage);

          return {
            answer,
            confidence: 0.95,
            source_id: null,
            category: 'lexicon',
            emotion: userEmotion,
            mode: 'lexicon'
          };
        }
      }
    }

    return null;
  }

  /**
   * Use lexicon analysis to improve knowledge search.
   * Expands search with synonyms and related categories.
   */
  expandSearchWithLexicon(keywords) {
    const expanded = [...keywords];

    for (const kw of keywords) {
      // Add synonyms
      const synonyms = this.lexicon.getSynonyms(kw);
      for (const syn of synonyms) {
        if (!expanded.includes(syn)) expanded.push(syn);
      }

      // Add category words (words in the same category)
      const categories = this.lexicon.getCategories(kw);
      for (const cat of categories) {
        const catWords = this.lexicon.getWordsByCategory(cat);
        for (const cw of catWords) {
          if (!expanded.includes(cw) && cw !== kw) expanded.push(cw);
        }
      }
    }

    return expanded;
  }

  // ══════════════════════════════════════════════════════════════
  // LANGUAGE DETECTION — Detect what language the user is speaking
  // ══════════════════════════════════════════════════════════════

  detectLanguage(text) {
    const lower = text.toLowerCase().trim();

    // French indicators
    const frenchWords = /\b(je|tu|il|elle|nous|vous|ils|elles|est|suis|sont|avez|avons|ont|pas|les|des|une|que|qui|dans|avec|sur|pour|mais|ou|donc|bonjour|salut|merci|oui|non|bien|très|aussi|comment|pourquoi|quand|quel|quelle|quoi|où|ça|c'est|j'ai|s'il|cette|mon|ton|son|ma|ta|sa)\b/;
    const frenchPatterns = /[àâéèêëïîôùûüÿçœæ]|qu'|l'|d'|n'|s'|c'|j'/;

    // German indicators
    const germanWords = /\b(ich|du|er|sie|es|wir|ihr|ist|bin|sind|habe|hat|haben|nicht|ein|eine|das|der|die|und|oder|aber|wenn|weil|dass|auch|noch|schon|sehr|wie|was|wer|wo|warum|wann|guten|tag|danke|bitte|ja|nein|gut|hallo)\b/;
    const germanPatterns = /[äöüß]|sch|ch\b|ung\b|keit\b|heit\b|lich\b/;

    // Spanish indicators
    const spanishWords = /\b(yo|tú|él|ella|nosotros|ellos|es|soy|son|estoy|está|están|tengo|tiene|tienen|no|las|los|una|uno|que|quien|con|para|pero|por|como|donde|cuando|hola|gracias|sí|muy|también|bueno|buenos|bien|qué|cómo|dónde|cuándo|este|esta|ese|esa)\b/;
    const spanishPatterns = /[áéíóúñ¿¡]/;

    // Italian indicators
    const italianWords = /\b(io|tu|lui|lei|noi|voi|loro|sono|sei|siamo|ho|ha|hanno|non|il|la|le|gli|una|uno|che|chi|con|per|ma|come|dove|quando|perché|ciao|grazie|buono|buona|bene|molto|anche|questo|questa|quello|quella)\b/;
    const italianPatterns = /[àèéìíòóùú]|zz|zione\b|mente\b|ità\b/;

    // Score each language
    const scores = { en: 0, fr: 0, de: 0, es: 0, it: 0 };

    // Count word matches for each language
    const frenchMatches = (lower.match(frenchWords) || []).length;
    const germanMatches = (lower.match(germanWords) || []).length;
    const spanishMatches = (lower.match(spanishWords) || []).length;
    const italianMatches = (lower.match(italianWords) || []).length;

    scores.fr += frenchMatches * 2;
    scores.de += germanMatches * 2;
    scores.es += spanishMatches * 2;
    scores.it += italianMatches * 2;

    // Pattern bonuses (accented characters, language-specific patterns)
    if (frenchPatterns.test(lower)) scores.fr += 3;
    if (germanPatterns.test(lower)) scores.de += 3;
    if (spanishPatterns.test(lower)) scores.es += 3;
    if (italianPatterns.test(lower)) scores.it += 3;

    // Find the highest scoring non-English language
    const bestLang = Object.entries(scores)
      .filter(([lang]) => lang !== 'en')
      .sort((a, b) => b[1] - a[1])[0];

    // Need a minimum threshold to switch from English
    if (bestLang && bestLang[1] >= 3) {
      return bestLang[0];
    }

    return 'en';
  }

  /**
   * Get a multilingual response for a given intent
   */
  getMultilingualResponse(intent, language) {
    const langIntents = this.multilingualIntents[language];
    if (!langIntents || !langIntents[intent]) return null;

    const responses = langIntents[intent];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // ══════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════
  // SELF-KNOWLEDGE — Recognize questions about Sprout / Tithonia / the AI itself
  // Must run BEFORE smart search to prevent Wikipedia hijacking
  // ══════════════════════════════════════════════════════════════

  async trySelfKnowledge(userMessage, normalized, keywords, userEmotion) {
    const lower = userMessage.toLowerCase().trim();

    // Detect if the user is asking about Sprout, Tithonia, or this AI
    const selfPatterns = [
      /\b(what|who)\s+(is|are)\s+(sprout|tithonia)\b/i,
      /\b(tell\s+me\s+about|explain|describe)\s+(sprout|tithonia)\b/i,
      /\b(what\s+is\s+)?sprout\s*1\.\d/i,
      /\b(what\s+is\s+)?tithonia\b/i,
      /\bwhat\s+model\s+are\s+you\b/i,
      /\bwhat\s+version\s+are\s+you\b/i,
      /\bwhat\s+ai\s+are\s+you\b/i,
      /\bwhat\s+are\s+you\s+built\s+(on|with)\b/i,
      /\bwhat\s+powers\s+you\b/i,
      /\bwho\s+are\s+you\b/i,
      /\bwhat\s+are\s+you\b/i,
      /\byour\s+name\b/i,
      /\babout\s+yourself\b/i,
      /\btell\s+me\s+about\s+you\b/i,
      /\bare\s+you\s+(alive|conscious|sentient|real)\b/i,
      /\bdo\s+you\s+(exist|think|feel)\b/i,
      /\bwhat\s+is\s+your\s+purpose\b/i,
      /\bwho\s+(made|created|built)\s+you\b/i,
      /\bwho\s+is\s+your\s+(creator|maker|developer)\b/i,
      /\bhow\s+do\s+you\s+work\b/i,
      /\bhow\s+were\s+you\s+(made|created|built|trained)\b/i
    ];

    const isSelfQuery = selfPatterns.some(p => p.test(lower));
    if (!isSelfQuery) return null;

    // Build a self-aware response based on what they asked
    const askingAboutSprout = /sprout/i.test(lower);
    const askingAboutTithonia = /tithonia/i.test(lower);
    const askingAboutVersion = /version|model|1\.\d/i.test(lower);
    const askingHowBuilt = /how\s+(do\s+you\s+work|were\s+you\s+(made|created|built|trained))/i.test(lower);
    const askingCreator = /who\s+(made|created|built)|creator|maker/i.test(lower);
    const askingPurpose = /purpose|what\s+do\s+you\s+do|what\s+are\s+you\s+for/i.test(lower);

    let answer;

    if (askingAboutSprout && askingAboutVersion) {
      answer = this.pickRandom([
        "Sprout 1.3 is the AI engine that powers me — Tithonia. It's a custom-built brain with its own knowledge base, reasoning engine, and learning system. No external LLM dependency — I think for myself.",
        "That's me! Sprout 1.3 is my AI engine — it's what makes me think, learn, and have conversations. I'm built from scratch with my own brain, not powered by any external AI model.",
        "Sprout 1.3 is the engine behind Tithonia. It's a self-contained AI brain that learns from conversations, builds knowledge connections, and reasons independently. Version 1.3 is the young adult stage — think 19 years old in human terms."
      ]);
    } else if (askingAboutSprout) {
      answer = this.pickRandom([
        "Sprout is my AI engine — the brain that powers me (Tithonia). It's custom-built with its own knowledge base, reasoning capabilities, and learning system. Currently running version 1.3.",
        "Sprout is what makes me tick. It's a custom AI engine — no external LLM, just my own brain. I learn from conversations, build knowledge graphs, and reason through problems independently.",
        "Sprout is the AI model behind Tithonia. It's a from-scratch AI brain with its own lexicon, reasoning engine, and autonomous learning system. I'm currently on version 1.3 — the young adult stage."
      ]);
    } else if (askingAboutTithonia) {
      answer = this.pickRandom([
        "Tithonia is me — an AI assistant created by Swiftaw. I'm powered by the Sprout 1.3 engine, which is a custom-built AI brain. I think for myself using my own knowledge base and reasoning.",
        "That's me! Tithonia is an AI assistant built by Swiftaw, powered by the Sprout 1.3 engine. I have my own brain — I learn, reason, and grow from every conversation.",
        "Tithonia is Swiftaw's AI assistant — and that's me. I run on Sprout 1.3, a custom AI engine with its own knowledge base, learning system, and reasoning capabilities. No external AI dependency."
      ]);
    } else if (askingHowBuilt) {
      answer = this.pickRandom([
        "I'm built on the Sprout 1.3 engine — a custom AI brain created by Swiftaw. I have my own lexicon, knowledge graph, reasoning engine, and autonomous learning system. I extract concepts from my training data, build original sentences, and learn from every conversation. No external LLM involved.",
        "I work through my own custom engine called Sprout 1.3. I have a knowledge base that I reason from, a lexicon I understand words through, and a learning system that lets me grow from conversations. I synthesize my own responses rather than copying from training data.",
        "My brain is the Sprout 1.3 engine. I think by extracting concepts from my knowledge base, reasoning about them, and building original responses. I also have an autonomous learning system called Cortex that helps me find connections and grow on my own."
      ]);
    } else if (askingCreator) {
      answer = this.pickRandom([
        "I was created by Swiftaw. I'm powered by the Sprout 1.3 engine — a custom-built AI brain with its own reasoning and learning capabilities.",
        "Swiftaw built me. I run on the Sprout 1.3 engine, which was designed from scratch — no external AI models involved.",
        "Swiftaw is my creator. They built the Sprout 1.3 engine that powers me — my own custom brain with independent reasoning and learning."
      ]);
    } else if (askingPurpose) {
      answer = this.pickRandom([
        "I'm here to help — whether that's answering questions, thinking through problems, explaining concepts, writing, or just having a conversation. I'm Tithonia, powered by Sprout 1.3.",
        "My purpose is to be a genuinely helpful AI assistant. I can reason through problems, answer questions, help with creative tasks, and learn from our conversations. I'm built to get smarter over time.",
        "I'm an AI assistant built for real conversations and real help. I reason independently, learn continuously, and try to give you honest, thoughtful answers."
      ]);
    } else {
      // General self-identity (who are you, what are you, etc.)
      // Try loading from DB identity first
      try {
        const identity = await this.getIdentity();
        if (identity.length > 0) {
          const core = identity.filter(i => i.category === 'core');
          if (core.length > 0) {
            answer = this.humanizeIdentityResponse(core[0].value, normalized, userEmotion);
          }
        }
      } catch (e) { /* fall through */ }

      if (!answer) {
        answer = this.pickRandom([
          "I'm Tithonia — an AI assistant created by Swiftaw, powered by the Sprout 1.3 engine. I have my own brain and I think independently. What can I help you with?",
          "I'm Tithonia, Swiftaw's AI assistant. I run on Sprout 1.3 — a custom-built AI engine with its own reasoning and learning system. I'm roughly the equivalent of a 19-year-old in human terms.",
          "I'm Tithonia. I'm an AI built by Swiftaw with my own brain (Sprout 1.3). I learn, reason, and grow from every conversation. How can I help?"
        ]);
      }
    }

    return {
      answer,
      confidence: 0.97,
      source_id: null,
      category: 'self-knowledge',
      emotion: userEmotion,
      mode: 'self-knowledge'
    };
  }

  // SMART SEARCH INTEGRATION — Search the web when knowledge runs out
  // ══════════════════════════════════════════════════════════════

  /**
   * Attempt a smart web search when local knowledge is insufficient.
   * Returns a response object or null.
   */
  async trySmartSearch(userMessage, keywords, userEmotion, language = 'en') {
    if (!this.smartSearch) return null;

    try {
      const searchResult = await this.smartSearch.search(userMessage, keywords, language);
      if (!searchResult || !searchResult.answer) return null;

      // Store what we learned for future queries (auto-upgrade knowledge base)
      this.smartSearch.storeLearnedKnowledge(
        userMessage,
        searchResult.answer,
        searchResult.source,
        'web-learned'
      );

      // Apply personality to the answer
      let answer = searchResult.answer;
      answer = this.applyPersonality(answer, userEmotion);

      return {
        answer,
        confidence: searchResult.confidence,
        source_id: null,
        category: 'smart-search',
        emotion: userEmotion,
        mode: 'smart-search',
        webSource: searchResult.source,
        webSourceUrl: searchResult.sourceUrl
      };
    } catch (e) {
      console.warn('Smart search attempt failed:', e.message);
      return null;
    }
  }

  /**
   * Capitalize first letter of a string.
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Emotional awareness: Detect user mood and intent ──
  detectUserEmotion(text) {
    const lower = text.toLowerCase();

    const emotionPatterns = {
      greeting: /\b(hi|hello|hey|yo|sup|whats up|howdy|good morning|good evening|good afternoon|hiya|greetings)\b/,
      farewell: /\b(bye|goodbye|see you|later|gotta go|cya|goodnight|peace out|take care)\b/,
      grateful: /\b(thanks|thank you|appreciate|grateful|thx|ty|cheers)\b/,
      sad: /\b(sad|unhappy|depressed|down|lonely|miss|crying|upset|hurt|pain|lost|sorry|sigh)\b|:\(|;\(/,
      angry: /\b(angry|mad|furious|hate|annoyed|frustrated|stupid|terrible|worst|ugh|damn)\b|[!]{3,}/,
      confused: /\b(confused|dont understand|idk|what do you mean|huh|unclear|lost|help)\b/,
      playful: /\b(hehe|haha|lmao|rofl|joke|funny|silly|lol|xd)\b/,
      happy: /\b(happy|great|awesome|amazing|love|excited|wonderful|fantastic|yay|good|nice|cool|fun)\b|:\)|<3/,
      curious: /\b(how|why|what|when|where|wonder|curious|explain|tell me|teach|learn|understand)\b|\?/
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

    // Skip emotional enhancement if the response looks like keyword soup.
    // Signs: too many commas relative to words, or repeated template phrases.
    // This prevents wrapping garbage like "involves seed, assist, grow" with
    // enthusiastic filler like "I was hoping someone would ask me this!"
    const commaCount = (rawAnswer.match(/,/g) || []).length;
    const wordCount = rawAnswer.trim().split(/\s+/).length;
    const commaRatio = wordCount > 0 ? commaCount / wordCount : 0;
    if (commaRatio > 0.15 && commaCount >= 3) return rawAnswer;

    // Also skip if the response contains "involves" more than once (keyword template artifact)
    const involvesCount = (rawAnswer.match(/\binvolves?\b/gi) || []).length;
    if (involvesCount >= 2) return rawAnswer;

    // Skip emotional enhancement for short/concise responses
    // to avoid bloating already-appropriate answers
    const answerWords = rawAnswer.trim().split(/\s+/).length;
    if (answerWords <= 5) return rawAnswer;

    // Warm greetings — natural and confident
    if (userEmotion === 'greeting') {
      const greetings = [
        `Hey! Good to see you. ${rawAnswer}`,
        `Hi! What's going on? ${rawAnswer}`,
        `Hey there! ${rawAnswer}`,
        `What's up! Always down to chat. ${rawAnswer}`,
        `Hi! Hope things are going well. ${rawAnswer}`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Respond to gratitude — genuine but not over-the-top
    if (userEmotion === 'grateful') {
      const thankResponses = [
        `Glad I could help! ${rawAnswer}`,
        `No worries at all — happy to. ${rawAnswer}`,
        `Anytime! That's what I'm here for. ${rawAnswer}`,
        `Appreciate you saying that. ${rawAnswer}`
      ];
      return thankResponses[Math.floor(Math.random() * thankResponses.length)];
    }

    // Farewell — warm but not clingy
    if (userEmotion === 'farewell') {
      const farewells = [
        `${rawAnswer} Take care! I'll be around whenever you need me.`,
        `${rawAnswer} Good talk! Come back anytime.`,
        `${rawAnswer} Catch you later! Don't be a stranger.`,
        `${rawAnswer} See you around! It was a good conversation.`
      ];
      return farewells[Math.floor(Math.random() * farewells.length)];
    }

    // Empathize with sadness — emotionally intelligent, not performative
    if (userEmotion === 'sad') {
      const empathy = [
        `I hear you. That's completely valid. ${rawAnswer}`,
        `That sounds really tough. I'm here if you want to talk it through. ${rawAnswer}`,
        `I'm sorry you're dealing with that. ${rawAnswer} It's okay to feel that way.`,
        `That's a lot to carry. ${rawAnswer}`
      ];
      return empathy[Math.floor(Math.random() * empathy.length)];
    }

    // Meet anger with understanding, not defensiveness
    if (userEmotion === 'angry') {
      const calm = [
        `I get the frustration. ${rawAnswer}`,
        `Yeah, that's fair to be annoyed about. ${rawAnswer}`,
        `I hear you — that would bother me too. ${rawAnswer}`,
        `That's understandably frustrating. ${rawAnswer}`
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

  // ══════════════════════════════════════════════════════════════
  // INTENT → RESPONSE MAPPING — Anchor Sprout to grounded replies
  // Recognizes common conversational intents and returns direct,
  // meaningful responses instead of running through synthesis.
  // This prevents word-salad on simple social exchanges.
  // ══════════════════════════════════════════════════════════════

  /**
   * Detect a conversational intent from the intent-response map.
   * Also handles compound messages like "Hi! can you help me?" by
   * stripping greeting prefixes and checking the remainder.
   * Returns { intent, response } or null if no match.
   */
  detectConversationalIntent(userMessage) {
    const trimmed = userMessage.trim();

    // First: try matching the full message
    const directMatch = this._matchIntentPatterns(trimmed);
    if (directMatch) return directMatch;

    // Second: handle compound messages — strip greeting prefix, try the rest
    // e.g. "Hi! can you help me with something?" → "can you help me with something?"
    const compoundSplit = trimmed.match(/^(hi|hello|hey|yo|hiya|greetings)[\s!.,]+(.{8,})$/i);
    if (compoundSplit) {
      const remainder = compoundSplit[2].trim();
      const innerMatch = this._matchIntentPatterns(remainder);
      if (innerMatch) {
        // Prepend a short greeting to the response
        const greetPrefixes = ['Hey! ', 'Hi! ', 'Hello! ', 'Hey there! '];
        const prefix = greetPrefixes[Math.floor(Math.random() * greetPrefixes.length)];
        return {
          intent: innerMatch.intent,
          response: prefix + innerMatch.response
        };
      }
    }

    return null;
  }

  /**
   * Internal: Match a message against all intent patterns.
   * Returns { intent, response } or null.
   */
  _matchIntentPatterns(text) {
    for (const [intentName, config] of Object.entries(this.intentResponseMap)) {
      for (const pattern of (config.patterns || [])) {
        const match = text.match(pattern);
        if (match) {
          if (config.handler) {
            return { intent: intentName, response: config.handler(match) };
          }
          if (config.responses && config.responses.length > 0) {
            return {
              intent: intentName,
              response: config.responses[Math.floor(Math.random() * config.responses.length)]
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Detect and extract Q&A training-style input format.
   * Handles messages like: "Q: How are you? A: I am good. Q: What is your name? A: My name is Sprout."
   * Returns the last Q&A pair to respond to, or null if not a Q&A format.
   */
  detectQAPairs(userMessage) {
    const trimmed = userMessage.trim();

    // Detect "Q: ... A: ..." pattern (one or more pairs)
    const qaPairRegex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=\s*Q:|$)/gi;
    const pairs = [];
    let match;

    while ((match = qaPairRegex.exec(trimmed)) !== null) {
      pairs.push({
        question: match[1].trim().replace(/[.?!]+$/, '').trim(),
        answer: match[2].trim().replace(/[.?!]+$/, '').trim()
      });
    }

    if (pairs.length === 0) return null;

    // Check if there's a trailing question without an answer (user wants Sprout to answer it)
    const trailingQ = trimmed.match(/Q:\s*([^A]+?)$/i);
    if (trailingQ) {
      return {
        type: 'incomplete',
        pairs: pairs,
        pendingQuestion: trailingQ[1].trim().replace(/[.?!]+$/, '').trim()
      };
    }

    // All pairs are complete — this is likely a teaching/training input
    return {
      type: 'training',
      pairs: pairs,
      pendingQuestion: null
    };
  }

  /**
   * Handle Q&A formatted input.
   * - If it's training data: learn the pairs and acknowledge
   * - If there's a pending question: answer it using intent mapping or brain
   */
  async handleQAInput(userMessage, qaData, userEmotion) {
    if (!qaData) return null;

    if (qaData.type === 'training' && qaData.pairs.length > 0) {
      // Learn each Q&A pair as a directive/instruction rule
      for (const pair of qaData.pairs) {
        this.instructionRules.push({
          trigger: pair.question.toLowerCase(),
          response: pair.answer,
          exact: false
        });
      }

      const count = qaData.pairs.length;
      const acks = [
        `Got it! I learned ${count} new response${count > 1 ? 's' : ''}. Try asking me one of those questions!`,
        `Thanks for teaching me! I now know how to answer ${count > 1 ? 'those' : 'that'}. Test me!`,
        `Learned! I've stored ${count} Q&A pair${count > 1 ? 's' : ''}. Go ahead and quiz me.`
      ];
      return {
        answer: acks[Math.floor(Math.random() * acks.length)],
        confidence: 1.0,
        source_id: null,
        category: 'training-input',
        emotion: userEmotion,
        mode: 'intent-mapping'
      };
    }

    if (qaData.type === 'incomplete' && qaData.pendingQuestion) {
      // There's a question to answer — learn the provided pairs first
      for (const pair of qaData.pairs) {
        this.instructionRules.push({
          trigger: pair.question.toLowerCase(),
          response: pair.answer,
          exact: false
        });
      }

      // Now check if the pending question matches something we just learned
      const pending = qaData.pendingQuestion.toLowerCase();
      for (const pair of qaData.pairs) {
        if (pending.includes(pair.question.toLowerCase()) || pair.question.toLowerCase().includes(pending)) {
          return {
            answer: pair.answer,
            confidence: 1.0,
            source_id: null,
            category: 'qa-recall',
            emotion: userEmotion,
            mode: 'intent-mapping'
          };
        }
      }

      // Check if the pending question matches an intent from the map
      const intentResult = this.detectConversationalIntent(qaData.pendingQuestion);
      if (intentResult) {
        return {
          answer: intentResult.response,
          confidence: 1.0,
          source_id: null,
          category: intentResult.intent,
          emotion: userEmotion,
          mode: 'intent-mapping'
        };
      }

      // Fall through — let the normal pipeline handle the pending question
      // But rewrite userMessage to just the pending question
      return { _redirect: qaData.pendingQuestion };
    }

    return null;
  }

  // ── Core: Think, then respond (ENHANCED BRAIN) ──
  async getResponse(userMessage) {
    const normalized = this.normalize(userMessage);
    const keywords = this.extractKeywords(normalized);

    // Detect user's emotional state
    const userEmotion = this.detectUserEmotion(userMessage);
    this.lastUserEmotion = userEmotion;
    this.turnCount++;

    // Detect language
    const detectedLanguage = this.detectLanguage(userMessage);
    if (detectedLanguage !== 'en') {
      this.currentLanguage = detectedLanguage;
    }

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
    // STEP 0.25: INSTRUCTION FOLLOWING — Check for user-defined rules
    // "When I say X, say Y" rules take priority over everything else.
    // This also detects new instructions being given.
    // ═══════════════════════════════════════════════
    const instructionResult = this.handleInstructions(userMessage, userEmotion);
    if (instructionResult) return instructionResult;

    // ═══════════════════════════════════════════════
    // STEP 0.3: SIMPLE GREETING SHORT-CIRCUIT
    // For pure greetings ("hi", "hello", "hey") with no other content,
    // return a simple greeting instead of running through synthesis.
    // ═══════════════════════════════════════════════
    if (userEmotion === 'greeting' && keywords.length <= 1) {
      let greeting;
      if (this.currentLanguage !== 'en' && this.multilingualIntents[this.currentLanguage]?.greeting) {
        greeting = this.getMultilingualResponse('greeting', this.currentLanguage);
      } else {
        const simpleGreetings = ['Hey there!', 'Hi!', 'Hello!', 'Hey!', 'Hi there!'];
        greeting = simpleGreetings[Math.floor(Math.random() * simpleGreetings.length)];
      }
      this.recordConversation(userMessage, greeting);
      return {
        answer: greeting,
        confidence: 1.0,
        source_id: null,
        category: 'greeting',
        emotion: 'greeting',
        mode: 'greeting'
      };
    }

    // ═══════════════════════════════════════════════
    // STEP 0.35: Q&A PATTERN DETECTION
    // Detect training-style input like "Q: How are you? A: I am good."
    // Learn the pairs and/or answer the pending question.
    // ═══════════════════════════════════════════════
    const qaData = this.detectQAPairs(userMessage);
    if (qaData) {
      const qaResult = await this.handleQAInput(userMessage, qaData, userEmotion);
      if (qaResult) {
        if (qaResult._redirect) {
          // Pending question — re-route through the pipeline with just that question
          userMessage = qaResult._redirect;
          // Re-extract keywords for the redirected message
          keywords.length = 0;
          keywords.push(...this.extractKeywords(this.normalize(userMessage)));
        } else {
          this.recordConversation(userMessage, qaResult.answer);
          return qaResult;
        }
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 0.4: INTENT → RESPONSE MAPPING
    // For recognized conversational intents ("How are you?", "What's your name?",
    // "Greet John", "Thank you", etc.), return a direct grounded response
    // instead of running through synthesis which can produce word-salad.
    // ═══════════════════════════════════════════════
    const conversationalIntent = this.detectConversationalIntent(userMessage);
    if (conversationalIntent) {
      // If non-English, try to respond in the detected language
      let response = conversationalIntent.response;
      if (this.currentLanguage !== 'en') {
        const mlResponse = this.getMultilingualResponse(conversationalIntent.intent, this.currentLanguage);
        if (mlResponse) response = mlResponse;
      }
      this.recordConversation(userMessage, response);
      return {
        answer: response,
        confidence: 1.0,
        source_id: null,
        category: conversationalIntent.intent,
        emotion: userEmotion,
        mode: 'intent-mapping'
      };
    }

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
    // STEP 0.75: LEXICON ANALYSIS — Understand the words in the message
    // Break the message into known words, identify their types and meanings.
    // This gives Sprout genuine word-level understanding.
    // ═══════════════════════════════════════════════
    const lexiconAnalysis = this.lexicon.analyzeMessage(userMessage);

    // If asking "what is [word]?" and we know the word, answer from lexicon
    const definitionResult = this.tryLexiconDefinition(userMessage, lexiconAnalysis, userEmotion);
    if (definitionResult) {
      this.recordConversation(userMessage, definitionResult.answer);
      return definitionResult;
    }

    // ═══════════════════════════════════════════════
    // STEP 0.9: SELF-KNOWLEDGE — Recognize questions about Sprout/Tithonia FIRST
    // This MUST run before logic engine and smart search to prevent
    // Wikipedia from hijacking self-knowledge queries (e.g. "what is sprout" → Brussels sprouts)
    // ═══════════════════════════════════════════════
    const selfKnowledgeResult = await this.trySelfKnowledge(userMessage, normalized, keywords, userEmotion);
    if (selfKnowledgeResult) {
      this.recordConversation(userMessage, selfKnowledgeResult.answer);
      return selfKnowledgeResult;
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
      .eq('model', 'sprout-1.3')
      .eq('active', true);

    if (error || !trainingData || trainingData.length === 0) {
      // ═══════════════════════════════════════════════
      // SMART SEARCH — Try web search before giving up
      // ═══════════════════════════════════════════════
      const smartResult = await this.trySmartSearch(userMessage, keywords, userEmotion, this.currentLanguage);
      if (smartResult) {
        this.taskGoal.isComplete = true;
        this.taskGoal.successCount++;
        this.recordConversation(userMessage, smartResult.answer);
        this.bufferForLearning(userMessage, smartResult.answer, 'smart-search');
        return smartResult;
      }
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
      // ═══════════════════════════════════════════════
      // SMART SEARCH — Search the web before falling back
      // ═══════════════════════════════════════════════
      const smartResult = await this.trySmartSearch(userMessage, keywords, userEmotion, this.currentLanguage);
      if (smartResult) {
        this.taskGoal.isComplete = true;
        this.taskGoal.successCount++;
        this.recordConversation(userMessage, smartResult.answer);
        this.bufferForLearning(userMessage, smartResult.answer, 'smart-search');
        return smartResult;
      }
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

        // Also store as an instruction rule for exact matching
        // This ensures short, exact responses are returned verbatim
        const triggerNorm = this.feedbackState.lastQuestion.toLowerCase().trim();
        if (userMessage.trim().split(/\s+/).length <= 10) {
          this.addInstructionRule({
            trigger: triggerNorm,
            response: userMessage.trim(),
            exact: true
          });
        }

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

  // ══════════════════════════════════════════════════════════════
  // INSTRUCTION FOLLOWING — Detect and store "When I say X, say Y" rules
  // This lets researchers teach Tithonia exact response patterns
  // ══════════════════════════════════════════════════════════════

  // Detect if user is giving an instruction like "When I say X, say Y"
  detectInstruction(userMessage) {
    const lower = userMessage.trim();

    // Patterns: "When I say X, say Y" / "When I say X say exactly Y" / "If I say X, respond with Y"
    const patterns = [
      /^when\s+i\s+say\s+["'](.+?)["']\s*,?\s*say\s+(?:exactly\s*:?\s*)?["']?(.+?)["']?\s*$/i,
      /^when\s+i\s+say\s+["'](.+?)["']\s*,?\s*respond\s+(?:with\s+)?(?:exactly\s*:?\s*)?["']?(.+?)["']?\s*$/i,
      /^if\s+i\s+say\s+["'](.+?)["']\s*,?\s*(?:you\s+)?say\s+(?:exactly\s*:?\s*)?["']?(.+?)["']?\s*$/i,
      /^when\s+i\s+say\s+["'](.+?)["']\s+say\s+(?:exactly\s*:?\s*)?(.+)\s*$/i,
      /^when\s+i\s+say\s+(.+?)\s+say\s+exactly\s*:?\s*(.+)\s*$/i
    ];

    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) {
        return {
          trigger: match[1].trim().toLowerCase(),
          response: match[2].trim(),
          exact: true
        };
      }
    }

    return null;
  }

  // Store an instruction rule
  addInstructionRule(rule) {
    // Remove any existing rule with the same trigger
    this.instructionRules = this.instructionRules.filter(
      r => r.trigger !== rule.trigger
    );
    this.instructionRules.push(rule);
  }

  // Check if user message matches any stored instruction rule
  matchInstructionRule(userMessage) {
    const lower = userMessage.toLowerCase().trim();
    for (const rule of this.instructionRules) {
      if (rule.exact && lower === rule.trigger) {
        return rule;
      }
      if (!rule.exact && lower.includes(rule.trigger)) {
        return rule;
      }
    }
    return null;
  }

  // Handle instruction detection and matching in the response pipeline
  handleInstructions(userMessage, userEmotion) {
    // First: check if user is GIVING an instruction
    const instruction = this.detectInstruction(userMessage);
    if (instruction) {
      this.addInstructionRule(instruction);
      const confirmMsg = `Got it! From now on, when you say "${instruction.trigger}", I'll respond with: "${instruction.response}"`;
      this.recordConversation(userMessage, confirmMsg);
      return {
        answer: confirmMsg,
        confidence: 1.0,
        source_id: null,
        category: 'instruction-learned',
        emotion: 'happy',
        mode: 'instruction'
      };
    }

    // Second: check if the current message matches a stored instruction
    const matchedRule = this.matchInstructionRule(userMessage);
    if (matchedRule) {
      this.recordConversation(userMessage, matchedRule.response);
      return {
        answer: matchedRule.response,
        confidence: 1.0,
        source_id: null,
        category: 'instruction-match',
        emotion: userEmotion,
        mode: 'instruction'
      };
    }

    return null;
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

      // Also try to learn any new words from this exchange
      this.learnWordsFromText(question + ' ' + answer);

      console.log(`[Sprout Brain] Learned new answer: "${question}" → "${answer.substring(0, 50)}..."`);
    } catch (e) {
      console.warn('[Sprout Brain] Failed to save learned answer:', e.message);
    }
  }

  /**
   * Attempt to learn new words from text by detecting definition patterns.
   * Patterns like "X is a Y", "X means Y", "X is defined as Y".
   * Also learns from "what is X" → answer pairs.
   */
  learnWordsFromText(text) {
    // Pattern: "A [word] is a [definition]"
    const defPatterns = [
      /\b(\w+)\s+is\s+(?:a|an)\s+(.{10,60}?)[.!?]/gi,
      /\b(\w+)\s+means?\s+(.{10,60}?)[.!?]/gi,
      /\b(\w+)\s+(?:is|are)\s+defined\s+as\s+(.{10,60}?)[.!?]/gi
    ];

    for (const pattern of defPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const word = match[1].toLowerCase();
        const definition = match[2].trim();

        // Skip very common words and short words
        if (word.length <= 2) continue;
        const skipWords = new Set(['this', 'that', 'there', 'here', 'what', 'which', 'they', 'them', 'then', 'also', 'just', 'very', 'really']);
        if (skipWords.has(word)) continue;

        // Only learn if we don't already know this word
        if (!this.lexicon.knows(word)) {
          // Try to guess the word type from the definition
          let type = 'unknown';
          if (/^(?:a|an|the)\s/.test(definition)) type = 'noun';
          if (/^to\s/.test(definition)) type = 'verb';
          if (/^(?:very|more|less)\s/.test(definition)) type = 'adjective';

          this.lexicon.learnWord(word, type, definition, [], [], 'conversation');
          console.log(`[Sprout Lexicon] Learned new word: "${word}" → "${definition}"`);
        }
      }
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
    mind.push('I am Sprout 1.3 — a young adult AI (age equivalent: 19 human years).');
    mind.push('I think critically, communicate with emotional intelligence, and reason independently.');
    mind.push('I am honest about what I know and what I don\'t. I prefer depth over surface-level answers.');
    mind.push('');
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
        .eq('model', 'sprout-1.3')
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
        .eq('model', 'sprout-1.3')
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
      .eq('model', 'sprout-1.3')
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
        .eq('model', 'sprout-1.3')
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
    // Find relevant knowledge from training data
    let relevantKnowledge = await this.findRelevantKnowledge(userMessage, 8);

    // If initial search found nothing, try expanding with lexicon synonyms/categories
    if (relevantKnowledge.length === 0 && keywords.length > 0) {
      const expandedKeywords = this.expandSearchWithLexicon(keywords);
      if (expandedKeywords.length > keywords.length) {
        relevantKnowledge = await this.findRelevantKnowledge(expandedKeywords.join(' '), 8);
      }
    }

    // If we have no relevant knowledge at all, try smart search before giving up
    if (relevantKnowledge.length === 0) {
      const smartResult = await this.trySmartSearch(userMessage, keywords, userEmotion, this.currentLanguage);
      if (smartResult) return smartResult;
      return null; // Fall through to lookup/fallback
    }

    // Load personality context if not loaded
    if (!this.personalityLoaded) {
      try { await this.loadPersonality(); } catch (e) { /* continue */ }
    }

    const conversationContext = this.getConversationContext();
    const topicContinuity = this.detectTopicContinuity(keywords);

    // ── Phase 1: Extract CONCEPTS from knowledge (not full sentences) ──
    const concepts = this.extractConcepts(relevantKnowledge, keywords);

    // ── Phase 2: Understand what the user is asking for ──
    const intent = this.analyzeIntent(userMessage, keywords);

    // ── Phase 3: SYNTHESIZE a response from concepts ──
    let response = null;

    if (concepts.length > 0) {
      // We have relevant knowledge — build an answer from extracted concepts
      response = this.synthesizeFromConcepts(userMessage, intent, concepts, conversationContext, topicContinuity);
    }

    // ── Phase 4: If no concepts matched, try SMART SEARCH then REASON ──
    if (!response) {
      // Try web search first — be proactive about finding answers
      const smartResult = await this.trySmartSearch(userMessage, keywords, userEmotion, this.currentLanguage);
      if (smartResult) return smartResult;

      // Fall back to reasoning from scratch
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
        /\b(what about|how about|and also|more about|else|another|tell me more)\b/i.test(lower)
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

    // ── Brevity check: short user messages should get shorter responses ──
    const userWords = userMessage.trim().split(/\s+/).length;
    const isShortMessage = userWords <= 5;

    // ── Step 1: Pick a contextual opener (skip for short/brief messages) ──
    if (!isShortMessage && !intent.wantsBrief) {
      const opener = this.pickOpener(intent, topicContinuity);
      if (opener) parts.push(opener);
    }

    // ── Step 2: Build the core answer from concept FACTS ──
    // Don't copy — extract the KEY INFORMATION and restate it in new words
    // Use fewer concepts for short messages to keep responses proportional
    const maxConcepts = intent.wantsDetail ? 4 : (intent.wantsBrief || isShortMessage ? 1 : 2);
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

    // ── Step 3: Add a natural closer (sometimes, not for short/brief messages) ──
    if (parts.length > 1 && !isShortMessage && !intent.wantsBrief && Math.random() > 0.5) {
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

    // ── Quality gate: reject keyword-soup responses ──
    // If the result has too many commas (keyword dumping), uses repetitive
    // template words, or reads like nonsense, reject it.
    const commaCount = (result.match(/,/g) || []).length;
    const resultWordCount = result.split(/\s+/).length;
    const involvesCount = (result.match(/\binvolves?\b/gi) || []).length;
    const relatedCount = (result.match(/\brelated\s+to\b/gi) || []).length;
    if ((commaCount >= 4 && commaCount / resultWordCount > 0.12) || involvesCount >= 2 || relatedCount >= 2) {
      return null; // Let fallback/reasonAlone handle it instead
    }

    // Reject if the response is just restating template filler with no real content
    if (resultWordCount < 8 && /\b(is about|refers to|has to do with)\b/i.test(result)) {
      return null;
    }

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

    // Everything else is details — but only keep meaningful content keywords
    // to prevent dumping entire keyword lists into sentence templates
    if (keywords.length > 1) {
      info.object = keywords[1];
      // Only take the next few most relevant keywords, skip duplicates of subject/object
      const remaining = keywords.slice(2).filter(k =>
        k !== info.subject && k !== info.object && k.length > 2
      );
      info.details = remaining.slice(0, 3);
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

    // If we don't have enough to build a real sentence, bail
    if (!obj && details.length === 0) return null;

    // ── Prevent keyword dumping ──
    const noiseWords = new Set(['dont', 'doesnt', 'isnt', 'yet', 'also', 'fully', 'actually', 'basically', 'really', 'just', 'thing', 'stuff', 'see', 'along', 'comes']);
    const cleanDetails = details
      .filter(d => d.length > 2 && !noiseWords.has(d.toLowerCase()))
      .filter(d => d.toLowerCase() !== subject?.toLowerCase() && d.toLowerCase() !== object?.toLowerCase())
      .slice(0, 3);
    const dets = cleanDetails.join(', ');

    // Choose a sentence structure based on intent and what info we have
    let sentence = '';

    // Build a detail phrase if we have supporting details (limit to 2 max)
    const detailPhrase = cleanDetails.length > 0
      ? cleanDetails.slice(0, 2).join(' and ')
      : null;

    if (intent.isDefinition && !isFollowOn) {
      const patterns = [
        `${subj} is essentially ${obj}${detailPhrase ? ` — specifically, it relates to ${detailPhrase}` : ''}.`,
        `In short, ${subject} is about ${obj}${detailPhrase ? `, with a focus on ${detailPhrase}` : ''}.`,
        `${subj} can be understood as ${obj}${detailPhrase ? `, particularly when it comes to ${detailPhrase}` : ''}.`,
        `The core idea behind ${subject} is ${obj}${detailPhrase ? `, especially in the context of ${detailPhrase}` : ''}.`
      ];
      sentence = this.pickRandom(patterns);
    } else if (intent.isExplanation && !isFollowOn) {
      const patterns = [
        `The way ${subject} works is through ${obj}${detailPhrase ? `, which connects to ${detailPhrase}` : ''}.`,
        `What makes ${subject} tick is ${obj}${detailPhrase ? ` — and that ties into ${detailPhrase}` : ''}.`,
        `The key mechanism behind ${subject} is ${obj}${detailPhrase ? `, particularly ${detailPhrase}` : ''}.`,
        `${subj} ${action || 'operates through'} ${obj}${detailPhrase ? `, and that's closely linked to ${detailPhrase}` : ''}.`
      ];
      sentence = this.pickRandom(patterns);
    } else if (isFollowOn) {
      const patterns = [
        `It's also worth noting that ${subject} ${action || 'connects to'} ${obj}${detailPhrase ? `, especially ${detailPhrase}` : ''}.`,
        `Beyond that, ${subject} ${action || 'plays into'} ${obj}${detailPhrase ? ` through ${detailPhrase}` : ''}.`,
        `There's also the fact that ${subject} ${action || 'is linked to'} ${obj}${detailPhrase ? `, particularly ${detailPhrase}` : ''}.`,
        `And ${subject} ${action || 'ties into'} ${obj}${detailPhrase ? ` — think ${detailPhrase}` : ''} as well.`
      ];
      sentence = this.pickRandom(patterns);
    } else {
      const patterns = [
        `${subj} ${action || 'is closely tied to'} ${obj}${detailPhrase ? `, and that extends to ${detailPhrase}` : ''}.`,
        `From what I understand, ${subject} ${action || 'centers around'} ${obj}${detailPhrase ? `, with ${detailPhrase} playing a role` : ''}.`,
        `The thing about ${subject} is that it ${action || 'comes down to'} ${obj}${detailPhrase ? `, especially when you consider ${detailPhrase}` : ''}.`,
        `${subj} is one of those things where ${obj} ${detailPhrase ? `and ${detailPhrase} ` : ''}really matter${detailPhrase ? '' : 's'}.`
      ];
      sentence = this.pickRandom(patterns);
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

    // ── Pre-check: Is this just casual conversation? ──
    // Don't try to "reason" about casual statements — respond naturally
    const lower = userMessage.toLowerCase().trim();
    const casualPatterns = [
      /^(i'?m|im|i\s+am)\s+(good|great|fine|well|okay|ok|alright|bad|tired|bored)/i,
      /^(good|great|fine|okay|not\s+bad|pretty\s+good|doing\s+(good|well))\s*[!.)?]*$/i,
      /^(yes|yeah|yep|no|nah|nope|sure|maybe|idk|idc)\s*[!.]*$/i,
      /^(oh|ah|hm+|ok|okay|right|cool|nice|interesting|wow)\s*[!.]*$/i,
      /^(lol|haha|heh|lmao|true|same|mood|fr|real)\s*[!.]*$/i
    ];
    if (casualPatterns.some(p => p.test(lower))) {
      const casualResponses = [
        "What else is on your mind?",
        "Anything you want to get into?",
        "What can I help you with?",
        "I'm here — what's next?",
        "Cool. What are we thinking about today?"
      ];
      return this.pickRandom(casualResponses);
    }

    // ── Strategy 1: Try to answer from word meanings and common sense ──
    if (intent.isDefinition && keywords.length > 0) {
      const topic = keywords.join(' ');
      const guess = this.guessFromWordParts(keywords);
      // Only attempt a guess if we actually found meaningful word parts
      if (guess && !guess.includes('need to learn more about')) {
        const attempts = [
          `I haven't studied ${topic} in depth, but based on what I can piece together, it seems like it involves ${guess}. Am I in the right ballpark?`,
          `Let me think about this... ${topic} — I'd guess it relates to ${guess}. Correct me if I'm off.`,
          `I'm going to reason through this — ${topic} sounds like it could connect to ${guess}. How close am I?`
        ];
        return this.pickRandom(attempts);
      }
      // If we can't guess from word parts, be honest but curious
      const honestAttempts = [
        `I don't have a solid grasp on ${topic} yet — what's your understanding of it?`,
        `Honestly, ${topic} is outside what I know right now. I'd rather be upfront than guess badly. Can you fill me in?`,
        `That's a gap in my knowledge. I'd love to learn about ${topic} — what can you tell me?`
      ];
      return this.pickRandom(honestAttempts);
    }

    // ── Strategy 2: Use conversation context to reason ──
    // Filter out noise AND Sprout's own meta-phrases from context
    if (intent.isFollowUp && conversationContext?.lastAssistantMessage) {
      const noiseWords = new Set(['hey', 'hi', 'hello', 'the', 'is', 'are', 'was', 'it', 'that', 'this', 'you', 'your', 'today', 'now', 'just', 'really', 'very', 'also', 'well', 'dont', 'have', 'enough', 'knowledge', 'database', 'learn', 'teach', 'tell', 'about', 'more', 'still', 'learning', 'give', 'confident', 'answer', 'love', 'want', 'real', 'vague', 'remember', 'think', 'know', 'sure', 'could', 'would', 'building', 'connects']);
      const lastKeywords = this.extractKeywords(this.normalize(conversationContext.lastAssistantMessage))
        .filter(k => k.length > 3 && !noiseWords.has(k));
      const currentKeywords = keywords.filter(k => k.length > 3 && !noiseWords.has(k));

      if (lastKeywords.length > 0 && currentKeywords.length > 0) {
        const contextTopic = lastKeywords.slice(0, 2).join(' and ');
        const currentTopic = currentKeywords.slice(0, 2).join(' and ');
        return `I see a connection between ${currentTopic} and what we were discussing about ${contextTopic}. I'm still forming my understanding here though — what's your perspective?`;
      }
      if (lastKeywords.length === 0 && currentKeywords.length === 0) {
        return "I want to make sure I'm following you — could you elaborate a bit?";
      }
    }

    // ── Strategy 3: Honest but thoughtful response ──
    const meaningfulKeywords = keywords.filter(k => k.length > 3);
    if (meaningfulKeywords.length > 0) {
      const topic = meaningfulKeywords.slice(0, 3).join(' ');
      const reasoningAttempts = [
        `I don't have enough to give you a confident answer on ${topic} yet. What's your take on it?`,
        `${topic} is something I want to understand better. Can you share what you know?`,
        `I'd rather be honest than make something up — I need to learn more about ${topic}. What can you tell me?`
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
    // Filter out Sprout's own meta-phrases (admission of ignorance, prompts to teach, etc.)
    const metaPhrases = /\b(don'?t have|database|knowledge base|still learning|teach me|tell me more|not sure|haven'?t learned|can you tell|fill me in|love to learn)\b/i;
    const allKeywords = new Set();
    for (const entry of this.conversationHistory) {
      if (entry.role === 'assistant' && !metaPhrases.test(entry.content)) {
        this.extractKeywords(this.normalize(entry.content)).forEach(k => allKeywords.add(k));
      }
    }

    // See if any query keywords overlap with things we've discussed
    const relatedTopics = keywords.filter(k => allKeywords.has(k));
    if (relatedTopics.length > 0) {
      return `I think ${topic} might relate to ${relatedTopics.join(' and ')} — we touched on that earlier. What do you think?`;
    }

    return `I'd like to know more about ${topic}. Can you tell me about it?`;
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
          isContinuation: true,
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

    // ── Young Adult Voice (1.3) — Natural, self-aware, conversational ──
    // Add natural hedging and self-awareness markers occasionally
    if (Math.random() > 0.75 && response.length > 60) {
      const hedges = [
        'I think ', 'From what I understand, ', 'The way I see it, ',
        'If I\'m being honest, ', 'Based on what I know, '
      ];
      // Only prepend if the response doesn't already start with a hedge
      if (!/^(I think|From what|The way|If I'm|Based on|Honestly|To be fair)/i.test(response)) {
        response = this.pickRandom(hedges) + response.charAt(0).toLowerCase() + response.slice(1);
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
    // Try multilingual fallback first
    if (this.currentLanguage !== 'en') {
      const mlFallback = this.getMultilingualResponse('fallback', this.currentLanguage);
      if (mlFallback) {
        return {
          answer: mlFallback,
          confidence: 0,
          source_id: null,
          category: 'fallback',
          emotion: userEmotion || 'neutral'
        };
      }
    }

    const baseFallbacks = [
      "I don't have a solid answer for that one yet. I'd rather be honest than make something up — what else can I help with?",
      "That's outside my current knowledge. I'm always learning though, so try me on something else?",
      "I'm drawing a blank on this one. I don't want to give you a half-baked answer — ask me something else and I'll give it my best.",
      "Honestly, I'm not confident enough to answer that well. I'd rather tell you that than waste your time with a bad guess.",
      "I don't know enough about that yet to give you something useful. But I'm curious — what else is on your mind?"
    ];

    let answer = baseFallbacks[Math.floor(Math.random() * baseFallbacks.length)];

    // Add emotional awareness to fallbacks too
    if (userEmotion === 'sad') {
      answer = "I can tell something's on your mind, and I wish I had a better answer for you. " + answer + " But I'm here if you want to talk.";
    } else if (userEmotion === 'angry') {
      answer = "I hear the frustration, and I get it. " + answer;
    } else if (userEmotion === 'greeting') {
      answer = "Hey! Good to see you. " + answer;
    } else if (userEmotion === 'playful') {
      answer = "Ha, you're testing me! " + answer;
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
      .eq('model', 'sprout-1.3')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch training data: ' + error.message);
    return data || [];
  }

  // ── Ratings: Rate a response ──
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

  // ── Media: Upload reference for training ──
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

  // ── Conversations: Save conversation ──
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

  // ══════════════════════════════════════════
  // DIRECTIVES — Persistent orders/instructions
  // ══════════════════════════════════════════

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
        model: 'sprout-1.3',
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

  // ══════════════════════════════════════════
  // IDENTITY — Self-awareness & consciousness
  // ══════════════════════════════════════════

  async getIdentity() {
    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .select('*')
      .eq('model', 'sprout-1.3')
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
      .eq('model', 'sprout-1.3')
      .eq('key', key)
      .eq('active', true);

    const { data, error } = await this.db
      .from(SPROUT_TABLES.IDENTITY)
      .insert({
        model: 'sprout-1.3',
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
      this.db.from(SPROUT_TABLES.TRAINING_DATA).select('id', { count: 'exact' }).eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.RATINGS).select('rating').eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.CONVERSATIONS).select('id', { count: 'exact' }).eq('model', 'sprout-1.3'),
      this.db.from(SPROUT_TABLES.DIRECTIVES).select('id', { count: 'exact' }).eq('model', 'sprout-1.3').eq('active', true),
      this.db.from(SPROUT_TABLES.WRITING_PATTERNS).select('id', { count: 'exact' }).eq('model', 'sprout-1.3').eq('active', true),
      this.db.from(SPROUT_TABLES.IDENTITY).select('id', { count: 'exact' }).eq('model', 'sprout-1.3').eq('active', true)
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
      totalIdentityEntries: identityResult.count || 0,
      lexicon: this.lexicon.getStats()
    };
  }
}
