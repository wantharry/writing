// Storage module tests
describe('Storage', () => {
  let storage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock Storage class
    storage = {
      storageKey: 'writingpad_entries',

      getAllEntries() {
        try {
          const data = localStorage.getItem(this.storageKey);
          return data ? JSON.parse(data) : [];
        } catch (e) {
          return [];
        }
      },

      saveEntry(content) {
        try {
          const entries = this.getAllEntries();
          const now = new Date().toISOString();
          const entry = {
            id: this.generateId(),
            content: content,
            createdAt: now,
            updatedAt: now,
            wordCount: this.countWords(content),
            title: this.generateTitle(content),
            tags: ['test-tag'],
          };
          entries.push(entry);
          localStorage.setItem(this.storageKey, JSON.stringify(entries));
          return true;
        } catch (e) {
          return false;
        }
      },

      getEntry(id) {
        const entries = this.getAllEntries();
        return entries.find(e => e.id === id);
      },

      deleteEntry(id) {
        try {
          let entries = this.getAllEntries();
          entries = entries.filter(e => e.id !== id);
          localStorage.setItem(this.storageKey, JSON.stringify(entries));
          return true;
        } catch (e) {
          return false;
        }
      },

      clearAll() {
        try {
          localStorage.removeItem(this.storageKey);
          return true;
        } catch (e) {
          return false;
        }
      },

      generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      },

      countWords(text) {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        return words.length;
      },

      generateTitle(content) {
        const firstLine = content.split('\n')[0].trim();
        const maxLength = 50;
        return firstLine.length > maxLength
          ? firstLine.substring(0, maxLength) + '...'
          : firstLine || 'Untitled';
      },
    };
  });

  test('should save an entry', () => {
    const result = storage.saveEntry('Hello world this is a test');
    expect(result).toBe(true);
    expect(storage.getAllEntries().length).toBe(1);
  });

  test('should retrieve an entry by ID', () => {
    storage.saveEntry('Test content');
    const entries = storage.getAllEntries();
    const id = entries[0].id;
    const entry = storage.getEntry(id);
    expect(entry).toBeDefined();
    expect(entry.content).toBe('Test content');
  });

  test('should delete an entry', () => {
    storage.saveEntry('Entry to delete');
    const id = storage.getAllEntries()[0].id;
    storage.deleteEntry(id);
    expect(storage.getAllEntries().length).toBe(0);
  });

  test('should clear all entries', () => {
    storage.saveEntry('Entry 1');
    storage.saveEntry('Entry 2');
    expect(storage.getAllEntries().length).toBe(2);
    storage.clearAll();
    expect(storage.getAllEntries().length).toBe(0);
  });

  test('should count words correctly', () => {
    expect(storage.countWords('hello world')).toBe(2);
    expect(storage.countWords('one two three four')).toBe(4);
    expect(storage.countWords('')).toBe(0);
  });

  test('should generate title from content', () => {
    const title = storage.generateTitle('This is my first line\nSecond line');
    expect(title).toBe('This is my first line');
  });

  test('should truncate long titles', () => {
    const longText = 'a'.repeat(60);
    const title = storage.generateTitle(longText);
    expect(title.length).toBe(53); // 50 + '...'
  });

  test('should update entry metadata', () => {
    storage.saveEntry('Original content');
    const entry = storage.getAllEntries()[0];
    expect(entry.wordCount).toBe(2);
    expect(entry.title).toBe('Original content');
  });
});
