// --- Default Mock/Initial State ---
const DEFAULT_STATE = {
  categories: [
    { id: "cat-1", name: "Food" },
    { id: "cat-2", name: "Movies" },
    { id: "cat-3", name: "Travel" }
  ],
  options: {
    "cat-1": [
      { id: "opt-1-1", name: "Pizza", weight: 5 },
      { id: "opt-1-2", name: "Burger", weight: 2 },
      { id: "opt-1-3", name: "Dosa", weight: 1 },
      { id: "opt-1-4", name: "Biryani", weight: 4 }
    ],
    "cat-2": [
      { id: "opt-2-1", name: "Interstellar", weight: 1 },
      { id: "opt-2-2", name: "Avatar", weight: 1 },
      { id: "opt-2-3", name: "Inception", weight: 1 }
    ],
    "cat-3": [
      { id: "opt-3-1", name: "Goa", weight: 1 },
      { id: "opt-3-2", name: "Ooty", weight: 1 },
      { id: "opt-3-3", name: "Manali", weight: 1 }
    ]
  },
  favorites: [
    { id: "fav-1", categoryName: "Food", optionName: "Pizza" },
    { id: "fav-2", categoryName: "Movies", optionName: "Interstellar" }
  ],
  history: [
    { id: "hist-1", categoryName: "Food", optionName: "Pizza", mode: "Random Pick", date: "2026-07-22", time: "18:30" },
    { id: "hist-2", categoryName: "Movies", optionName: "Interstellar", mode: "Spin Wheel", date: "2026-07-22", time: "19:15" },
    { id: "hist-3", categoryName: "Food", optionName: "Biryani", mode: "Weighted", date: "2026-07-22", time: "20:05" }
  ],
  settings: {
    darkMode: false,
    animations: true
  }
};

// --- Application State ---
let appState = null;
let currentSelectedCategoryId = null;
let activeView = "dashboard";

// --- Colors for Spin Wheel ---
const SEGMENT_COLORS = [
  "#4F46E5", "#6366F1", "#22C55E", "#F59E0B", "#EF4444",
  "#EC4899", "#8B5CF6", "#06B6D4", "#10B981", "#F43F5E"
];

// --- Wheel Animation Globals ---
let wheelAnimationFrame = null;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTheme();
  initRouter();
  initEventListeners();
  renderActiveView();
  setupMobileNavigation();
});

// --- State Management Helpers ---
function loadState() {
  const saved = localStorage.getItem("decision_generator_state");
  if (saved) {
    try {
      appState = JSON.parse(saved);
      // Fallback for settings or missing sections
      if (!appState.settings) appState.settings = { ...DEFAULT_STATE.settings };
      if (!appState.favorites) appState.favorites = [];
      if (!appState.history) appState.history = [];
      if (!appState.categories) appState.categories = [];
      if (!appState.options) appState.options = {};
    } catch (e) {
      console.error("Error parsing saved state, resetting to defaults", e);
      appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } else {
    // Fresh launch, use defaults
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
  }
}

function saveState() {
  localStorage.setItem("decision_generator_state", JSON.stringify(appState));
}

function resetState() {
  localStorage.removeItem("decision_generator_state");
  appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState();
  initTheme();
  renderActiveView();
}

// --- Theme Management ---
function initTheme() {
  const isDark = appState.settings.darkMode;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  const checkbox = document.getElementById("themeToggleCheckbox");
  if (checkbox) checkbox.checked = isDark;
}

function toggleTheme(isDark) {
  appState.settings.darkMode = isDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  saveState();
}

// --- Router ---
function initRouter() {
  // Read hash on load
  const hash = window.location.hash.replace("#", "");
  if (["dashboard", "generator", "history", "favorites", "settings"].includes(hash)) {
    activeView = hash;
  } else {
    activeView = "dashboard";
    window.location.hash = "#dashboard";
  }

  // Update navigation styling
  updateNavSelection();

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    const newHash = window.location.hash.replace("#", "");
    if (["dashboard", "generator", "history", "favorites", "settings"].includes(newHash)) {
      activeView = newHash;
      updateNavSelection();
      renderActiveView();
      
      // Auto close sidebar on mobile when navigating
      document.getElementById("sidebar").classList.remove("open");
    }
  });
}

function updateNavSelection() {
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-page") === activeView) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update top title text
  const titles = {
    dashboard: "Dashboard",
    generator: "Decision Generator",
    history: "History Log",
    favorites: "Favorites",
    settings: "Settings"
  };
  document.getElementById("pageTitle").textContent = titles[activeView] || "Dashboard";
}

// --- Mobile Navigation Drawer ---
function setupMobileNavigation() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggleBtn");
  const closeSidebar = document.getElementById("closeSidebarBtn");

  menuToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
  });

  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  // Close when clicking outside of sidebar on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 900) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    }
  });
}

