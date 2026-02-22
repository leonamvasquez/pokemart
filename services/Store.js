const Store = {
    items: null,
    users: JSON.parse(localStorage.getItem("pokemart-users")) ?? [],
    user: JSON.parse(localStorage.getItem("pokemart-user")) ?? null,
    cart: [],
    selectedCategory: "",
    searchQuery: "",
    sortBy: ""
};

const initialUser = JSON.parse(localStorage.getItem("pokemart-user"));
const anonymousCart = JSON.parse(localStorage.getItem("pokemart-cart-anonymous")) ?? [];

Store.cart = initialUser ? (initialUser.cart || []) : anonymousCart;

const proxiedStore = new Proxy(Store, {
    set(target, property, value) {
        const oldValue = target[property];  
        target[property] = value;

        const syncUsersList = (updatedUser) => {
            target.users = target.users.map(u =>
                u.email === updatedUser.email ? updatedUser : u
            );
            localStorage.setItem("pokemart-users", JSON.stringify(target.users));
        };

        if (property === "items") {
            window.dispatchEvent(new Event("appitemschange"));
        }

        if (property === "user") {
            const newUser = value;

            if (newUser && !oldValue) {
                const currentAnonCart = target.cart || [];
                const userSavedCart = newUser.cart || [];
                const mergedCart = [...userSavedCart];

                currentAnonCart.forEach(anonItem => {
                    const index = mergedCart.findIndex(uItem => uItem.itemId === anonItem.itemId);
                    if (index > -1) mergedCart[index].quantity += anonItem.quantity;
                    else mergedCart.push(anonItem);
                });

                newUser.cart = mergedCart;
                target.cart = mergedCart;
                syncUsersList(newUser);
                localStorage.removeItem("pokemart-cart-anonymous");
            } 
            else if (!newUser && oldValue) {
                target.cart = [];
                localStorage.removeItem("pokemart-cart-anonymous");
            } 
            else if (newUser && oldValue) {
                syncUsersList(newUser);
            }

            if (newUser) localStorage.setItem("pokemart-user", JSON.stringify(newUser));
            else localStorage.removeItem("pokemart-user");

            window.dispatchEvent(new Event("appauthchange"));
            window.dispatchEvent(new Event("appcartchange"));
        }

        if (property === "cart") {
            if (target.user) {
                target.user.cart = value;
                syncUsersList(target.user);
                localStorage.setItem("pokemart-user", JSON.stringify(target.user));
            } else {
                localStorage.setItem("pokemart-cart-anonymous", JSON.stringify(value));
            }
            window.dispatchEvent(new Event("appcartchange"));
        }

        if (property === "users") {
            localStorage.setItem("pokemart-users", JSON.stringify(value));
        }

        if (["selectedCategory", "searchQuery", "sortBy"].includes(property)) {
            window.dispatchEvent(new Event("appitemschange"));
        }

        return true;
    }
});

export default proxiedStore;