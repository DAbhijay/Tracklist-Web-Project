// app.js - Main application logic and rendering

// Prevent page reloads from errors
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
  e.preventDefault();
  if (typeof setLoadingOverlay !== 'undefined') {
    setLoadingOverlay(false);
  }
  return false;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
  if (typeof setLoadingOverlay !== 'undefined') {
    setLoadingOverlay(false);
  }
});

// DOM element references
let groceryInput, groceryList, groceryAddBtn;
let taskInput, taskDate, taskList, taskAddBtn;
let elementsInitialized = false;

function initElements() {
  if (elementsInitialized) return;
  
  groceryInput = document.getElementById("grocery-input");
  groceryList = document.getElementById("grocery-items");
  groceryAddBtn = document.getElementById("add-grocery-btn");
  
  taskInput = document.getElementById("task-input");
  taskDate = document.getElementById("task-date");
  taskList = document.getElementById("task-items");
  taskAddBtn = document.getElementById("add-task-btn");
  
  elementsInitialized = true;
  console.log('✅ DOM elements initialized');
}

/* ----------------- GROCERIES RENDERING ----------------- */

let resetButtonInitialized = false;
function initResetButton() {
  if (resetButtonInitialized) return;
  resetButtonInitialized = true;
  
  const resetBtn = document.getElementById("reset-groceries");
  if (resetBtn) {
    resetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof resetGroceries === 'function') {
        await resetGroceries();
        renderGroceries();
      }
    });
    console.log('✅ Reset button initialized');
  }
}

function renderGroceries() {
  if (!groceryList) {
    console.warn('⚠️ renderGroceries: groceryList element not found');
    return;
  }
  
  // Get groceries from window object (most reliable source)
  const groceriesToRender = window.groceries || [];
  
  console.log('🎨 renderGroceries called, items:', groceriesToRender.length);
  
  groceryList.innerHTML = "";

  if (!groceriesToRender.length) {
    groceryList.innerHTML = `<li class="empty-state">Your grocery list is empty</li>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  groceriesToRender.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.toggle("expanded", item.expanded);
    
    // Check if purchased today
    const purchasedToday = item.purchases && item.purchases.some(date => {
      const purchaseDate = new Date(date).toISOString().split('T')[0];
      return purchaseDate === today;
    });
    
    if (purchasedToday) {
      li.classList.add("purchased");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "grocery-checkbox";
    checkbox.checked = purchasedToday;

    const name = document.createElement("span");
    name.className = "grocery-name";
    name.textContent = item.name;
    name.tabIndex = 0;
    name.setAttribute("role", "button");
    name.setAttribute("aria-expanded", item.expanded ? "true" : "false");

    name.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (typeof toggleHistory === 'function') {
          await toggleHistory(item);
          renderGroceries();
        }
      }
    });

    name.addEventListener("click", async () => {
      if (typeof toggleHistory === 'function') {
        await toggleHistory(item);
        renderGroceries();
      }
    });

    checkbox.addEventListener("change", async () => {
      if (typeof togglePurchase === 'function') {
        await togglePurchase(item, checkbox.checked);
        renderGroceries();
      }
    });

    // Info section with purchase count
    const infoContainer = document.createElement("div");
    infoContainer.className = "grocery-info";
    infoContainer.style.display = "flex";
    infoContainer.style.alignItems = "center";
    infoContainer.style.gap = "8px";
    infoContainer.style.flexWrap = "wrap";

    const info = document.createElement("small");
    info.className = "grocery-info-text";
    
    if (item.purchases && item.purchases.length > 0) {
      info.textContent = `Last bought: ${formatDateRelative(item.purchases.at(-1))}`;
      
      const badge = document.createElement("span");
      badge.className = "purchase-count";
      badge.textContent = `${item.purchases.length} purchase${item.purchases.length > 1 ? 's' : ''}`;
      infoContainer.appendChild(badge);
    } else {
      info.textContent = "No purchase history yet";
    }
    
    infoContainer.insertBefore(info, infoContainer.firstChild);

    // Delete button with icon
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-grocery-btn";
    deleteBtn.innerHTML = '<span class="delete-icon">🗑️</span>';
    deleteBtn.setAttribute("aria-label", `Delete ${item.name}`);
    deleteBtn.title = `Delete ${item.name}`;
    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const confirmed = confirm(`Are you sure you want to delete "${item.name}"?\n\nThis will also remove all purchase history for this item.`);
      if (confirmed && typeof deleteGrocery === 'function') {
        // Find actual index in current array
        const actualIndex = window.groceries.findIndex(g => g.name === item.name);
        if (actualIndex !== -1) {
          await deleteGrocery(actualIndex);
          renderGroceries();
        }
      }
    });

    // Create a container for the main content
    const mainContent = document.createElement("div");
    mainContent.className = "grocery-main-content";
    mainContent.append(name, infoContainer);
    
    // Create action buttons container
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "grocery-actions";
    actionsContainer.appendChild(deleteBtn);
    
    // Add purchase history if expanded
    if (item.expanded && item.purchases && item.purchases.length) {
      const history = document.createElement("ul");
      history.className = "purchase-history";

      [...item.purchases].reverse().forEach(d => {
        const h = document.createElement("li");
        h.className = "purchase-history-item";
        h.textContent = formatDateFull(d);
        history.appendChild(h);
      });

      mainContent.appendChild(history);
    }
    
    li.append(checkbox, mainContent, actionsContainer);
    groceryList.appendChild(li);
  });
  
  console.log('✅ Rendered', groceriesToRender.length, 'grocery items');
}

/* ----------------- TASKS RENDERING ----------------- */

function renderTasks() {
  if (!taskList) {
    console.warn('⚠️ renderTasks: taskList element not found');
    return;
  }
  
  // Get tasks from window object (most reliable source)
  const tasksToRender = window.tasks || [];
  
  console.log('🎨 renderTasks called, items:', tasksToRender.length);
  
  taskList.innerHTML = "";

  if (!tasksToRender.length) {
    taskList.innerHTML = `<li class="empty-state">You're all caught up 🎉</li>`;
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const sorted = [...tasksToRender].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  sorted.forEach(task => {
    const li = document.createElement("li");

    const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
    if (isOverdue) {
      li.classList.add("task-overdue");
    }

    if (task.completed) {
      li.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    const span = document.createElement("span");
    span.textContent = task.name;

    const meta = document.createElement("small");
    if (task.dueDate) {
      meta.textContent = `Due: ${task.dueDate}`;
      meta.classList.add("task-date");
    }

    checkbox.addEventListener("change", async () => {
      task.completed = checkbox.checked;
      if (typeof toggleTask === 'function') {
        await toggleTask(task);
        renderTasks();
      }
    });

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (typeof deleteTask === 'function') {
        const tasksArray = window.tasks || [];
        const index = tasksArray.findIndex(t => t.id === task.id || (t.name === task.name && t.dueDate === task.dueDate));
        if (index !== -1) {
          await deleteTask(index);
          renderTasks();
        }
      }
    });

    li.append(checkbox, span, meta, del);
    taskList.appendChild(li);
  });
  
  console.log('✅ Rendered', sorted.length, 'task items');
}

