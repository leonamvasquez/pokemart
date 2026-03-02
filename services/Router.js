import { Toast } from "./Toast.js";
import API from "./API.js";

const Router = {
    routes: {
        "/": "items-page",
        "/cart": "cart-page",
        "/orders": "orders-page",
        "/success": "checkout-success-page",
        "/login": "auth-page",
        "/admin": "admin-page",
    },

    init: () => {
        document.body.addEventListener("click", (event) => {
            const path = event.composedPath?.() ?? [];
            const link = path.find(el => el?.tagName === "A" && el?.dataset?.link !== undefined);

            if (link) {
                event.preventDefault();
                Router.go(link.getAttribute("href"));
            }
        });

        window.addEventListener("popstate", (event) => {
            Router.go(location.pathname, false);
        });

        Router.go(location.pathname);
    },

    go: async (route, addToHistory = true) => {
        if (addToHistory) {
            history.pushState({ route }, '', route);
        }

        let pageElement = await Router.resolveRoute(route); 
        Router.render(pageElement);

        window.dispatchEvent(new CustomEvent("approutechange", { detail: { route } }));
    },

    resolveRoute: async (route) => {
        const protectedRoutes = ["/cart", "/success", "/orders"];
        const adminRoutes = ["/admin"];

        const user = app.store.user;

        if ((protectedRoutes.includes(route) || adminRoutes.includes(route)) && !user) {
            sessionStorage.setItem("redirectAfterLogin", route);
            history.replaceState({ route: "/login" }, '', "/login");
            Toast.show("Faça login para acessar esta área.", "info");
            return document.createElement("auth-page");
        }

        if (adminRoutes.includes(route)) {
            const realUser = await API.getMe();

            if (!realUser || realUser.role !== "ADMIN") {
                console.warn("Tentativa de spoofing bloqueada. O usuário não é ADMIN real.");
                
                localStorage.setItem("pokemart_role", realUser ? realUser.role : "USER");
                if (app.store.user) app.store.user.role = realUser ? realUser.role : "USER";
                
                history.replaceState({ route: "/" }, '', "/");
                Toast.show("Acesso restrito. Apenas o administradores tem permissão.", "error");
                
                window.dispatchEvent(new CustomEvent("appauthchange")); 
                
                return document.createElement("items-page"); 
            }
        }

        if (Router.routes[route]) {
            return document.createElement(Router.routes[route]);
        }

        if (route.startsWith("/item/")) {
            const el = document.createElement("item-details-page");
            const paramId = route.split("/").pop();
            el.dataset.itemId = paramId;
            return el;
        }

        return document.createElement("not-found-page");
    },

    render: (pageElement) => {
        const viewport = document.querySelector("main");
        if (!viewport) return;

        viewport.classList.add("loading");

        setTimeout(() => {
            viewport.innerHTML = "";
            viewport.appendChild(pageElement);
            
            requestAnimationFrame(() => {
                viewport.classList.remove("loading");
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }, 150);
    }
}

export default Router;