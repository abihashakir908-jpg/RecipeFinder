/**
 * Zaiqa — Pakistani Recipe Finder
 * shopping-list.js - Smart Ingredients Shopping List with Custom Additions, Checkbox Progress & Print
 */

let shoppingItems = [];

document.addEventListener("DOMContentLoaded", () => {
  initShoppingListPage();
});

function initShoppingListPage() {
  loadShoppingList();
  renderShoppingList();
  setupShoppingListControls();
}

function loadShoppingList() {
  try {
    const raw = localStorage.getItem("zaiqa_shopping_list");
    if (raw) {
      shoppingItems = JSON.parse(raw);
    } else {
      // Default initial items from classic Biryani & Karahi to demonstrate
      shoppingItems = [
        { id: "item_1", name: "3 cups Aged Basmati Rice", category: "Rice Dishes", recipe: "Chicken Biryani", purchased: false },
        { id: "item_2", name: "1 kg Bone-in Chicken pieces", category: "Chicken Recipes", recipe: "Chicken Karahi", purchased: false },
        { id: "item_3", name: "5 large Ripe Red Tomatoes", category: "Chicken Recipes", recipe: "Chicken Karahi", purchased: false },
        { id: "item_4", name: "1 cup Plain Yogurt (Dahi)", category: "Dairy & Cold", recipe: "Chicken Biryani", purchased: true },
        { id: "item_5", name: "2 tbsp Ginger-Garlic Paste", category: "Spices & Pantry", recipe: "Chicken Biryani", purchased: false }
      ];
      saveShoppingList();
    }
  } catch (e) {
    console.error("Error loading shopping list:", e);
    shoppingItems = [];
  }
}

function saveShoppingList() {
  localStorage.setItem("zaiqa_shopping_list", JSON.stringify(shoppingItems));
}

// ==========================================
// Render Shopping List
// ==========================================
function renderShoppingList() {
  const container = document.getElementById("shoppingItemsContainer");
  const emptyState = document.getElementById("emptyShoppingList");
  const countBadge = document.getElementById("shoppingTotalCountBadge");
  const progressBadge = document.getElementById("shoppingPurchasedCountBadge");

  if (!container) return;

  container.innerHTML = "";

  if (shoppingItems.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (countBadge) countBadge.textContent = "0 items";
    if (progressBadge) progressBadge.textContent = "0 purchased";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  const purchasedCount = shoppingItems.filter(i => i.purchased).length;
  if (countBadge) countBadge.textContent = `${shoppingItems.length} items`;
  if (progressBadge) progressBadge.textContent = `${purchasedCount} / ${shoppingItems.length} purchased`;

  shoppingItems.forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = `shopping-list-item ${item.purchased ? 'purchased' : ''}`;
    itemEl.setAttribute("data-id", item.id);

    itemEl.innerHTML = `
      <div class="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
        <input 
          type="checkbox" 
          class="custom-checkbox shopping-item-checkbox" 
          ${item.purchased ? 'checked' : ''} 
          aria-label="Mark ${item.name} as purchased"
        >
        <div class="d-flex flex-column text-truncate">
          <span class="item-text fw-semibold fs-6 text-truncate">${item.name}</span>
          ${item.recipe ? `<span class="small text-muted text-truncate"><i class="bi bi-journal-bookmark me-1"></i> For ${item.recipe}</span>` : ''}
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-secondary bg-opacity-10 text-secondary" style="font-size: 0.72rem;">${item.category || 'General'}</span>
        <button type="button" class="btn btn-link text-danger p-0 delete-shopping-item-btn" title="Delete item">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `;

    // Checkbox toggle
    const checkbox = itemEl.querySelector(".shopping-item-checkbox");
    checkbox.addEventListener("change", () => {
      item.purchased = checkbox.checked;
      saveShoppingList();
      renderShoppingList();
    });

    // Delete item
    const deleteBtn = itemEl.querySelector(".delete-shopping-item-btn");
    deleteBtn.addEventListener("click", () => {
      shoppingItems = shoppingItems.filter(i => i.id !== item.id);
      saveShoppingList();
      renderShoppingList();
      showToast(`Removed "${item.name}" from shopping list.`, "info");
    });

    container.appendChild(itemEl);
  });
}

// ==========================================
// Shopping List Controls
// ==========================================
function setupShoppingListControls() {
  const addForm = document.getElementById("addCustomItemForm");
  const clearPurchasedBtn = document.getElementById("clearPurchasedBtn");
  const clearAllBtn = document.getElementById("clearAllShoppingBtn");
  const copyBtn = document.getElementById("copyShoppingListBtn");
  const printBtn = document.getElementById("printShoppingListBtn");
  const confirmModalEl = document.getElementById("confirmClearShoppingModal");

  // Add custom item
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("customItemName");
      const categorySelect = document.getElementById("customItemCategory");

      if (!nameInput || !nameInput.value.trim()) return;

      const newItem = {
        id: 'item_' + Date.now(),
        name: nameInput.value.trim(),
        category: categorySelect ? categorySelect.value : "Pantry",
        recipe: "Custom Addition",
        purchased: false
      };

      shoppingItems.unshift(newItem);
      saveShoppingList();
      renderShoppingList();
      nameInput.value = "";
      showToast(`Added "${newItem.name}" to shopping list!`, "success");
    });
  }

  // Clear purchased items
  if (clearPurchasedBtn) {
    clearPurchasedBtn.addEventListener("click", () => {
      const initialCount = shoppingItems.length;
      shoppingItems = shoppingItems.filter(i => !i.purchased);
      if (shoppingItems.length < initialCount) {
        saveShoppingList();
        renderShoppingList();
        showToast("Cleared purchased items from your list.", "success");
      } else {
        showToast("No purchased items to clear.", "info");
      }
    });
  }

  // Clear all items with modal
  if (clearAllBtn && confirmModalEl) {
    const modal = new bootstrap.Modal(confirmModalEl);
    clearAllBtn.addEventListener("click", () => {
      if (shoppingItems.length === 0) {
        showToast("Your shopping list is already empty.", "info");
        return;
      }
      modal.show();
    });

    const confirmActionBtn = document.getElementById("confirmClearShoppingAction");
    if (confirmActionBtn) {
      confirmActionBtn.addEventListener("click", () => {
        shoppingItems = [];
        saveShoppingList();
        renderShoppingList();
        modal.hide();
        showToast("Shopping list has been cleared.", "success");
      });
    }
  }

  // Copy shopping list
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (shoppingItems.length === 0) {
        showToast("Shopping list is empty.", "info");
        return;
      }

      let text = "🛒 ZAIQA SMART SHOPPING LIST\n===========================\n";
      shoppingItems.forEach(item => {
        text += `[${item.purchased ? 'X' : ' '}] ${item.name} (${item.category || 'General'})\n`;
      });
      text += "\nGenerated by Zaiqa — Pakistani Recipe Finder";

      navigator.clipboard.writeText(text)
        .then(() => showToast("Shopping list copied to clipboard!", "success"))
        .catch(() => showToast("Could not copy shopping list.", "danger"));
    });
  }

  // Print shopping list
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}
