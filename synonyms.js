// Synonym dictionary for lightweight suggestions
const SYNONYMS = {
  'good': ['excellent', 'great', 'wonderful', 'fine', 'decent', 'positive'],
  'bad': ['poor', 'awful', 'terrible', 'horrible', 'dreadful', 'disappointing'],
  'very': ['quite', 'rather', 'extremely', 'incredibly', 'deeply', 'truly'],
  'really': ['genuinely', 'truly', 'actually', 'actually', 'certainly'],
  'just': ['only', 'simply', 'merely', 'nothing but'],
  'nice': ['pleasant', 'delightful', 'enjoyable', 'lovely', 'charming'],
  'big': ['large', 'huge', 'massive', 'vast', 'enormous', 'substantial'],
  'small': ['tiny', 'little', 'diminutive', 'compact', 'minimal'],
  'said': ['explained', 'mentioned', 'noted', 'remarked', 'stated', 'declared', 'expressed'],
  'think': ['believe', 'suppose', 'consider', 'feel', 'reckon', 'assume'],
  'make': ['create', 'produce', 'construct', 'build', 'form', 'establish'],
  'get': ['obtain', 'acquire', 'receive', 'gain', 'fetch'],
  'give': ['provide', 'offer', 'grant', 'bestow', 'donate', 'contribute'],
  'go': ['move', 'travel', 'proceed', 'advance', 'journey', 'depart'],
  'come': ['arrive', 'appear', 'approach', 'reach', 'show up'],
  'know': ['understand', 'comprehend', 'realize', 'recognize', 'acknowledge'],
  'see': ['observe', 'notice', 'perceive', 'view', 'watch', 'behold'],
  'want': ['desire', 'wish', 'crave', 'yearn for', 'long for', 'seek'],
  'need': ['require', 'demand', 'necessity', 'essential', 'vital'],
  'like': ['enjoy', 'appreciate', 'prefer', 'fancy', 'adore'],
  'love': ['adore', 'cherish', 'treasure', 'devotion', 'affection'],
  'hate': ['detest', 'despise', 'abhor', 'loathe', 'resent'],
  'important': ['significant', 'crucial', 'vital', 'essential', 'critical', 'key'],
  'different': ['distinct', 'varied', 'diverse', 'unique', 'unlike', 'dissimilar'],
  'same': ['identical', 'alike', 'equivalent', 'matching', 'similar'],
  'new': ['fresh', 'novel', 'recent', 'modern', 'current', 'latest'],
  'old': ['ancient', 'aged', 'archaic', 'obsolete', 'traditional', 'vintage'],
  'help': ['assist', 'aid', 'support', 'contribute', 'facilitate', 'enable'],
  'try': ['attempt', 'endeavor', 'strive', 'aim', 'make an effort'],
  'use': ['utilize', 'employ', 'apply', 'leverage', 'operate'],
  'work': ['labor', 'function', 'operate', 'perform', 'task', 'effort'],
  'feel': ['sense', 'perceive', 'experience', 'emotion', 'sensation'],
  'happy': ['joyful', 'pleased', 'delighted', 'cheerful', 'content', 'glad'],
  'sad': ['unhappy', 'melancholy', 'sorrowful', 'dejected', 'downhearted'],
  'angry': ['furious', 'irritated', 'livid', 'enraged', 'irate', 'incensed'],
  'afraid': ['fearful', 'scared', 'terrified', 'anxious', 'apprehensive'],
  'beautiful': ['lovely', 'gorgeous', 'stunning', 'elegant', 'exquisite', 'aesthetic'],
  'ugly': ['unattractive', 'unsightly', 'hideous', 'grotesque', 'repulsive'],
  'strong': ['powerful', 'robust', 'vigorous', 'mighty', 'forceful', 'sturdy'],
  'weak': ['fragile', 'frail', 'delicate', 'feeble', 'faint', 'powerless'],
  'fast': ['quick', 'swift', 'rapid', 'speedy', 'brisk', 'hurried'],
  'slow': ['sluggish', 'gradual', 'leisurely', 'unhurried', 'delayed'],
  'hot': ['warm', 'scorching', 'blazing', 'burning', 'sweltering'],
  'cold': ['cool', 'chilly', 'freezing', 'icy', 'frigid'],
  'bright': ['luminous', 'radiant', 'shining', 'brilliant', 'vivid'],
  'dark': ['dim', 'gloomy', 'shadowy', 'murky', 'obscure'],
  'quiet': ['silent', 'peaceful', 'still', 'tranquil', 'hushed', 'serene'],
  'loud': ['noisy', 'boisterous', 'raucous', 'deafening', 'thunderous'],
  'easy': ['simple', 'effortless', 'straightforward', 'uncomplicated', 'facile'],
  'hard': ['difficult', 'challenging', 'tough', 'arduous', 'strenuous', 'complex'],
  'rich': ['wealthy', 'affluent', 'prosperous', 'well-off', 'abundant'],
  'poor': ['impoverished', 'destitute', 'needy', 'underprivileged', 'meager'],
  'clean': ['tidy', 'neat', 'immaculate', 'spotless', 'hygienic', 'pure'],
  'dirty': ['filthy', 'grimy', 'soiled', 'muddy', 'unclean'],
  'full': ['packed', 'brimming', 'overflowing', 'replete', 'complete'],
  'empty': ['vacant', 'hollow', 'bare', 'blank', 'void'],
  'wet': ['damp', 'moist', 'soaked', 'dripping', 'soggy'],
  'dry': ['arid', 'parched', 'withered', 'desiccated', 'barren'],
  'high': ['elevated', 'lofty', 'towering', 'tall', 'supreme'],
  'low': ['ground-level', 'sunken', 'deep', 'base', 'inferior'],
  'deep': ['profound', 'extensive', 'thorough', 'penetrating', 'abyssal'],
  'shallow': ['superficial', 'slight', 'cursory', 'trivial', 'frivolous'],
};

