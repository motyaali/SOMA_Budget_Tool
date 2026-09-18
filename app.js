(() => {
  "use strict";

  const STORAGE_KEY = "soma-budget-planner-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const currentMonth = () => new Date().toISOString().slice(0, 7);
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const amount = (value) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);

  const sampleState = () => ({
    version: 1,
    month: currentMonth(),
    income: 8500,
    categories: [
      { id: uid(), name: "Housing", items: [
        { id: uid(), name: "Rent (SOMA 1BR)", budget: 3500, actual: 3500 },
        { id: uid(), name: "Renter's Insurance", budget: 25, actual: 25 }
      ]},
      { id: uid(), name: "Utilities", items: [
        { id: uid(), name: "PG&E", budget: 120, actual: 0 },
        { id: uid(), name: "Internet & Phone", budget: 165, actual: 0 },
        { id: uid(), name: "Water & Garbage", budget: 60, actual: 0 }
      ]},
      { id: uid(), name: "Food & Pet Care", items: [
        { id: uid(), name: "Groceries", budget: 450, actual: 0 },
        { id: uid(), name: "Dining Out & Coffee", budget: 350, actual: 0 },
        { id: uid(), name: "Pet Care (Diggy)", budget: 100, actual: 0 }
      ]},
      { id: uid(), name: "Lifestyle & Transit", items: [
        { id: uid(), name: "Entertainment & Nightlife", budget: 300, actual: 0 },
        { id: uid(), name: "Transit & Rideshare", budget: 150, actual: 0 },
        { id: uid(), name: "Subscriptions", budget: 100, actual: 0 }
      ]}
    ]
  });

  const normalize = (candidate) => {
    if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.categories)) throw new Error("Invalid budget file");
    return {
      version: 1,
      month: /^\d{4}-\d{2}$/.test(candidate.month || "") ? candidate.month : currentMonth(),
      income: amount(candidate.income),
      categories: candidate.categories.map(category => ({
        id: String(category.id || uid()),
        name: String(category.name || "Untitled category").slice(0, 50),
        items: Array.isArray(category.items) ? category.items.map(item => ({
          id: String(item.id || uid()),
          name: String(item.name || "Untitled item").slice(0, 70),
          budget: amount(item.budget),
          actual: amount(item.actual)
        })) : []
      }))
    };
  };

  const load = () => {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))) } catch { return sampleState(); }
  };

  let state = load();
  let saveTimer;

  const totals = () => {
    const budget = state.categories.flatMap(c => c.items).reduce((sum, item) => sum + amount(item.budget), 0);
    const actual = state.categories.flatMap(c => c.items).reduce((sum, item) => sum + amount(item.actual), 0);
    const remaining = state.income - actual;
    return { budget, actual, remaining, savingsRate: state.income > 0 ? (remaining / state.income) * 100 : 0 };
  };

  const save = () => {
    $("#saveStatus").textContent = "Saving…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#saveStatus").textContent = "Saved on this device";
    }, 180);
  };

  const renderSummary = () => {
    const t = totals();
    $("#incomeSummary").textContent = money.format(state.income);
    $("#budgetSummary").textContent = money.format(t.budget);
    $("#actualSummary").textContent = money.format(t.actual);
    $("#remainingSummary").textContent = money.format(t.remaining);
    $("#savingsSummary").textContent = `${Math.round(t.savingsRate)}%`;
    $("#remainingCard").classList.toggle("negative", t.remaining < 0);
  };

  const categoryTotals = (category) => ({
    budget: category.items.reduce((sum, item) => sum + amount(item.budget), 0),
    actual: category.items.reduce((sum, item) => sum + amount(item.actual), 0)
  });

  const render = () => {
    $("#budgetMonth").value = state.month;
    $("#netIncome").value = state.income;
    const list = $("#categoryList");
    list.replaceChildren();

    state.categories.forEach(category => {
      const card = $("#categoryTemplate").content.firstElementChild.cloneNode(true);
      card.dataset.id = category.id;
      $(".category-name", card).value = category.name;
      const ct = categoryTotals(category);
      $(".category-budget", card).textContent = money.format(ct.budget);
      $(".category-actual", card).textContent = money.format(ct.actual);
      const items = $(".items", card);

      category.items.forEach(item => {
        const row = $("#itemTemplate").content.firstElementChild.cloneNode(true);
        row.dataset.id = item.id;
        $(".item-name", row).value = item.name;
        $(".item-budget", row).value = item.budget;
        $(".item-actual", row).value = item.actual;
        items.append(row);
      });
      list.append(card);
    });
    renderSummary();
  };

  const findCategory = (element) => state.categories.find(c => c.id === element.closest(".category-card")?.dataset.id);
  const findItem = (element, category) => category?.items.find(i => i.id === element.closest(".item-row")?.dataset.id);

  $("#budgetMonth").addEventListener("change", event => { state.month = event.target.value || currentMonth(); save(); });
  $("#netIncome").addEventListener("input", event => { state.income = amount(event.target.value); renderSummary(); save(); });

  $("#categoryList").addEventListener("input", event => {
    const category = findCategory(event.target);
    if (!category) return;
    if (event.target.matches(".category-name")) category.name = event.target.value;
    const item = findItem(event.target, category);
    if (item && event.target.matches(".item-name")) item.name = event.target.value;
    if (item && event.target.matches(".item-budget")) item.budget = amount(event.target.value);
    if (item && event.target.matches(".item-actual")) item.actual = amount(event.target.value);
    const ct = categoryTotals(category);
    const card = event.target.closest(".category-card");
    $(".category-budget", card).textContent = money.format(ct.budget);
    $(".category-actual", card).textContent = money.format(ct.actual);
    renderSummary();
    save();
  });

  $("#categoryList").addEventListener("click", event => {
    const category = findCategory(event.target);
    if (!category) return;
    if (event.target.closest(".add-item")) {
      category.items.push({ id: uid(), name: "New expense", budget: 0, actual: 0 });
    } else if (event.target.closest(".remove-item")) {
      const item = findItem(event.target, category);
      category.items = category.items.filter(i => i.id !== item?.id);
    } else if (event.target.closest(".remove-category")) {
      state.categories = state.categories.filter(c => c.id !== category.id);
    } else return;
    render(); save();
  });

  $("#addCategoryButton").addEventListener("click", () => {
    state.categories.push({ id: uid(), name: "New category", items: [{ id: uid(), name: "New expense", budget: 0, actual: 0 }] });
    render(); save();
    $$(".category-name").at(-1)?.focus();
  });

  $("#exportButton").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `soma-budget-${state.month}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async event => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      state = normalize(JSON.parse(await file.text()));
      render(); save();
    } catch { alert("That file is not a valid SOMA Budget Planner export."); }
    event.target.value = "";
  });

  $("#printButton").addEventListener("click", () => print());
  $("#resetButton").addEventListener("click", () => $("#confirmDialog").showModal());
  $("#confirmDialog").addEventListener("close", event => {
    if (event.target.returnValue === "confirm") { state = sampleState(); render(); save(); }
  });

  render();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js");

  globalThis.SomaBudget = { amount, normalize, totals: data => { const before = state; state = normalize(data); const result = totals(); state = before; return result; } };
})();
