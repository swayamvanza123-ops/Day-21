
function renderDashboard() {
  const products = getProducts();
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0
  );
  const lowStock = products.filter(p => Number(p.stock) <= 10).length;

  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("totalStock").textContent = totalStock.toLocaleString("en-IN");
  document.getElementById("inventoryValue").textContent = money(inventoryValue);
  document.getElementById("lowStock").textContent = lowStock;

  const recent = products.slice(-5).reverse();
  const table = document.getElementById("dashboardProducts");

  table.innerHTML = recent.length ? recent.map(p => {
    const status = productStatus(p);
    return `
      <tr>
        <td><div class="product-cell">
          <img class="product-thumb" src="${escapeHTML(p.image || "")}" alt=""
            onerror="this.style.visibility='hidden'">
          <div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.id)}</small></div>
        </div></td>
        <td>${escapeHTML(p.category)}</td>
        <td class="price">${money(p.price)}</td>
        <td>${Number(p.stock)}</td>
        <td><span class="badge ${status.className}">${status.label}</span></td>
      </tr>`;
  }).join("") : '<tr><td colspan="5" class="empty">No products yet. Add your first product.</td></tr>';

  const alerts = products.filter(p => Number(p.stock) <= 10);
  document.getElementById("stockAlerts").innerHTML = alerts.length
    ? alerts.map(p => `
      <div class="alert-item">
        <img src="${escapeHTML(p.image || "")}" alt="" onerror="this.style.visibility='hidden'">
        <div class="alert-info">
          <strong>${escapeHTML(p.name)}</strong>
          <small>${Number(p.stock) === 0 ? "Out of stock" : `${Number(p.stock)} units remaining`}</small>
        </div>
        <span class="badge ${Number(p.stock) === 0 ? "badge-red" : "badge-orange"}">
          ${Number(p.stock) === 0 ? "Empty" : "Low"}
        </span>
      </div>`).join("")
    : '<div class="empty">✨ All products have healthy stock levels.</div>';
}

function refreshDashboard() {
  renderDashboard();
}