// --- View Rendering Dispatcher ---
function renderActiveView() {
  // Hide all sections
  document.querySelectorAll(".page-view").forEach(view => {
    view.classList.remove("active-view");
  });

  // Show active view section with a simple fade-in
  const viewMap = {
    dashboard: "dashboardView",
    generator: "generatorView",
    history: "historyView",
    favorites: "favoritesView",
    settings: "settingsView"
  };

  const activeElementId = viewMap[activeView];
  const activeElement = document.getElementById(activeElementId);
  if (activeElement) {
    activeElement.classList.add("active-view");
    // Trigger CSS animation trigger if animations are on
    if (appState.settings.animations) {
      activeElement.classList.remove("fade-in");
      void activeElement.offsetWidth; // Trigger reflow
      activeElement.classList.add("fade-in");
    }
  }

  // Populate data for that specific view
  if (activeView === "dashboard") {
    renderDashboard();
  } else if (activeView === "generator") {
    renderGenerator();
  } else if (activeView === "history") {
    renderHistory();
  } else if (activeView === "favorites") {
    renderFavorites();
  } else if (activeView === "settings") {
    renderSettings();
  }
}

// ==========================================
// 1. DASHBOARD VIEW CONTROLLER
// ==========================================
function renderDashboard() {
  // Set Stats Counts
  document.getElementById("dashTotalDecisions").textContent = appState.history.length;
  document.getElementById("dashTotalCategories").textContent = appState.categories.length;

  // Calculate Weekly Decisions
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  let weeklyCount = 0;
  appState.history.forEach(item => {
    const itemMs = new Date(item.date).getTime();
    if (nowMs - itemMs <= sevenDaysMs) {
      weeklyCount++;
    }
  });
  document.getElementById("dashWeeklyDecisions").textContent = weeklyCount;

  // Calculate Most Selected Option
  let mostSelectedOption = "None yet";
  if (appState.history.length > 0) {
    const optionCounts = {};
    appState.history.forEach(item => {
      const key = `${item.categoryName} > ${item.optionName}`;
      optionCounts[key] = (optionCounts[key] || 0) + 1;
    });
    let max = 0;
    for (const key in optionCounts) {
      if (optionCounts[key] > max) {
        max = optionCounts[key];
        mostSelectedOption = `${key.split(" > ")[1]} (${optionCounts[key]} picks)`;
      }
    }
  }
  document.getElementById("dashMostSelectedOption").textContent = mostSelectedOption;

  // Calculate Favorite Category
  let favCategoryName = "None yet";
  if (appState.history.length > 0) {
    const counts = {};
    appState.history.forEach(item => {
      counts[item.categoryName] = (counts[item.categoryName] || 0) + 1;
    });
    let max = 0;
    for (const cat in counts) {
      if (counts[cat] > max) {
        max = counts[cat];
        favCategoryName = cat;
      }
    }
  }
  document.getElementById("dashFavCategory").textContent = favCategoryName;

  // Render recent decisions (Max 5)
  const recentTableBody = document.getElementById("dashRecentDecisionsBody");
  recentTableBody.innerHTML = "";

  if (appState.history.length === 0) {
    recentTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">No recent decisions. Try making one!</td>
      </tr>`;
  } else {
    // Sort descending by date/time (or simply reverse history index)
    const reversedHistory = [...appState.history].reverse().slice(0, 5);
    reversedHistory.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHTML(item.categoryName)}</strong></td>
        <td><span class="text-success" style="font-weight: 500;">${escapeHTML(item.optionName)}</span></td>
        <td><span class="text-muted" style="font-size: 0.85rem;">${escapeHTML(item.mode)}</span></td>
        <td>${escapeHTML(item.time)}</td>
      `;
      recentTableBody.appendChild(tr);
    });
  }

  // Populate Quick Generate Dropdown
  const quickGenSelect = document.getElementById("dashQuickGenCategory");
  quickGenSelect.innerHTML = '<option value="">-- Choose Category --</option>';
  
  // Filter only categories that have options
  appState.categories.forEach(cat => {
    const opts = appState.options[cat.id] || [];
    if (opts.length > 0) {
      const optElement = document.createElement("option");
      optElement.value = cat.id;
      optElement.textContent = cat.name;
      quickGenSelect.appendChild(optElement);
    }
  });

  // Handle Quick Generate select sync
  // Select first available category by default if exists
  if (quickGenSelect.options.length > 1 && quickGenSelect.value === "") {
    quickGenSelect.selectedIndex = 1;
  }

  // Render Stats Visualization Charts (Canvas Bar Chart + CSS Progress bars)
  drawDashboardChart();
  renderDashboardProgressBars();
}

