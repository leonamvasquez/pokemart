import { BasePage } from "./BasePage.js";
import { 
    isValidEmail,
    isValidPassword
} from "../services/Text.js";
import { Toast } from "../services/Toast.js";
import API from "../services/API.js";

export class AuthPage extends BasePage {
    constructor() {
        super();
        this.isLogin = true;
    }

    async connectedCallback() {
        await this.loadInfrastructure("/components/AuthPage.css", "auth-page-template");

        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const toggleBtn = this.root.querySelector("#toggle-auth-mode");
        const form = this.root.querySelector("#auth-form");

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const card = this.root.querySelector(".auth-card");
                card.classList.add("fade-out");

                setTimeout(() => {
                    this.isLogin = !this.isLogin;
                    this.clearInputs();
                    this.render();

                    requestAnimationFrame(() => {
                        card.classList.remove("fade-out");
                    });
                }, 150);
            });
        }

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAuth();
            });
        }

        const demoAdminBtn = this.root.querySelector("#demo-admin-btn");
        if (demoAdminBtn) {
            demoAdminBtn.addEventListener("click", () => this.loginAsDemoAdmin());
        }

        this.root.addEventListener("pointerdown", (e) => {
            const btn = e.target.closest(".auth-btn");
            if (btn) btn.classList.add("is-active");
        });

        const removeActive = (e) => {
            const btn = e.target.closest(".auth-btn");
            if (btn) btn.classList.remove("is-active");
        };

        this.root.addEventListener("pointerup", removeActive);
        this.root.addEventListener("pointercancel", removeActive);
    }

    loginAsDemoAdmin() {
        const adminEmail = "admin@admin.com";
        let adminUser = app.store.users?.find(u => u.email === adminEmail);

        if (!adminUser) {
            adminUser = {
                id: "ef9a58ea-6c5d-418a-a598-dfb293e7e77d",
                email: adminEmail,
                name: "Professor Carvalho",
                cart: [],
                orders: [],
                role: "ADMIN"
            };
            if(app.store.users) {
                app.store.users = [...app.store.users, adminUser];
            }
        }

        app.store.user = adminUser;
        
        localStorage.setItem("pokemart_role", "ADMIN");
        
        const redirectTarget = sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        
        Toast.show("Bem-vindo. Acesso Administrativo liberado (Modo Local).", "success");
        app.router.go(redirectTarget);
    }

    async handleAuth() {
        const email = this.root.querySelector("#email").value.trim();
        const password = this.root.querySelector("#password").value;
        const errorEl = this.root.querySelector("#error-message");
        const submitBtn = this.root.querySelector("#auth-submit-btn");

        if (errorEl) errorEl.hidden = true;

        if (!email || !password) {
            this.showError("Preencha todos os campos.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = this.isLogin ? "Conectando..." : "Cadastrando...";

        if (this.isLogin) {
            try {
                const authResponse = await API.login(email, password);
                
                localStorage.setItem("pokemart_role", authResponse.role);
                
                app.store.user = {
                    id: authResponse.id,
                    email: authResponse.email || email,
                    name: authResponse.name || email.split('@')[0], 
                    role: authResponse.role
                };
                
                Toast.show("Login realizado com sucesso!", "success");

                const redirectTarget = sessionStorage.getItem("redirectAfterLogin") || "/";
                sessionStorage.removeItem("redirectAfterLogin");
                app.router.go(redirectTarget);
                
                return; 
            } catch (error) {
                if (error.data && error.data.error) {
                    this.showError(error.data.error);
                } else {
                    this.showError("E-mail ou senha incorretos.");
                }
            }
        } else {
            if (!isValidEmail(email)) {
                this.showError("Por favor, insira um e-mail válido.");
                submitBtn.disabled = false;
                this.render();
                return;
            }

            if (!isValidPassword(password)) {
                this.showError("A senha deve ter 8+ caracteres, maiúsculas, minúsculas, números e símbolos.");
                submitBtn.disabled = false;
                this.render();
                return;
            }

            const confirmPass = this.root.querySelector("#confirm-password").value;
            if (password !== confirmPass) {
                this.showError("As senhas não coincidem!");
                submitBtn.disabled = false;
                this.render();
                return;
            }

            const newUser = { 
                email: email, 
                password: password, 
                name: email.split('@')[0]
            };
            
            try {
                await API.register(newUser);
                Toast.show("Treinador cadastrado com sucesso no PokéMart! Pode entrar.", "success");
                this.isLogin = true;
                this.clearInputs();
            } catch (error) {
                if (error.data) {
                    if (error.data.errors && error.data.errors.length > 0) {
                        const mensagens = error.data.errors.map(e => e.message).join(" | ");
                        this.showError(mensagens);
                    } else if (error.data.error) {
                        this.showError(error.data.error);
                    } else {
                        this.showError("Erro ao cadastrar. Verifique os dados.");
                    }
                } else {
                    this.showError("Erro inesperado ao tentar cadastrar.");
                }
            }
        }

        submitBtn.disabled = false;
        this.render();
    }

    render() {
        if (!this.cssLoaded) return;

        const title = this.root.querySelector("#auth-title");
        const subtitle = this.root.querySelector("#auth-subtitle");
        const submitBtn = this.root.querySelector("#auth-submit-btn");
        const toggleBtn = this.root.querySelector("#toggle-auth-mode");
        const toggleText = this.root.querySelector("#toggle-text");
        const confirmGroup = this.root.querySelector("#confirm-password-group");

        if (!title) return;

        if (this.isLogin) {
            title.textContent = "Bem-vindo de volta";
            subtitle.textContent = "Entre com sua conta para salvar sua jornada.";
            submitBtn.textContent = "Entrar";
            toggleText.textContent = "Ainda não tem uma conta?";
            toggleBtn.textContent = "Cadastre-se";
            confirmGroup.hidden = true;

            this.removeAttribute("mode");
        } else {
            title.textContent = "Criar Conta";
            subtitle.textContent = "Comece sua aventura no PokéMart hoje mesmo.";
            submitBtn.textContent = "Cadastrar";
            toggleText.textContent = "Já possui uma conta?";
            toggleBtn.textContent = "Entrar";
            confirmGroup.hidden = false;

            this.setAttribute("mode", "register");
        }
    }

    showError(msg) {
        const errorEl = this.root.querySelector("#error-message");
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.hidden = false;
            errorEl.setAttribute("role", "alert"); 
        }
    }

    clearInputs() {
        const inputs = this.root.querySelectorAll("input");
        inputs.forEach(input => {
            input.value = "";
        });
        const errorEl = this.root.querySelector("#error-message");
        if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = ""; 
            errorEl.removeAttribute("role");
        }
    }
}

customElements.define("auth-page", AuthPage);