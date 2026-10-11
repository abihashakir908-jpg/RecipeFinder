/**
 * Zaiqa — Pakistani Recipe Finder
 * recipe-details.js - Dedicated Recipe Page Logic, Scaler, Cooking Mode, Timer, Share & Reviews
 */

let currentRecipe = null;
let currentScale = 1;
let currentStepIndex = 0;
let timerInterval = null;
let timerRemainingSeconds = 0;
let timerTotalSeconds = 0;
let isTimerRunning = false;

document.addEventListener("DOMContentLoaded", () => {
  initRecipePage();
});

function initRecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get("id");

  if (!window.RECIPES || !window.RECIPES.length) {
    console.error("RECIPES database not available");
    return;
  }

  currentRecipe = window.RECIPES.find(r => r.id === recipeId);

  // Fallback if not found or missing param
  if (!currentRecipe) {
    currentRecipe = window.RECIPES[0];
  }

  renderRecipeDetails(currentRecipe);
  setupScalingControls();
  setupIngredientsChecklist();
  setupCookingMode();
  setupKitchenTimer();
  setupUtilityActions();
  setupReviewsSection();
}

// ==========================================
// Render Recipe Page Information
// ==========================================
function renderRecipeDetails(recipe) {
  document.title = `${recipe.name} (${recipe.urduName}) — Zaiqa Pakistani Recipe Finder`;

  // Update Breadcrumb & Header
  setElementText("breadcrumbRecipeName", recipe.name);
  setElementText("recipeHeroTitle", recipe.name);
  setElementText("recipeHeroUrdu", recipe.urduName);
  setElementText("recipeHeroCategory", recipe.category);
  setElementText("recipeHeroRegion", recipe.region);
  setElementText("recipeHeroDescription", recipe.description);
  
  // Image
  const imgEl = document.getElementById("recipeHeroImage");
  if (imgEl) {
    imgEl.src = recipe.image;
    imgEl.alt = recipe.name;
    imgEl.onerror = () => { imgEl.src = "images/placeholder.svg"; };
  }

  // Quick stats
  setElementText("statPrepTime", `${recipe.prepTime} mins`);
  setElementText("statCookTime", `${recipe.cookTime} mins`);
  setElementText("statTotalTime", `${recipe.totalTime} mins`);
  setElementText("statServings", `${recipe.servings} persons`);
  setElementText("statDifficulty", recipe.difficulty);
  setElementText("statCalories", `~${recipe.calories} kcal`);
  setElementText("statSpice", recipe.spiceLevel);
  setElementText("statDiet", recipe.isVegetarian ? "100% Vegetarian" : "Halal Non-Veg");

  // Heat Level
  setElementText("heatLevelNote", recipe.heatLevel || "Medium flame simmer");

  // Render Ingredients
  renderIngredientsList(currentScale);

  // Render Instructions
  renderInstructionsList();

  // Chef Tips
  renderListItems("chefTipsList", recipe.chefTips);

  // Substitutions
  renderListItems("substitutionsList", recipe.substitutions);

  // Serving Suggestions
  setElementText("servingSuggestionsText", recipe.servingSuggestions);

  // Storage & Reheating
  setElementText("storageReheatingText", recipe.storageReheating);

  // Mistakes to avoid
  renderListItems("mistakesList", recipe.mistakesToAvoid);

  // Allergens
  const allergenList = recipe.allergens && recipe.allergens.length ? recipe.allergens.join(", ") : "None";
  setElementText("allergensText", allergenList);

  // Favorite button state
  updateFavoriteButtonState(recipe.id);
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderListItems(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container || !items) return;
  container.innerHTML = items.map(item => `
    <li class="mb-2 d-flex align-items-start gap-2">
      <i class="bi bi-check2-circle text-success mt-1 flex-shrink-0"></i>
      <span>${item}</span>
    </li>
  `).join("");
}

