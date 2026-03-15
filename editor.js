// Editor module
const Editor = {
  pad: null,
  panel: null,
  autoSaveTimer: null,
  lastSavedContent: '',

  init() {
    this.pad = document.getElementById('writing-pad');
    this.panel = document.getElementById('suggestions-panel');

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

    if (text.trim().length < 10) {
      this.hideSuggestions();
      return;
    }

    try {
      const suggestions = await suggestionEngine.getSuggestions(text);

      if (suggestions.length === 0) {
        this.hideSuggestions();
        return;
      }

      this.displaySuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.hideSuggestions();
    }
  },

  // Display suggestions in panel
  displaySuggestions(suggestions) {
    const content = this.panel.querySelector('.suggestions-content');
    content.innerHTML = '';

    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = suggestion.text;
      item.title = `[${suggestion.type}] ${suggestion.text}`;
      content.appendChild(item);
    });

    this.showSuggestions();
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
  },
};

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Editor.init();
});