// Stop words to exclude from subject tagging
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what',
  'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'as', 'if', 'because', 'so',
  'then', 'there', 'here', 'up', 'down', 'out', 'in', 'about', 'during', 'before',
  'after', 'above', 'below', 'between', 'through', 'into', 'across', 'along', 'around',
  'over', 'under', 'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had',
]);

// Filler words that suggest weak writing
const FILLER_WORDS = {
  'very': { alternative: 'Use stronger adjectives', severity: 'low' },
  'really': { alternative: 'Remove or replace with stronger word', severity: 'low' },
  'just': { alternative: 'Often unnecessary', severity: 'low' },
  'actually': { alternative: 'Can be omitted', severity: 'low' },
  'quite': { alternative: 'Be more specific', severity: 'low' },
  'rather': { alternative: 'Choose a definitive word', severity: 'low' },
  'basically': { alternative: 'Too vague, be specific', severity: 'medium' },
  'literally': { alternative: 'Used incorrectly often', severity: 'medium' },
  'so': { alternative: 'Explain the connection', severity: 'low' },
  'like': { alternative: 'Replace with precise word', severity: 'low' },
};

// Patterns for common writing issues
const WRITING_PATTERNS = [
  {
    pattern: /\b(I think|I believe|in my opinion)\b/gi,
    message: 'Confidence: State facts rather than hedging with "I think"',
  },
  {
    pattern: /\b(you can|you should|you might)\b/gi,
    message: 'Directness: Consider rewording for stronger voice',
  },
  {
    pattern: /\b(there is|there are)\b/gi,
    message: 'Weak verb: "There is" often signals passive construction',
  },
  {
    pattern: /\b(as a matter of fact|it goes without saying|needless to say)\b/gi,
    message: 'Redundant phrase: Remove for clarity',
  },
];

// Get synonyms for a word
function getSynonyms(word) {
  const lowerWord = word.toLowerCase();
  return SYNONYMS[lowerWord] || [];
}

// Check if word is a filler word
function isFillerWord(word) {
  return FILLER_WORDS.hasOwnProperty(word.toLowerCase());
}

// Get filler word feedback
function getFillerWordFeedback(word) {
  return FILLER_WORDS[word.toLowerCase()] || null;
}

// Extract keywords from text for subject tagging
function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (word.length > 3 && !STOP_WORDS.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// Detect passive voice (simplified)
function hasPassiveVoice(sentence) {
  const passivePattern = /\b(is|are|am|was|were|be|been|being)\s+\w+ed\b/i;
  return passivePattern.test(sentence);
}

// Get writing tips based on text
function getWritingTips(text) {
  const tips = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);

    // Check for long sentences
    if (words.length > 35) {
      tips.push('Long sentence: Consider breaking into smaller sentences');
    }

    // Check for passive voice
    if (hasPassiveVoice(sentence)) {
      tips.push('Passive voice detected: Consider using active voice');
    }
  });

  // Check for writing patterns
  WRITING_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(text)) {
      tips.push(message);
    }
  });

  return [...new Set(tips)].slice(0, 3); // Return unique, max 3 tips
}
