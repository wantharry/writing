// Settings module
const Settings = {
  suggestionModeRadios: null,
  ollamaSettings: null,
  ollamaUrlInput: null,
  ollamaModelInput: null,
  testBtn: null,
  statusMsg: null,
  themeRadios: null,
  clearBtn: null,

  init() {
    this.suggestionModeRadios = document.querySelectorAll('input[name="suggestion-mode"]');
    this.ollamaSettings = document.getElementById('ollama-settings');
    this.ollamaUrlInput = document.getElementById('ollama-url');
    this.ollamaModelInput = document.getElementById('ollama-model');
    this.testBtn = document.getElementById('test-ollama-btn');
    this.statusMsg = document.getElementById('ollama-status');
    this.themeRadios = document.querySelectorAll('input[name="theme"]');
    this.clearBtn = document.getElementById('clear-all-btn');

    // Load settings
    this.loadSettings();

    // Event listeners
    this.suggestionModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleModeChange(e));
    });

    this.themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleThemeChange(e));
    });

    this.testBtn.addEventListener('click', () => this.testOllamaConnection());
    this.clearBtn.addEventListener('click', () => this.handleClearAll());

    // Save settings on input change
    this.ollamaUrlInput.addEventListener('change', () => this.saveSettings());
    this.ollamaModelInput.addEventListener('change', () => this.saveSettings());
  },

  // Load settings from storage
  loadSettings() {
    const settings = storage.getSettings();

    // Set suggestion mode
    document.querySelector(
      `input[name="suggestion-mode"][value="${settings.suggestionMode}"]`
    ).checked = true;
    this.updateOllamaVisibility(settings.suggestionMode);

    // Set Ollama config
    this.ollamaUrlInput.value = settings.ollamaUrl;
    this.ollamaModelInput.value = settings.ollamaModel;

    // Set theme
    document.querySelector(
      `input[name="theme"][value="${settings.theme}"]`
    ).checked = true;
    this.applyTheme(settings.theme);

    // Load suggestion engine settings
    suggestionEngine.setMode(settings.suggestionMode);
    suggestionEngine.setOllamaConfig(settings.ollamaUrl, settings.ollamaModel);
  },

  // Handle suggestion mode change
  handleModeChange(e) {
    const mode = e.target.value;
    this.updateOllamaVisibility(mode);
    suggestionEngine.setMode(mode);
    this.saveSettings();
  },

  // Update Ollama settings visibility
  updateOllamaVisibility(mode) {
    if (mode === 'ollama') {
      this.ollamaSettings.style.display = 'block';
    } else {
      this.ollamaSettings.style.display = 'none';
    }
  },

  // Handle theme change
  handleThemeChange(e) {
    const theme = e.target.value;
    this.applyTheme(theme);
    this.saveSettings();
  },

  // Apply theme
  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark-mode');
    } else {
      html.classList.remove('dark-mode');
    }
  },

  // Test Ollama connection
  async testOllamaConnection() {
    const url = this.ollamaUrlInput.value;
    const model = this.ollamaModelInput.value;

    this.testBtn.disabled = true;
    this.statusMsg.textContent = 'Testing...';
    this.statusMsg.className = '';

    // Update engine config
    suggestionEngine.setOllamaConfig(url, model);

    try {
      const result = await suggestionEngine.testOllamaConnection();

      if (result.success) {
        this.statusMsg.textContent = result.message;
        this.statusMsg.className = 'status-message success';
      } else {
        this.statusMsg.textContent = result.message;
        this.statusMsg.className = 'status-message error';
      }
    } catch (error) {
      this.statusMsg.textContent = `Error: ${error.message}`;
      this.statusMsg.className = 'status-message error';
    } finally {
      this.testBtn.disabled = false;
    }
  },

  // Save all settings
  saveSettings() {
    const settings = {
      suggestionMode: document.querySelector('input[name="suggestion-mode"]:checked').value,
      ollamaUrl: this.ollamaUrlInput.value,
      ollamaModel: this.ollamaModelInput.value,
      theme: document.querySelector('input[name="theme"]:checked').value,
    };

    storage.saveSettings(settings);
    suggestionEngine.setMode(settings.suggestionMode);
    suggestionEngine.setOllamaConfig(settings.ollamaUrl, settings.ollamaModel);
  },

  // Handle clear all data
  handleClearAll() {
    const confirmation = prompt(
      'Type "DELETE" to permanently delete all writings:\n\nThis cannot be undone.'
    );

    if (confirmation === 'DELETE') {
      storage.clearAll();
      Editor.clear();
      History.refresh();
      alert('All data has been deleted.');
      app.switchView('editor');
    }
  },
};

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
});
