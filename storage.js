// Storage handler for localStorage
class Storage {
  constructor() {
    this.storageKey = 'writingpad_entries';
  }

  // Get all entries
  getAllEntries() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from storage:', e);
      return [];
    }
  }

  // Save or update entry
  saveEntry(content) {
    try {
      const entries = this.getAllEntries();
      const now = new Date().toISOString();

      // Check if updating existing entry (if there's an active entry)
      const activeEntry = this.getActiveEntry();

      if (activeEntry) {
        // Update existing entry
        const index = entries.findIndex(e => e.id === activeEntry.id);
        if (index !== -1) {
          entries[index].content = content;
          entries[index].updatedAt = now;
          entries[index].wordCount = this.countWords(content);
          entries[index].title = this.generateTitle(content);
        }
      } else {
        // Create new entry
        const entry = {
          id: this.generateId(),
          content: content,
          createdAt: now,
          updatedAt: now,
          wordCount: this.countWords(content),
          title: this.generateTitle(content),
          tags: this.generateTags(content),
        };
        entries.push(entry);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(entries));
      return true;
    } catch (e) {
      console.error('Error saving entry:', e);
      return false;
    }
  }

  // Get entry by ID
  getEntry(id) {
    const entries = this.getAllEntries();
    return entries.find(e => e.id === id);
  }

  // Get the most recent entry (active writing session)
  getActiveEntry() {
    const entries = this.getAllEntries();
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }

  // Delete entry
  deleteEntry(id) {
    try {
      let entries = this.getAllEntries();
      entries = entries.filter(e => e.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
      return true;
    } catch (e) {
      console.error('Error deleting entry:', e);
      return false;
    }
  }

  // Clear all entries
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Count words in text
  countWords(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  // Generate title from first line or first N words
  generateTitle(content) {
    const firstLine = content.split('\n')[0].trim();
    const maxLength = 50;
    return firstLine.length > maxLength
      ? firstLine.substring(0, maxLength) + '...'
      : firstLine || 'Untitled';
  }

  // Generate tags (date, day of week, keywords)
  generateTags(content) {
    const now = new Date();
    const tags = [];

    // Date tag (YYYY-MM-DD)
    tags.push(now.toISOString().split('T')[0]);

    // Day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    tags.push(days[now.getDay()]);

    // Keywords from content
    const keywords = extractKeywords(content);
    tags.push(...keywords);

    return tags;
  }

  // Search entries
  searchEntries(query) {
    const entries = this.getAllEntries();
    const queryLower = query.toLowerCase();

    return entries.filter(e =>
      e.content.toLowerCase().includes(queryLower) ||
      e.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
      e.title.toLowerCase().includes(queryLower)
    );
  }

  // Get entries by tag
  getEntriesByTag(tag) {
    const entries = this.getAllEntries();
    return entries.filter(e => e.tags.includes(tag));
  }

  // Format date for display
  formatDate(isoDate) {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // Get settings from localStorage
  getSettings() {
    try {
      const data = localStorage.getItem('writingpad_settings');
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (e) {
      return this.getDefaultSettings();
    }
  }

  // Save settings
  saveSettings(settings) {
    try {
      localStorage.setItem('writingpad_settings', JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Error saving settings:', e);
      return false;
    }
  }

  // Get default settings
  getDefaultSettings() {
    return {
      suggestionMode: 'lightweight',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3',
      theme: 'light',
    };
  }
}

// Create global storage instance
const storage = new Storage();
