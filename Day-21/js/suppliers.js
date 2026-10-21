
function renderSuppliers() {
  const search = (document.getElementById("supplierSearch")?.value || "").toLowerCase();
  const suppliers = getSuppliers().filter(s =>
    [s.name, s.companyName, s.phone, s.email, s.address]
      .some(value => String(value || "").toLowerCase().includes(search))
  );

  document.getElementById("supplierCount").textContent =
    `${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"} found`;

  document.getElementById("suppliersTable").innerHTML = suppliers.length
    ? suppliers.map(s => `
      <tr>
        <td><strong>${escapeHTML(s.name)}</strong></td>
        <td>${escapeHTML(s.companyName)}</td>
        <td>${escapeHTML(s.phone)}</td>
        <td>${escapeHTML(s.email)}</td>
        <td>${escapeHTML(s.address)}</td>
        <td><div class="actions">
          <button class="action-edit" data-edit-supplier="${escapeHTML(s.id)}">Edit</button>
          <button class="action-delete" data-delete-supplier="${escapeHTML(s.id)}">Delete</button>
        </div></td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="empty">No suppliers found.</td></tr>';

  loadProductSupplierOptions();
  if (typeof renderProducts === "function") renderProducts();
}

function resetSupplierForm() {
  document.getElementById("supplierForm").reset();
  document.getElementById("supplierId").value = "";
  document.getElementById("supplierFormTitle").textContent = "Add New Supplier";
  document.getElementById("cancelSupplierEdit").classList.add("hidden");
  document.querySelector("#supplierForm button[type='submit']").textContent = "＋ Add Supplier";
}

function initSuppliers() {
  document.getElementById("supplierForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("supplierId").value;
    const name = document.getElementById("supplierName").value.trim();
    const companyName = document.getElementById("companyName").value.trim();
    const phone = document.getElementById("supplierPhone").value.trim();
    const email = document.getElementById("supplierEmail").value.trim();
    const address = document.getElementById("supplierAddress").value.trim();

    if (name.length < 2 || !companyName || !/^[0-9+() .-]{7,20}$/.test(phone) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || address.length < 5) {
      showToast("Please enter valid supplier details.", "error");
      return;
    }

    const suppliers = getSuppliers();
    const duplicate = suppliers.some(s =>
      s.id !== id &&
      (s.email.toLowerCase() === email.toLowerCase() || s.phone === phone)
    );

    if (duplicate) {
      showToast("A supplier with this email or phone already exists.", "error");
      return;
    }

    const supplier = { id: id || makeId("SUP"), name, companyName, phone, email, address };
    const updated = id
      ? suppliers.map(s => s.id === id ? supplier : s)
      : [...suppliers, supplier];

    if (!saveData(DB.suppliers, updated)) return;

    resetSupplierForm();
    renderSuppliers();
    showToast(id ? "Supplier updated successfully!" : "Supplier added successfully!");
  });

  document.getElementById("cancelSupplierEdit").addEventListener("click", resetSupplierForm);
  document.getElementById("supplierSearch").addEventListener("input", renderSuppliers);

  document.getElementById("suppliersTable").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-supplier]");
    const remove = event.target.closest("[data-delete-supplier]");

    if (edit) {
      const supplier = getSuppliers().find(s => s.id === edit.dataset.editSupplier);
      if (!supplier) return;

      document.getElementById("supplierId").value = supplier.id;
      document.getElementById("supplierName").value = supplier.name;
      document.getElementById("companyName").value = supplier.companyName;
      document.getElementById("supplierPhone").value = supplier.phone;
      document.getElementById("supplierEmail").value = supplier.email;
      document.getElementById("supplierAddress").value = supplier.address;
      document.getElementById("supplierFormTitle").textContent = "Edit Supplier";
      document.getElementById("cancelSupplierEdit").classList.remove("hidden");
      document.querySelector("#supplierForm button[type='submit']").textContent = "✓ Update Supplier";
      document.getElementById("suppliers").scrollIntoView({ behavior: "smooth" });
    }

    if (remove) {
      const id = remove.dataset.deleteSupplier;
      const supplier = getSuppliers().find(s => s.id === id);
      if (!supplier) return;

      if (!confirm(`Delete supplier "${supplier.companyName}"? Existing product records will be kept.`)) return;

      const updatedProducts = getProducts().map(p =>
        p.supplierId === id ? { ...p, supplierId: "" } : p
      );

      if (!saveData(DB.products, updatedProducts)) return;
      if (!saveData(DB.suppliers, getSuppliers().filter(s => s.id !== id))) return;

      renderSuppliers();
      showToast("Supplier deleted successfully.");
    }
  });

  renderSuppliers();
}
