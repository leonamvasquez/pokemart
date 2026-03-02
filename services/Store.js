const Store = {
    items: null,
    pagination: { currentPage: 0, totalPages: 1, totalElements: 0, hasNext: false },
    user: JSON.parse(localStorage.getItem("pokemart-user")) ?? null,
    cart: [],
    selectedCategory: "",
    searchQuery: "",
    sortBy: ""
};

const initialUser = JSON.parse(localStorage.getItem("pokemart-user"));
const anonymousCart = JSON.parse(localStorage.getItem("pokemart-cart-anonymous")) ?? [];

Store.cart = initialUser ? (JSON.parse(localStorage.getItem("pokemart-cart")) ?? []) : anonymousCart;

const proxiedStore = new Proxy(Store, {
    set(target, property, value) {
        const oldValue = target[property];  
        target[property] = value;

        if (property === "items") {
            window.dispatchEvent(new Event("appitemschange"));
        }

        if (property === "user") {
            const newUser = value;

            if (newUser && !oldValue) {
                localStorage.removeItem("pokemart-cart-anonymous");
            } 
            else if (!newUser && oldValue) {
                target.cart = [];
                localStorage.removeItem("pokemart-cart-anonymous");
                localStorage.removeItem("pokemart-cart");
            } 

            if (newUser) localStorage.setItem("pokemart-user", JSON.stringify(newUser));
            else localStorage.removeItem("pokemart-user");

            window.dispatchEvent(new Event("appauthchange"));
            window.dispatchEvent(new Event("appcartchange"));
        }

        if (property === "cart") {
            if (target.user) {
                localStorage.setItem("pokemart-cart", JSON.stringify(value));
            } else {
                localStorage.setItem("pokemart-cart-anonymous", JSON.stringify(value));
            }
            window.dispatchEvent(new Event("appcartchange"));
        }

        if (["selectedCategory", "searchQuery", "sortBy", "categoryStats"].includes(property)) {
            window.dispatchEvent(new Event("appitemschange"));
        }

        return true;
    }
});

export default proxiedStore;