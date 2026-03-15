// History module
const History = {
  grid: null,
  searchBox: null,
  allEntries: [],

  init() {
    this.grid = document.getElementById('history-grid');
    this.searchBox = document.getElementById('history-search');

    // Search event listener
    this.searchBox.addEventListener('input', (e) => {
      const query = e.target.value;
      this.displayEntries(query);
    });
  },

  // Show history view and load entries
  show() {
    this.refresh();
  },

  // Refresh history display
  refresh() {
    this.allEntries = storage.getAllEntries();
    this.displayEntries('');
  },

  // Display entries (with optional search query)
  displayEntries(query = '') {
    let entries = this.allEntries;

    if (query.trim()) {
      entries = storage.searchEntries(query);
    }

    // Sort by most recent first
    entries = entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Render cards
    this.grid.innerHTML = '';

    if (entries.length === 0) {
      this.grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 20px; text-align: center; color: var(--text-light);">No writings yet. Start writing!</div>';
      return;
    }

    entries.forEach(entry => {
      const card = this.createCard(entry);
      this.grid.appendChild(card);
    });
  },

  // Create history card element
  createCard(entry) {
    const card = document.createElement('div');
    card.className = 'history-card';

    const title = document.createElement('div');
    title.className = 'history-card-title';
    title.textContent = entry.title;

    const preview = document.createElement('div');
    preview.className = 'history-card-preview';
    preview.textContent = entry.content.substring(0, 150);

    const meta = document.createElement('div');
    meta.className = 'history-card-meta';
    meta.textContent = `${entry.wordCount} words • ${storage.formatDate(entry.updatedAt)}`;

    const tagContainer = document.createElement('div');
    tagContainer.className = 'history-card-tags';

    // Show max 4 tags
    entry.tags.slice(0, 4).forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      tagContainer.appendChild(tagEl);
    });

    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(meta);
    card.appendChild(tagContainer);

    // Click to open entry
    card.addEventListener('click', () => {
      this.openEntry(entry.id);
    });

    return card;
  },

  // Open entry for editing
  openEntry(entryId) {
    const entry = storage.getEntry(entryId);
    if (!entry) return;

    // Switch to editor view
    app.switchView('editor');

    // Load content
    Editor.setContent(entry.content);
    Editor.focus();
  },

  // Delete entry
  deleteEntry(entryId) {
    if (confirm('Delete this writing? This cannot be undone.')) {
      storage.deleteEntry(entryId);
      this.refresh();
    }
  },
};

// Initialize history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  History.init();
});
