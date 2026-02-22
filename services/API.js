const API = {
    url: "/data/items.json",

    fetchItems: async () => {
        try {
            const response = await fetch(API.url);

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados da API:", error);
            return [];
        }
    }
}

export default API;