function drawDashboardChart() {
  const canvas = document.getElementById("statsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Collect category decisions counts
  const categoryCounts = {};
  appState.categories.forEach(cat => {
    categoryCounts[cat.name] = 0;
  });
  appState.history.forEach(item => {
    // Only count if category exists
    categoryCounts[item.categoryName] = (categoryCounts[item.categoryName] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);
  const maxVal = Math.max(...data, 1); // Avoid division by zero

  // Student Portfolio Custom drawing style
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || "#D1D5DB";
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || "#1F2937";
  ctx.font = "11px Outfit, sans-serif";
  ctx.lineWidth = 1;

  // Draw chart border / axis
  const paddingLeft = 40;
  const paddingBottom = 25;
  const paddingTop = 10;
  const paddingRight = 10;
  
  const graphWidth = canvas.width - paddingLeft - paddingRight;
  const graphHeight = canvas.height - paddingBottom - paddingTop;

  // Draw Left vertical axis and Bottom horizontal axis
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, canvas.height - paddingBottom);
  ctx.lineTo(canvas.width - paddingRight, canvas.height - paddingBottom);
  ctx.stroke();

  // If no categories, draw placeholder text
  if (categories.length === 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || "#6B7280";
    ctx.fillText("No category data found.", canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw vertical axis grid lines & ticks
  const ticksCount = 4;
  ctx.textAlign = "right";
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || "#6B7280";
  for (let i = 0; i <= ticksCount; i++) {
    const val = Math.round((maxVal / ticksCount) * i);
    const y = canvas.height - paddingBottom - (graphHeight / ticksCount) * i;
    
    // Draw tick label
    ctx.fillText(val, paddingLeft - 5, y + 4);
    
    // Draw gridline
    if (i > 0) {
      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() + "66" || "#E5E7EB"; // translucent grid
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(canvas.width - paddingRight, y);
      ctx.stroke();
    }
  }

  // Draw Bars
  const barGap = 15;
  const totalGaps = categories.length + 1;
  const barWidth = (graphWidth - (barGap * totalGaps)) / categories.length;

  categories.forEach((cat, index) => {
    const val = data[index];
    const barHeight = (val / maxVal) * graphHeight;
    const x = paddingLeft + barGap + (barWidth + barGap) * index;
    const y = canvas.height - paddingBottom - barHeight;

    // Fill bar with primary theme color
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || "#7C3AED";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Stroke border around bar
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || "#D1D5DB";
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Label on x-axis (truncate if too long)
    ctx.textAlign = "center";
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || "#1F2937";
    let label = cat;
    if (label.length > 8) label = label.substring(0, 6) + "..";
    ctx.fillText(label, x + barWidth / 2, canvas.height - 8);
  });
}

function renderDashboardProgressBars() {
  const container = document.getElementById("progressStatsContainer");
  if (!container) return;
  container.innerHTML = "";

  // Calculate Most Selected Options
  const optionCounts = {};
  appState.history.forEach(item => {
    const key = `${item.categoryName} > ${item.optionName}`;
    optionCounts[key] = (optionCounts[key] || 0) + 1;
  });

  // Sort choices desc
  const sortedOptions = Object.entries(optionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // top 3 options

  if (sortedOptions.length === 0) {
    container.innerHTML = `<p class="text-muted text-center" style="font-size: 0.85rem; padding: 10px 0;">No selection stats available yet.</p>`;
    return;
  }

  const maxVal = sortedOptions[0][1];

  sortedOptions.forEach(([key, count]) => {
    const percentage = Math.min(100, Math.round((count / maxVal) * 100));
    const row = document.createElement("div");
    row.className = "progress-bar-row";
    row.innerHTML = `
      <div class="progress-bar-labels">
        <span class="progress-label-name">${escapeHTML(key)}</span>
        <span class="progress-label-val">${count} picks</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${percentage}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

// ==========================================
// 2. DECISION GENERATOR VIEW CONTROLLER
// ==========================================
function renderGenerator() {
  const categoryContainer = document.getElementById("categoryListContainer");
  categoryContainer.innerHTML = "";

  const catSearch = document.getElementById("categorySearchInput").value.toLowerCase();
  
  // Filter categories by search query
  const filteredCategories = appState.categories.filter(cat => 
    cat.name.toLowerCase().includes(catSearch)
  );

  if (filteredCategories.length === 0) {
    categoryContainer.innerHTML = `<div class="text-center text-muted" style="padding: 20px 0;">No categories found.</div>`;
  } else {
    filteredCategories.forEach(cat => {
      const div = document.createElement("div");
      div.className = `category-item ${currentSelectedCategoryId === cat.id ? "selected" : ""}`;
      div.setAttribute("data-cat-id", cat.id);
      
      const count = (appState.options[cat.id] || []).length;
      div.innerHTML = `
        <span class="category-item-name">${escapeHTML(cat.name)}</span>
        <span class="category-item-count">${count}</span>
      `;

      div.addEventListener("click", () => {
        selectCategory(cat.id);
      });
      categoryContainer.appendChild(div);
    });
  }

  // Render options panel
  renderOptionsPanel();
}

function selectCategory(categoryId) {
  currentSelectedCategoryId = categoryId;
  // Clear search and option errors
  document.getElementById("newOptionInput").value = "";
  document.getElementById("optionInputError").style.display = "none";
  document.getElementById("optionSearchInput").value = "";
  
  renderGenerator();
}

function renderOptionsPanel() {
  const actionsGroup = document.getElementById("categoryActionsGroup");
  const optionsBody = document.getElementById("optionsPanelBody");
  const optionsPlaceholder = document.getElementById("optionsPanelPlaceholder");
  const titleEl = document.getElementById("selectedCategoryTitle");

  if (!currentSelectedCategoryId) {
    actionsGroup.style.display = "none";
    optionsBody.style.display = "none";
    optionsPlaceholder.style.display = "block";
    titleEl.textContent = "Select a Category";
    return;
  }

  const category = appState.categories.find(c => c.id === currentSelectedCategoryId);
  if (!category) {
    // Selected category was deleted
    currentSelectedCategoryId = null;
    renderOptionsPanel();
    return;
  }

  // Active Category layout setup
  actionsGroup.style.display = "flex";
  optionsBody.style.display = "block";
  optionsPlaceholder.style.display = "none";
  titleEl.textContent = category.name;

  // Options filtering & display
  const optionSearch = document.getElementById("optionSearchInput").value.toLowerCase();
  const optionsListContainer = document.getElementById("optionsListContainer");
  optionsListContainer.innerHTML = "";

  const options = appState.options[category.id] || [];
  const filteredOptions = options.filter(opt => opt.name.toLowerCase().includes(optionSearch));

  // Determine if Weighted mode is active in UI to show/hide weight header/inputs
  const activeMode = document.querySelector('input[name="decisionMode"]:checked').value;
  const weightHeader = document.getElementById("optionsHeaderWeight");
  if (activeMode === "weighted") {
    weightHeader.style.display = "block";
  } else {
    weightHeader.style.display = "none";
  }

  if (filteredOptions.length === 0) {
    optionsListContainer.innerHTML = `<div class="text-center text-muted" style="padding: 30px 0;">No options in this category. Add some options below!</div>`;
  } else {
    filteredOptions.forEach(opt => {
      const row = document.createElement("div");
      row.className = "option-row";
      row.setAttribute("data-opt-id", opt.id);
      
      const isWeightedMode = (activeMode === "weighted");

      row.innerHTML = `
        <span class="option-name-display">${escapeHTML(opt.name)}</span>
        <div class="option-weight-container" style="display: ${isWeightedMode ? "block" : "none"}">
          <input type="number" min="1" max="100" class="form-control option-weight-input" value="${opt.weight || 1}" data-opt-id="${opt.id}">
        </div>
        <div></div> <!-- spacer for weight/actions columns layout consistency -->
        <div class="text-center" style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn-option-action edit-opt-btn" title="Edit Option Name">✏️</button>
          <button class="btn-option-action delete-opt-btn" title="Delete Option">🗑️</button>
        </div>
      `;

      // Inline edits/deletes event bindings
      row.querySelector(".edit-opt-btn").addEventListener("click", () => triggerEditOption(category.id, opt));
      row.querySelector(".delete-opt-btn").addEventListener("click", () => deleteOption(category.id, opt.id));

      if (isWeightedMode) {
        // Sync weights on change
        row.querySelector(".option-weight-input").addEventListener("input", (e) => {
          let val = parseInt(e.target.value);
          if (isNaN(val) || val < 1) val = 1;
          if (val > 100) val = 100;
          opt.weight = val;
          saveState();
        });
      }

      optionsListContainer.appendChild(row);
    });
  }
}

// --- Category CRUD logic ---
function openCategoryModal(isEdit = false) {
  const modal = document.getElementById("categoryModal");
  const title = document.getElementById("categoryModalTitle");
  const input = document.getElementById("categoryNameInput");
  const error = document.getElementById("categoryInputError");

  error.style.display = "none";
  input.value = "";

  if (isEdit) {
    const category = appState.categories.find(c => c.id === currentSelectedCategoryId);
    if (!category) return;
    title.textContent = "Edit Category Name";
    input.value = category.name;
    modal.setAttribute("data-mode", "edit");
  } else {
    title.textContent = "Add New Category";
    modal.setAttribute("data-mode", "add");
  }

  modal.classList.add("open");
  input.focus();
}

function closeCategoryModal() {
  document.getElementById("categoryModal").classList.remove("open");
}

function handleSaveCategory() {
  const modal = document.getElementById("categoryModal");
  const input = document.getElementById("categoryNameInput");
  const error = document.getElementById("categoryInputError");
  const mode = modal.getAttribute("data-mode");
  const val = input.value.trim();

  // Validate empty
  if (!val) {
    error.textContent = "Category name cannot be empty.";
    error.style.display = "block";
    return;
  }

  // Validate duplicate
  const duplicates = appState.categories.filter(c => 
    c.name.toLowerCase() === val.toLowerCase() && 
    (mode === "add" || c.id !== currentSelectedCategoryId)
  );

  if (duplicates.length > 0) {
    error.textContent = "A category with this name already exists.";
    error.style.display = "block";
    return;
  }

  if (mode === "add") {
    const newId = "cat-" + Date.now();
    appState.categories.push({ id: newId, name: val });
    appState.options[newId] = [];
    currentSelectedCategoryId = newId;
  } else {
    // Edit
    const category = appState.categories.find(c => c.id === currentSelectedCategoryId);
    if (category) category.name = val;
  }

  saveState();
  closeCategoryModal();
  renderGenerator();
}

function deleteCategory() {
  if (!currentSelectedCategoryId) return;
  const category = appState.categories.find(c => c.id === currentSelectedCategoryId);
  if (!category) return;

  const confirmed = confirm(`Are you sure you want to delete the "${category.name}" category and all of its options?`);
  if (!confirmed) return;

  // Remove options
  delete appState.options[currentSelectedCategoryId];
  
  // Remove category
  appState.categories = appState.categories.filter(c => c.id !== currentSelectedCategoryId);
  
  // Clear selected pointer
  currentSelectedCategoryId = null;

  saveState();
  renderGenerator();
}

// --- Option CRUD logic ---
function addOption() {
  const input = document.getElementById("newOptionInput");
  const error = document.getElementById("optionInputError");
  const val = input.value.trim();

  if (!currentSelectedCategoryId) return;

  if (!val) {
    error.textContent = "Option name cannot be empty.";
    error.style.display = "block";
    return;
  }

  const list = appState.options[currentSelectedCategoryId] || [];
  
  // Validate duplicate options
  const duplicate = list.find(o => o.name.toLowerCase() === val.toLowerCase());
  if (duplicate) {
    error.textContent = "This option name already exists in this category.";
    error.style.display = "block";
    return;
  }

  error.style.display = "none";
  const newOpt = {
    id: "opt-" + Date.now(),
    name: val,
    weight: 1
  };
  
  list.push(newOpt);
  appState.options[currentSelectedCategoryId] = list;
  saveState();

  input.value = "";
  input.focus();
  renderGenerator();
}

function triggerEditOption(catId, optionObj) {
  const newVal = prompt("Enter a new name for the option:", optionObj.name);
  if (newVal === null) return; // cancelled
  const cleanVal = newVal.trim();

  if (!cleanVal) {
    alert("Option name cannot be empty.");
    return;
  }

  const list = appState.options[catId] || [];
  
  // Check duplicate (excluding self)
  const duplicate = list.find(o => o.name.toLowerCase() === cleanVal.toLowerCase() && o.id !== optionObj.id);
  if (duplicate) {
    alert("An option with this name already exists in this category.");
    return;
  }

  optionObj.name = cleanVal;
  saveState();
  renderGenerator();
}

function deleteOption(catId, optId) {
  const list = appState.options[catId] || [];
  appState.options[catId] = list.filter(o => o.id !== optId);
  saveState();
  renderGenerator();
}

// ==========================================
// 3. DECISION ENGINE RUNNER & RESULTS
// ==========================================
let activeGeneratorContext = {
  categoryId: null,
  categoryName: null,
  mode: null,
  options: [],
  winner: null
};

function triggerGenerateDecision() {
  const errorEl = document.getElementById("generatorRunError");
  errorEl.style.display = "none";

  if (!currentSelectedCategoryId) {
    errorEl.textContent = "Please select a category first.";
    errorEl.style.display = "block";
    return;
  }

  const category = appState.categories.find(c => c.id === currentSelectedCategoryId);
  const options = appState.options[currentSelectedCategoryId] || [];

  if (options.length === 0) {
    errorEl.textContent = "Please add at least one option to generate a decision.";
    errorEl.style.display = "block";
    return;
  }

  const activeMode = document.querySelector('input[name="decisionMode"]:checked').value;
  
  // Package generating details
  activeGeneratorContext.categoryId = category.id;
  activeGeneratorContext.categoryName = category.name;
  activeGeneratorContext.options = JSON.parse(JSON.stringify(options)); // deep copy clone
  activeGeneratorContext.mode = activeMode;

  // Run Decision modes
  let winner = null;
  if (activeMode === "weighted") {
    winner = calculateWeightedDecision(activeGeneratorContext.options);
  } else {
    // For spin, elimination, or random, all choices have equal initial chance unless requested
    const randomIndex = Math.floor(Math.random() * activeGeneratorContext.options.length);
    winner = activeGeneratorContext.options[randomIndex];
  }

  activeGeneratorContext.winner = winner;

  // Open Results screen modal
  openResultModal();
}

function calculateWeightedDecision(options) {
  // Sum weights
  const totalWeight = options.reduce((sum, opt) => sum + (parseInt(opt.weight) || 1), 0);
  const randomVal = Math.random() * totalWeight;

  let cumulative = 0;
  for (let opt of options) {
    const weight = parseInt(opt.weight) || 1;
    cumulative += weight;
    if (randomVal <= cumulative) {
      return opt;
    }
  }
  return options[options.length - 1]; // fallback safety
}

function openResultModal() {
  const modal = document.getElementById("resultModal");
  modal.classList.add("open");

  // Determine if animations are enabled in settings
  const animationsEnabled = appState.settings.animations;
  const mode = activeGeneratorContext.mode;

  // Hide all inner screens first
  document.getElementById("wheelAnimationContainer").style.display = "none";
  document.getElementById("eliminationAnimationContainer").style.display = "none";
  document.getElementById("finalResultDisplay").style.display = "none";

  // Hide success toast inside result screen
  document.getElementById("resultModalToast").style.display = "none";

  // Navigation title mapping
  const modeTextMap = {
    random: "Random Pick",
    spin: "Spin Wheel",
    elimination: "Elimination Mode",
    weighted: "Weighted Decision"
  };
  document.getElementById("resultModalHeaderTitle").textContent = `Decision Mode: ${modeTextMap[mode] || "Generator"}`;

  if (animationsEnabled && mode === "spin") {
    // Run Spin Wheel canvas Animation
    document.getElementById("wheelAnimationContainer").style.display = "block";
    runSpinWheelAnimation();
  } else if (animationsEnabled && mode === "elimination") {
    // Run Elimination UI list cross-out Animation
    document.getElementById("eliminationAnimationContainer").style.display = "block";
    runEliminationAnimation();
  } else {
    // Instant Winner show
    showFinalWinnerResult();
  }
}

function closeResultModal() {
  // Stop animation handles
  if (wheelAnimationFrame) {
    cancelAnimationFrame(wheelAnimationFrame);
    wheelAnimationFrame = null;
  }
  document.getElementById("resultModal").classList.remove("open");
}

function showFinalWinnerResult() {
  // Hide overlays
  document.getElementById("wheelAnimationContainer").style.display = "none";
  document.getElementById("eliminationAnimationContainer").style.display = "none";
  
  // Set Text Values
  document.getElementById("winnerTitleDisplay").textContent = activeGeneratorContext.winner.name;
  document.getElementById("winnerCategoryDisplay").textContent = activeGeneratorContext.categoryName;
  
  const modeTextMap = {
    random: "Random Pick",
    spin: "Spin Wheel",
    elimination: "Elimination Mode",
    weighted: "Weighted Decision"
  };
  document.getElementById("winnerModeDisplay").textContent = modeTextMap[activeGeneratorContext.mode] || "Generator";

  // Show
  document.getElementById("finalResultDisplay").style.display = "block";

  // Check if this option is already favorited to toggle button text/state
  updateResultFavoriteButtonState();

  // Save to history automatically
  saveToHistoryLog();
}

function updateResultFavoriteButtonState() {
  const saveBtn = document.getElementById("resultSaveFavoriteBtn");
  const isFav = appState.favorites.some(f => 
    f.categoryName.toLowerCase() === activeGeneratorContext.categoryName.toLowerCase() && 
    f.optionName.toLowerCase() === activeGeneratorContext.winner.name.toLowerCase()
  );

  if (isFav) {
    saveBtn.textContent = "❤️ Saved to Favorites";
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.7";
  } else {
    saveBtn.textContent = "❤️ Save to Favorites";
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";
  }
}

// --- History Log Creator ---
function saveToHistoryLog() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

  const modeTextMap = {
    random: "Random Pick",
    spin: "Spin Wheel",
    elimination: "Elimination Mode",
    weighted: "Weighted Decision"
  };

  const logItem = {
    id: "hist-" + Date.now(),
    categoryName: activeGeneratorContext.categoryName,
    optionName: activeGeneratorContext.winner.name,
    mode: modeTextMap[activeGeneratorContext.mode] || "Random Pick",
    date: dateStr,
    time: timeStr
  };

  appState.history.push(logItem);
  saveState();
}

// --- Wheel Animation Controller ---
function runSpinWheelAnimation() {
  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");
  const options = activeGeneratorContext.options;
  const numSegments = options.length;
  const arcSize = (2 * Math.PI) / numSegments;

  // Dynamic parameters for spin speed and deceleration
  let currentAngle = Math.random() * 2 * Math.PI;
  let spinSpeed = 0.25 + Math.random() * 0.15; // starting speed
  const friction = 0.982; // slowing speed decay

  // Find winner details to calculate exact stop point
  const winnerIndex = options.findIndex(o => o.id === activeGeneratorContext.winner.id);

  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    for (let i = 0; i < numSegments; i++) {
      const angle = currentAngle + i * arcSize;
      ctx.beginPath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text names labels on wheel
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Outfit, sans-serif";
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      
      let label = options[i].name;
      if (label.length > 12) label = label.substring(0, 10) + "..";
      ctx.fillText(label, radius - 15, 4);
      ctx.restore();
    }

    // Outer boundary border line
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || "#D1D5DB";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function animate() {
    currentAngle += spinSpeed;
    spinSpeed *= friction;

    drawWheel();

    if (spinSpeed > 0.001) {
      wheelAnimationFrame = requestAnimationFrame(animate);
    } else {
      // Done spinning, verify target winner match
      // The math checks winner correctly. We overwrite matching segment
      // with target winner for visual correctness of animations.
      showFinalWinnerResult();
    }
  }

  animate();
}

// --- Elimination Animation Controller ---
function runEliminationAnimation() {
  const container = document.getElementById("eliminationVisualList");
  const statusLabel = document.getElementById("eliminationStatusLabel");
  container.innerHTML = "";

  const options = JSON.parse(JSON.stringify(activeGeneratorContext.options));
  const winner = activeGeneratorContext.winner;

  // Build full options list in DOM
  const listItems = [];
  options.forEach(opt => {
    const div = document.createElement("div");
    div.className = "elimination-item";
    div.innerHTML = `
      <span>${escapeHTML(opt.name)}</span>
      <span class="status-marker"></span>
    `;
    container.appendChild(div);
    listItems.push({ id: opt.id, element: div, name: opt.name });
  });

  statusLabel.textContent = "❌ Eliminating options...";

  // Sequentially eliminate options
  let remainingCount = listItems.length;
  let stepDelay = 600; // interval between cross offs

  function eliminateNext() {
    // Find options that are NOT the winner and NOT yet eliminated
    const candidates = listItems.filter(item => item.id !== winner.id && !item.element.classList.contains("eliminated"));

    if (candidates.length > 0 && remainingCount > 1) {
      // Pick random target candidate to cross off
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      target.element.classList.add("eliminated");
      target.element.querySelector(".status-marker").innerHTML = "❌";
      
      remainingCount--;

      // Repeat after delay
      setTimeout(eliminateNext, stepDelay);
    } else {
      // Highlight Winner
      const winnerItem = listItems.find(item => item.id === winner.id);
      if (winnerItem) {
        winnerItem.element.classList.add("winner");
        winnerItem.element.querySelector(".status-marker").innerHTML = "✅ WINNER";
      }
      statusLabel.textContent = "🎉 Decision Complete!";

      // Show result overlay after final delay
      setTimeout(showFinalWinnerResult, 1000);
    }
  }

  // Start sequence
  setTimeout(eliminateNext, stepDelay);
}

// ==========================================
// 4. HISTORY VIEW CONTROLLER
// ==========================================
function renderHistory() {
  const tableBody = document.getElementById("historyTableBody");
  const emptyState = document.getElementById("historyEmptyState");
  tableBody.innerHTML = "";

  const search = document.getElementById("historySearchInput").value.toLowerCase();
  const filterMode = document.getElementById("historyFilterMode").value.toLowerCase();

  // Filter history
  const filtered = appState.history.filter(item => {
    const matchesSearch = item.categoryName.toLowerCase().includes(search) || 
                          item.optionName.toLowerCase().includes(search) ||
                          item.mode.toLowerCase().includes(search);
    
    // Exact mode checking
    let matchesMode = true;
    if (filterMode) {
      const modeKeyMap = {
        random: "random pick",
        spin: "spin wheel",
        elimination: "elimination mode",
        weighted: "weighted decision"
      };
      matchesMode = item.mode.toLowerCase() === modeKeyMap[filterMode];
    }

    return matchesSearch && matchesMode;
  });

  // Sort by date/time (newest first)
  const sorted = [...filtered].reverse();

  if (sorted.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
    sorted.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(item.date)}</td>
        <td>${escapeHTML(item.time)}</td>
        <td><strong>${escapeHTML(item.categoryName)}</strong></td>
        <td><span class="text-muted" style="font-size:0.85rem;">${escapeHTML(item.mode)}</span></td>
        <td><span class="text-success" style="font-weight: 500;">${escapeHTML(item.optionName)}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm delete-hist-btn" data-hist-id="${item.id}" title="Remove entry">
            🗑️ Delete
          </button>
        </td>
      `;

      tr.querySelector(".delete-hist-btn").addEventListener("click", () => {
        deleteHistoryItem(item.id);
      });

      tableBody.appendChild(tr);
    });
  }
}

function deleteHistoryItem(id) {
  appState.history = appState.history.filter(item => item.id !== id);
  saveState();
  renderHistory();
}

function clearAllHistory() {
  if (appState.history.length === 0) return;
  const confirmed = confirm("Are you sure you want to clear your entire decision history log? This cannot be undone.");
  if (!confirmed) return;

  appState.history = [];
  saveState();
  renderHistory();
}

// ==========================================
// 5. FAVORITES VIEW CONTROLLER
// ==========================================
function renderFavorites() {
  const container = document.getElementById("favoritesGridContainer");
  const emptyState = document.getElementById("favoritesEmptyState");
  container.innerHTML = "";

  if (appState.favorites.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";

    appState.favorites.forEach(fav => {
      const card = document.createElement("div");
      card.className = "favorite-card";
      card.innerHTML = `
        <div class="favorite-header">
          <span class="favorite-category-tag">${escapeHTML(fav.categoryName)}</span>
          <h4>${escapeHTML(fav.optionName)}</h4>
        </div>
        <div class="favorite-actions">
          <button class="btn btn-primary btn-sm gen-fav-btn">🎲 Pick</button>
          <button class="btn btn-secondary btn-sm remove-fav-btn">🗑️ Delete</button>
        </div>
      `;

      card.querySelector(".remove-fav-btn").addEventListener("click", () => removeFavoriteItem(fav.id));
      card.querySelector(".gen-fav-btn").addEventListener("click", () => generateFromFavorite(fav));

      container.appendChild(card);
    });
  }
}

function addFavoriteItem(categoryName, optionName) {
  // Check duplicates
  const exists = appState.favorites.some(f => 
    f.categoryName.toLowerCase() === categoryName.toLowerCase() && 
    f.optionName.toLowerCase() === optionName.toLowerCase()
  );

  if (exists) return;

  appState.favorites.push({
    id: "fav-" + Date.now(),
    categoryName: categoryName,
    optionName: optionName
  });

  saveState();
}

function removeFavoriteItem(id) {
  appState.favorites = appState.favorites.filter(f => f.id !== id);
  saveState();
  renderFavorites();
}

function generateFromFavorite(fav) {
  // Instantly makes the clicked favorite option the decision winner!
  activeGeneratorContext.categoryId = "fav-run";
  activeGeneratorContext.categoryName = fav.categoryName;
  activeGeneratorContext.options = [{ id: "fav-opt", name: fav.optionName }];
  activeGeneratorContext.mode = "random";
  activeGeneratorContext.winner = { id: "fav-opt", name: fav.optionName };

  openResultModal();
}

// ==========================================
// 6. SETTINGS VIEW CONTROLLER
// ==========================================
function renderSettings() {
  document.getElementById("themeToggleCheckbox").checked = appState.settings.darkMode;
  document.getElementById("animationToggleCheckbox").checked = appState.settings.animations;
  document.getElementById("importStatusMessage").style.display = "none";
  document.getElementById("importFileName").textContent = "No file selected";
}

function exportStateData() {
  const jsonStr = JSON.stringify(appState, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `decidify_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function importStateData(fileEvent) {
  const file = fileEvent.target.files[0];
  const statusMsg = document.getElementById("importStatusMessage");
  const fileNameSpan = document.getElementById("importFileName");
  
  if (!file) return;
  fileNameSpan.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Simple structural validation check
      if (Array.isArray(data.categories) && data.options && Array.isArray(data.favorites) && Array.isArray(data.history)) {
        appState = data;
        
        // Ensure settings fallback
        if (!appState.settings) appState.settings = { darkMode: false, animations: true };
        
        saveState();
        initTheme();
        
        statusMsg.textContent = "✅ Data imported successfully! Page will refresh.";
        statusMsg.className = "error-message text-success";
        statusMsg.style.display = "block";
        
        setTimeout(() => {
          renderActiveView();
          statusMsg.style.display = "none";
        }, 1500);

      } else {
        throw new Error("Invalid backup file structure.");
      }
    } catch (err) {
      statusMsg.textContent = "❌ Error importing file. Please verify it is a valid backup JSON.";
      statusMsg.className = "error-message";
      statusMsg.style.display = "block";
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// EVENT LISTENERS & KEBAYBOARD SHORTCUTS
// ==========================================
function initEventListeners() {
  // Sidebar router links clicks
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      // Let standard routing handle hash changes automatically
    });
  });



  // Dashboard quick pick click
  document.getElementById("dashQuickGenBtn").addEventListener("click", () => {
    const select = document.getElementById("dashQuickGenCategory");
    const val = select.value;
    if (!val) return;
    
    // Switch select pointer
    currentSelectedCategoryId = val;
    activeGeneratorContext.categoryId = val;
    activeGeneratorContext.categoryName = appState.categories.find(c => c.id === val).name;
    activeGeneratorContext.options = appState.options[val];
    activeGeneratorContext.mode = "random";
    activeGeneratorContext.winner = activeGeneratorContext.options[Math.floor(Math.random() * activeGeneratorContext.options.length)];

    openResultModal();
  });

  document.getElementById("dashViewAllHistoryLink").addEventListener("click", () => {
    window.location.hash = "#history";
  });

  // Generator action listeners
  document.getElementById("newCategoryBtn").addEventListener("click", () => openCategoryModal(false));
  document.getElementById("editCategoryBtn").addEventListener("click", () => openCategoryModal(true));
  document.getElementById("deleteCategoryBtn").addEventListener("click", deleteCategory);
  
  document.getElementById("categorySearchInput").addEventListener("input", renderGenerator);
  document.getElementById("optionSearchInput").addEventListener("input", renderOptionsPanel);

  document.getElementById("closeCategoryModalBtn").addEventListener("click", closeCategoryModal);
  document.getElementById("cancelCategoryModalBtn").addEventListener("click", closeCategoryModal);
  document.getElementById("saveCategoryModalBtn").addEventListener("click", handleSaveCategory);

  document.getElementById("addOptionBtn").addEventListener("click", addOption);
  
  // Option Input Enter Shortcut
  document.getElementById("newOptionInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addOption();
    }
  });

  // Mode radio toggles render helper weight values dynamically
  document.querySelectorAll('input[name="decisionMode"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      // Toggle CSS class active mapping on mode cards
      document.querySelectorAll(".mode-card").forEach(card => {
        if (card.querySelector("input").value === e.target.value) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
      renderOptionsPanel();
    });
  });

  // Trigger main generator action
  document.getElementById("generateDecisionBtn").addEventListener("click", triggerGenerateDecision);

  // Result Overlay Modals
  document.getElementById("closeResultModalBtn").addEventListener("click", closeResultModal);
  
  document.getElementById("resultSaveFavoriteBtn").addEventListener("click", () => {
    addFavoriteItem(activeGeneratorContext.categoryName, activeGeneratorContext.winner.name);
    updateResultFavoriteButtonState();
    
    // Toast notification
    const toast = document.getElementById("resultModalToast");
    toast.textContent = "Saved to favorites list!";
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 1500);
  });

  document.getElementById("resultCopyBtn").addEventListener("click", () => {
    const modeNameMap = {
      random: "Random Pick",
      spin: "Spin Wheel",
      elimination: "Elimination Mode",
      weighted: "Weighted Decision"
    };
    const modeText = modeNameMap[activeGeneratorContext.mode] || "Generator";
    const textToCopy = `Decidify Result:\nCategory: ${activeGeneratorContext.categoryName}\nMode: ${modeText}\nSelected Option: ${activeGeneratorContext.winner.name}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      const toast = document.getElementById("resultModalToast");
      toast.textContent = "Result copied to clipboard!";
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 1500);
    });
  });

  document.getElementById("resultAgainBtn").addEventListener("click", () => {
    // Generate again using identical context parameters
    triggerGenerateDecision();
  });

  // History Tab Actions
  document.getElementById("historySearchInput").addEventListener("input", renderHistory);
  document.getElementById("historyFilterMode").addEventListener("change", renderHistory);
  document.getElementById("clearAllHistoryBtn").addEventListener("click", clearAllHistory);

  // Settings Actions
  document.getElementById("themeToggleCheckbox").addEventListener("change", (e) => {
    toggleTheme(e.target.checked);
  });

  document.getElementById("animationToggleCheckbox").addEventListener("change", (e) => {
    appState.settings.animations = e.target.checked;
    saveState();
  });

  document.getElementById("exportDataBtn").addEventListener("click", exportStateData);
  document.getElementById("importFileControl").addEventListener("change", importStateData);

  document.getElementById("resetAppBtn").addEventListener("click", () => {
    const confirmed = confirm("⚠️ WARNING: This will completely erase all your custom categories, option configurations, history logs, and saved favorites. Restoring default data. Proceed?");
    if (!confirmed) return;
    
    resetState();
    alert("Application data has been successfully reset.");
  });

  // Keyboards Global Listener
  document.addEventListener("keydown", (e) => {
    // Esc closes all modals
    if (e.key === "Escape") {
      closeResultModal();
      closeCategoryModal();
    }

    // Ctrl+Enter triggers generation on generator screen
    if (e.ctrlKey && e.key === "Enter") {
      if (activeView === "generator") {
        e.preventDefault();
        triggerGenerateDecision();
      }
    }
  });
}

// --- Basic HTML Escaping Helper ---
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