// ==========================================
// Ingredients List with Scaling
// ==========================================
function renderIngredientsList(scale) {
  const container = document.getElementById("ingredientsList");
  if (!container || !currentRecipe) return;

  const baseServings = currentRecipe.servings;
  const scaledServings = Math.round(baseServings * scale);
  const servingsLabel = document.getElementById("scaledServingsLabel");
  if (servingsLabel) servingsLabel.textContent = `${scaledServings} Servings`;

  container.innerHTML = currentRecipe.ingredients.map((ing, idx) => {
    let scaledAmount = ing.amount * scale;
    // Format nicely: e.g. 1.5, 0.75 or integers
    scaledAmount = Math.round(scaledAmount * 100) / 100;

    return `
      <div class="ingredient-item" data-index="${idx}">
        <input type="checkbox" class="custom-checkbox ingredient-checkbox" id="ing-${idx}">
        <label for="ing-${idx}" class="d-flex justify-content-between align-items-center w-100 cursor-pointer mb-0">
          <span class="ingredient-name">
            <strong>${scaledAmount} ${ing.unit}</strong> ${ing.item}
          </span>
          ${ing.notes ? `<span class="small text-muted fst-italic">(${ing.notes})</span>` : ''}
        </label>
      </div>
    `;
  }).join("");

  // Re-attach checkbox strike-through
  const checkboxes = container.querySelectorAll(".ingredient-checkbox");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", (e) => {
      const parent = e.target.closest(".ingredient-item");
      if (parent) {
        if (e.target.checked) parent.classList.add("checked");
        else parent.classList.remove("checked");
      }
    });
  });
}

function setupScalingControls() {
  const scaleButtons = document.querySelectorAll(".scale-btn");
  scaleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      scaleButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentScale = parseFloat(btn.getAttribute("data-scale")) || 1;
      renderIngredientsList(currentScale);
      showToast(`Recipe ingredients scaled to ${currentScale}x servings.`, "info");
    });
  });
}

function setupIngredientsChecklist() {
  const selectAllBtn = document.getElementById("selectAllIngredientsBtn");
  const clearAllBtn = document.getElementById("clearIngredientsBtn");
  const copyBtn = document.getElementById("copyIngredientsBtn");
  const addToListBtn = document.getElementById("addIngredientsToShoppingListBtn");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".ingredient-checkbox");
      checkboxes.forEach(cb => {
        cb.checked = true;
        cb.closest(".ingredient-item")?.classList.add("checked");
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".ingredient-checkbox");
      checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest(".ingredient-item")?.classList.remove("checked");
      });
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (!currentRecipe) return;
      const text = currentRecipe.ingredients.map(ing => {
        const amt = Math.round(ing.amount * currentScale * 100) / 100;
        return `• ${amt} ${ing.unit} ${ing.item} ${ing.notes ? `(${ing.notes})` : ''}`;
      }).join("\n");

      navigator.clipboard.writeText(`Ingredients for ${currentRecipe.name} (${currentScale}x):\n\n${text}`)
        .then(() => showToast("Ingredients copied to clipboard!", "success"))
        .catch(() => showToast("Could not copy to clipboard.", "danger"));
    });
  }

  if (addToListBtn) {
    addToListBtn.addEventListener("click", () => {
      if (!currentRecipe) return;
      // Get stored shopping list
      let shoppingList = [];
      try {
        shoppingList = JSON.parse(localStorage.getItem("zaiqa_shopping_list") || "[]");
      } catch (e) { shoppingList = []; }

      let addedCount = 0;
      currentRecipe.ingredients.forEach(ing => {
        const scaledAmt = Math.round(ing.amount * currentScale * 100) / 100;
        const itemName = `${scaledAmt} ${ing.unit} ${ing.item}`;
        // avoid exact duplicate text
        if (!shoppingList.some(item => item.name === itemName)) {
          shoppingList.push({
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: itemName,
            category: currentRecipe.category,
            recipe: currentRecipe.name,
            purchased: false
          });
          addedCount++;
        }
      });

      localStorage.setItem("zaiqa_shopping_list", JSON.stringify(shoppingList));
      showToast(`Added ${addedCount} ingredients to your Smart Shopping List!`, "success");
    });
  }
}

// ==========================================
// Instructions Rendering
// ==========================================
function renderInstructionsList() {
  const container = document.getElementById("instructionsList");
  if (!container || !currentRecipe) return;

  container.innerHTML = currentRecipe.instructions.map((step, idx) => `
    <div class="instruction-step-card">
      <div class="step-num-badge">${idx + 1}</div>
      <div class="flex-grow-1">
        <h6 class="fw-bold mb-1 font-serif">Step ${idx + 1}</h6>
        <p class="mb-0 text-muted" style="line-height: 1.6;">${step}</p>
      </div>
    </div>
  `).join("");
}

