let tasks = [];
let tasksReady = false;

// Make tasks accessible globally for debugging and cross-file access
window.tasks = tasks;

// Initialize tasks from API
(async function initTasks() {
  try {
    tasks = await loadTasks();
    
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      tasks = [];
    }
    
    // Migration: ensure all tasks have IDs
    let needsUpdate = false;
    tasks = tasks.map(task => {
      if (!task.id) {
        needsUpdate = true;
        return {
          ...task,
          id: Date.now() + Math.random() // Unique ID
        };
      }
      return task;
    });
    
    // Only save if migration was needed (don't save on every load)
    if (needsUpdate) {
      try {
        await saveTasks(tasks);
      } catch (saveError) {
        console.warn("Could not save migrated tasks:", saveError);
        // Don't fail initialization if save fails
      }
    }
    
    // Update global reference
    window.tasks = tasks;
    
    tasksReady = true;
    if (window.onTasksReady) window.onTasksReady();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('tasksReady', { detail: tasks }));
    
    console.log('Tasks loaded:', tasks.length, 'items');
    
    // Render if we're on the tasks page - check multiple ways
    const isOnTasksPage = (typeof getCurrentPage === 'function' && getCurrentPage() === 'tasks') ||
                          window.location.hash === '#tasks' ||
                          document.querySelector('#tasks-page.active');
    
    if (isOnTasksPage && typeof renderTasks === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderTasks();
      }, 100);
    }
  } catch (error) {
    console.warn("Error loading tasks (using empty list):", error.message);
    // Silently fail - use empty array
    tasks = [];
    
    // Update global reference
    window.tasks = tasks;
    
    tasksReady = true;
    if (window.onTasksReady) window.onTasksReady();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('tasksReady', { detail: tasks }));
    
    // Render if we're on the tasks page - check multiple ways
    const isOnTasksPage = (typeof getCurrentPage === 'function' && getCurrentPage() === 'tasks') ||
                          window.location.hash === '#tasks' ||
                          document.querySelector('#tasks-page.active');
    
    if (isOnTasksPage && typeof renderTasks === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderTasks();
      }, 100);
    }
  }
})();

async function addTask(name, dueDate) {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, dueDate: dueDate || null }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to add task");
    }

    const newTask = await res.json();
    // If the API returns the full array, use it; otherwise add to local array
    if (Array.isArray(newTask)) {
      tasks = newTask;
    } else {
      tasks.push(newTask);
    }
    
    // Update global reference
    window.tasks = tasks;
    
    if (typeof showToast !== 'undefined') {
      showToast(`Added task: "${name}"`, "success");
    }
  } catch (error) {
    console.error("Error adding task:", error);
    if (typeof showToast !== 'undefined') {
      showToast(error.message || "Failed to add task", "error");
    }
    throw error;
  }
}

async function toggleTask(task) {
  const wasCompleted = task.completed;
  
  try {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: task.completed }),
    });

    if (!res.ok) {
      throw new Error("Failed to update task");
    }

    const updatedTasks = await res.json();
     
    if (Array.isArray(updatedTasks)) {
      tasks = updatedTasks;
      window.tasks = tasks;
    }
    
    if (typeof showToast !== 'undefined') {
      const status = task.completed ? "completed" : "reopened";
      showToast(`Task "${task.name}" ${status}`, "success", 2000);
    }
  } catch (error) {
    console.error("Error toggling task:", error);
    // Revert on error
    task.completed = wasCompleted;
    if (typeof showToast !== 'undefined') {
      showToast("Failed to update task", "error");
    }
    // Fallback: save all tasks
    await saveTasks(tasks);
  }
}

async function deleteTask(index) {
  const task = tasks[index];
  if (!task || !task.id) {
    // If no ID, fall back to bulk save
    tasks.splice(index, 1);
    window.tasks = tasks;
    await saveTasks(tasks);
    return;
  }

  const taskName = task.name;
  try {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete task");
    }

    const updatedTasks = await res.json();
    if (Array.isArray(updatedTasks)) {
      tasks = updatedTasks;
      window.tasks = tasks;
    }
    
    if (typeof showToast !== 'undefined') {
      showToast(`Deleted "${taskName}"`, "success");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    if (typeof showToast !== "undefined") {
      showToast("Failed to delete task", "error");
    }
    // Fallback: remove locally
    tasks.splice(index, 1);
    window.tasks = tasks;
    await saveTasks(tasks);
  }
}