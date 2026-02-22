import { BasePage } from "./BasePage.js";

export class NotFoundPage extends BasePage {
    constructor() {
        super();
    }

    async connectedCallback() {
        await this.loadInfrastructure("/components/NotFoundPage.css", "not-found-page-template");

        if (!this.root.innerHTML.trim()) {
            this.root.innerHTML = `
                <section role="alert" aria-live="assertive">
                    <h2>404 - Página não encontrada</h2>
                    <a href="/" data-link>Voltar para a PokéMart</a>
                </section>
            `;
        }
    }
}

customElements.define("not-found-page", NotFoundPage);