// ==========================================
// Step-by-Step Cooking Mode Modal
// ==========================================
function setupCookingMode() {
  const startBtn = document.getElementById("startCookingModeBtn");
  const modalEl = document.getElementById("cookingModeModal");
  const prevBtn = document.getElementById("cookStepPrevBtn");
  const nextBtn = document.getElementById("cookStepNextBtn");

  if (!startBtn || !modalEl) return;

  const cookingModal = new bootstrap.Modal(modalEl);

  startBtn.addEventListener("click", () => {
    currentStepIndex = 0;
    updateCookingModeView();
    cookingModal.show();
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateCookingModeView();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentStepIndex < currentRecipe.instructions.length - 1) {
        currentStepIndex++;
        updateCookingModeView();
      } else {
        cookingModal.hide();
        showToast("Zabardast! You completed all cooking steps! Bon Appetit!", "success");
      }
    });
  }

  // Keyboard navigation inside cooking mode
  document.addEventListener("keydown", (e) => {
    if (modalEl.classList.contains("show")) {
      if (e.key === "ArrowRight" || e.key === " ") {
        if (nextBtn) nextBtn.click();
      } else if (e.key === "ArrowLeft") {
        if (prevBtn) prevBtn.click();
      }
    }
  });
}

function updateCookingModeView() {
  if (!currentRecipe) return;

  const totalSteps = currentRecipe.instructions.length;
  const currentStep = currentRecipe.instructions[currentStepIndex];

  setElementText("cookStepIndicator", `Step ${currentStepIndex + 1} of ${totalSteps}`);
  setElementText("cookStepContent", currentStep);

  const progressBar = document.getElementById("cookProgressBar");
  if (progressBar) {
    const pct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
    progressBar.style.width = `${pct}%`;
    progressBar.setAttribute("aria-valuenow", pct);
  }

  const prevBtn = document.getElementById("cookStepPrevBtn");
  const nextBtn = document.getElementById("cookStepNextBtn");
  if (prevBtn) prevBtn.disabled = currentStepIndex === 0;
  if (nextBtn) {
    if (currentStepIndex === totalSteps - 1) {
      nextBtn.innerHTML = 'Complete Cooking <i class="bi bi-check-circle"></i>';
      nextBtn.className = "btn btn-success px-4";
    } else {
      nextBtn.innerHTML = 'Next Step <i class="bi bi-arrow-right"></i>';
      nextBtn.className = "btn btn-primary-zaiqa px-4";
    }
  }
}

// ==========================================
// Kitchen Countdown Timer
// ==========================================
function setupKitchenTimer() {
  const startBtn = document.getElementById("timerStartBtn");
  const pauseBtn = document.getElementById("timerPauseBtn");
  const resetBtn = document.getElementById("timerResetBtn");
  const setMinutesInput = document.getElementById("timerCustomMinutes");

  // Set default timer to recipe cookTime
  if (currentRecipe && currentRecipe.cookTime) {
    timerTotalSeconds = currentRecipe.cookTime * 60;
    timerRemainingSeconds = timerTotalSeconds;
    if (setMinutesInput) setMinutesInput.value = currentRecipe.cookTime;
  } else {
    timerTotalSeconds = 20 * 60;
    timerRemainingSeconds = timerTotalSeconds;
  }
  updateTimerDisplay();

  if (setMinutesInput) {
    setMinutesInput.addEventListener("change", () => {
      const mins = parseInt(setMinutesInput.value, 10);
      if (!isNaN(mins) && mins > 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerTotalSeconds = mins * 60;
        timerRemainingSeconds = timerTotalSeconds;
        updateTimerDisplay();
        toggleTimerButtons(false);
      }
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (isTimerRunning) return;
      isTimerRunning = true;
      toggleTimerButtons(true);
      timerInterval = setInterval(() => {
        if (timerRemainingSeconds > 0) {
          timerRemainingSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
          toggleTimerButtons(false);
          playTimerAlertSound();
          showToast("⏰ Cooking Timer Finished! Time to check your delicious dish!", "success");
        }
      }, 1000);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (!isTimerRunning) return;
      clearInterval(timerInterval);
      isTimerRunning = false;
      toggleTimerButtons(false);
      showToast("Timer paused.", "info");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      isTimerRunning = false;
      const mins = parseInt(setMinutesInput?.value, 10) || (currentRecipe?.cookTime || 20);
      timerTotalSeconds = mins * 60;
      timerRemainingSeconds = timerTotalSeconds;
      updateTimerDisplay();
      toggleTimerButtons(false);
      showToast("Timer reset.", "info");
    });
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerRemainingSeconds / 60);
  const seconds = timerRemainingSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  setElementText("timerDisplay", formatted);
}

