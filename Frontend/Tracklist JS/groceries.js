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

      // Only save if migration was needed (don't save on every load)
      if (needsMigration) {
        try {
          await saveGroceries(groceries);
        } catch (saveError) {
          console.warn("Could not save migrated groceries:", saveError);
          // Don't fail initialization if save fails
        }
      }
    } else {
      groceries = [];
    }
    
    groceriesReady = true;
    if (window.onGroceriesReady) window.onGroceriesReady();
  } catch (error) {
    console.warn("Error loading groceries (using empty list):", error.message);
    // Silently fail - use empty array
    groceries = [];
    groceriesReady = true;
    if (window.onGroceriesReady) window.onGroceriesReady();
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
    // If the API returns the full array, use it; otherwise add to local array
    if (Array.isArray(newItem)) {
      groceries = newItem;
    } else {
      groceries.push(newItem);
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

async function recordPurchase(grocery) {
  if (boughtToday(grocery.purchases)) return;
  
  try {
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
    // Update local grocery item
    const index = groceries.findIndex(g => g.name === grocery.name);
    if (index !== -1) {
      groceries[index] = updatedItem;
    }
    
    if (typeof showToast !== 'undefined') {
      showToast(`Recorded purchase of "${grocery.name}"`, "success");
    }
  } catch (error) {
    console.error("Error recording purchase:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Failed to record purchase. Retrying...", "error");
    }
    // Fallback: update locally and save
    grocery.purchases.push(new Date().toISOString());
    await saveGroceries(groceries);
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
    // Update local grocery item
    const index = groceries.findIndex(g => g.name === grocery.name);
    if (index !== -1) {
      groceries[index] = updatedItem;
    }
  } catch (error) {
    console.error("Error toggling history:", error);
    // Fallback: save all groceries
    await saveGroceries(groceries);
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
  } finally {
    if (resetBtn && typeof setLoading !== 'undefined') {
      setLoading(resetBtn, false);
    }
  }
}

async function renameGrocery(grocery, newName) {
  grocery.name = newName;
  await saveGroceries(groceries);
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
      // Fallback: remove from local array
      groceries.splice(index, 1);
    }

    if (typeof showToast !== 'undefined') {
      showToast(`Deleted "${grocery.name}"`, "success");
    }
  } catch (error) {
    console.error("Error deleting grocery:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Failed to delete grocery", "error");
    }
    // Fallback: remove from local array
    groceries.splice(index, 1);
    await saveGroceries(groceries);
  }
}

async function clearGroceryHistory(grocery) {
  grocery.purchases = [];
  grocery.expanded = false;
  await saveGroceries(groceries);
}

window.resetGroceries = resetGroceries;