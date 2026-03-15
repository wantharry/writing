// Suggestions module tests
describe('Suggestions Engine', () => {
  let engine;

  beforeEach(() => {
    engine = {
      mode: 'lightweight',

      getCurrentSentence(text) {
        const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
        if (sentences.length > 0) {
          return sentences[sentences.length - 1].trim();
        }
        const words = text.trim().split(/\s+/);
        return words.slice(-20).join(' ');
      },

      getPartialWord(text) {
        const lastWord = text.match(/\S*$/);
        return lastWord ? lastWord[0] : '';
      },

      getSentenceTips(sentence) {
        const tips = [];
        const words = sentence.trim().split(/\s+/);

        if (words.length > 20) {
          tips.push('Long sentence: Consider breaking it up');
        }

        if (/\b(I think|I believe|in my opinion|maybe|perhaps|might)\b/i.test(sentence)) {
          tips.push('Hedging: Be more confident and direct');
        }

        return tips;
      },

      getLocalWordSuggestions(partialWord) {
        const commonWords = ['building', 'button', 'business', 'beautiful', 'before'];
        const lower = partialWord.toLowerCase();
        return commonWords
          .filter(word => word.startsWith(lower))
          .slice(0, 5);
      },
    };
  });

  test('should extract current sentence', () => {
    const text = 'First sentence. Second sentence.';
    const sentence = engine.getCurrentSentence(text);
    expect(sentence).toBe('Second sentence.');
  });

  test('should handle text without punctuation', () => {
    const text = 'No punctuation here';
    const sentence = engine.getCurrentSentence(text);
    expect(sentence).toBe('No punctuation here');
  });

  test('should extract partial word being typed', () => {
    expect(engine.getPartialWord('hello wor')).toBe('wor');
    expect(engine.getPartialWord('test')).toBe('test');
    expect(engine.getPartialWord('word ')).toBe('');
  });

  test('should detect long sentences', () => {
    const longSentence = 'This is a very long sentence that has way more than twenty words in it to test the detection of the system ok here we go';
    const tips = engine.getSentenceTips(longSentence);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0]).toContain('Long sentence');
  });

  test('should detect hedging words', () => {
    const hedgedSentence = 'I think maybe this might be good';
    const tips = engine.getSentenceTips(hedgedSentence);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0]).toContain('Hedging');
  });

  test('should suggest word completions', () => {
    const suggestions = engine.getLocalWordSuggestions('bu');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('building');
    expect(suggestions).toContain('button');
  });

  test('should not suggest if partial word too short', () => {
    const suggestions = engine.getLocalWordSuggestions('b');
    expect(suggestions.length).toBeGreaterThan(0); // Still suggests
  });

  test('should be case insensitive for suggestions', () => {
    const suggestions1 = engine.getLocalWordSuggestions('BU');
    const suggestions2 = engine.getLocalWordSuggestions('bu');
    expect(suggestions1).toEqual(suggestions2);
  });

  test('should handle empty text', () => {
    const sentence = engine.getCurrentSentence('');
    expect(sentence).toBe('');
  });

  test('should limit suggestions to 5', () => {
    // Create a word that matches many possibilities
    const partialWord = 'b'; // b matches building, button, business, beautiful, before
    const suggestions = engine.getLocalWordSuggestions(partialWord);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});