function toggleTimerButtons(running) {
  const startBtn = document.getElementById("timerStartBtn");
  const pauseBtn = document.getElementById("timerPauseBtn");
  if (startBtn) startBtn.style.display = running ? "none" : "inline-flex";
  if (pauseBtn) pauseBtn.style.display = running ? "inline-flex" : "none";
}

// Web Audio API Beep synthesizer for Timer Alarm
function playTimerAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playBeep(880, now, 0.25);
    playBeep(1046, now + 0.3, 0.35);
    playBeep(1318, now + 0.7, 0.5);
  } catch (e) {
    console.warn("Audio Context alert sound failed:", e);
  }
}

// ==========================================
// Utility Actions (Print, Download, Share, Fav)
// ==========================================
function setupUtilityActions() {
  const printBtn = document.getElementById("printRecipeBtn");
  const downloadBtn = document.getElementById("downloadRecipeBtn");
  const shareBtn = document.getElementById("shareRecipeBtn");
  const favBtn = document.getElementById("favoriteRecipeBtn");

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!currentRecipe) return;
      downloadRecipeAsTextFile(currentRecipe, currentScale);
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (!currentRecipe) return;
      if (navigator.share) {
        navigator.share({
          title: `${currentRecipe.name} — Zaiqa Recipe Finder`,
          text: `Check out this authentic Pakistani recipe for ${currentRecipe.name} (${currentRecipe.urduName})!`,
          url: window.location.href
        }).catch(() => {
          copyShareLinkToClipboard();
        });
      } else {
        copyShareLinkToClipboard();
      }
    });
  }

  if (favBtn) {
    favBtn.addEventListener("click", () => {
      if (!currentRecipe) return;
      toggleFavoriteFromDetailsPage(currentRecipe.id, favBtn);
    });
  }
}

function copyShareLinkToClipboard() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast("Recipe link copied to clipboard!", "success"))
    .catch(() => showToast("Failed to copy link.", "danger"));
}

function downloadRecipeAsTextFile(recipe, scale) {
  const scaledServings = Math.round(recipe.servings * scale);
  let content = `=====================================================\n`;
  content += `ZAIQA — PAKISTANI RECIPE FINDER\n`;
  content += `${recipe.name.toUpperCase()} (${recipe.urduName})\n`;
  content += `Region: ${recipe.region} | Category: ${recipe.category}\n`;
  content += `=====================================================\n\n`;
  content += `Total Time: ${recipe.totalTime} mins (Prep: ${recipe.prepTime}m, Cook: ${recipe.cookTime}m)\n`;
  content += `Servings: ${scaledServings} | Difficulty: ${recipe.difficulty} | Spice Level: ${recipe.spiceLevel}\n`;
  content += `Estimated Calories: ~${recipe.calories} kcal per serving\n\n`;
  content += `--- DESCRIPTION ---\n${recipe.description}\n\n`;
  content += `--- INGREDIENTS (${scale}x scaled) ---\n`;
  recipe.ingredients.forEach(ing => {
    const amt = Math.round(ing.amount * scale * 100) / 100;
    content += `• ${amt} ${ing.unit} ${ing.item} ${ing.notes ? `(${ing.notes})` : ''}\n`;
  });
  content += `\n--- STEP-BY-STEP COOKING INSTRUCTIONS ---\n`;
  recipe.instructions.forEach((step, idx) => {
    content += `${idx + 1}. ${step}\n`;
  });
  content += `\n--- CHEF TIPS & SECRETS ---\n`;
  recipe.chefTips.forEach(tip => {
    content += `* ${tip}\n`;
  });
  content += `\n--- SERVING SUGGESTIONS ---\n${recipe.servingSuggestions}\n\n`;
  content += `--- STORAGE & REHEATING ---\n${recipe.storageReheating}\n\n`;
  content += `Baked with love from Zaiqa Pakistani Recipe Finder: ${window.location.href}\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${recipe.id}-recipe.txt`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  showToast("Recipe downloaded successfully!", "success");
}

function updateFavoriteButtonState(id) {
  const favBtn = document.getElementById("favoriteRecipeBtn");
  if (!favBtn) return;
  const favorites = getStoredFavorites();
  const isFav = favorites.includes(id);

  if (isFav) {
    favBtn.classList.add("active", "btn-danger");
    favBtn.classList.remove("btn-outline-danger");
    favBtn.innerHTML = '<i class="bi bi-heart-fill"></i> Saved in Favorites';
  } else {
    favBtn.classList.remove("active", "btn-danger");
    favBtn.classList.add("btn-outline-danger");
    favBtn.innerHTML = '<i class="bi bi-heart"></i> Add to Favorites';
  }
}

