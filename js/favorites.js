/**
 * Zaiqa — Pakistani Recipe Finder
 * favorites.js - Favorites Management Page with Search, Category Filter, Remove & Clear All
 */

document.addEventListener("DOMContentLoaded", () => {
  initFavoritesPage();
});

function initFavoritesPage() {
  renderFavoritesList();
  setupFavoritesControls();
}

function renderFavoritesList() {
  const container = document.getElementById("favoritesGrid");
  const emptyState = document.getElementById("noFavoritesState");
  const countHeader = document.getElementById("favoritesCountHeader");
  const searchInput = document.getElementById("favoriteSearchInput");
  const categoryFilter = document.getElementById("favoriteCategoryFilter");

  if (!container) return;

  const savedIds = getStoredFavorites();
  const allRecipes = window.RECIPES || [];

  let favoriteRecipes = allRecipes.filter(r => savedIds.includes(r.id));

  // Filter by search query if any
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  if (query) {
    favoriteRecipes = favoriteRecipes.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.urduName.includes(query) ||
      r.category.toLowerCase().includes(query)
    );
  }

  // Filter by category if selected
  const category = categoryFilter ? categoryFilter.value : "";
  if (category) {
    favoriteRecipes = favoriteRecipes.filter(r => r.category === category);
  }

  // Update header count
  if (countHeader) {
    countHeader.textContent = `You have ${savedIds.length} saved ${savedIds.length === 1 ? 'favorite' : 'favorites'}`;
  }

  container.innerHTML = "";

  if (savedIds.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (favoriteRecipes.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-muted"></i>
        <h5 class="mt-3">No matching favorites found</h5>
        <p class="text-muted small">Try searching for a different dish name or reset category filter.</p>
      </div>
    `;
    if (emptyState) emptyState.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  favoriteRecipes.forEach(recipe => {
    const cardEl = createFavoriteCardElement(recipe);
    container.appendChild(cardEl);
  });
}

function createFavoriteCardElement(recipe) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4 d-flex align-items-stretch";

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
          class="recipe-favorite-btn active" 
          data-id="${recipe.id}" 
          title="Remove from favorites"
          aria-label="Remove ${recipe.name} from favorites"
        >
          <i class="bi bi-trash3 text-danger"></i>
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
          <div class="recipe-meta-item"><i class="bi bi-bar-chart"></i> ${recipe.difficulty}</div>
          <div class="recipe-meta-item"><i class="bi bi-fire"></i> ${recipe.spiceLevel}</div>
          <div class="recipe-meta-item"><i class="bi bi-lightning-charge"></i> ${recipe.calories} kcal</div>
        </div>

        <div class="recipe-card-footer">
          <div class="recipe-rating">
            <i class="bi bi-star-fill text-warning"></i>
            <span>${recipe.rating.toFixed(1)}</span>
          </div>
          <a href="recipe.html?id=${recipe.id}" class="btn btn-sm btn-primary-zaiqa px-3">
            Cook Now <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  // Remove button action
  const removeBtn = col.querySelector(".recipe-favorite-btn");
  removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(recipe.id, recipe.name);
  });

  return col;
}

function removeFavorite(id, name) {
  let favorites = getStoredFavorites();
  favorites = favorites.filter(favId => favId !== id);
  localStorage.setItem("zaiqa_favorites", JSON.stringify(favorites));
  window.dispatchEvent(new Event("favoritesUpdated"));
  showToast(`Removed "${name}" from Favorites.`, "info");
  renderFavoritesList();
}

function setupFavoritesControls() {
  const searchInput = document.getElementById("favoriteSearchInput");
  const categoryFilter = document.getElementById("favoriteCategoryFilter");
  const clearAllBtn = document.getElementById("clearAllFavoritesBtn");
  const confirmModalEl = document.getElementById("confirmClearFavoritesModal");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderFavoritesList();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      renderFavoritesList();
    });
  }

  if (clearAllBtn && confirmModalEl) {
    const modal = new bootstrap.Modal(confirmModalEl);
    clearAllBtn.addEventListener("click", () => {
      const saved = getStoredFavorites();
      if (saved.length === 0) {
        showToast("You don't have any saved favorites to clear.", "info");
        return;
      }
      modal.show();
    });

    const confirmBtn = document.getElementById("confirmClearFavoritesAction");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        localStorage.removeItem("zaiqa_favorites");
        window.dispatchEvent(new Event("favoritesUpdated"));
        modal.hide();
        renderFavoritesList();
        showToast("All saved favorites have been cleared.", "success");
      });
    }
  }
}
