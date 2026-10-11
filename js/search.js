/**
 * Zaiqa — Pakistani Recipe Finder
 * search.js - Search, Multi-Faceted Filters, Sorting, Pagination, and Surprise Me Generator
 */

let allRecipes = [];
let filteredRecipes = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.RECIPES !== "undefined") {
    allRecipes = window.RECIPES;
    initRecipeExplorer();
  } else {
    console.error("RECIPES database not loaded");
  }
});

function initRecipeExplorer() {
  parseUrlParams();
  setupFilterEventListeners();
  setupSurpriseMeModal();
  applyFiltersAndSort();
}

// ==========================================
// URL Query Parameter Handling
// ==========================================
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  const categoryParam = urlParams.get("category");

  if (searchParam) {
    const searchInput = document.getElementById("recipeSearchInput");
    if (searchInput) searchInput.value = searchParam;
  }

  if (categoryParam) {
    const categorySelect = document.getElementById("filterCategory");
    if (categorySelect) categorySelect.value = categoryParam;
    
    // Also highlight matching pill if on page
    const pills = document.querySelectorAll(".category-pill");
    pills.forEach(pill => {
      if (pill.getAttribute("data-category") === categoryParam) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });
  }
}

// ==========================================
// Event Listeners
// ==========================================
function setupFilterEventListeners() {
  const searchInput = document.getElementById("recipeSearchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const filterCategory = document.getElementById("filterCategory");
  const filterTime = document.getElementById("filterTime");
  const filterDifficulty = document.getElementById("filterDifficulty");
  const filterSpice = document.getElementById("filterSpice");
  const filterDiet = document.getElementById("filterDiet");
  const filterIngredient = document.getElementById("filterIngredient");
  const sortSelect = document.getElementById("sortRecipes");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  // Debounced search while typing
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentPage = 1;
        applyFiltersAndSort();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchInput.value ? "inline-block" : "none";
        }
      }, 250);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentPage = 1;
        applyFiltersAndSort();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        clearSearchBtn.style.display = "none";
        currentPage = 1;
        applyFiltersAndSort();
      }
    });
  }

  // Filter change handlers
  [filterCategory, filterTime, filterDifficulty, filterSpice, filterDiet, filterIngredient, sortSelect].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndSort();
      });
    }
  });

  // Category Pills
  const categoryPills = document.querySelectorAll(".category-pill");
  categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
      categoryPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const cat = pill.getAttribute("data-category");
      if (filterCategory) {
        filterCategory.value = cat === "all" ? "" : cat;
      }
      currentPage = 1;
      applyFiltersAndSort();
    });
  });

  // Reset Filters
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (clearSearchBtn) clearSearchBtn.style.display = "none";
      if (filterCategory) filterCategory.value = "";
      if (filterTime) filterTime.value = "";
      if (filterDifficulty) filterDifficulty.value = "";
      if (filterSpice) filterSpice.value = "";
      if (filterDiet) filterDiet.value = "";
      if (filterIngredient) filterIngredient.value = "";
      if (sortSelect) sortSelect.value = "featured";

      categoryPills.forEach(p => {
        if (p.getAttribute("data-category") === "all") p.classList.add("active");
        else p.classList.remove("active");
      });

      currentPage = 1;
      applyFiltersAndSort();
      showToast("All filters have been reset.", "info");
    });
  }

  // Load More button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPage++;
      renderRecipesGrid(true);
    });
  }
}