function toggleFavoriteFromDetailsPage(id, buttonEl) {
  let favorites = getStoredFavorites();
  const index = favorites.indexOf(id);
  const recipeName = currentRecipe ? currentRecipe.name : "Recipe";

  if (index === -1) {
    favorites.push(id);
    showToast(`Added "${recipeName}" to your Favorites!`, "success");
  } else {
    favorites.splice(index, 1);
    showToast(`Removed "${recipeName}" from your Favorites.`, "info");
  }

  localStorage.setItem("zaiqa_favorites", JSON.stringify(favorites));
  window.dispatchEvent(new Event("favoritesUpdated"));
  updateFavoriteButtonState(id);
}

// ==========================================
// Ratings and Reviews System
// ==========================================
function setupReviewsSection() {
  const reviewForm = document.getElementById("reviewForm");
  const starInputs = document.querySelectorAll(".star-rating-radio");
  const starsContainer = document.getElementById("starRatingPicker");

  // Render initial community reviews + stored local reviews
  renderReviewsList();

  if (starsContainer) {
    const starIcons = starsContainer.querySelectorAll(".bi-star, .bi-star-fill");
    starIcons.forEach((star, index) => {
      star.addEventListener("click", () => {
        const ratingVal = index + 1;
        starsContainer.setAttribute("data-rating", ratingVal);
        starIcons.forEach((s, i) => {
          if (i < ratingVal) {
            s.className = "bi bi-star-fill text-warning fs-4 cursor-pointer";
          } else {
            s.className = "bi bi-star text-muted fs-4 cursor-pointer";
          }
        });
      });
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const rating = parseInt(starsContainer?.getAttribute("data-rating") || "5", 10);
      const nameInput = document.getElementById("reviewAuthorName");
      const textInput = document.getElementById("reviewComment");

      const author = nameInput?.value.trim() || "Food Lover";
      const comment = textInput?.value.trim();

      if (!comment) {
        showToast("Please enter your review comments.", "danger");
        return;
      }

      const reviewObj = {
        id: 'rev_' + Date.now(),
        author: author,
        rating: rating,
        comment: comment,
        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
        localUser: true
      };

      saveReviewLocally(currentRecipe.id, reviewObj);
      renderReviewsList();
      reviewForm.reset();
      
      // Reset stars
      if (starsContainer) {
        starsContainer.setAttribute("data-rating", "5");
        const starIcons = starsContainer.querySelectorAll("i");
        starIcons.forEach(s => s.className = "bi bi-star-fill text-warning fs-4 cursor-pointer");
      }

      showToast("Thank you! Your review has been saved locally on your device.", "success");
    });
  }
}

function saveReviewLocally(recipeId, review) {
  try {
    const key = `zaiqa_reviews_${recipeId}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(review);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving review:", e);
  }
}

function getStoredReviews(recipeId) {
  try {
    const key = `zaiqa_reviews_${recipeId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}

function renderReviewsList() {
  const container = document.getElementById("reviewsContainer");
  if (!container || !currentRecipe) return;

  const localReviews = getStoredReviews(currentRecipe.id);

  // Default sample authentic reviews for realism
  const sampleReviews = [
    {
      author: "Farhan Malik (Lahore)",
      rating: 5,
      date: "3 days ago",
      comment: `Made this ${currentRecipe.name} for our Sunday family dinner. The spice balance and detailed cooking tips made it turn out just like my Daadi's traditional recipe!`,
      localUser: false
    },
    {
      author: "Sana Qureshi (Karachi)",
      rating: 5,
      date: "1 week ago",
      comment: "The kitchen countdown timer and step-by-step cooking mode were super helpful. Everyone at home asked for seconds!",
      localUser: false
    }
  ];

  const allReviewsToDisplay = [...localReviews, ...sampleReviews];

  container.innerHTML = allReviewsToDisplay.map(rev => {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="bi ${i <= rev.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}"></i> `;
    }

    return `
      <div class="card border-0 shadow-sm p-3 mb-3 bg-card">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong class="d-block">${rev.author}</strong>
            <span class="small text-muted">${rev.date}</span>
          </div>
          <div>${starsHtml}</div>
        </div>
        <p class="mb-0 text-muted small">${rev.comment}</p>
        ${rev.localUser ? '<span class="badge bg-secondary bg-opacity-25 text-secondary align-self-start mt-2" style="font-size:0.65rem;">Saved on this device</span>' : ''}
      </div>
    `;
  }).join("");
}
