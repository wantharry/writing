// Main app module
const app = {
  currentView: 'editor',

  init() {
    // Set up navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Set initial view
    this.switchView('editor');
  },

  // Switch between views
  switchView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
      selectedView.classList.add('active');
    }

    // Update active nav button
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.currentView = viewName;

    // View-specific logic
    if (viewName === 'history') {
      History.show();
    } else if (viewName === 'editor') {
      Editor.focus();
    }
  },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