// ==========================================
// Filter and Sort Engine
// ==========================================
function applyFiltersAndSort() {
  const searchInput = document.getElementById("recipeSearchInput");
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filterCategory = document.getElementById("filterCategory")?.value || "";
  const filterTime = document.getElementById("filterTime")?.value || "";
  const filterDifficulty = document.getElementById("filterDifficulty")?.value || "";
  const filterSpice = document.getElementById("filterSpice")?.value || "";
  const filterDiet = document.getElementById("filterDiet")?.value || "";
  const filterIngredient = document.getElementById("filterIngredient")?.value || "";
  const sortOption = document.getElementById("sortRecipes")?.value || "featured";

  filteredRecipes = allRecipes.filter(recipe => {
    // 1. Text Search across name, urdu name, region, category, description, and ingredients
    if (searchQuery) {
      const matchName = recipe.name.toLowerCase().includes(searchQuery);
      const matchUrdu = recipe.urduName.includes(searchQuery);
      const matchRegion = recipe.region.toLowerCase().includes(searchQuery);
      const matchCategory = recipe.category.toLowerCase().includes(searchQuery);
      const matchDesc = recipe.description.toLowerCase().includes(searchQuery);
      const matchIngredient = recipe.ingredients.some(ing => ing.item.toLowerCase().includes(searchQuery));

      if (!matchName && !matchUrdu && !matchRegion && !matchCategory && !matchDesc && !matchIngredient) {
        return false;
      }
    }

    // 2. Category
    if (filterCategory && recipe.category !== filterCategory) {
      return false;
    }

    // 3. Cooking Time
    if (filterTime) {
      if (filterTime === "quick" && recipe.totalTime > 30) return false;
      if (filterTime === "medium" && (recipe.totalTime <= 30 || recipe.totalTime > 60)) return false;
      if (filterTime === "slow" && recipe.totalTime <= 60) return false;
    }

    // 4. Difficulty
    if (filterDifficulty && recipe.difficulty !== filterDifficulty) {
      return false;
    }

    // 5. Spice Level
    if (filterSpice && recipe.spiceLevel !== filterSpice) {
      return false;
    }

    // 6. Vegetarian Status
    if (filterDiet) {
      if (filterDiet === "veg" && !recipe.isVegetarian) return false;
      if (filterDiet === "non-veg" && recipe.isVegetarian) return false;
    }

    // 7. Main Ingredient
    if (filterIngredient && recipe.mainIngredient.toLowerCase() !== filterIngredient.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Sorting
  if (sortOption === "title-asc") {
    filteredRecipes.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "title-desc") {
    filteredRecipes.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortOption === "time-asc") {
    filteredRecipes.sort((a, b) => a.totalTime - b.totalTime);
  } else if (sortOption === "rating-desc") {
    filteredRecipes.sort((a, b) => b.rating - a.rating);
  }

  // Update counts
  const resultsCountEl = document.getElementById("resultsCount");
  if (resultsCountEl) {
    resultsCountEl.textContent = `${filteredRecipes.length} ${filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found`;
  }

  renderRecipesGrid(false);
}

// ==========================================
// Grid Rendering
// ==========================================
function renderRecipesGrid(append = false) {
  const container = document.getElementById("recipesGrid");
  const emptyState = document.getElementById("noRecipesFound");
  const loadMoreContainer = document.getElementById("loadMoreContainer");

  if (!container) return;

  if (!append) {
    container.innerHTML = "";
  }

  if (filteredRecipes.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  const startIndex = append ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredRecipes.length);
  const pageItems = filteredRecipes.slice(startIndex, endIndex);

  const favorites = getStoredFavorites();

  pageItems.forEach(recipe => {
    const isFav = favorites.includes(recipe.id);
    const cardEl = createRecipeCardElement(recipe, isFav);
    container.appendChild(cardEl);
  });

  // Load more visibility
  if (loadMoreContainer) {
    if (endIndex < filteredRecipes.length) {
      loadMoreContainer.style.display = "block";
      const remainingCount = filteredRecipes.length - endIndex;
      const countLabel = document.getElementById("loadMoreCount");
      if (countLabel) countLabel.textContent = `(${remainingCount} more)`;
    } else {
      loadMoreContainer.style.display = "none";
    }
  }
}

// ==========================================
// Recipe Card Component Generator
// ==========================================
function createRecipeCardElement(recipe, isFavorite) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4 d-flex align-items-stretch";

  // Determine spice icon
  let spiceBadge = "";
  if (recipe.spiceLevel === "Mild") {
    spiceBadge = `<span class="spice-level-mild" title="Mild"><i class="bi bi-fire"></i> Mild</span>`;
  } else if (recipe.spiceLevel === "Medium") {
    spiceBadge = `<span class="spice-level-medium" title="Medium"><i class="bi bi-fire"></i><i class="bi bi-fire"></i> Med</span>`;
  } else if (recipe.spiceLevel === "Hot") {
    spiceBadge = `<span class="spice-level-hot" title="Hot"><i class="bi bi-fire"></i><i class="bi bi-fire"></i><i class="bi bi-fire"></i> Hot</span>`;
  } else {
    spiceBadge = `<span class="spice-level-extra" title="Extra Hot"><i class="bi bi-fire"></i> Extra Hot</span>`;
  }

  col.innerHTML = `
    <div class="recipe-card w-100">
      <div class="recipe-card-img-wrapper">
        <img 
          src="${recipe.image}" 
          alt="${recipe.name}" 
          class="recipe-card-img" 
          loading="lazy" 
          onerror="this.onerror=null;this.src='images/placeholder.svg';"
        >
        <span class="recipe-badge-category">${recipe.category}</span>
        <button 
          type="button" 
          class="recipe-favorite-btn ${isFavorite ? 'active' : ''}" 
          data-id="${recipe.id}" 
          aria-label="Add ${recipe.name} to favorites"
          title="Toggle Favorite"
        >
          <i class="bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
        </button>
        <span class="recipe-badge-time">
          <i class="bi bi-clock"></i> ${recipe.totalTime}m
        </span>
      </div>
      <div class="recipe-card-body">
        <div class="d-flex justify-content-between align-items-center">
          <span class="recipe-card-region">${recipe.region}</span>
          <span class="badge ${recipe.isVegetarian ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${recipe.isVegetarian ? 'success' : 'danger'} border border-${recipe.isVegetarian ? 'success' : 'danger'} border-opacity-25" style="font-size: 0.7rem;">
            ${recipe.isVegetarian ? 'Veg' : 'Non-Veg'}
          </span>
        </div>
        <h3 class="recipe-card-title">${recipe.name}</h3>
        <div class="recipe-card-urdu">${recipe.urduName}</div>
        <p class="recipe-card-desc">${recipe.description}</p>
        
        <div class="recipe-card-meta">
          <div class="recipe-meta-item" title="Difficulty">
            <i class="bi bi-bar-chart"></i> ${recipe.difficulty}
          </div>
          <div class="recipe-meta-item">
            ${spiceBadge}
          </div>
          <div class="recipe-meta-item" title="Estimated calories per serving">
            <i class="bi bi-lightning-charge"></i> ${recipe.calories} kcal
          </div>
        </div>

        <div class="recipe-card-footer">
          <div class="recipe-rating">
            <i class="bi bi-star-fill"></i>
            <span>${recipe.rating.toFixed(1)}</span>
            <span class="text-muted small">(${recipe.reviewCount})</span>
          </div>
          <a href="recipe.html?id=${recipe.id}" class="btn btn-sm btn-primary-zaiqa px-3">
            View Recipe <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  // Attach Favorite click event with isolation
  const favBtn = col.querySelector(".recipe-favorite-btn");
  favBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteRecipe(recipe.id, favBtn);
  });

  return col;
}

// ==========================================
// Favorite Toggle Helper
// ==========================================
function toggleFavoriteRecipe(id, buttonEl) {
  let favorites = getStoredFavorites();
  const index = favorites.indexOf(id);
  const icon = buttonEl.querySelector("i");
  const recipe = allRecipes.find(r => r.id === id);
  const recipeName = recipe ? recipe.name : "Recipe";

  if (index === -1) {
    favorites.push(id);
    buttonEl.classList.add("active", "pulse-heart");
    icon.className = "bi bi-heart-fill";
    showToast(`Added "${recipeName}" to your Favorites!`, "success");
  } else {
    favorites.splice(index, 1);
    buttonEl.classList.remove("active", "pulse-heart");
    icon.className = "bi bi-heart";
    showToast(`Removed "${recipeName}" from your Favorites.`, "info");
  }

  localStorage.setItem("zaiqa_favorites", JSON.stringify(favorites));
  window.dispatchEvent(new Event("favoritesUpdated"));

  setTimeout(() => {
    buttonEl.classList.remove("pulse-heart");
  }, 450);
}

// ==========================================
// Surprise Me Generator Modal Functionality
// ==========================================
function setupSurpriseMeModal() {
  const surpriseForm = document.getElementById("surpriseMeFilterForm");
  if (!surpriseForm) return;

  surpriseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const timePref = document.getElementById("surpriseTime")?.value;
    const catPref = document.getElementById("surpriseCategory")?.value;
    const dietPref = document.getElementById("surpriseDiet")?.value;
    const spicePref = document.getElementById("surpriseSpice")?.value;

    let pool = allRecipes.filter(r => {
      if (timePref === "quick" && r.totalTime > 30) return false;
      if (timePref === "medium" && r.totalTime > 60) return false;
      if (catPref && r.category !== catPref) return false;
      if (dietPref === "veg" && !r.isVegetarian) return false;
      if (dietPref === "non-veg" && r.isVegetarian) return false;
      if (spicePref && r.spiceLevel !== spicePref) return false;
      return true;
    });

    const resultBox = document.getElementById("surpriseResultBox");
    if (pool.length === 0) {
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="alert alert-warning d-flex align-items-center gap-2">
            <i class="bi bi-info-circle-fill fs-5"></i>
            <div>No recipe matches all of these strict filters. Try loosening your preferences!</div>
          </div>
        `;
      }
    } else {
      const luckyRecipe = pool[Math.floor(Math.random() * pool.length)];
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="card border-0 shadow-sm overflow-hidden mb-3">
            <div class="row g-0 align-items-center">
              <div class="col-4">
                <img src="${luckyRecipe.image}" class="img-fluid rounded-start h-100" style="object-fit:cover; min-height:120px;" alt="${luckyRecipe.name}" onerror="this.src='images/placeholder.svg';">
              </div>
              <div class="col-8">
                <div class="card-body p-3">
                  <span class="badge bg-success bg-opacity-10 text-success mb-1">${luckyRecipe.category}</span>
                  <h5 class="card-title mb-1 font-serif">${luckyRecipe.name}</h5>
                  <p class="card-text small text-muted mb-2"><i class="bi bi-clock"></i> ${luckyRecipe.totalTime} mins • ${luckyRecipe.difficulty}</p>
                  <a href="recipe.html?id=${luckyRecipe.id}" class="btn btn-sm btn-primary-zaiqa w-100">
                    Open This Recipe Now <i class="bi bi-arrow-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
  });
}
