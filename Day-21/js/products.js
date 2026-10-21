
let selectedProductImage = "";
let imageWasChanged = false;

function loadProductSupplierOptions() {
  const select = document.getElementById("productSupplier");
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">No supplier selected</option>' +
    getSuppliers().map(s => `
      <option value="${escapeHTML(s.id)}">${escapeHTML(s.companyName)} — ${escapeHTML(s.name)}</option>
    `).join("");

  if ([...select.options].some(o => o.value === current)) select.value = current;
}

function renderProducts() {
  const search = (document.getElementById("productSearch")?.value || "").toLowerCase();
  const products = getProducts().filter(p =>
    [p.name, p.category, p.id, p.description]
      .some(value => String(value || "").toLowerCase().includes(search)) ||
    (getSuppliers().find(s => s.id === p.supplierId)?.companyName || "")
      .toLowerCase().includes(search)
  );

  const tbody = document.getElementById("productsTable");
  document.getElementById("productCount").textContent =
    `${products.length} product${products.length === 1 ? "" : "s"} found`;

  tbody.innerHTML = products.length ? products.map(p => {
    const status = productStatus(p);
    const supplier = getSuppliers().find(s => s.id === p.supplierId);

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
        <td>${escapeHTML(supplier?.companyName || "—")}</td>
        <td><span class="badge ${status.className}">${status.label}</span></td>
        <td><div class="actions">
          <button class="action-edit" data-edit-product="${escapeHTML(p.id)}">Edit</button>
          <button class="action-delete" data-delete-product="${escapeHTML(p.id)}">Delete</button>
        </div></td>
      </tr>`;
  }).join("") : '<tr><td colspan="7" class="empty">No products found.</td></tr>';

  loadProductSupplierOptions();
  if (typeof refreshDashboard === "function") refreshDashboard();
  if (typeof refreshSaleProductOptions === "function") refreshSaleProductOptions();
  if (typeof refreshStockProductOptions === "function") refreshStockProductOptions();
}

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("productFormTitle").textContent = "Add New Product";
  document.getElementById("saveProductBtn").textContent = "＋ Add Product";
  document.getElementById("cancelProductEdit").classList.add("hidden");
  document.getElementById("imagePreview").classList.add("hidden");
  document.getElementById("imagePreview").removeAttribute("src");
  selectedProductImage = "";
  imageWasChanged = false;
  loadProductSupplierOptions();
}

function editProduct(id) {
  const p = getProducts().find(item => item.id === id);
  if (!p) return;

  document.getElementById("productId").value = p.id;
  document.getElementById("productName").value = p.name;
  document.getElementById("productCategory").value = p.category;
  document.getElementById("productPrice").value = p.price;
  document.getElementById("productStock").value = p.stock;
  document.getElementById("productDescription").value = p.description || "";

  loadProductSupplierOptions();
  document.getElementById("productSupplier").value = p.supplierId || "";

  selectedProductImage = p.image || "";
  imageWasChanged = false;

  const preview = document.getElementById("imagePreview");
  if (selectedProductImage) {
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }

  document.getElementById("productFormTitle").textContent = "Edit Product";
  document.getElementById("saveProductBtn").textContent = "✓ Update Product";
  document.getElementById("cancelProductEdit").classList.remove("hidden");
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
}

async function readImageFile(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG or WebP image.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be 2 MB or smaller.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

function initProducts() {
  const form = document.getElementById("productForm");

  document.getElementById("productImage").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      selectedProductImage = await readImageFile(file);
      imageWasChanged = true;
      const preview = document.getElementById("imagePreview");
      preview.src = selectedProductImage;
      preview.classList.remove("hidden");
    } catch (error) {
      event.target.value = "";
      showToast(error.message, "error");
    }
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("productId").value;
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);
    const supplierId = document.getElementById("productSupplier").value;
    const description = document.getElementById("productDescription").value.trim();

    if (name.length < 2 || !category || !Number.isFinite(price) ||
        price <= 0 || !Number.isInteger(stock) || stock < 0 ||
        description.length < 10) {
      showToast("Please complete all product fields correctly.", "error");
      return;
    }

    const products = getProducts();
    const duplicate = products.some(p =>
      p.name.toLowerCase() === name.toLowerCase() && p.id !== id
    );
    if (duplicate) {
      showToast("A product with this name already exists.", "error");
      return;
    }

    const oldProduct = products.find(p => p.id === id);
    const product = {
      id: id || makeId("P"),
      name, category, price, stock, supplierId, description,
      image: imageWasChanged ? selectedProductImage : (oldProduct?.image || "")
    };

    const updated = id
      ? products.map(p => p.id === id ? product : p)
      : [...products, product];

    if (!saveData(DB.products, updated)) return;

    resetProductForm();
    renderProducts();
    showToast(id ? "Product updated successfully!" : "Product added successfully!");
  });

  document.getElementById("cancelProductEdit").addEventListener("click", resetProductForm);
  document.getElementById("productSearch").addEventListener("input", renderProducts);

  document.getElementById("productsTable").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");

    if (editButton) editProduct(editButton.dataset.editProduct);

    if (deleteButton) {
      const id = deleteButton.dataset.deleteProduct;
      const product = getProducts().find(p => p.id === id);
      if (!product) return;

      if (!confirm(`Delete "${product.name}"? Its historical sales and stock records will remain.`)) return;

      if (!saveData(DB.products, getProducts().filter(p => p.id !== id))) return;
      renderProducts();
      showToast("Product deleted successfully.");
    }
  });

  renderProducts();
}
