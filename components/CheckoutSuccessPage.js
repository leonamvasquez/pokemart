import { BasePage } from "./BasePage.js";

export class CheckoutSuccessPage extends BasePage {
  constructor() {
    super();
  }

  async connectedCallback() {
    await this.loadInfrastructure("/components/CheckoutSuccessPage.css", "checkout-success-template");

    const card = this.root.querySelector(".card");
    
    if (card) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.classList.add("animate-in");
        });
      });
    } else {
      this.root.innerHTML = `<section class="card" role="status" aria-live="polite">
        <h2>Compra Concluída!</h2>
        <a href="/" data-link>Voltar para a Loja</a>
      </section>`;
    }
  }
}

customElements.define("checkout-success-page", CheckoutSuccessPage);
