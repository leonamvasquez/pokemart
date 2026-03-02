import { Toast } from "./Toast.js";

const BASE_URL = "http://localhost:8080/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("pokemart_token");
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const safeFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login') {
        console.warn("[API] Sessão inválida ou expirada. Forçando logout...");
        
        localStorage.removeItem("pokemart_token");
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
        throw new Error(`Status HTTP: ${response.status}`);
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
            
            return await safeFetch(url, { headers: getAuthHeaders() });
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
        try {
            return await safeFetch(`/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
        } catch (error) {
            Toast.show("E-mail ou senha incorretos.", "error");
            return null;
        }
    },

    getMe: async () => {
        try {
            return await safeFetch(`/auth/me`, { headers: getAuthHeaders() });
        } catch (error) {
            return null;
        }
    },

    register: async (userData) => {
        try {
            return await safeFetch(`/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        } catch (error) {
            if (error.message !== "SESSAO_EXPIRADA") Toast.show("Falha no cadastro. O e-mail pode já estar em uso.", "error");
            return null;
        }
    },

    placeOrder: async () => {
        try {
            return await safeFetch(`/checkout`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (error) {
            if (error.message !== "SESSAO_EXPIRADA") console.error("Erro ao processar sua compra. Tente novamente.", "error");
            throw error;
        }
    },

    getUserOrders: async (userId) => {
        try {
            return await safeFetch(`/users/${userId}/orders`, { headers: getAuthHeaders() });
        } catch (error) {
            if (error.message !== "SESSAO_EXPIRADA") Toast.show("Não foi possível carregar seus pedidos.", "error");
            return [];
        }
    },

    createItem: async (itemData) => {
        return await safeFetch(`/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(itemData)
        });
    },

    updateItem: async (id, itemData) => {
        return await safeFetch(`/items/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(itemData)
        });
    },

    deleteItem: async (id) => {
        return await safeFetch(`/items/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },

    toggleStatus: async (id, deletedStatus) => {
        return await safeFetch(`/items/${id}/status?deleted=${deletedStatus}`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
    },

    getCart: async () => {
        try {
            return await safeFetch(`/cart`, { headers: getAuthHeaders() });
        } catch (error) {
            return [];
        }
    },

    updateCartItem: async (itemId, quantity) => {
        try {
            return await safeFetch(`/cart`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ itemId, quantity })
            });
        } catch (error) {
            throw error;
        }
    },

    clearCart: async () => {
        try {
            await safeFetch(`/cart`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return true;
        } catch (error) {
            return false;
        }
    }
};

export default API;