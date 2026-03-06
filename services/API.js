import { Toast } from "./Toast.js";

const BASE_URL = "http://localhost:8080/api";

const getStandardHeaders = () => {
    return { 'Content-Type': 'application/json' };
};

const safeFetch = async (endpoint, options = {}) => {
    options.credentials = "include";

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login') {
        console.warn("[API] Sessão inválida ou expirada. Forçando logout...");
        
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
        } catch (e) {
            console.error("Erro ao dar parse no JSON de erro.");
        }

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
            method: 'POST',
            headers: getStandardHeaders(),
            body: JSON.stringify({ email, password })
        });
    },

    logout: async () => {
        try {
            await safeFetch(`/auth/logout`, {
                method: 'POST',
                headers: getStandardHeaders()
            });
            return true;
        } catch (error) {
            console.warn("Erro ao fazer logout no servidor, limpando apenas o frontend.");
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
            method: 'POST',
            headers: getStandardHeaders(),
            body: JSON.stringify(userData)
        });
    },

    placeOrder: async () => {
        try {
            return await safeFetch(`/checkout`, {
                method: 'POST',
                headers: getStandardHeaders()
            });
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

    fetchItemById: async (id) => {
        return await safeFetch(`/items/${id}`);
    },

    createItem: async (itemData) => {
        return await safeFetch(`/items`, {
            method: 'POST',
            headers: getStandardHeaders(),
            body: JSON.stringify(itemData)
        });
    },

    updateItem: async (id, itemData) => {
        return await safeFetch(`/items/${id}`, {
            method: 'PUT',
            headers: getStandardHeaders(),
            body: JSON.stringify(itemData)
        });
    },

    deleteItem: async (id) => {
        return await safeFetch(`/items/${id}`, {
            method: 'DELETE',
            headers: getStandardHeaders()
        });
    },

    toggleStatus: async (id, deletedStatus) => {
        return await safeFetch(`/items/${id}/status?deleted=${deletedStatus}`, {
            method: 'PATCH',
            headers: getStandardHeaders()
        });
    },

    getCart: async () => {
        try {
            return await safeFetch(`/cart`, { headers: getStandardHeaders() });
        } catch (error) {
            return [];
        }
    },

    updateCartItem: async (itemId, quantity) => {
        return await safeFetch(`/cart`, {
            method: 'POST',
            headers: getStandardHeaders(),
            body: JSON.stringify({ itemId, quantity })
        });
    },

    clearCart: async () => {
        try {
            await safeFetch(`/cart`, {
                method: 'DELETE',
                headers: getStandardHeaders()
            });
            return true;
        } catch (error) {
            return false;
        }
    }
};

export default API;