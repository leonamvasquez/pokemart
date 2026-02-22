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

    go: (route, addToHistory = true) => {
        if (addToHistory) {
            history.pushState({ route }, '', route);
        }

        let pageElement = Router.resolveRoute(route);
        Router.render(pageElement);

        window.dispatchEvent(new CustomEvent("approutechange", { detail: { route } }));
    },

    resolveRoute: (route) => {
        const protectedRoutes = ["/cart", "/success", "/orders", "/admin"];

        if (protectedRoutes.includes(route) && !app.store.user) {
            sessionStorage.setItem("redirectAfterLogin", route);
            history.replaceState({ route: "/login" }, '', "/login");
            return document.createElement("auth-page");
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