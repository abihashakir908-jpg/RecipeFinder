/**
 * Zaiqa — Pakistani Recipe Finder
 * meal-planner.js - Interactive Weekly Pakistani Meal Planner & Shopping List Generator
 */

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];

let currentPlan = {};
let activeSlotTarget = null; // { day: "Monday", meal: "Dinner" }

document.addEventListener("DOMContentLoaded", () => {
  initMealPlanner();
});

function initMealPlanner() {
  loadMealPlan();
  renderMealPlannerGrid();
  setupRecipePickerModal();
  setupPlannerActions();
}

function loadMealPlan() {
  try {
    const raw = localStorage.getItem("zaiqa_meal_plan");
    if (raw) {
      currentPlan = JSON.parse(raw);
    } else {
      // Default initial starter plan for inspiration
      currentPlan = {
        "Monday": {
          "Breakfast": "anda-paratha",
          "Lunch": "daal-chawal",
          "Dinner": "chicken-karahi"
        },
        "Friday": {
          "Lunch": "chicken-biryani",
          "Dinner": "beef-nihari"
        },
        "Sunday": {
          "Breakfast": "halwa-puri",
          "Lunch": "kabuli-pulao",
          "Dinner": "chicken-tikka"
        }
      };
      saveMealPlan();
    }
  } catch (e) {
    console.error("Error loading meal plan:", e);
    currentPlan = {};
  }
}

function saveMealPlan() {
  localStorage.setItem("zaiqa_meal_plan", JSON.stringify(currentPlan));
}

// ==========================================
// Render Meal Planner Grid
// ==========================================
function renderMealPlannerGrid() {
  const container = document.getElementById("mealPlanGrid");
  if (!container) return;

  const allRecipes = window.RECIPES || [];
  let totalPlannedRecipes = 0;

  container.innerHTML = DAYS_OF_WEEK.map(day => {
    const dayData = currentPlan[day] || {};

    const mealSlotsHtml = MEAL_TYPES.map(meal => {
      const recipeId = dayData[meal];
      const recipe = recipeId ? allRecipes.find(r => r.id === recipeId) : null;
      if (recipe) totalPlannedRecipes++;

      return `
        <div class="meal-slot-box">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="meal-slot-label">${meal}</span>
            ${recipe ? `
              <button 
                type="button" 
                class="btn btn-link btn-sm text-danger p-0 remove-meal-btn" 
                data-day="${day}" 
                data-meal="${meal}" 
                title="Remove ${recipe.name}"
              >
                <i class="bi bi-x-circle"></i>
              </button>
            ` : ''}
          </div>
          ${recipe ? `
            <div class="meal-planned-item">
              <a href="recipe.html?id=${recipe.id}" class="text-truncate text-dark text-decoration-none flex-grow-1" title="${recipe.name}">
                <i class="bi bi-check-circle-fill text-success me-1"></i> ${recipe.name}
              </a>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-secondary p-0 px-1 ms-1 change-meal-btn" 
                data-day="${day}" 
                data-meal="${meal}" 
                title="Change recipe"
              >
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>
          ` : `
            <button 
              type="button" 
              class="btn btn-sm btn-outline-zaiqa w-100 py-1 add-meal-btn" 
              data-day="${day}" 
              data-meal="${meal}"
            >
              <i class="bi bi-plus"></i> Add ${meal}
            </button>
          `}
        </div>
      `;
    }).join("");

    return `
      <div class="col-12 col-md-6 col-xl-3 d-flex flex-column">
        <div class="meal-day-column flex-grow-1">
          <div class="meal-day-header">
            <span><i class="bi bi-calendar3 me-1"></i> ${day}</span>
            <span class="badge bg-secondary bg-opacity-25 text-secondary" style="font-size:0.7rem;">
              ${Object.keys(dayData).length} meals
            </span>
          </div>
          ${mealSlotsHtml}
        </div>
      </div>
    `;
  }).join("");

  // Update summary counts
  const summaryEl = document.getElementById("plannerSummaryBadge");
  if (summaryEl) {
    summaryEl.textContent = `${totalPlannedRecipes} meals scheduled`;
  }

  // Attach button events
  attachPlannerGridEvents();
}

function attachPlannerGridEvents() {
  const addButtons = document.querySelectorAll(".add-meal-btn, .change-meal-btn");
  const removeButtons = document.querySelectorAll(".remove-meal-btn");
  const pickerModalEl = document.getElementById("recipePickerModal");
  const pickerModal = pickerModalEl ? new bootstrap.Modal(pickerModalEl) : null;

  addButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeSlotTarget = {
        day: btn.getAttribute("data-day"),
        meal: btn.getAttribute("data-meal")
      };
      const titleEl = document.getElementById("pickerModalTargetTitle");
      if (titleEl) {
        titleEl.textContent = `Select Recipe for ${activeSlotTarget.day} (${activeSlotTarget.meal})`;
      }
      if (pickerModal) pickerModal.show();
    });
  });

  removeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const day = btn.getAttribute("data-day");
      const meal = btn.getAttribute("data-meal");
      if (currentPlan[day] && currentPlan[day][meal]) {
        delete currentPlan[day][meal];
        if (Object.keys(currentPlan[day]).length === 0) {
          delete currentPlan[day];
        }
        saveMealPlan();
        renderMealPlannerGrid();
        showToast(`Removed meal from ${day} ${meal}.`, "info");
      }
    });
  });
}