/* ----------------- EVENT HANDLERS ----------------- */

function initEventHandlers() {
  // Grocery add button
  if (groceryAddBtn) {
    groceryAddBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const value = groceryInput.value.trim();
      if (!value) return;

      const name = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

      if (window.groceries && window.groceries.some(g => g.name === name)) {
        showToast("Item already exists", "error");
        return;
      }

      setLoading(groceryAddBtn, true);

      try {
        if (typeof addGrocery === 'function') {
          await addGrocery(name);
          groceryInput.value = "";
          renderGroceries();
        }
      } catch (error) {
        console.error("Error in add grocery handler:", error);
      } finally {
        setLoading(groceryAddBtn, false);
      }
    });
    
    // Allow Enter key in input
    groceryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        groceryAddBtn.click();
      }
    });
    
    console.log('✅ Grocery event handlers initialized');
  }

  // Task add button
  if (taskAddBtn) {
    taskAddBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const name = taskInput.value.trim();
      const dueDate = taskDate.value || null;

      if (!name) return;

      setLoading(taskAddBtn, true);

      try {
        if (typeof addTask === 'function') {
          await addTask(name, dueDate);
          taskInput.value = "";
          taskDate.value = "";
          renderTasks();
        }
      } catch (error) {
        console.error("Error in add task handler:", error);
      } finally {
        setLoading(taskAddBtn, false);
      }
    });
    
    // Allow Enter key in task input
    taskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        taskAddBtn.click();
      }
    });
    
    console.log('✅ Task event handlers initialized');
  }
}

/* ----------------- INITIALIZATION ----------------- */

function initializeApp() {
  console.log('🚀 Initializing app...');
  initElements();
  initEventHandlers();
  initResetButton();
  console.log('✅ App initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/* ----------------- DATA LOADING COORDINATION ----------------- */

let initCount = 0;
let initComplete = false;

function checkInit() {
  initCount++;
  console.log(`📊 Init check ${initCount}/2`);
  
  if (initCount === 2 && !initComplete) {
    initComplete = true;
    console.log('✅ Both data sources loaded');
    
    setLoadingOverlay(false);
    renderCurrentPage();
  }
}

function renderCurrentPage() {
  const hash = window.location.hash.replace('#', '');
  let pageToRender = null;
  
  if (hash && ['groceries', 'tasks'].includes(hash)) {
    pageToRender = hash;
  } else if (typeof getCurrentPage === 'function') {
    pageToRender = getCurrentPage();
  }
  
  console.log('📄 Rendering current page:', pageToRender);
  
  if (pageToRender === 'groceries') {
    renderGroceries();
  } else if (pageToRender === 'tasks') {
    renderTasks();
  }
}

// Show loading overlay at start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setLoadingOverlay(true);
  });
} else {
  setLoadingOverlay(true);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    if (e.key === 'g' && typeof showPage === 'function') {
      e.preventDefault();
      showPage('groceries');
    } else if (e.key === 't' && typeof showPage === 'function') {
      e.preventDefault();
      showPage('tasks');
    } else if (e.key === 'h' && typeof showPage === 'function') {
      e.preventDefault();
      showPage('home');
    }
  }
});

// Register callbacks for when data is ready
window.onGroceriesReady = checkInit;
window.onTasksReady = checkInit;

// Safety timeout to ensure loading overlay is removed
setTimeout(() => {
  if (!initComplete) {
    console.warn('⚠️ Initialization timeout - forcing completion');
    initComplete = true;
    setLoadingOverlay(false);
    renderCurrentPage();
  }
}, 3000);

// Listen for page changes to trigger re-render
window.addEventListener('hashchange', () => {
  console.log('🔄 Hash changed, re-rendering current page');
  renderCurrentPage();
});

// Make render functions globally available for external calls
window.renderGroceries = renderGroceries;
window.renderTasks = renderTasks;
window.renderCurrentPage = renderCurrentPage;

console.log('✅ App.js loaded');