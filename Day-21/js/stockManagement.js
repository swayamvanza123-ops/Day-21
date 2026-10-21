
function refreshStockProductOptions() {
  const select = document.getElementById("stockProduct");
  if (!select) return;

  const previous = select.value;
  select.innerHTML = '<option value="">Choose a product</option>' +
    getProducts().map(p => `
      <option value="${escapeHTML(p.id)}">${escapeHTML(p.name)} (${Number(p.stock)} available)</option>
    `).join("");

  if ([...select.options].some(o => o.value === previous)) select.value = previous;
  updateAvailableStock();
}

function updateAvailableStock() {
  const id = document.getElementById("stockProduct").value;
  const type = document.getElementById("stockType").value;
  const product = getProducts().find(p => p.id === id);
  const label = document.getElementById("availableStock");

  label.textContent = product
    ? `Current available stock: ${Number(product.stock)} units. ${
        type === "out" ? "Stock Out cannot exceed this quantity." : "Stock In will increase this quantity."
      }`
    : "Select a product to see available stock.";
}

function renderStockHistory() {
  const query = (document.getElementById("stockSearch")?.value || "").toLowerCase();
  const filter = document.getElementById("stockFilter")?.value || "all";

  const history = getStockHistory().filter(item =>
    (filter === "all" || item.type === filter) &&
    [item.productName, item.reason, item.type, item.date]
      .some(value => String(value || "").toLowerCase().includes(query))
  ).slice().reverse();

  document.getElementById("stockInCount").textContent =
    getStockHistory().filter(h => h.type === "in").length;
  document.getElementById("stockOutCount").textContent =
    getStockHistory().filter(h => h.type === "out").length;

  document.getElementById("stockTable").innerHTML = history.length
    ? history.map(h => `
      <tr>
        <td><strong>${escapeHTML(h.productName)}</strong></td>
        <td><span class="badge ${h.type === "in" ? "badge-green" : "badge-orange"}">
          ${h.type === "in" ? "Stock In" : "Stock Out"}
        </span></td>
        <td>${h.type === "in" ? "+" : "−"}${Number(h.quantity)}</td>
        <td>${Number(h.previousStock)}</td>
        <td><strong>${Number(h.updatedStock)}</strong></td>
        <td>${escapeHTML(h.reason)}</td>
        <td>${formatDate(h.date)}</td>
      </tr>`).join("")
    : '<tr><td colspan="7" class="empty">No stock movements match your search.</td></tr>';
}

function initStockManagement() {
  document.getElementById("stockProduct").addEventListener("change", updateAvailableStock);
  document.getElementById("stockType").addEventListener("change", updateAvailableStock);
  document.getElementById("stockSearch").addEventListener("input", renderStockHistory);
  document.getElementById("stockFilter").addEventListener("change", renderStockHistory);

  document.getElementById("stockForm").addEventListener("submit", event => {
    event.preventDefault();

    const productId = document.getElementById("stockProduct").value;
    const type = document.getElementById("stockType").value;
    const quantity = Number(document.getElementById("stockQuantity").value);
    const reason = document.getElementById("stockReason").value;

    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (!product || !["in", "out"].includes(type) ||
        !Number.isInteger(quantity) || quantity < 1 || !reason) {
      showToast("Complete all stock movement fields correctly.", "error");
      return;
    }

    const previousStock = Number(product.stock);
    const updatedStock = type === "in"
      ? previousStock + quantity
      : previousStock - quantity;

    if (updatedStock < 0) {
      showToast(`Insufficient stock. Only ${previousStock} units are available.`, "error");
      return;
    }

    const movement = {
      id: makeId("STK"), productId, productName: product.name, type,
      quantity, previousStock, updatedStock, reason,
      date: new Date().toLocaleDateString("en-CA")
    };

    const oldHistory = getStockHistory();
    if (!saveData(DB.products, products.map(p =>
      p.id === productId ? { ...p, stock: updatedStock } : p
    ))) return;

    if (!saveData(DB.stock, [...oldHistory, movement])) {
      saveData(DB.products, products);
      return;
    }

    document.getElementById("stockForm").reset();
    document.getElementById("stockType").value = "in";

    renderProducts();
    refreshStockProductOptions();
    renderStockHistory();
    renderDashboard();

    showToast(`Stock updated: ${product.name} now has ${updatedStock} units.`);
  });

  refreshStockProductOptions();
  renderStockHistory();
}