// ==========================================
// Recipe Picker Modal
// ==========================================
function setupRecipePickerModal() {
  const container = document.getElementById("pickerRecipeGrid");
  const searchInput = document.getElementById("pickerSearchInput");
  const categoryFilter = document.getElementById("pickerCategoryFilter");
  const modalEl = document.getElementById("recipePickerModal");

  if (!container) return;

  function renderPickerOptions() {
    const allRecipes = window.RECIPES || [];
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const category = categoryFilter ? categoryFilter.value : "";

    let list = allRecipes.filter(r => {
      if (query && !r.name.toLowerCase().includes(query) && !r.urduName.includes(query)) return false;
      if (category && r.category !== category) return false;
      return true;
    });

    container.innerHTML = list.map(r => `
      <div class="col-12 col-md-6 mb-2">
        <div class="card h-100 border p-2 d-flex flex-row align-items-center gap-2 cursor-pointer picker-item-card" data-id="${r.id}">
          <img src="${r.image}" class="rounded" style="width: 50px; height: 50px; object-fit: cover;" alt="${r.name}" onerror="this.src='images/placeholder.svg';">
          <div class="flex-grow-1 overflow-hidden">
            <h6 class="mb-0 text-truncate font-serif" style="font-size: 0.9rem;">${r.name}</h6>
            <div class="small text-muted">${r.category} • ${r.totalTime}m</div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-success select-this-recipe-btn" data-id="${r.id}">
            Select
          </button>
        </div>
      </div>
    `).join("");

    // Attach select events
    container.querySelectorAll(".select-this-recipe-btn, .picker-item-card").forEach(el => {
      el.addEventListener("click", (e) => {
        const recipeId = el.getAttribute("data-id");
        if (recipeId && activeSlotTarget) {
          if (!currentPlan[activeSlotTarget.day]) {
            currentPlan[activeSlotTarget.day] = {};
          }
          currentPlan[activeSlotTarget.day][activeSlotTarget.meal] = recipeId;
          saveMealPlan();
          renderMealPlannerGrid();
          
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();

          const r = allRecipes.find(x => x.id === recipeId);
          showToast(`Added ${r ? r.name : 'recipe'} to ${activeSlotTarget.day} ${activeSlotTarget.meal}!`, "success");
        }
      });
    });
  }

  renderPickerOptions();

  if (searchInput) {
    searchInput.addEventListener("input", renderPickerOptions);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener("change", renderPickerOptions);
  }
}

// ==========================================
// Planner Actions (Export, Print, Clear)
// ==========================================
function setupPlannerActions() {
  const exportBtn = document.getElementById("exportToShoppingListBtn");
  const printBtn = document.getElementById("printWeeklyPlanBtn");
  const clearBtn = document.getElementById("clearMealPlanBtn");
  const confirmClearModalEl = document.getElementById("confirmClearPlannerModal");

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportPlanToShoppingList();
    });
  }

  if (clearBtn && confirmClearModalEl) {
    const modal = new bootstrap.Modal(confirmClearModalEl);
    clearBtn.addEventListener("click", () => {
      modal.show();
    });

    const confirmActionBtn = document.getElementById("confirmClearPlannerAction");
    if (confirmActionBtn) {
      confirmActionBtn.addEventListener("click", () => {
        currentPlan = {};
        saveMealPlan();
        renderMealPlannerGrid();
        modal.hide();
        showToast("Weekly meal plan cleared.", "success");
      });
    }
  }
}

function exportPlanToShoppingList() {
  const allRecipes = window.RECIPES || [];
  let plannedRecipeIds = [];

  Object.values(currentPlan).forEach(dayObj => {
    Object.values(dayObj).forEach(id => {
      if (id && !plannedRecipeIds.includes(id)) {
        plannedRecipeIds.push(id);
      }
    });
  });

  if (plannedRecipeIds.length === 0) {
    showToast("No recipes currently in meal plan to generate shopping list from.", "info");
    return;
  }

  let shoppingList = [];
  try {
    shoppingList = JSON.parse(localStorage.getItem("zaiqa_shopping_list") || "[]");
  } catch (e) { shoppingList = []; }

  let countAdded = 0;
  plannedRecipeIds.forEach(id => {
    const recipe = allRecipes.find(r => r.id === id);
    if (recipe && recipe.ingredients) {
      recipe.ingredients.forEach(ing => {
        const itemName = `${ing.amount} ${ing.unit} ${ing.item}`;
        if (!shoppingList.some(item => item.name === itemName)) {
          shoppingList.push({
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: itemName,
            category: recipe.category,
            recipe: recipe.name,
            purchased: false
          });
          countAdded++;
        }
      });
    }
  });

  localStorage.setItem("zaiqa_shopping_list", JSON.stringify(shoppingList));
  showToast(`Successfully added ${countAdded} ingredients to your Smart Shopping List!`, "success");

  // Offer quick redirect
  setTimeout(() => {
    if (confirm("Ingredients added! Would you like to view your Shopping List now?")) {
      window.location.href = "shopping-list.html";
    }
  }, 350);
}
