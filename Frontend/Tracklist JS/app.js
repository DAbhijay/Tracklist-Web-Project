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

// Wait for DOM to be ready
let groceryInput, groceryList, groceryAddBtn;
let taskInput, taskDate, taskList, taskAddBtn;
let elementsInitialized = false;

function initElements() {
  if (elementsInitialized) return;
  elementsInitialized = true;
  
  groceryInput = document.getElementById("grocery-input");
  groceryList = document.getElementById("grocery-items");
  groceryAddBtn = document.getElementById("add-grocery-btn");
  
  taskInput = document.getElementById("task-input");
  taskDate = document.getElementById("task-date");
  taskList = document.getElementById("task-items");
  taskAddBtn = document.getElementById("add-task-btn");
}

/* ----------------- GROCERIES ----------------- */

let resetButtonInitialized = false;
function initResetButton() {
  if (resetButtonInitialized) return;
  resetButtonInitialized = true;
  
  const resetBtn = document.getElementById("reset-groceries");
  if (resetBtn) {
    resetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await resetGroceries();
      renderGroceries();
    });
  }
}

function renderGroceries() {
  if (!groceryList) return;
  
  groceryList.innerHTML = "";

  if (!groceries || !groceries.length) {
    groceryList.innerHTML = `<li class="empty-state">Your grocery list is empty</li>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  groceries.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.toggle("expanded", item.expanded);
    
    // Check if purchased today
    const purchasedToday = item.purchases.some(date => {
      const purchaseDate = new Date(date).toISOString().split('T')[0];
      return purchaseDate === today;
    });
    
    // Add purchased class for styling
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
        await toggleHistory(item);
        renderGroceries();
      }
    });

    name.addEventListener("click", async () => {
      await toggleHistory(item);
      renderGroceries();
    });

    checkbox.addEventListener("change", async () => {
      await togglePurchase(item, checkbox.checked);
      renderGroceries();
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
    info.textContent = item.purchases.length
      ? `Last bought: ${formatDateRelative(item.purchases.at(-1))}`
      : "No purchase history yet";

    if (item.purchases.length > 0) {
      const badge = document.createElement("span");
      badge.className = "purchase-count";
      badge.textContent = `${item.purchases.length} purchase${item.purchases.length > 1 ? 's' : ''}`;
      infoContainer.appendChild(badge);
    }

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
      // Use a more user-friendly confirmation
      const confirmed = confirm(`Are you sure you want to delete "${item.name}" from your grocery list?\n\nThis will also remove all purchase history for this item.`);
      if (confirmed) {
        // Find the actual index in the current groceries array
        const actualIndex = groceries.findIndex(g => g.name === item.name);
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
    if (item.expanded && item.purchases.length) {
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
}

/* ----------------- TASKS ----------------- */

function renderTasks() {
  if (!taskList) return;
  
  taskList.innerHTML = "";

  if (!tasks || !tasks.length) {
    taskList.innerHTML = `<li class="empty-state">You're all caught up 🎉</li>`;
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const sorted = [...tasks].sort((a, b) => {
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
      await toggleTask(task);
      renderTasks();
    });

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = tasks.indexOf(task);
      await deleteTask(index);
      renderTasks();
    });

    li.append(checkbox, span, meta, del);
    taskList.appendChild(li);
  });
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

      if (groceries.some(g => g.name === name)) {
        if (typeof showToast !== 'undefined') {
          showToast("Item already exists", "error");
        } else {
          alert("Item already exists.");
        }
        return;
      }

      if (typeof setLoading !== 'undefined') {
        setLoading(groceryAddBtn, true);
      }

      try {
        await addGrocery(name);
        groceryInput.value = "";
        renderGroceries();
      } catch (error) {
        // Error already shown in addGrocery function
      } finally {
        if (typeof setLoading !== 'undefined') {
          setLoading(groceryAddBtn, false);
        }
      }
    });
    
    // Also allow Enter key in input
    groceryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        groceryAddBtn.click();
      }
    });
  }

  // Task add button
  if (taskAddBtn) {
    taskAddBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const name = taskInput.value.trim();
      const dueDate = taskDate.value || null;

      if (!name) return;

      if (typeof setLoading !== 'undefined') {
        setLoading(taskAddBtn, true);
      }

      try {
        await addTask(name, dueDate);
        taskInput.value = "";
        taskDate.value = "";
        renderTasks();
      } catch (error) {
        // Error already shown in addTask
      } finally {
        if (typeof setLoading !== 'undefined') {
          setLoading(taskAddBtn, false);
        }
      }
    });
    
    // Also allow Enter key in task input
    taskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        taskAddBtn.click();
      }
    });
  }
}

/* ----------------- INITIALIZATION ----------------- */

function initializeApp() {
  initElements();
  initEventHandlers();
  initResetButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/* ----------------- DATA LOADING ----------------- */

let initCount = 0;
let initComplete = false;

function checkInit() {
  initCount++;
  if (initCount === 2 && !initComplete) {
    initComplete = true;
    if (typeof setLoadingOverlay !== 'undefined') {
      setLoadingOverlay(false);
    }
    // Always render the current page after data loads
    renderCurrentPage();
  }
}

function renderCurrentPage() {
  // Check URL hash first, then getCurrentPage function
  const hash = window.location.hash.replace('#', '');
  let pageToRender = null;
  
  if (hash && ['groceries', 'tasks'].includes(hash)) {
    pageToRender = hash;
  } else if (typeof getCurrentPage === 'function') {
    pageToRender = getCurrentPage();
  }
  
  if (pageToRender === 'groceries' && typeof renderGroceries === 'function') {
    renderGroceries();
  }
  if (pageToRender === 'tasks' && typeof renderTasks === 'function') {
    renderTasks();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof setLoadingOverlay !== 'undefined') {
      setLoadingOverlay(true);
    }
  });
} else {
  if (typeof setLoadingOverlay !== 'undefined') {
    setLoadingOverlay(true);
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+G for Groceries, Alt+T for Tasks, Alt+H for Home
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    if (e.key === 'g') {
      e.preventDefault();
      showPage('groceries');
    } else if (e.key === 't') {
      e.preventDefault();
      showPage('tasks');
    } else if (e.key === 'h') {
      e.preventDefault();
      showPage('home');
    }
  }
});

window.onGroceriesReady = checkInit;
window.onTasksReady = checkInit;

setTimeout(() => {
  if (!initComplete) {
    console.warn('Initialization timeout - hiding loading overlay and forcing completion');
    initComplete = true;
    if (window.onGroceriesReady) {
      window.onGroceriesReady();
    }
    if (window.onTasksReady) {
      window.onTasksReady();
    }
    if (typeof setLoadingOverlay !== 'undefined') {
      setLoadingOverlay(false);
    }
  }
}, 2000);