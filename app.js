import Store from './services/Store.js';
import Router from './services/Router.js';
import { getCartCount } from "./services/Cart.js";
import { Toast } from "./services/Toast.js";
import API from "./services/API.js";

import { ItemsPage } from './components/ItemsPage.js';
import { CartPage } from "./components/CartPage.js";
import { ItemDetailsPage } from "./components/ItemDetailsPage.js";
import { CheckoutSuccessPage } from './components/CheckoutSuccessPage.js';
import { NotFoundPage } from './components/NotFoundPage.js';
import { AuthPage } from './components/AuthPage.js';
import { AdminPage } from './components/AdminPage.js';
import { OrdersPage } from './components/OrdersPage.js';

window.app = {
    store: Store,
    router: Router
};

window.addEventListener("appauthchange", () => {
    updateAuthUI();
    updateDesktopMenu();
    updateMenuUI();
    updateResetButtonUI();
});

async function performLogout() {
    const wasDemoMode = localStorage.getItem("pokemart_demo_mode") === "true";

    await API.logout(); 
    
    app.store.user = null; 
    app.store.searchQuery = "";
    app.store.selectedCategory = "";
    app.store.items = null;
    
    window.dispatchEvent(new CustomEvent("appcartchange"));
    Toast.show("Sessão encerrada com sucesso.", "info");

    if (wasDemoMode) {
        window.location.href = "/";
    } else {
        app.router.go("/");
    }
}

window.addEventListener("DOMContentLoaded", () => { 
    app.router.init();
    updateCartUI();
    updateDesktopMenu();
    updateMenuUI();
    updateActiveLinkUI(location.pathname);
    updateResetButtonUI();

    const btnOpen = document.querySelector("#hamburger-menu");
    const btnClose = document.querySelector("#close-menu");
    const overlay = document.querySelector("#menu-overlay");

    if (btnOpen) {
        btnOpen.addEventListener("click", (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    const resetBtn = document.querySelector("#reset-app-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            const confirmReset = confirm("Deseja resetar as alterações do Modo Demo e voltar ao início?");
            
            if (confirmReset) {
                await API.logout(); 

                const keysToRemove = [
                    "pokemart-items",
                    "pokemart-user",
                    "pokemart-cart-anonymous",
                    "pokemart-cart",
                    "pokemart_role",
                    "pokemart_demo_mode"
                ];

                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                window.location.href = "/";
            }
        });
    }

    if (btnClose) btnClose.addEventListener("click", toggleMenu);
    if (overlay) overlay.addEventListener("click", toggleMenu);
});

window.addEventListener("appcartchange", () => {
    updateCartUI();
});

function updateCartUI() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    const qty = getCartCount();
    
    badge.textContent = qty;
    badge.hidden = qty === 0;

    if (qty > 0) {
        badge.classList.remove("pulse-animation");
        void badge.offsetWidth;
        badge.classList.add("pulse-animation");
    }
}

function updateAuthUI() {
    const loginLink = document.getElementById("login-link");
    if (!loginLink) return;

    const user = app.store.user;

    if (user) {
        loginLink.textContent = "Sair";
        loginLink.href = "#"; 
        
        loginLink.onclick = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            performLogout();
        };
    } else {
        loginLink.textContent = "Entrar";
        loginLink.href = "/login";
        loginLink.onclick = null; 
    }
}

function toggleMenu() {
    const drawer = document.getElementById("mobile-menu");
    const overlay = document.getElementById("menu-overlay");
    if (!drawer || !overlay) return;

    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
}

function updateDesktopMenu() {
    const container = document.getElementById("desktop-links");
    if (!container) return;

    const user = app.store.user;
    
    let html = `<a href="/" data-link>Início</a>`;

    if (user) {
        html += `<a href="/orders" data-link>Meus Pedidos</a>`;

        if (user.role === "ADMIN") {
            html += `<a href="/admin" data-link>Administração</a>`;
        }

        html += `<a href="#" id="desktop-logout">Sair</a>`;
    } else {
        html += `<a href="/login" data-link>Entrar</a>`;
    }

    container.innerHTML = html;

    const logoutBtn = document.getElementById("desktop-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            performLogout();
        });
    }
}

function updateMenuUI() {
    const menuLinks = document.getElementById("menu-links");
    if (!menuLinks) return;

    const user = app.store.user;
    menuLinks.innerHTML = "";

    addMenuLink("Início", "/");
    addMenuLink("Meu Carrinho", "/cart");

    if (user) {
        addMenuLink("Meus Pedidos", "/orders");

        if (user.role === "ADMIN") {
            addMenuLink("Administração", "/admin");
        }

        const logoutLi = document.createElement("li");
        logoutLi.innerHTML = `<button class="menu-logout-btn">Sair</button>`;
        logoutLi.querySelector("button").onclick = () => {
            toggleMenu(); 
            performLogout();
        };
        menuLinks.appendChild(logoutLi);
    } else {
        addMenuLink("Entrar", "/login");
    }
}

function addMenuLink(text, path) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = text;
    link.href = path;
    
    link.onclick = (e) => {
        e.preventDefault();
        toggleMenu();
        app.router.go(path);
    };
    
    li.appendChild(link);
    document.getElementById("menu-links").appendChild(li);
}

window.addEventListener("approutechange", (event) => {
    updateActiveLinkUI(event.detail.route);
});

function updateActiveLinkUI(currentRoute) {
    const mobileLinks = document.querySelectorAll("#menu-links a");

    mobileLinks.forEach(link => {
        link.classList.remove("active-link");

        const linkPath = link.getAttribute("href");
        
        if (linkPath === "/" && (currentRoute === "/" || currentRoute === "")) {
            link.classList.add("active-link");
        } else if (linkPath !== "/" && currentRoute.startsWith(linkPath)) {
            link.classList.add("active-link");
        }
    });
}

function updateResetButtonUI() {
    const resetBtn = document.querySelector("#reset-app-btn");
    if (!resetBtn) return;

    const isDemoMode = localStorage.getItem("pokemart_demo_mode") === "true";
    
    resetBtn.hidden = !isDemoMode;
}