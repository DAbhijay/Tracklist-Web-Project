// Storage.js - API communication layer
// This file must be loaded BEFORE groceries.js and tasks.js

const API_BASE = window.location.hostname === 'localhost'
  ? "http://localhost:3000/api"
  : "/api";

console.log('📡 Storage layer initialized, API base:', API_BASE);

// ----- GROCERY API FUNCTIONS -----

async function loadGroceries() {
  try {
    console.log('🔄 Loading groceries from:', `${API_BASE}/groceries`);
    const res = await fetch(`${API_BASE}/groceries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Groceries API response status:', res.status, res.statusText);
    
    if (!res.ok) {
      console.error(`❌ Backend returned ${res.status}, using empty grocery list`);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return [];
    }
    
    const data = await res.json();
    console.log('✅ Groceries API returned data:', data);
    console.log('📊 Number of items:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (!Array.isArray(data)) {
      console.error('❌ API did not return an array, got:', typeof data, data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("❌ Could not connect to backend, using empty grocery list:", error.message);
    console.error('Full error:', error);
    return [];
  }
}

async function saveGroceries(groceries) {
  try {
    const res = await fetch(`${API_BASE}/groceries`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groceries),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to save groceries: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error saving groceries:", error);
    throw error;
  }
}

// ----- TASK API FUNCTIONS -----

async function loadTasks() {
  try {
    console.log('🔄 Loading tasks from:', `${API_BASE}/tasks`);
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Tasks API response status:', res.status, res.statusText);
    
    if (!res.ok) {
      console.error(`❌ Backend returned ${res.status}, using empty task list`);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return [];
    }
    
    const data = await res.json();
    console.log('✅ Tasks API returned data:', data);
    console.log('📊 Number of items:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (!Array.isArray(data)) {
      console.error('❌ API did not return an array, got:', typeof data, data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("❌ Could not connect to backend, using empty task list:", error.message);
    console.error('Full error:', error);
    return [];
  }
}

async function saveTasks(tasks) {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tasks),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to save tasks: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error saving tasks:", error);
    throw error;
  }
}

// Make functions globally available
window.loadGroceries = loadGroceries;
window.saveGroceries = saveGroceries;
window.loadTasks = loadTasks;
window.saveTasks = saveTasks;

console.log('✅ Storage API functions registered globally');