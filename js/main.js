/**
 * Zaiqa — Pakistani Recipe Finder
 * main.js - Core UI, Navigation, Theme Toggle, Toast System & Shared Utilities
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initFavoritesCounter();
  initBackToTop();
  initGlobalSearch();
  initNewsletterForm();
  highlightActiveNavLink();
});

// ==========================================
// Theme Management (Light / Dark Mode)
// ==========================================
function initTheme() {
  const themeToggleBtns = document.querySelectorAll(".theme-toggle-btn");
  const savedTheme = localStorage.getItem("zaiqa_theme") || "light";
  
  applyTheme(savedTheme);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-bs-theme") || "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("zaiqa_theme", newTheme);
      showToast(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`, "info");
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  const themeIcons = document.querySelectorAll(".theme-icon");
  themeIcons.forEach(icon => {
    if (theme === "dark") {
      icon.className = "bi bi-sun-fill theme-icon";
    } else {
      icon.className = "bi bi-moon-stars-fill theme-icon";
    }
  });
}

// ==========================================
// Live Favorites Counter
// ==========================================
function initFavoritesCounter() {
  updateFavoritesCountBadge();
  window.addEventListener("favoritesUpdated", updateFavoritesCountBadge);
  window.addEventListener("storage", (e) => {
    if (e.key === "zaiqa_favorites") {
      updateFavoritesCountBadge();
    }
  });
}

function updateFavoritesCountBadge() {
  const favorites = getStoredFavorites();
  const badges = document.querySelectorAll(".favorites-count-badge");
  badges.forEach(badge => {
    badge.textContent = favorites.length;
    badge.style.display = favorites.length > 0 ? "flex" : "none";
  });
}

function getStoredFavorites() {
  try {
    const raw = localStorage.getItem("zaiqa_favorites");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading favorites:", e);
    return [];
  }
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;
  
  let icon = "bi-check-circle-fill";
  if (type === "danger") icon = "bi-exclamation-triangle-fill";
  if (type === "info") icon = "bi-info-circle-fill";

  toast.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <i class="bi ${icon} fs-5 text-${type === 'info' ? 'primary' : type}"></i>
      <span class="small fw-medium">${message}</span>
    </div>
    <button type="button" class="btn-close btn-close-white ms-2" style="font-size: 0.7rem;" aria-label="Close"></button>
  `;

  const closeBtn = toast.querySelector(".btn-close");
  closeBtn.addEventListener("click", () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
}
window.showToast = showToast;

// ==========================================
// Back To Top Button
// ==========================================
function initBackToTop() {
  const btn = document.getElementById("backToTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 350) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ==========================================
// Global Navbar Search
// ==========================================
function initGlobalSearch() {
  const forms = document.querySelectorAll(".global-search-form");
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='search'], input[type='text']");
      if (input && input.value.trim()) {
        const query = encodeURI(input.value.trim());
        window.location.href = `recipes.html?search=${query}`;
      }
    });
  });
}

// ==========================================
// Active Navbar Link
// ==========================================
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".navbar-zaiqa .nav-link");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ==========================================
// Newsletter Form
// ==========================================
function initNewsletterForm() {
  const newsletterForms = document.querySelectorAll(".newsletter-form");
  newsletterForms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = form.querySelector("input[type='email']");
      if (!emailInput || !emailInput.value.trim()) return;

      const email = emailInput.value.trim();
      if (!validateEmail(email)) {
        showToast("Please enter a valid email address.", "danger");
        return;
      }

      // Demo feedback
      emailInput.value = "";
      showToast("Shukriya! You are subscribed to Zaiqa Weekly Recipes. (Demo mode)", "success");
    });
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Open Surprise Me Recipe
function triggerSurpriseRecipe() {
  if (!window.RECIPES || !window.RECIPES.length) return;
  const randomIndex = Math.floor(Math.random() * window.RECIPES.length);
  const randomRecipe = window.RECIPES[randomIndex];
  window.location.href = `recipe.html?id=${randomRecipe.id}`;
}
window.triggerSurpriseRecipe = triggerSurpriseRecipe;
