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

  // Lightweight suggestions (synchronous)
  getLightweightSuggestions(text) {
    const suggestions = [];

    // Check for filler words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const fillerWords = words.filter(word => isFillerWord(word));

    fillerWords.slice(0, 3).forEach(word => {
      const feedback = getFillerWordFeedback(word);
      if (feedback) {
        suggestions.push({
          type: 'filler',
          text: `"${word}" - ${feedback.alternative}`,
          severity: feedback.severity,
        });
      }
    });

    // Get writing tips
    const tips = getWritingTips(text);
    tips.forEach(tip => {
      suggestions.push({
        type: 'tip',
        text: tip,
        severity: 'info',
      });
    });

    return suggestions.slice(0, 5); // Max 5 suggestions
  }

  // Ollama suggestions (async)
  async getOllamaSuggestions(text) {
    try {
      // Select last sentence or last 2 sentences
      const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
      const lastSentence = sentences.slice(-1)[0] || text;

      const prompt = `Suggest 3-4 ways to improve this sentence for better clarity and emotional impact: "${lastSentence.trim()}"
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
      const suggestions = aiResponse
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 4)
        .map(line => ({
          type: 'ollama',
          text: line.replace(/^[\d\-•*\.]\s*/, '').trim(),
          severity: 'info',
        }));

      return suggestions.length > 0 ? suggestions : this.getLightweightSuggestions(text);
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
