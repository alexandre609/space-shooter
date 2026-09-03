(function () {
  "use strict";

  const STORAGE_DAYS = "caltrack_days_v1";
  const STORAGE_GOAL = "caltrack_goal_v1";
  const DEFAULT_GOAL = 2000;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  const MEALS = [
    { key: "breakfast", label: "Petit-déjeuner" },
    { key: "lunch", label: "Déjeuner" },
    { key: "dinner", label: "Dîner" },
    { key: "snack", label: "Collation" },
  ];

  const el = (id) => document.getElementById(id);

  const els = {
    dateLabel: el("dateLabel"),
    dateSub: el("dateSub"),
    prevDay: el("prevDay"),
    nextDay: el("nextDay"),
    ringProgress: el("ringProgress"),
    remainingValue: el("remainingValue"),
    goalValue: el("goalValue"),
    consumedValue: el("consumedValue"),
    overValue: el("overValue"),
    editGoalBtn: el("editGoalBtn"),
    mealsContainer: el("mealsContainer"),
    addFab: el("addFab"),
    entrySheetBackdrop: el("entrySheetBackdrop"),
    entryForm: el("entryForm"),
    foodName: el("foodName"),
    foodCalories: el("foodCalories"),
    foodMeal: el("foodMeal"),
    cancelEntry: el("cancelEntry"),
    goalSheetBackdrop: el("goalSheetBackdrop"),
    goalForm: el("goalForm"),
    goalInput: el("goalInput"),
    cancelGoal: el("cancelGoal"),
    historyBackdrop: el("historyBackdrop"),
    historyList: el("historyList"),
    closeHistory: el("closeHistory"),
    tabBtns: document.querySelectorAll(".tab-btn"),
    toast: el("toast"),
  };

  let currentDate = todayKey();
  let toastTimer = null;

  function todayKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatKey(d);
  }

  function formatKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function keyToDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftKey(key, delta) {
    const d = keyToDate(key);
    d.setDate(d.getDate() + delta);
    return formatKey(d);
  }

  function loadDays() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_DAYS)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveDays(days) {
    localStorage.setItem(STORAGE_DAYS, JSON.stringify(days));
  }

  function getGoal() {
    const raw = localStorage.getItem(STORAGE_GOAL);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL;
  }

  function setGoal(value) {
    localStorage.setItem(STORAGE_GOAL, String(value));
  }

  function getDayEntries(key) {
    const days = loadDays();
    return (days[key] && days[key].entries) || [];
  }

  function addEntry(key, entry) {
    const days = loadDays();
    if (!days[key]) days[key] = { entries: [] };
    days[key].entries.push(entry);
    saveDays(days);
  }

  function removeEntry(key, entryId) {
    const days = loadDays();
    if (!days[key]) return;
    days[key].entries = days[key].entries.filter((e) => e.id !== entryId);
    if (days[key].entries.length === 0) delete days[key];
    saveDays(days);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 1800);
  }

  function formatDateLabel(key) {
    const today = todayKey();
    const yesterday = todayKey(-1);
    const tomorrow = todayKey(1);
    if (key === today) return "Aujourd'hui";
    if (key === yesterday) return "Hier";
    if (key === tomorrow) return "Demain";
    const d = keyToDate(key);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }

  function formatDateSub(key) {
    const d = keyToDate(key);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function render() {
    els.dateLabel.textContent = formatDateLabel(currentDate);
    els.dateSub.textContent = formatDateSub(currentDate);
    els.nextDay.disabled = currentDate === todayKey();

    const goal = getGoal();
    const entries = getDayEntries(currentDate);
    const consumed = entries.reduce((sum, e) => sum + e.calories, 0);
    const remaining = goal - consumed;
    const over = Math.max(0, consumed - goal);

    els.goalValue.textContent = goal;
    els.consumedValue.textContent = consumed;
    els.overValue.textContent = over;
    els.remainingValue.textContent = Math.max(0, remaining);

    const percent = goal > 0 ? Math.min(consumed / goal, 1) : 0;
    els.ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - percent));
    els.ringProgress.style.stroke =
      consumed > goal ? "var(--danger)" : consumed / goal > 0.85 ? "var(--warn)" : "var(--primary)";

    renderMeals(entries);
  }

  function renderMeals(entries) {
    els.mealsContainer.innerHTML = "";

    const hasAny = entries.length > 0;
    if (!hasAny) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Aucun aliment ajouté pour ce jour. Appuyez sur + pour commencer.";
      els.mealsContainer.appendChild(empty);
      return;
    }

    MEALS.forEach((meal) => {
      const items = entries.filter((e) => e.meal === meal.key);
      if (items.length === 0) return;

      const group = document.createElement("section");
      group.className = "meal-group";

      const total = items.reduce((sum, e) => sum + e.calories, 0);

      const header = document.createElement("div");
      header.className = "meal-header";
      header.innerHTML = `<span class="meal-title">${meal.label}</span><span class="meal-total">${total} kcal</span>`;
      group.appendChild(header);

      const list = document.createElement("div");
      list.className = "meal-items";

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "food-item";
        row.innerHTML = `
          <div class="food-info">
            <span class="food-name"></span>
            <span class="food-cal">${item.calories} kcal</span>
          </div>
          <button class="delete-btn" aria-label="Supprimer">✕</button>
        `;
        row.querySelector(".food-name").textContent = item.name;
        row.querySelector(".delete-btn").addEventListener("click", () => {
          removeEntry(currentDate, item.id);
          render();
          showToast("Aliment supprimé");
        });
        list.appendChild(row);
      });

      group.appendChild(list);
      els.mealsContainer.appendChild(group);
    });
  }

  function openSheet(backdrop) {
    backdrop.classList.remove("hidden");
  }

  function closeSheet(backdrop) {
    backdrop.classList.add("hidden");
  }

  els.prevDay.addEventListener("click", () => {
    currentDate = shiftKey(currentDate, -1);
    render();
  });

  els.nextDay.addEventListener("click", () => {
    if (currentDate === todayKey()) return;
    currentDate = shiftKey(currentDate, 1);
    render();
  });

  els.addFab.addEventListener("click", () => {
    els.entryForm.reset();
    els.foodMeal.value = defaultMealForNow();
    openSheet(els.entrySheetBackdrop);
    setTimeout(() => els.foodName.focus(), 50);
  });

  function defaultMealForNow() {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 16) return "lunch";
    if (h < 21) return "dinner";
    return "snack";
  }

  els.cancelEntry.addEventListener("click", () => closeSheet(els.entrySheetBackdrop));
  els.entrySheetBackdrop.addEventListener("click", (e) => {
    if (e.target === els.entrySheetBackdrop) closeSheet(els.entrySheetBackdrop);
  });

  els.entryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.foodName.value.trim();
    const calories = parseInt(els.foodCalories.value, 10);
    const meal = els.foodMeal.value;
    if (!name || !Number.isFinite(calories) || calories < 0) return;

    addEntry(currentDate, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      calories,
      meal,
      time: new Date().toISOString(),
    });

    closeSheet(els.entrySheetBackdrop);
    render();
    showToast("Aliment ajouté");
  });

  els.editGoalBtn.addEventListener("click", () => {
    els.goalInput.value = getGoal();
    openSheet(els.goalSheetBackdrop);
    setTimeout(() => els.goalInput.focus(), 50);
  });

  els.cancelGoal.addEventListener("click", () => closeSheet(els.goalSheetBackdrop));
  els.goalSheetBackdrop.addEventListener("click", (e) => {
    if (e.target === els.goalSheetBackdrop) closeSheet(els.goalSheetBackdrop);
  });

  els.goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = parseInt(els.goalInput.value, 10);
    if (!Number.isFinite(value) || value <= 0) return;
    setGoal(value);
    closeSheet(els.goalSheetBackdrop);
    render();
    showToast("Objectif mis à jour");
  });

  function renderHistory() {
    const days = loadDays();
    const goal = getGoal();
    const keys = Object.keys(days)
      .filter((k) => days[k].entries && days[k].entries.length > 0)
      .sort((a, b) => (a < b ? 1 : -1));

    els.historyList.innerHTML = "";

    if (keys.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Aucun historique pour le moment.";
      els.historyList.appendChild(empty);
      return;
    }

    keys.forEach((key) => {
      const entries = days[key].entries;
      const total = entries.reduce((sum, e) => sum + e.calories, 0);
      const diff = total - goal;

      const row = document.createElement("button");
      row.className = "history-row";
      row.innerHTML = `
        <div>
          <div class="history-date"></div>
          <div class="history-meta">${entries.length} aliment${entries.length > 1 ? "s" : ""}</div>
        </div>
        <div class="history-cal ${diff > 0 ? "over" : "under"}">${total} kcal</div>
      `;
      row.querySelector(".history-date").textContent = formatDateLabel(key) + " · " + formatDateSub(key);
      row.addEventListener("click", () => {
        currentDate = key;
        render();
        closeSheet(els.historyBackdrop);
        setActiveTab("today");
      });
      els.historyList.appendChild(row);
    });
  }

  els.closeHistory.addEventListener("click", () => closeSheet(els.historyBackdrop));
  els.historyBackdrop.addEventListener("click", (e) => {
    if (e.target === els.historyBackdrop) closeSheet(els.historyBackdrop);
  });

  function setActiveTab(tab) {
    els.tabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  }

  els.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveTab(btn.dataset.tab);
      if (btn.dataset.tab === "history") {
        renderHistory();
        openSheet(els.historyBackdrop);
      } else {
        currentDate = todayKey();
        render();
      }
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }

  render();
})();
