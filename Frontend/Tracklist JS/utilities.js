// Utilities.js - Helper functions used across the app

// Format date for relative display (e.g., "2 days ago")
function formatDateRelative(dateStr) {
  if (!dateStr) return "Never";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Format date for full display (e.g., "Jan 30, 2026")
function formatDateFull(dateStr) {
  if (!dateStr) return "Unknown date";
  
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Show toast notification (if toast system exists)
function showToast(message, type = 'info', duration = 3000) {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Check if there's a toast system available
  if (typeof window.showToastNotification === 'function') {
    window.showToastNotification(message, type, duration);
  }
}

// Set loading state on button
function setLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
    button.classList.add('loading');
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
    button.classList.remove('loading');
  }
}

// Set loading overlay
function setLoadingOverlay(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// Get current page from DOM
function getCurrentPage() {
  // Check active page element
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    return activePage.id.replace('-page', '');
  }
  
  // Check URL hash
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    return hash;
  }
  
  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    const lastPage = localStorage.getItem('lastActivePage');
    if (lastPage) {
      return lastPage;
    }
  }
  
  return 'home'; // default
}

// Make functions globally available
window.formatDateRelative = formatDateRelative;
window.formatDateFull = formatDateFull;
window.showToast = showToast;
window.setLoading = setLoading;
window.setLoadingOverlay = setLoadingOverlay;
window.getCurrentPage = getCurrentPage;

console.log('✅ Utility functions registered globally');