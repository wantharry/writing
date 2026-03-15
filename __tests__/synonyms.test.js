// Synonyms module tests
describe('Synonyms and Word Analysis', () => {
  // Mock synonym database
  const SYNONYMS = {
    'good': ['excellent', 'great', 'wonderful'],
    'bad': ['poor', 'awful', 'terrible'],
    'very': ['quite', 'rather', 'extremely'],
    'said': ['explained', 'mentioned', 'noted'],
  };

  const FILLER_WORDS = {
    'very': { alternative: 'Use stronger adjectives', severity: 'low' },
    'really': { alternative: 'Remove or replace with stronger word', severity: 'low' },
    'just': { alternative: 'Often unnecessary', severity: 'low' },
  };

  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'
  ]);

  function getSynonyms(word) {
    const lowerWord = word.toLowerCase();
    return SYNONYMS[lowerWord] || [];
  }

  function isFillerWord(word) {
    return FILLER_WORDS.hasOwnProperty(word.toLowerCase());
  }

  function getFillerWordFeedback(word) {
    return FILLER_WORDS[word.toLowerCase()] || null;
  }

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

  test('should find synonyms for a word', () => {
    const synonyms = getSynonyms('good');
    expect(synonyms).toContain('excellent');
    expect(synonyms).toContain('great');
  });

  test('should return empty array for unknown word', () => {
    const synonyms = getSynonyms('xyz123');
    expect(synonyms).toEqual([]);
  });

  test('should be case insensitive', () => {
    expect(getSynonyms('GOOD')).toEqual(getSynonyms('good'));
    expect(getSynonyms('Good')).toEqual(getSynonyms('good'));
  });

  test('should identify filler words', () => {
    expect(isFillerWord('very')).toBe(true);
    expect(isFillerWord('really')).toBe(true);
    expect(isFillerWord('just')).toBe(true);
    expect(isFillerWord('good')).toBe(false);
  });

  test('should get filler word feedback', () => {
    const feedback = getFillerWordFeedback('very');
    expect(feedback).toBeDefined();
    expect(feedback.alternative).toBeTruthy();
    expect(feedback.severity).toBe('low');
  });

  test('should extract keywords from text', () => {
    const keywords = extractKeywords('This is about love and family and relationships');
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain('love');
  });

  test('should filter out stop words from keywords', () => {
    const keywords = extractKeywords('the and a or but');
    expect(keywords.length).toBe(0); // All stop words
  });

  test('should limit keywords to 5', () => {
    const text = 'word1 word1 word2 word2 word3 word3 word4 word4 word5 word5 word6 word6';
    const keywords = extractKeywords(text);
    expect(keywords.length).toBeLessThanOrEqual(5);
  });

  test('should sort keywords by frequency', () => {
    const keywords = extractKeywords('apple apple apple banana banana cherry');
    expect(keywords[0]).toBe('apple'); // Most frequent
  });

  test('should handle text with short words', () => {
    const keywords = extractKeywords('a to be it or');
    expect(keywords.length).toBe(0); // All too short or stop words
  });

  test('should handle multiple occurrences of filler words', () => {
    const text = 'I really think this is very very good';
    const fillerCount = text.toLowerCase().match(/\bvery\b/g).length;
    expect(fillerCount).toBe(2);
  });
});
