import { Toast } from "./Toast.js";

const hostname = window.location.hostname;
const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

const BASE_URL = isLocalhost 
    ? "http://localhost:8080/api" 
    : "https://pokemart.filpo.com.br/api";

const getStandardHeaders = () => {
  return { "Content-Type": "application/json" };
};

const isDemoMode = () => localStorage.getItem("pokemart_demo_mode") === "true";
const generateFakeId = () => "demo-" + Math.random().toString(36).substring(2, 11);

let demoDatabase = null;

const initDemoDB = async () => {
    if (demoDatabase !== null) return;
    try {
        const res = await fetch('/data/items.json');
        demoDatabase = res.ok ? await res.json() : [];
    } catch (e) {
        demoDatabase = [];
    }
};

const safeFetch = async (endpoint, options = {}) => {
  options.credentials = "include";

  if (isDemoMode()) {
    await initDemoDB(); 
    const method = options.method || "GET";

    if (endpoint === '/auth/me' && method === 'GET') {
        return { id: "ef9a58ea-6c5d-418a-a598-dfb293e7e77d", name: "Professor Carvalho (Demo)", email: "admin@admin.com", role: "ADMIN" };
    }
    
    if (endpoint === '/auth/logout' && method === 'POST') {
        localStorage.removeItem("pokemart_demo_mode");
        return true;
    }

    if (endpoint.includes('/categories/stats') && method === 'GET') {
        const statsMap = demoDatabase.reduce((acc, item) => {
            if (!item.deleted && item.category) {
                acc[item.category] = (acc[item.category] || 0) + 1;
            }
            return acc;
        }, {});
        return Object.entries(statsMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    }

    if (endpoint.startsWith("/items") && method === "GET") {
        const params = new URLSearchParams(endpoint.split("?")[1] || "");
        const page = parseInt(params.get("page") || "0", 10);
        const size = parseInt(params.get("size") || "10", 10);
        const category = params.get("category") || "";
        const search = (params.get("search") || "").toLowerCase();
        const isAdminRoute = endpoint.startsWith("/items/all");
        const sort = params.get("sort") || "price-asc";

        let filtered = demoDatabase.filter(item => {
            if (!isAdminRoute && item.deleted) return false;
            if (category && item.category !== category) return false;
            if (search && !item.name.toLowerCase().includes(search)) return false;
            return true;
        });

        if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
        else if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);

        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / size) || 1;
        const paginated = filtered.slice(page * size, (page + 1) * size);

        await new Promise(r => setTimeout(r, 200)); 
        return {
            data: paginated,
            currentPage: page,
            totalPages: totalPages,
            totalElements: totalElements,
            hasNext: page < totalPages - 1
        };
    }

    if (endpoint.startsWith("/items") && method !== "GET") {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (method === "POST") {
        const newItem = { id: generateFakeId(), ...JSON.parse(options.body), deleted: false };
        demoDatabase.unshift(newItem); 
        return newItem;
      }
      if (method === "PUT") {
        const bodyObj = JSON.parse(options.body);
        const id = endpoint.split("/")[2];
        demoDatabase = demoDatabase.map(i => String(i.id) === id ? { ...i, ...bodyObj } : i);
        return bodyObj;
      }
      if (method === "PATCH") {
        const id = endpoint.split("/")[2].split("?")[0];
        const isDeleted = endpoint.includes("deleted=true");
        demoDatabase = demoDatabase.map(i => String(i.id) === id ? { ...i, deleted: isDeleted } : i);
        return true;
      }
      if (method === "DELETE") {
        const id = endpoint.split("/")[2];
        demoDatabase = demoDatabase.filter(i => String(i.id) !== id);
        return true;
      }
    }

    const getDemoCart = () => JSON.parse(localStorage.getItem("pokemart_demo_cart")) || [];
    const saveDemoCart = (cart) => localStorage.setItem("pokemart_demo_cart", JSON.stringify(cart));
    const getDemoOrders = () => JSON.parse(localStorage.getItem("pokemart_demo_orders")) || [];
    const saveDemoOrders = (orders) => localStorage.setItem("pokemart_demo_orders", JSON.stringify(orders));

    if (endpoint.startsWith("/cart")) {
      if (method === "GET") {
        return getDemoCart();
      }
      if (method === "POST") {
        const bodyObj = JSON.parse(options.body);
        const itemId = bodyObj.itemId;
        const quantity = bodyObj.quantity;
        let cart = getDemoCart();
        const existingItem = cart.find(i => String(i.itemId) === String(itemId));
        
        if (existingItem) {
          existingItem.quantity = quantity;
        } else {
          const product = demoDatabase.find(i => String(i.id) === String(itemId));
          if (product) {
            cart.push({
              itemId: product.id,
              name: product.name,
              quantity: quantity,
              price: product.price,
              imageUrl: product.image
            });
          }
        }
        cart = cart.filter(i => i.quantity > 0);
        saveDemoCart(cart);
        return cart;
      }
      if (method === "DELETE") {
        saveDemoCart([]);
        return true;
      }
    }

    if (endpoint.startsWith("/checkout") && method === "POST") {
      await new Promise(r => setTimeout(r, 600)); 
      const cart = getDemoCart();
      if (cart.length === 0) throw new Error("Carrinho vazio");

      const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const newOrder = {
        id: generateFakeId(),
        status: "APPROVED",
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
        items: cart.map(i => ({
            productId: i.itemId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            imageUrl: i.imageUrl || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
        }))
      };

      const orders = getDemoOrders();
      orders.push(newOrder);
      saveDemoOrders(orders);
      saveDemoCart([]); 
      
      Toast.show("Compra Processada (Modo Demo)!", "info");
      return newOrder;
    }

    if (endpoint.match(/\/users\/.*\/orders/) && method === "GET") {
      await new Promise(r => setTimeout(r, 300));
      return getDemoOrders();
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);

  if ((response.status === 401 || response.status === 403) && endpoint !== "/auth/login") {
    localStorage.removeItem("pokemart_role");
    if (window.app && window.app.store) {
      window.app.store.user = null;
      window.app.store.cart = [];
      window.dispatchEvent(new CustomEvent("appauthchange"));
      window.dispatchEvent(new CustomEvent("appcartchange"));
      window.app.router.go("/login");
    } else {
      window.location.href = "/login";
    }
    Toast.show("Sua sessão expirou. Por favor, faça login novamente.", "error");
    throw new Error("SESSAO_EXPIRADA");
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {}

    const error = new Error(`Status HTTP: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) return true;
  return await response.json();
};

const API = {
  fetchItems: async (page = 0, size = 10, category = "", search = "", sort = "price-asc") => {
    try {
      let url = `/items?page=${page}&size=${size}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sort) url += `&sort=${encodeURIComponent(sort)}`;
      return await safeFetch(url);
    } catch (error) {
      if (error.message !== "SESSAO_EXPIRADA") Toast.show("Falha ao buscar itens do PokéMart.", "error");
      return { data: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  },

  fetchAdminItems: async (page = 0, size = 10, category = "", search = "", sort = "price-asc") => {
    try {
      let url = `/items/all?page=${page}&size=${size}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sort) url += `&sort=${encodeURIComponent(sort)}`;
      return await safeFetch(url, { headers: getStandardHeaders() });
    } catch (error) {
      if (error.message !== "SESSAO_EXPIRADA") Toast.show("Falha ao buscar inventário.", "error");
      return { data: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  },

  fetchCategoryStats: async (search = "") => {
    try {
      let url = `/categories/stats`;
      if (search) url += `?search=${encodeURIComponent(search)}`;
      return await safeFetch(url);
    } catch (error) {
      return [];
    }
  },

  fetchCategories: async () => {
    try {
      return await safeFetch(`/categories`);
    } catch (error) {
      if (error.message !== "SESSAO_EXPIRADA") Toast.show("Falha ao buscar categorias.", "error");
      return [];
    }
  },

  login: async (email, password) => {
    return await safeFetch(`/auth/login`, {
      method: "POST",
      headers: getStandardHeaders(),
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    try {
      await safeFetch(`/auth/logout`, { method: "POST", headers: getStandardHeaders() });
      return true;
    } catch (error) {
      return false;
    }
  },

  getMe: async () => {
    try {
      return await safeFetch(`/auth/me`, { headers: getStandardHeaders() });
    } catch (error) {
      return null;
    }
  },

  register: async (userData) => {
    return await safeFetch(`/users`, {
      method: "POST",
      headers: getStandardHeaders(),
      body: JSON.stringify(userData),
    });
  },

  placeOrder: async () => {
    try {
      return await safeFetch(`/checkout`, { method: "POST", headers: getStandardHeaders() });
    } catch (error) {
      if (error.message !== "SESSAO_EXPIRADA") Toast.show("Erro ao processar sua compra.", "error");
      throw error;
    }
  },

  getUserOrders: async (userId) => {
    try {
      return await safeFetch(`/users/${userId}/orders`, { headers: getStandardHeaders() });
    } catch (error) {
      if (error.message !== "SESSAO_EXPIRADA") Toast.show("Não foi possível carregar seus pedidos.", "error");
      return [];
    }
  },

  fetchItemById: async (id) => await safeFetch(`/items/${id}`),

  createItem: async (itemData) => await safeFetch(`/items`, {
    method: "POST", headers: getStandardHeaders(), body: JSON.stringify(itemData),
  }),

  updateItem: async (id, itemData) => await safeFetch(`/items/${id}`, {
    method: "PUT", headers: getStandardHeaders(), body: JSON.stringify(itemData),
  }),

  deleteItem: async (id) => await safeFetch(`/items/${id}`, {
    method: "DELETE", headers: getStandardHeaders(),
  }),

  toggleStatus: async (id, deletedStatus) => await safeFetch(`/items/${id}/status?deleted=${deletedStatus}`, {
    method: "PATCH", headers: getStandardHeaders(),
  }),

  getCart: async () => {
    try {
      return await safeFetch(`/cart`, { headers: getStandardHeaders() });
    } catch (error) {
      return [];
    }
  },

  updateCartItem: async (itemId, quantity) => await safeFetch(`/cart`, {
    method: "POST", headers: getStandardHeaders(), body: JSON.stringify({ itemId, quantity }),
  }),

  clearCart: async () => {
    try {
      await safeFetch(`/cart`, { method: "DELETE", headers: getStandardHeaders() });
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default API;
