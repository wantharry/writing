// Suggestion engine
class SuggestionEngine {
  constructor() {
    this.mode = 'lightweight'; // or 'ollama'
    this.ollamaUrl = 'http://localhost:11434';
    this.ollamaModel = 'llama3';
    this.debounceTimer = null;
    this.debounceDelay = 400; // ms
  }

  // Set suggestion mode
  setMode(mode) {
    this.mode = mode;
  }

  // Set Ollama config
  setOllamaConfig(url, model) {
    this.ollamaUrl = url;
    this.ollamaModel = model;
  }

  // Get suggestions for text (async)
  async getSuggestions(text) {
    if (this.mode === 'ollama') {
      return await this.getOllamaSuggestions(text);
    } else {
      return this.getLightweightSuggestions(text);
    }
  }

  // Lightweight suggestions (synchronous) - focused on current sentence
  getLightweightSuggestions(text) {
    // Get current sentence from cursor position
    const currentSentence = this.getCurrentSentence(text);

    if (!currentSentence || currentSentence.trim().length < 5) {
      return { sentence: [], words: [] };
    }

    const sentenceSuggestions = [];
    const wordSuggestions = [];

    // Word-level suggestions: filler words in current sentence
    const words = currentSentence.toLowerCase().match(/\b\w+\b/g) || [];
    const fillerWords = words.filter(word => isFillerWord(word));

    fillerWords.slice(0, 3).forEach(word => {
      const feedback = getFillerWordFeedback(word);
      if (feedback) {
        wordSuggestions.push({
          type: 'filler',
          text: `"${word}" - ${feedback.alternative}`,
          severity: feedback.severity,
          targetWord: word,
        });
      }
    });

    // Sentence-level suggestions: structural issues
    const sentenceTips = this.getSentenceTips(currentSentence);
    sentenceTips.forEach(tip => {
      sentenceSuggestions.push({
        type: 'tip',
        text: tip,
        severity: 'info',
      });
    });

    return {
      sentence: sentenceSuggestions.slice(0, 3),
      words: wordSuggestions.slice(0, 3),
    };
  }

  // Get current sentence being edited
  getCurrentSentence(text) {
    // Get last sentence (what user is currently writing)
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
    if (sentences.length > 0) {
      return sentences[sentences.length - 1].trim();
    }
    // If no punctuation, return last few words as "current sentence"
    const words = text.trim().split(/\s+/);
    return words.slice(-20).join(' ');
  }

  // Get tips specific to sentence structure
  getSentenceTips(sentence) {
    const tips = [];
    const words = sentence.trim().split(/\s+/);

    // Check for long sentences
    if (words.length > 35) {
      tips.push('Long sentence: Consider breaking it up');
    }

    // Check for passive voice
    if (hasPassiveVoice(sentence)) {
      tips.push('Passive voice detected: Use active voice');
    }

    // Check for hedge words
    if (/\b(I think|I believe|in my opinion|maybe|perhaps|might)\b/i.test(sentence)) {
      tips.push('Hedging: Be more confident and direct');
    }

    return tips;
  }

  // Ollama suggestions (async) - focused on current sentence
  async getOllamaSuggestions(text) {
    try {
      const currentSentence = this.getCurrentSentence(text);

      if (!currentSentence || currentSentence.trim().length < 5) {
        return { sentence: [], words: [] };
      }

      const prompt = `Suggest 2-3 ways to improve this sentence for better clarity and emotional impact: "${currentSentence.trim()}"
Be concise. Format as bullet points.`;

      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        console.error('Ollama error:', response.status);
        return this.getLightweightSuggestions(text);
      }

      const data = await response.json();
      const aiResponse = data.response || '';

      // Parse response into suggestions
      const sentenceSuggestions = aiResponse
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3)
        .map(line => ({
          type: 'ollama',
          text: line.replace(/^[\d\-•*\.]\s*/, '').trim(),
          severity: 'info',
        }));

      // Also get word-level suggestions
      const wordSuggestions = this.getLightweightSuggestions(text).words;

      return sentenceSuggestions.length > 0 || wordSuggestions.length > 0
        ? { sentence: sentenceSuggestions, words: wordSuggestions }
        : this.getLightweightSuggestions(text);
    } catch (error) {
      console.error('Ollama fetch error:', error);
      // Fallback to lightweight
      return this.getLightweightSuggestions(text);
    }
  }

  // Test Ollama connection
  async testOllamaConnection() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (!response.ok) {
        return { success: false, message: 'Connection failed' };
      }

      const data = await response.json();
      const models = data.models || [];
      const modelNames = models.map(m => m.name);

      return {
        success: true,
        message: `Connected! Available models: ${modelNames.join(', ') || 'None'}`,
        models: modelNames,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  // Get word alternatives
  getWordAlternatives(word) {
    const synonyms = getSynonyms(word);
    return synonyms.length > 0 ? synonyms : [];
  }
}

// Create global suggestion engine
const suggestionEngine = new SuggestionEngine();
