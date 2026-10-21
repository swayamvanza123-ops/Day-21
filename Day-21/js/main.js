
"use strict";

const pageTitles = {
  dashboard: "Dashboard Overview",
  products: "Product Management",
  suppliers: "Supplier Management",
  sales: "Sales Management",
  stock: "Stock Management"
};

function openPage(pageId) {
  if (!pageTitles[pageId]) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  document.getElementById("pageTitle").textContent = pageTitles[pageId];
  document.getElementById("breadcrumb").textContent = pageTitles[pageId].toUpperCase();

  document.querySelector(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "dashboard") renderDashboard();
  if (pageId === "products") renderProducts();
  if (pageId === "suppliers") renderSuppliers();
  if (pageId === "sales") {
    refreshSaleProductOptions();
    renderSales();
  }
  if (pageId === "stock") {
    refreshStockProductOptions();
    renderStockHistory();
  }
}

function initNavigation() {
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
  });

  document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.go));
  });

  document.getElementById("menuToggle").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open");
  });

  document.addEventListener("click", event => {
    const sidebar = document.querySelector(".sidebar");
    const menu = document.getElementById("menuToggle");

    if (
      window.innerWidth <= 760 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menu.contains(event.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
}

function initApp() {
  document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  initNavigation();
  initProducts();
  initSuppliers();
  initSales();
  initStockManagement();
  renderDashboard();
  openPage("dashboard");
}

document.addEventListener("DOMContentLoaded", initApp);
