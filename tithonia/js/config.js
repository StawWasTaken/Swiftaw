/**
 * Tithonia — Model Configuration & Constants
 */

export const MODELS = {
  'sprout-1.4': {
    name: 'Sprout 1.4',
    desc: 'General-purpose AI. Great for everyday tasks, learning, and creative work.',
    engine: 'sprout'
  },
  'floret-1.1': {
    name: 'Floret 1.1',
    desc: 'Enterprise-focused AI. Perfect for code scripting, corporate tasks, and technical automation.',
    engine: 'floret'
  }
  // Future models go here:
  // 'sprout-2.0': { name: 'Sprout 2.0', desc: 'Advanced reasoning and deeper understanding.', engine: 'sprout' },
  // 'floret-2.0': { name: 'Floret 2.0', desc: 'Next-gen enterprise intelligence.', engine: 'floret' },
};

export const moodLabels = {
  happy: 'feeling happy',
  sad: 'feeling empathetic',
  angry: 'staying calm',
  curious: 'intrigued',
  greeting: 'welcoming',
  grateful: 'touched',
  playful: 'feeling playful',
  confused: 'here to help',
  farewell: 'saying goodbye',
  neutral: 'listening'
};

export const modeLabels = {
  'logic-engine': 'solved with logic',
  'sprout-brain': 'thought about it',
  'feedback-loop': 'learning from feedback',
  'feedback-retry': 'trying again',
  'lookup': 'from knowledge base',
  'cached': 'remembered',
  'context-aware': 'understood context',
  'lexicon': 'knows this word',
  'smart-search': 'searched the web',
  'sprout-reasoning': 'reasoned it out',
  'code-generation': 'generated code',
  'task-execution': 'executed task',
  'validation': 'validated output',
  'floret-analysis': 'analyzed requirements',
  'corporate-task': 'corporate execution',
  'syntax-verified': 'syntax verified'
};
