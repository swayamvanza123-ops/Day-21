
function refreshSaleProductOptions() {
  const select = document.getElementById("saleProduct");
  if (!select) return;

  const previous = select.value;
  select.innerHTML = '<option value="">Choose a product</option>' +
    getProducts().map(p => `
      <option value="${escapeHTML(p.id)}" ${Number(p.stock) <= 0 ? "disabled" : ""}>
        ${escapeHTML(p.name)} — ${money(p.price)} (${Number(p.stock)} available)
      </option>`).join("");

  if ([...select.options].some(o => o.value === previous && !o.disabled)) {
    select.value = previous;
  }

  updateSaleCalculation();
}

function updateSaleCalculation() {
  const product = getProducts().find(p =>
    p.id === document.getElementById("saleProduct").value
  );
  const quantity = Number(document.getElementById("saleQuantity").value || 0);
  const discount = Number(document.getElementById("saleDiscount").value || 0);
  const price = product ? Number(product.price) : 0;
  const subtotal = price * quantity;
  const finalAmount = Math.max(0, subtotal - discount);

  document.getElementById("salePrice").value = product ? price.toFixed(2) : "";
  document.getElementById("saleTotal").textContent = money(finalAmount);
  document.getElementById("saleCalculation").textContent = product
    ? `Subtotal ${money(subtotal)} − Discount ${money(discount)} · ${Number(product.stock)} units available`
    : "Select a product to calculate the total.";
}

function renderSales() {
  const query = (document.getElementById("salesSearch")?.value || "").toLowerCase();
  const sales = getSales().filter(s =>
    [s.invoice, s.customerName, s.customerPhone, s.productName]
      .some(v => String(v || "").toLowerCase().includes(query))
  ).slice().reverse();

  document.getElementById("salesCount").textContent =
    `${sales.length} sale${sales.length === 1 ? "" : "s"} found`;

  document.getElementById("salesTable").innerHTML = sales.length
    ? sales.map(s => `
      <tr>
        <td><span class="badge badge-purple">${escapeHTML(s.invoice)}</span></td>
        <td><strong>${escapeHTML(s.customerName)}</strong><br><small>${escapeHTML(s.customerPhone)}</small></td>
        <td>${escapeHTML(s.productName)}</td>
        <td>${Number(s.quantity)}</td>
        <td>${money(s.discount)}</td>
        <td class="price">${money(s.total)}</td>
        <td>${formatDate(s.date)}</td>
      </tr>`).join("")
    : '<tr><td colspan="7" class="empty">No sales recorded yet.</td></tr>';
}

function initSales() {
  const dateInput = document.getElementById("saleDate");
  dateInput.value = new Date().toLocaleDateString("en-CA");

  ["saleProduct", "saleQuantity", "saleDiscount"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateSaleCalculation);
    document.getElementById(id).addEventListener("change", updateSaleCalculation);
  });

  document.getElementById("salesSearch").addEventListener("input", renderSales);

  document.getElementById("saleForm").addEventListener("submit", event => {
    event.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const productId = document.getElementById("saleProduct").value;
    const quantity = Number(document.getElementById("saleQuantity").value);
    const discount = Number(document.getElementById("saleDiscount").value);
    const date = dateInput.value;

    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (!customerName || !/^[0-9+() .-]{7,20}$/.test(customerPhone)) {
      showToast("Enter a valid customer name and phone number.", "error");
      return;
    }

    if (!product || !Number.isInteger(quantity) || quantity < 1 ||
        quantity > product.stock) {
      showToast("Choose a product and enter a valid quantity within available stock.", "error");
      return;
    }

    if (!Number.isFinite(discount) || discount < 0 ||
        discount > Number(product.price) * quantity) {
      showToast("Discount must be between zero and the subtotal.", "error");
      return;
    }

    if (!date || Number.isNaN(Date.parse(date + "T12:00:00"))) {
      showToast("Please choose a valid sale date.", "error");
      return;
    }

    const previousStock = Number(product.stock);
    const updatedStock = previousStock - quantity;
    const subtotal = Number(product.price) * quantity;
    const total = subtotal - discount;
    const invoice = "INV-" + Date.now().toString().slice(-8);

    const sale = {
      id: makeId("SALE"), invoice, customerName, customerPhone,
      productId, productName: product.name, quantity,
      price: Number(product.price), subtotal, discount, total, date
    };

    const movement = {
      id: makeId("STK"), productId, productName: product.name,
      type: "out", quantity, previousStock, updatedStock,
      reason: `Sale ${invoice}`, date
    };

    // Save both records before committing the stock change.
    const oldSales = getSales();
    const oldHistory = getStockHistory();

    if (!saveData(DB.sales, [...oldSales, sale])) return;
    if (!saveData(DB.stock, [...oldHistory, movement])) {
      saveData(DB.sales, oldSales);
      return;
    }
    if (!saveData(DB.products, products.map(p =>
      p.id === productId ? { ...p, stock: updatedStock } : p
    ))) {
      saveData(DB.sales, oldSales);
      saveData(DB.stock, oldHistory);
      return;
    }

    document.getElementById("saleForm").reset();
    dateInput.value = new Date().toLocaleDateString("en-CA");
    document.getElementById("saleQuantity").value = "1";
    document.getElementById("saleDiscount").value = "0";

    refreshSaleProductOptions();
    renderSales();
    renderProducts();
    renderStockHistory();
    renderDashboard();

    showToast(`Sale completed! Invoice ${invoice} · ${money(total)}`);
  });

  refreshSaleProductOptions();
  renderSales();
}
