const BASE_URL = "http://localhost:8080/api";

const API = {
    fetchItems: async () => {
        try {
            const response = await fetch(`${BASE_URL}/items`);
            if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar itens do Spring Boot:", error);
            return [];
        }
    },

    fetchCategories: async () => {
        try {
            const response = await fetch(`${BASE_URL}/categories`);
            if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar categorias:", error);
            return [];
        }
    },

    placeOrder: async (checkoutPayload) => {
        try {
            const response = await fetch(`${BASE_URL}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutPayload)
            });
            if (!response.ok) throw new Error(`Erro ao finalizar pedido: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha no checkout:", error);
            throw error;
        }
    },

    getUserOrders: async (userId) => {
        try {
            const response = await fetch(`${BASE_URL}/users/${userId}/orders`);
            if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar histórico de pedidos:", error);
            return [];
        }
    },

    login: async (email, password) => {
        try {
            const response = await fetch(`${BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) throw new Error("Credenciais inválidas");
            return await response.json();
        } catch (error) {
            console.error("Falha no login:", error);
            return null;
        }
    },

    register: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error("Erro ao cadastrar");
            return await response.json();
        } catch (error) {
            console.error("Falha no cadastro:", error);
            return null;
        }
    },

    createItem: async (itemData) => {
        try {
            const response = await fetch(`${BASE_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!response.ok) throw new Error("Erro ao criar item");
            return await response.json();
        } catch (error) {
            console.error("Falha ao criar item:", error);
            throw error;
        }
    },

    updateItem: async (id, itemData) => {
        try {
            const response = await fetch(`${BASE_URL}/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!response.ok) throw new Error("Erro ao atualizar item");
            return await response.json();
        } catch (error) {
            console.error("Falha ao atualizar item:", error);
            throw error;
        }
    },

    deleteItem: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/items/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Erro ao deletar item");
            return true; // Status 204 No Content não retorna JSON
        } catch (error) {
            console.error("Falha ao deletar item:", error);
            throw error;
        }
    },

    toggleStatus: async (id, deletedStatus) => {
        try {
            const response = await fetch(`${BASE_URL}/items/${id}/status?deleted=${deletedStatus}`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error("Erro ao mudar status");
            return true;
        } catch (error) {
            console.error("Falha ao mudar status:", error);
            throw error;
        }
    }
};

export default API;