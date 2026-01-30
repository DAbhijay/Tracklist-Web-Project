let groceries = [];
let groceriesReady = false;

// Initialize groceries from API
(async function initGroceries() {
  try {
    groceries = await loadGroceries();
    
    // Migration - only if we got data
    if (Array.isArray(groceries)) {
      let needsMigration = false;
      groceries = groceries.map(item => {
        if (item.purchases) {
          return {
            name: item.name,
            purchases: item.purchases,
            expanded: item.expanded || false
          };
        }

        if (item.lastBought) {
          needsMigration = true;
          return {
            name: item.name,
            purchases: [item.lastBought],
            expanded: false
          };
        }

        return {
          name: item.name,
          purchases: [],
          expanded: false
        };
      });

      if (needsMigration) {
        try {
          await saveGroceries(groceries);
        } catch (saveError) {
          console.warn("Could not save migrated groceries:", saveError);
        }
      }
    } else {
      groceries = [];
    }
    
    groceriesReady = true;
    if (window.onGroceriesReady) window.onGroceriesReady();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('groceriesReady', { detail: groceries }));
    
    // Render if we're on the groceries page - check multiple ways
    const isOnGroceriesPage = (typeof getCurrentPage === 'function' && getCurrentPage() === 'groceries') ||
                              window.location.hash === '#groceries' ||
                              document.querySelector('#groceries-page.active');
    
    if (isOnGroceriesPage && typeof renderGroceries === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderGroceries();
      }, 100);
    }
  } catch (error) {
    console.warn("Error loading groceries (using empty list):", error.message);
    groceries = [];
    groceriesReady = true;
    if (window.onGroceriesReady) window.onGroceriesReady();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('groceriesReady', { detail: groceries }));
    
    // Render if we're on the groceries page - check multiple ways
    const isOnGroceriesPage = (typeof getCurrentPage === 'function' && getCurrentPage() === 'groceries') ||
                              window.location.hash === '#groceries' ||
                              document.querySelector('#groceries-page.active');
    
    if (isOnGroceriesPage && typeof renderGroceries === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderGroceries();
      }, 100);
    }
  }
})();

async function addGrocery(name) {
  try {
    const res = await fetch("/api/groceries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to add grocery");
    }

    const newItem = await res.json();
    if (Array.isArray(newItem)) {
      groceries = newItem;
    } else {
      groceries.push(newItem);
    }
    
    // Re-render the UI immediately
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
    
    if (typeof showToast !== 'undefined') {
      showToast(`Added "${name}" to grocery list`, "success");
    }
  } catch (error) {
    console.error("Error adding grocery:", error);
    if (typeof showToast !== 'undefined') {
      showToast(error.message || "Failed to add grocery item", "error");
    }
    throw error;
  }
}


async function togglePurchase(grocery, isChecked) {
  const today = new Date().toISOString();
  const todayDate = today.split('T')[0];
  
  try {
    if (isChecked) {

      const res = await fetch(`/api/groceries/${encodeURIComponent(grocery.name)}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to record purchase");
      }

      const updatedItem = await res.json();
      const index = groceries.findIndex(g => g.name === grocery.name);
      if (index !== -1) {
        groceries[index] = updatedItem;
      }
      
      // Re-render the UI immediately
      if (typeof renderGroceries === 'function') {
        renderGroceries();
      }
      
      if (typeof showToast !== 'undefined') {
        showToast(`Marked "${grocery.name}" as purchased`, "success");
      }
    } else {

      const purchaseIndex = grocery.purchases.findIndex(date => {
        const purchaseDate = new Date(date).toISOString().split('T')[0];
        return purchaseDate === todayDate;
      });
      
      if (purchaseIndex !== -1) {
        grocery.purchases.splice(purchaseIndex, 1);
        
        const res = await fetch(`/api/groceries/${encodeURIComponent(grocery.name)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ purchases: grocery.purchases }),
        });

        if (!res.ok) {
          throw new Error("Failed to update grocery");
        }

        const updatedItem = await res.json();
        const index = groceries.findIndex(g => g.name === grocery.name);
        if (index !== -1) {
          groceries[index] = updatedItem;
        }
        
        // Re-render the UI immediately
        if (typeof renderGroceries === 'function') {
          renderGroceries();
        }
        
        if (typeof showToast !== 'undefined') {
          showToast(`Unmarked "${grocery.name}"`, "info");
        }
      }
    }
  } catch (error) {
    console.error("Error toggling purchase:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Failed to update item", "error");
    }
    // Fallback: update locally and save
    if (isChecked) {
      grocery.purchases.push(today);
    } else {
      const purchaseIndex = grocery.purchases.findIndex(date => {
        const purchaseDate = new Date(date).toISOString().split('T')[0];
        return purchaseDate === todayDate;
      });
      if (purchaseIndex !== -1) {
        grocery.purchases.splice(purchaseIndex, 1);
      }
    }
    await saveGroceries(groceries);
    
    // Re-render even on error
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
  }
}

async function toggleHistory(grocery) {
  grocery.expanded = !grocery.expanded;
  
  try {
    const res = await fetch(`/api/groceries/${encodeURIComponent(grocery.name)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expanded: grocery.expanded }),
    });

    if (!res.ok) {
      throw new Error("Failed to update grocery");
    }

    const updatedItem = await res.json();
    const index = groceries.findIndex(g => g.name === grocery.name);
    if (index !== -1) {
      groceries[index] = updatedItem;
    }
    
    // Re-render the UI immediately
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
  } catch (error) {
    console.error("Error toggling history:", error);
    await saveGroceries(groceries);
    
    // Re-render even on error
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
  }
}

async function resetGroceries() {
  if (!confirm("Clear all grocery data?")) return;
  
  const resetBtn = document.getElementById("reset-groceries");
  if (resetBtn && typeof setLoading !== 'undefined') {
    setLoading(resetBtn, true);
  }
  try {
    const res = await fetch("/api/groceries", {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to reset groceries");
    }

    groceries = [];
    
    // Re-render the UI immediately
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
    
    if (typeof showToast !== 'undefined') {
      showToast("Grocery list reset successfully", "success");
    }
  } catch (error) {
    console.error("Error resetting groceries:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Failed to reset groceries", "error");
    }
    groceries = [];
    await saveGroceries(groceries);
    
    // Re-render even on error
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
  } finally {
    if (resetBtn && typeof setLoading !== 'undefined') {
      setLoading(resetBtn, false);
    }
  }
}

async function deleteGrocery(index) {
  const grocery = groceries[index];
  if (!grocery) return;

  try {
    const res = await fetch(`/api/groceries/${encodeURIComponent(grocery.name)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete grocery");
    }

    const updatedGroceries = await res.json();
    if (Array.isArray(updatedGroceries)) {
      groceries = updatedGroceries;
    } else {
      groceries.splice(index, 1);
    }

    // Re-render the UI immediately
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
    
    if (typeof showToast !== 'undefined') {
      showToast(`Deleted "${grocery.name}"`, "success");
    }
  } catch (error) {
    console.error("Error deleting grocery:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Failed to delete grocery", "error");
    }
    groceries.splice(index, 1);
    await saveGroceries(groceries);
    
    // Re-render even on error
    if (typeof renderGroceries === 'function') {
      renderGroceries();
    }
  }
}

window.resetGroceries = resetGroceries;