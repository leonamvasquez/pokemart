import API from "./API.js";

export async function loadItems() {
    if (app.store.items && app.store.items.length > 0) return;

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    try {
        const localItems = localStorage.getItem("pokemart-items");
        
        if (localItems) {
            try {
                await delay(800);
                app.store.items = JSON.parse(localItems);
            } catch (parseError) {
                console.warn("Cache corrompido detectado! Limpando e recarregando da API.");
                localStorage.removeItem("pokemart-items");
                throw new Error("Cache inválido");
            }
        } else {
            throw new Error("Sem cache");
        }
    } catch (error) {
        try {
            const data = await API.fetchItems();
            await delay(1200);

            const itemsWithStock = Array.isArray(data) 
                ? data.map(item => ({ ...item, stock: item.stock ?? 10 })) 
                : [];
            
            app.store.items = itemsWithStock;
            localStorage.setItem("pokemart-items", JSON.stringify(itemsWithStock));
        } catch (apiError) {
            console.error("Erro fatal: Não foi possível carregar itens nem do cache nem da API.", apiError);
            app.store.items = "ERROR";
        }
    }
}

export async function updateItemStock(id, newStock) {
    const items = app.store.items;
    const itemIndex = items.findIndex(i => i.id === Number(id));

    if (itemIndex > -1) {
        items[itemIndex].stock = newStock;
        app.store.items = [...items]; 
        localStorage.setItem("pokemart-items", JSON.stringify(app.store.items));
    }
}

export async function getItemById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) return null;

    await loadItems();
    return app.store.items.find(item => item.id === numericId) ?? null;
}

export function getCategoriesWithCount() {
    const items = app.store.items ?? [];
    if (items.length === 0) return [];

    const categoryMap = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(categoryMap).map(([name, count]) => ({ 
        name, 
        count 
    }));
}