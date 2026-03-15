// Editor module
const Editor = {
  pad: null,
  panel: null,
  autoSaveTimer: null,
  lastSavedContent: '',
  llmIndicator: null,
  llmText: null,

  init() {
    this.pad = document.getElementById('writing-pad');
    this.panel = document.getElementById('suggestions-panel');
    this.llmIndicator = document.getElementById('llm-indicator');
    this.llmText = document.getElementById('llm-text');

    // Load last entry or empty pad
    const activeEntry = storage.getActiveEntry();
    if (activeEntry) {
      this.pad.value = activeEntry.content;
      this.lastSavedContent = activeEntry.content;
      this.updateWordCount();
    }

    // Event listeners
    this.pad.addEventListener('input', () => this.handleInput());
    this.pad.addEventListener('mouseup', () => this.handleTextSelection());
    this.pad.addEventListener('touchend', () => this.handleTextSelection());

    // Set up auto-save every 3 seconds
    setInterval(() => this.autoSave(), 3000);

    // Check LLM connection on init and every 10 seconds
    this.checkLLMConnection();
    setInterval(() => this.checkLLMConnection(), 10000);
  },

  // Check if LLM (Ollama) is connected
  async checkLLMConnection() {
    const settings = storage.getSettings();
    if (settings.suggestionMode !== 'ollama') {
      this.updateLLMStatus(true, 'Lightweight');
      return;
    }

    try {
      const result = await suggestionEngine.testOllamaConnection();
      this.updateLLMStatus(result.success, result.success ? 'LLM Online' : 'LLM Offline');
    } catch (error) {
      this.updateLLMStatus(false, 'LLM Offline');
    }
  },

  // Update LLM status indicator
  updateLLMStatus(connected, text) {
    if (connected) {
      this.llmIndicator.classList.remove('disconnected');
      this.llmIndicator.classList.add('connected');
    } else {
      this.llmIndicator.classList.remove('connected');
      this.llmIndicator.classList.add('disconnected');
    }
    this.llmText.textContent = text;
  },

  // Handle text input - debounced suggestions
  handleInput() {
    this.updateWordCount();

    // Clear previous debounce timer
    clearTimeout(this.suggestionTimer);

    // Debounce suggestion fetch (400ms)
    this.suggestionTimer = setTimeout(() => {
      this.updateSuggestions();
    }, 400);
  },

  // Update suggestions panel
  async updateSuggestions() {
    const text = this.pad.value;

    if (text.trim().length < 5) {
      this.hideSuggestions();
      return;
    }

    try {
      const suggestions = await suggestionEngine.getSuggestions(text);
      console.log('Suggestions:', suggestions);

      // Check if both sentence and words are empty
      if (!suggestions.sentence && !suggestions.words) {
        // Old format (array) - check if empty
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
          this.hideSuggestions();
          return;
        }
      } else {
        // New format (object)
        if (suggestions.sentence.length === 0 && suggestions.words.length === 0) {
          this.hideSuggestions();
          return;
        }
      }

      this.displaySuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.hideSuggestions();
    }
  },

  // Display suggestions in two-column layout
  displaySuggestions(suggestionGroups) {
    const content = this.panel.querySelector('.suggestions-content');
    content.innerHTML = '';

    // Handle both old format (array) and new format (object with sentence/words)
    if (Array.isArray(suggestionGroups)) {
      this.displaySuggestionsLegacy(suggestionGroups);
      return;
    }

    const { sentence = [], words = [] } = suggestionGroups;

    if (sentence.length === 0 && words.length === 0) {
      this.hideSuggestions();
      return;
    }

    content.style.display = 'grid';
    content.style.gridTemplateColumns = '1fr 1fr';
    content.style.gap = '12px';

    // Sentence suggestions (left column)
    if (sentence.length > 0) {
      const sentenceCol = document.createElement('div');
      sentenceCol.className = 'suggestion-column';
      const sentenceHeader = document.createElement('div');
      sentenceHeader.className = 'suggestion-column-header';
      sentenceHeader.textContent = 'Sentence';
      sentenceCol.appendChild(sentenceHeader);

      sentence.forEach(suggestion => {
        const item = this.createSuggestionItem(suggestion);
        sentenceCol.appendChild(item);
      });
      content.appendChild(sentenceCol);
    }

    // Word suggestions (right column)
    if (words.length > 0) {
      const wordsCol = document.createElement('div');
      wordsCol.className = 'suggestion-column';
      const wordsHeader = document.createElement('div');
      wordsHeader.className = 'suggestion-column-header';
      wordsHeader.textContent = 'Words';
      wordsCol.appendChild(wordsHeader);

      words.forEach(suggestion => {
        const item = this.createSuggestionItem(suggestion);
        wordsCol.appendChild(item);
      });
      content.appendChild(wordsCol);
    }

    this.showSuggestions();
  },

  // Create individual suggestion item
  createSuggestionItem(suggestion) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = suggestion.text;
    item.title = `Click to apply`;
    item.style.cursor = 'pointer';

    // Make suggestions clickable
    item.addEventListener('click', () => {
      this.handleSuggestionClick(suggestion);
    });

    return item;
  },

  // Legacy support for array-based suggestions
  displaySuggestionsLegacy(suggestions) {
    const content = this.panel.querySelector('.suggestions-content');
    content.style.display = 'flex';
    content.style.gridTemplateColumns = 'initial';
    content.style.gap = '8px';

    suggestions.forEach(suggestion => {
      const item = this.createSuggestionItem(suggestion);
      content.appendChild(item);
    });

    this.showSuggestions();
  },

  // Handle suggestion click - highlight issue and show options
  handleSuggestionClick(suggestion) {
    const text = this.pad.value;
    let startPos = -1;
    let endPos = -1;
    let targetWord = null;

    // Extract word from suggestion text
    // Patterns: "word" or word: or word -
    const wordMatch = suggestion.text.match(/["']([^"']+)["']|^(\w+)\s*[:\-]|(\w+)\s+detected|of\s+"([^"]+)"/);
    if (wordMatch) {
      targetWord = wordMatch[1] || wordMatch[2] || wordMatch[3] || wordMatch[4];
    }

    // If no word found in suggestion text, try to find any word in the suggestion
    if (!targetWord) {
      const words = suggestion.text.match(/\b[a-z]+\b/gi);
      if (words && words.length > 0) {
        targetWord = words[0]; // First word
      }
    }

    // Find the word in the text
    if (targetWord) {
      startPos = text.toLowerCase().indexOf(targetWord.toLowerCase());
      if (startPos !== -1) {
        endPos = startPos + targetWord.length;
      }
    }

    if (startPos === -1) {
      // If can't find specific text, show general suggestion popup
      this.showSuggestionPopup(suggestion);
      return;
    }

    // Highlight the found text
    this.pad.focus();
    this.pad.setSelectionRange(startPos, endPos);

    // Get alternatives for the word (works for any word now)
    const alternatives = getSynonyms(targetWord);

    if (alternatives.length > 0) {
      // Show alternatives if available
      this.showWordPopup(targetWord, alternatives);
    } else {
      // Show general suggestion if no alternatives
      this.showSuggestionPopup(suggestion);
    }
  },

  // Show general suggestion popup (for non-replaceable suggestions)
  showSuggestionPopup(suggestion) {
    const popup = document.getElementById('word-popup');
    const content = popup.querySelector('.popup-content');

    content.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 8px; color: var(--text-light); font-size: 12px;">Suggestion:</div>
      <div style="font-size: 13px; margin-bottom: 8px; line-height: 1.5; color: var(--text);">${suggestion.text}</div>
      <div style="font-size: 11px; color: var(--text-light);">Review and adjust manually</div>
    `;

    // Position popup near cursor
    const start = this.pad.selectionStart;
    const textBeforeCursor = this.pad.value.substring(0, start);
    const linesBeforeCursor = textBeforeCursor.split('\n').length - 1;
    const posX = this.pad.offsetLeft + 20;
    const posY = this.pad.offsetTop + (linesBeforeCursor * 28) + 50;

    popup.style.left = posX + 'px';
    popup.style.top = posY + 'px';
    popup.style.display = 'block';
  },

  // Show suggestions panel
  showSuggestions() {
    this.panel.classList.add('active');
  },

  // Hide suggestions panel
  hideSuggestions() {
    this.panel.classList.remove('active');
  },

  // Update word count
  updateWordCount() {
    const text = this.pad.value;
    const wordCount = storage.countWords(text);
    document.getElementById('word-count').textContent = wordCount;
  },

  // Handle text selection for word alternatives
  handleTextSelection() {
    const selectedText = this.pad.value.substring(
      this.pad.selectionStart,
      this.pad.selectionEnd
    ).trim();

    if (selectedText.length === 0 || selectedText.split(/\s+/).length > 1) {
      this.hideWordPopup();
      return;
    }

    const alternatives = suggestionEngine.getWordAlternatives(selectedText);

    if (alternatives.length === 0) {
      this.hideWordPopup();
      return;
    }

    this.showWordPopup(selectedText, alternatives);
  },

  // Show word popup with alternatives
  showWordPopup(word, alternatives) {
    const popup = document.getElementById('word-popup');
    const content = popup.querySelector('.popup-content');

    content.innerHTML = `<div style="font-weight: 500; margin-bottom: 8px; color: var(--text-light);">Alternatives for "${word}":</div>`;

    alternatives.forEach(alt => {
      const item = document.createElement('div');
      item.className = 'popup-word';
      item.textContent = alt;
      item.addEventListener('click', () => this.replaceWord(word, alt));
      content.appendChild(item);
    });

    // Position popup near cursor
    const start = this.pad.selectionStart;
    const textBeforeCursor = this.pad.value.substring(0, start);
    const linesBeforeCursor = textBeforeCursor.split('\n').length - 1;
    const posX = this.pad.offsetLeft + 20;
    const posY = this.pad.offsetTop + (linesBeforeCursor * 28) + 50;

    popup.style.left = posX + 'px';
    popup.style.top = posY + 'px';
    popup.style.display = 'block';
  },

  // Hide word popup
  hideWordPopup() {
    const popup = document.getElementById('word-popup');
    popup.style.display = 'none';
  },

  // Replace selected word with alternative
  replaceWord(oldWord, newWord) {
    const text = this.pad.value;
    const start = this.pad.selectionStart;
    const end = this.pad.selectionEnd;

    const before = text.substring(0, start);
    const after = text.substring(end);
    this.pad.value = before + newWord + after;

    // Move cursor after replaced word
    this.pad.selectionStart = start + newWord.length;
    this.pad.selectionEnd = start + newWord.length;

    this.hideWordPopup();
    this.updateWordCount();

    // Trigger input event to update suggestions
    this.pad.dispatchEvent(new Event('input'));
  },

  // Auto-save every 3 seconds
  autoSave() {
    const text = this.pad.value;

    if (text !== this.lastSavedContent && text.trim().length > 0) {
      storage.saveEntry(text);
      this.lastSavedContent = text;
    }
  },

  // Clear editor
  clear() {
    this.pad.value = '';
    this.updateWordCount();
    this.hideSuggestions();
    this.lastSavedContent = '';
  },

  // Get current content
  getContent() {
    return this.pad.value;
  },

  // Set content
  setContent(content) {
    this.pad.value = content;
    this.lastSavedContent = content;
    this.updateWordCount();
  },

  // Focus pad
  focus() {
    this.pad.focus();
  }
};

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Editor.init();
});
