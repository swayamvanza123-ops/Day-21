
"use strict";

const DB = {
  products: "day21_products",
  suppliers: "day21_suppliers",
  sales: "day21_sales",
  stock: "day21_stock_history"
};

const sampleProducts = [
  {
    id: "P1001", name: "Dell Inspiron Laptop", category: "Electronics",
    price: 52000, stock: 20, supplierId: "", description: "Powerful laptop for office work, study and everyday productivity.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "P1002", name: "Wireless Mouse", category: "Accessories",
    price: 850, stock: 50, supplierId: "", description: "Comfortable wireless mouse with responsive tracking for daily use.",
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "P1003", name: "Mechanical Keyboard", category: "Accessories",
    price: 1800, stock: 35, supplierId: "", description: "Durable mechanical keyboard with comfortable keys for work and gaming.",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "P1004", name: "HD Monitor", category: "Electronics",
    price: 12500, stock: 8, supplierId: "", description: "Clear high-definition monitor for work, entertainment and productivity.",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "P1005", name: "Office Chair", category: "Furniture",
    price: 6500, stock: 5, supplierId: "", description: "Ergonomic office chair designed for comfortable daily working.",
    image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=250&q=80"
  }
];

function readData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("Could not read saved data:", error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    showToast("Could not save data. Your browser storage may be full.", "error");
    return false;
  }
}

function getProducts() {
  return readData(DB.products, []);
}

function getSuppliers() {
  return readData(DB.suppliers, []);
}

function getSales() {
  return readData(DB.sales, []);
}

function getStockHistory() {
  return readData(DB.stock, []);
}

function makeId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
  return Number.isNaN(date.getTime())
    ? escapeHTML(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
}

function productStatus(product) {
  if (Number(product.stock) === 0) {
    return { label: "Out of Stock", className: "badge-red" };
  }
  if (Number(product.stock) <= 10) {
    return { label: "Low Stock", className: "badge-orange" };
  }
  return { label: "In Stock", className: "badge-green" };
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.className = "toast show " + type;

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function initStorage() {
  try {
    if (localStorage.getItem(DB.products) === null) {
      localStorage.setItem(DB.products, JSON.stringify(sampleProducts));
    }
    [DB.suppliers, DB.sales, DB.stock].forEach(key => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, "[]");
      }
    });
  } catch (error) {
    console.error("Storage initialization failed:", error);
    showToast("Browser storage is unavailable. Changes may not persist.", "error");
  }
}

initStorage();
