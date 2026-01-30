// Navigation system for Tracklist app

let currentPage = 'home';

function showPage(pageId) {
  // LOG: See what's calling showPage
  console.log('🔵 showPage called:', pageId, 'from:', currentPage);
  console.trace('Stack trace:');
  
  // Don't do anything if already on this page
  if (currentPage === pageId) {
    console.log('⚠️ Already on this page, skipping');
    return;
  }
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  const page = document.getElementById(`${pageId}-page`);
  if (page) {
    page.classList.add('active');
    currentPage = pageId;
    console.log('✅ Switched to page:', pageId);
  }
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
  
  // Re-render content for the active page
  // Use a small delay to ensure DOM is ready, but also check if data is ready
  setTimeout(() => {
    if (pageId === 'groceries' && typeof renderGroceries === 'function') {
      // Check if groceries data is ready, if not wait a bit more
      if (typeof groceriesReady !== 'undefined' && groceriesReady) {
        renderGroceries();
      } else {
        // Wait for data to be ready
        const checkGroceries = setInterval(() => {
          if (typeof groceriesReady !== 'undefined' && groceriesReady) {
            renderGroceries();
            clearInterval(checkGroceries);
          }
        }, 50);
        // Timeout after 2 seconds
        setTimeout(() => clearInterval(checkGroceries), 2000);
      }
    }
    if (pageId === 'tasks' && typeof renderTasks === 'function') {
      // Check if tasks data is ready, if not wait a bit more
      if (typeof tasksReady !== 'undefined' && tasksReady) {
        renderTasks();
      } else {
        // Wait for data to be ready
        const checkTasks = setInterval(() => {
          if (typeof tasksReady !== 'undefined' && tasksReady) {
            renderTasks();
            clearInterval(checkTasks);
          }
        }, 50);
        // Timeout after 2 seconds
        setTimeout(() => clearInterval(checkTasks), 2000);
      }
    }
  }, 100);
}

// Initialize navigation - only once
let navigationInitialized = false;

function initNavigation() {
  if (navigationInitialized) {
    console.log('⚠️ Navigation already initialized');
    return;
  }
  navigationInitialized = true;
  console.log('🚀 Initializing navigation');
  
  // Set up nav button listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('🔵 Nav button clicked:', btn.dataset.page);
      e.preventDefault();
      e.stopPropagation();
      showPage(btn.dataset.page);
    });
  });
  
  // Set up feature card listeners - ONLY on the home page cards
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', (e) => {
      console.log('🟡 Feature card clicked, currentPage:', currentPage, 'target:', e.target.tagName);
      
      // Only handle clicks if we're on the home page
      if (currentPage !== 'home') {
        console.log('❌ Not on home page, ignoring feature card click');
        return;
      }
      
      // Don't navigate if clicking interactive elements
      if (e.target.closest('button') || e.target.closest('input')) {
        console.log('❌ Clicked on button/input, ignoring');
        return;
      }
      
      console.log('✅ Feature card navigation triggered');
      e.preventDefault();
      e.stopPropagation();
      showPage(card.dataset.page);
    });
  });
  
  // Set up feature button listeners separately
  document.querySelectorAll('.feature-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('🟢 Feature button clicked, currentPage:', currentPage);
      
      // Only handle clicks if we're on the home page
      if (currentPage !== 'home') {
        console.log('❌ Not on home page, ignoring feature button click');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation(); // Prevent card click
      const card = btn.closest('.feature-card');
      if (card) {
        console.log('✅ Feature button navigation triggered');
        showPage(card.dataset.page);
      }
    });
  });
  
  // Show home page by default
  const active = document.querySelector('.page.active');
  if (active) {
    const id = active.id.replace('-page', '');
    currentPage = id;
    console.log('📍 Initial page from HTML:', currentPage);
  } else {
    console.log('📍 No active page, showing home');
    showPage('home');
  }
}

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}

// Export for use in other files
window.showPage = showPage;
window.getCurrentPage = () => currentPage;