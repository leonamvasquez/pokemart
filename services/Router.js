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
            try {
                const realUser = await API.getMe();

                if (!realUser) {
                    app.store.user = null;
                    history.replaceState({ route: "/login" }, '', "/login");
                    Toast.show("Sua sessão expirou. Faça login novamente.", "warning");
                    window.dispatchEvent(new CustomEvent("appauthchange")); 
                    return document.createElement("auth-page");
                }

                if (realUser.role !== "ADMIN") {
                    console.warn("Tentativa de spoofing bloqueada. O usuário não é ADMIN.");
                    app.store.user.role = "USER";
                    history.replaceState({ route: "/" }, '', "/");
                    Toast.show("Acesso restrito. Apenas administradores têm permissão.", "error");
                    return document.createElement("items-page"); 
                }
            } catch (error) {
                history.replaceState({ route: "/" }, '', "/");
                Toast.show("Erro ao validar permissões. Tente novamente.", "error");
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