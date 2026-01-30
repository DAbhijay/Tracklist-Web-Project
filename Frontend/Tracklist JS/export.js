// Data Export/Import Feature

function exportData() {
  const data = {
    groceries: groceries,
    tasks: tasks,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracklist-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (typeof showToast !== 'undefined') {
    showToast('Data exported successfully!', 'success');
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.groceries || !data.tasks) {
        throw new Error('Invalid backup file format');
      }
      
      // Confirm before importing
      if (!confirm('This will replace all current data. Continue?')) {
        return;
      }
      
      // Import groceries
      groceries = data.groceries;
      await saveGroceries(groceries);
      
      // Import tasks
      tasks = data.tasks;
      await saveTasks(tasks);
      
      // Re-render
      renderGroceries();
      renderTasks();
      
      if (typeof showToast !== 'undefined') {
        showToast('Data imported successfully!', 'success');
      }
    } catch (error) {
      console.error('Import error:', error);
      if (typeof showToast !== 'undefined') {
        showToast('Failed to import data: ' + error.message, 'error');
      }
    }
  });
  
  input.click();
}

// Add export/import buttons to the page
document.addEventListener('DOMContentLoaded', () => {
  const navBar = document.querySelector('.nav-bar');
  if (navBar) {
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'nav-btn export-btn';
    exportBtn.innerHTML = '<span>💾</span> Export';
    exportBtn.title = 'Export all data';
    exportBtn.addEventListener('click', exportData);
    
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'nav-btn import-btn';
    importBtn.innerHTML = '<span>📥</span> Import';
    importBtn.title = 'Import data from backup';
    importBtn.addEventListener('click', importData);
    
    navBar.appendChild(exportBtn);
    navBar.appendChild(importBtn);
  }
});

window.exportData = exportData;
window.importData = importData;