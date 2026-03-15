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

    // Check if user is typing a partial word (word completion)
    const partialWord = this.getPartialWord(text);
    if (partialWord && partialWord.length >= 2) {
      // Add word completion suggestions
      const completions = this.getLocalWordSuggestions(partialWord);
      completions.forEach(word => {
        wordSuggestions.push({
          type: 'completion',
          text: `→ ${word}`,
          severity: 'info',
        });
      });
    }

    // Word-level suggestions: filler words in current sentence
    const words = currentSentence.toLowerCase().match(/\b\w+\b/g) || [];
    const fillerWords = words.filter(word => isFillerWord(word));

    fillerWords.slice(0, 3 - wordSuggestions.length).forEach(word => {
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

    // Add general tip if no other suggestions
    if (sentenceSuggestions.length === 0 && wordSuggestions.length === 0) {
      sentenceSuggestions.push({
        type: 'tip',
        text: 'Keep writing! Tips will appear as you write.',
        severity: 'info',
      });
    }

    return {
      sentence: sentenceSuggestions.slice(0, 3),
      words: wordSuggestions.slice(0, 3),
    };
  }

  // Get the partial word being typed at the end of text
  getPartialWord(text) {
    const lastWord = text.match(/\S*$/);
    return lastWord ? lastWord[0] : '';
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
    if (words.length > 20) {
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

    // Check for repeated words
    const wordFreq = {};
    words.forEach(w => {
      const lower = w.toLowerCase();
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    });
    const repeated = Object.entries(wordFreq).find(([_, count]) => count > 2);
    if (repeated) {
      tips.push(`Repetition: "${repeated[0]}" used ${repeated[1]} times`);
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

  // Get word suggestions (autocomplete) for partial word being typed
  async getWordSuggestions(partialWord) {
    if (!partialWord || partialWord.length < 2) {
      return [];
    }

    try {
      // Use Free Dictionary API to get word suggestions
      const response = await fetch(
        `https://api.api-ninjas.com/v1/dictionary?word=${partialWord}`,
        {
          headers: { 'X-Api-Key': 'your-key-here' } // Free tier might not need key
        }
      );

      if (!response.ok) {
        // Fallback to local suggestions
        return this.getLocalWordSuggestions(partialWord);
      }

      const data = await response.json();
      return data.definitions ? [data.word] : [];
    } catch (error) {
      // Fallback to local word list
      return this.getLocalWordSuggestions(partialWord);
    }
  }

  // Local word suggestions (fallback)
  getLocalWordSuggestions(partialWord) {
    const commonWords = [
      'about', 'above', 'absolutely', 'accept', 'access', 'account', 'achieve', 'action', 'activity',
      'actually', 'add', 'additional', 'address', 'adjust', 'admit', 'advance', 'adverse', 'advice',
      'advise', 'affair', 'afford', 'afraid', 'after', 'again', 'against', 'age', 'agency', 'agenda',
      'agent', 'agree', 'agreement', 'ahead', 'aid', 'aim', 'air', 'aircraft', 'alarm', 'albeit',
      'album', 'alcohol', 'alert', 'alien', 'align', 'alive', 'all', 'allow', 'almost', 'alone',
      'along', 'already', 'also', 'alter', 'alternative', 'although', 'always', 'amateur', 'amazing',
      'among', 'amount', 'analysis', 'analyze', 'ancient', 'and', 'anger', 'angle', 'angry', 'animal',
      'announce', 'annual', 'another', 'answer', 'antenna', 'anticipate', 'anxiety', 'anxious', 'any',
      'anybody', 'anymore', 'anyone', 'anything', 'anyway', 'anywhere', 'apart', 'apartment', 'apology',
      'apparent', 'appeal', 'appear', 'appearance', 'apple', 'application', 'apply', 'appoint', 'appointment',
      'appreciate', 'approach', 'appropriate', 'approval', 'approve', 'approximate', 'april', 'arbitrary',
      'arc', 'arch', 'architect', 'architecture', 'archive', 'area', 'argue', 'argument', 'arise', 'arm',
      'armed', 'army', 'around', 'arrange', 'arrangement', 'arrest', 'arrival', 'arrive', 'arrow', 'art',
      'article', 'artificial', 'artist', 'artistic', 'as', 'ash', 'aside', 'ask', 'aspect', 'assault',
      'asset', 'assign', 'assignment', 'assist', 'assistant', 'associate', 'association', 'assume', 'assumption',
      'assure', 'attach', 'attachment', 'attack', 'attain', 'attempt', 'attend', 'attendance', 'attendant',
      'attention', 'attitude', 'attorney', 'attract', 'attraction', 'attractive', 'audience', 'august', 'aunt',
      'authentic', 'author', 'authority', 'authorization', 'authorize', 'automatic', 'automobile', 'autumn', 'available',
      'avenue', 'average', 'aversion', 'avoid', 'await', 'awake', 'award', 'aware', 'awareness', 'away',
      'awesome', 'awful', 'awhile', 'awkward', 'axis', 'baby', 'back', 'background', 'backward', 'bacon',
      'bacteria', 'badge', 'badly', 'bag', 'bail', 'bait', 'bake', 'balance', 'balcony', 'bald', 'ball',
      'balloon', 'band', 'bang', 'bank', 'banner', 'bar', 'bare', 'barely', 'bargain', 'barge', 'bark',
      'barrel', 'base', 'basement', 'basic', 'basket', 'bass', 'bat', 'batch', 'bath', 'bathroom',
      'battery', 'battle', 'beach', 'bead', 'beam', 'bean', 'bear', 'beard', 'bearing', 'beast',
      'beat', 'beauty', 'because', 'become', 'beef', 'been', 'beer', 'before', 'began', 'begin',
      'behalf', 'behave', 'behavior', 'behind', 'being', 'belief', 'believe', 'bell', 'belly', 'belong',
      'below', 'belt', 'bench', 'bend', 'beneath', 'benefit', 'bent', 'berry', 'beside', 'best',
      'bet', 'better', 'between', 'beyond', 'bible', 'bicycle', 'bid', 'big', 'bill', 'billion',
      'bind', 'bird', 'birth', 'bit', 'bite', 'bitter', 'black', 'blade', 'blame', 'blank',
      'blanket', 'blast', 'bleak', 'bleed', 'blend', 'bless', 'blind', 'blink', 'bliss', 'block',
      'blood', 'blossom', 'blow', 'blue', 'blush', 'board', 'boat', 'body', 'boil', 'bold',
      'bolt', 'bomb', 'bond', 'bone', 'bonus', 'book', 'boom', 'boost', 'booth', 'border',
      'bore', 'born', 'borrow', 'boss', 'both', 'bother', 'bottle', 'bottom', 'bounce', 'bound',
      'bow', 'bowl', 'box', 'boy', 'brain', 'brand', 'brass', 'brave', 'breach', 'bread',
      'break', 'breast', 'breath', 'breathe', 'breed', 'breeze', 'brew', 'brick', 'bride', 'bridge',
      'brief', 'bright', 'bring', 'brink', 'brisk', 'broad', 'broadcast', 'broke', 'broken', 'bronze',
      'brook', 'broom', 'brother', 'brought', 'brow', 'brown', 'browse', 'brush', 'bubble', 'bucket',
      'bud', 'budget', 'buffalo', 'buffer', 'bug', 'build', 'building', 'bulk', 'bull', 'bullet',
      'bundle', 'burden', 'bureau', 'burn', 'burst', 'bury', 'bus', 'bush', 'business', 'busy',
      'but', 'butter', 'button', 'buy', 'buyer', 'buzz', 'by', 'bye', 'byte'
    ];

    const lower = partialWord.toLowerCase();
    return commonWords
      .filter(word => word.startsWith(lower))
      .slice(0, 5); // Return top 5 suggestions
  }
}

// Create global suggestion engine
const suggestionEngine = new SuggestionEngine();
