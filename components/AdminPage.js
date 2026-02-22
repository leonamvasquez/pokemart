import { BasePage } from "./BasePage.js";
import { loadItems } from "../services/Items.js";
import { normalizeText, formatPrice } from "../services/Text.js";
import { Toast } from "../services/Toast.js";

export class AdminPage extends BasePage {
    constructor() {
        super();
        this.searchQuery = "";
        this.selectedCategory = "";
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async connectedCallback() {
        const user = app.store.user;
        if (!user || user.role !== "ADMIN") {
            app.router.go("/");
            return;
        }

        await this.loadInfrastructure("/components/AdminPage.css", "admin-page-template");

        this.renderSkeletons();

        try {
            await loadItems();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error("Erro ao carregar AdminPage:", error);
        } 
    }

    setupEventListeners() {
        const $ = (s) => this.root.querySelector(s);

        $("#admin-search")?.addEventListener("input", (e) => {
            this.searchQuery = e.target.value.trim();
            this.currentPage = 1;
            this.renderTableWithFilters();
        });

        $("#admin-categories")?.addEventListener("click", (e) => {
            const btn = e.target.closest(".cat-chip");
            if (btn) {
                const newCat = btn.dataset.category;
                this.selectedCategory = (this.selectedCategory === newCat) ? "" : newCat;
                this.currentPage = 1;
                this.renderTableWithFilters();
            }
        });

        const modal = $("#product-modal");
        const form = $("#product-form");

        $(".btn-add")?.addEventListener("click", () => {
            this.openModal(); 
        });

        $("#modal-close-btn")?.addEventListener("click", () => this.closeModal());
        $("#btn-cancel")?.addEventListener("click", () => this.closeModal());

        form?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleSaveItem();
        });

        this.root.addEventListener("click", (e) => {
            const btnEdit = e.target.closest(".edit");
            const btnToggle = e.target.closest(".toggle-status");

            if (e.target.id === "product-modal") {
                this.closeModal();
            }

            if (btnEdit) {
                const id = Number(btnEdit.dataset.id);
                const item = app.store.items.find(i => i.id === id);
                if (item) this.openModal(item);
            }

            if (btnToggle) {
                const id = Number(btnToggle.dataset.id);
                this.handleToggleStatus(id);
            }

            if (e.target.closest("#btn-prev-page")) {
                this.currentPage--;
                this.renderTableWithFilters();
            }
            if (e.target.closest("#btn-next-page")) {
                this.currentPage++;
                this.renderTableWithFilters();
            }
        });

        this.root.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const modal = this.root.querySelector("#product-modal");
                if (modal && !modal.hidden) {
                    this.closeModal();
                }
            }
        });

        window.addEventListener("appitemschange", () => this.render());
    }

    openModal(item = null) {
        const $ = (s) => this.root.querySelector(s);
        const modal = $("#product-modal");
        const title = $("#modal-title");
        const editIdInput = $("#edit-id");

        if (!modal) return;

        if (item) {
            title.textContent = "Editar Item";
            editIdInput.value = item.id;
            $("#p-name").value = item.name;
            $("#p-price").value = item.price;
            $("#p-stock").value = item.stock;
            $("#p-category").value = item.category;
            $("#p-image").value = item.image;
            $("#p-desc").value = item.description;
        } else {
            title.textContent = "Novo Item";
            editIdInput.value = "";
            $("#product-form").reset();
            
            $("#p-image").value = ""; 
        }

        modal.hidden = false;
    }

    closeModal() {
        const modal = this.root.querySelector("#product-modal");
        if (modal) modal.hidden = true;
    }

    async handleSaveItem() {
        const $ = (s) => this.root.querySelector(s);
        const idStr = $("#edit-id").value;
        const stockVal = Number($("#p-stock").value);
        const priceVal = Number($("#p-price").value);
        
        const inputImageVal = $("#p-image").value.trim();
        const finalImageVal = inputImageVal !== "" ? inputImageVal : "/images/missingno.png";

        if (priceVal <= 0) {
            Toast.show("O preço do item deve ser maior que zero.", "error");
            return;
        }

        if (stockVal < 0) {
            Toast.show("O estoque não pode ser negativo.", "error");
            return;
        }

        const newItem = {
            id: idStr ? Number(idStr) : Date.now(),
            name: $("#p-name").value,
            price: priceVal,
            stock: stockVal,
            category: $("#p-category").value,
            image: finalImageVal,
            description: $("#p-desc").value,
            deleted: idStr ? (app.store.items.find(i => i.id == idStr)?.deleted || false) : false
        };

        let items = [...(app.store.items || [])];

        if (idStr) {
            const index = items.findIndex(i => i.id === newItem.id);
            if (index > -1) items[index] = newItem;
        } else {
            items.push(newItem);
        }

        this.saveItemsToStorage(items);
        this.closeModal();
        Toast.show(idStr ? "Item atualizado!" : "Item criado com sucesso!", "success");
    }

    handleToggleStatus(id) {
        const items = [...app.store.items];
        const itemIndex = items.findIndex(i => i.id === id);

        if (itemIndex > -1) {
            const item = items[itemIndex];
            item.deleted = !item.deleted;
            this.saveItemsToStorage(items);

            if (item.deleted) {
                Toast.show(`Venda de ${item.name} pausada.`, "info"); 
            } else {
                Toast.show(`${item.name} reativado para venda!`, "success");
            }
        }
    }

    saveItemsToStorage(items) {
        app.store.items = items;
        localStorage.setItem("pokemart-items", JSON.stringify(items));
    }

    render() {
        if (!this.cssLoaded) return;

        if (!app.store.items) {
            this.renderSkeletons();
            return;
        }

        const items = app.store.items;
        this.updateStats(items);
        this.renderTableWithFilters();
    }

    renderSkeletons() {
        const stats = {
            total: this.root.querySelector("#total-items"),
            value: this.root.querySelector("#total-value"),
            cats: this.root.querySelector("#total-cats")
        };

        if (stats.total) stats.total.innerHTML = '<div class="skeleton" style="width: 40px; height: 28px; margin: 0 auto; border-radius: 8px;"></div>';
        if (stats.value) stats.value.innerHTML = '<div class="skeleton" style="width: 100px; height: 28px; margin: 0 auto; border-radius: 8px;"></div>';
        if (stats.cats) stats.cats.innerHTML = '<div class="skeleton" style="width: 30px; height: 28px; margin: 0 auto; border-radius: 8px;"></div>';

        const tbody = this.root.querySelector("#inventory-list");
        if (!tbody) return;

        tbody.innerHTML = Array(5).fill(0).map(() => `
            <tr style="pointer-events: none; border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px;"><div class="skeleton" style="width: 40px; height: 40px; border-radius: 8px;"></div></td>
                <td style="padding: 12px;"><div class="skeleton" style="width: 140px; height: 16px;"></div></td>
                <td style="padding: 12px;"><div class="skeleton" style="width: 90px; height: 16px;"></div></td>
                <td style="padding: 12px;"><div class="skeleton" style="width: 60px; height: 24px; border-radius: 12px;"></div></td>
                <td style="padding: 12px;"><div class="skeleton" style="width: 30px; height: 16px;"></div></td>
                <td style="padding: 12px;"><div class="skeleton" style="width: 70px; height: 16px;"></div></td>
                <td style="padding: 12px;">
                    <div style="display: flex; gap: 8px;">
                        <div class="skeleton" style="width: 32px; height: 32px; border-radius: 6px;"></div>
                        <div class="skeleton" style="width: 32px; height: 32px; border-radius: 6px;"></div>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    renderTableWithFilters() {
        const items = app.store.items || [];
        const filteredItems = this.applyFilters(items);
        this.renderCategories(items);
        this.renderTable(filteredItems);
    }

    applyFilters(items) {
        let result = [...items];
        
        if (this.selectedCategory) {
            result = result.filter(i => i.category === this.selectedCategory);
        }
        
        if (this.searchQuery) {
            const normalizedQuery = normalizeText(this.searchQuery);
            result = result.filter(i => 
                normalizeText(i.name).includes(normalizedQuery) || 
                String(i.id).includes(normalizedQuery)
            );
        }
        return result;
    }

    renderCategories(allItems) {
        const list = this.root.querySelector("#admin-categories");
        if (!list) return;

        const counts = allItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});

        let html = `
            <button class="cat-chip ${this.selectedCategory === "" ? 'active' : ''}" data-category="">
                Todos <span class="count">${allItems.length}</span>
            </button>
        `;

        html += Object.entries(counts).map(([name, count]) => `
            <button class="cat-chip ${this.selectedCategory === name ? 'active' : ''}" data-category="${name}">
                ${name} <span class="count">${count}</span>
            </button>
        `).join("");

        list.innerHTML = html;
    }

    updateStats(items) {
        const totalItemsEl = this.root.querySelector("#total-items");
        const totalValueEl = this.root.querySelector("#total-value");
        const totalCatsEl = this.root.querySelector("#total-cats");

        if (totalItemsEl) totalItemsEl.textContent = items.length;
        
        if (totalValueEl) {
            const activeItems = items.filter(i => !i.deleted);
            const totalValue = activeItems.reduce((acc, item) => acc + (item.price * (item.stock || 0)), 0);
            totalValueEl.textContent = `₽ ${formatPrice(totalValue)}`;
        }
        
        if (totalCatsEl) {
            const categories = new Set(items.map(i => i.category));
            totalCatsEl.textContent = categories.size;
        }
    }

    renderTable(items) {
        const tbody = this.root.querySelector("#inventory-list");
        const tableContainer = this.root.querySelector(".table-container");
        if (!tbody || !tableContainer) return;

        const totalPages = Math.ceil(items.length / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedItems = items.slice(start, start + this.itemsPerPage);

        if (paginatedItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #6b7280;">Nenhum item encontrado.</td></tr>`;
            this.renderPaginationUI(tableContainer, 1, 1);
            return;
        }
        
        tbody.innerHTML = paginatedItems.map(item => {
            const isInactive = item.deleted === true;
            const isOutOfStock = item.stock === 0;

            let stockColor = '#111827';
            if (isOutOfStock) stockColor = '#ef4444';
            else if (item.stock < 5) stockColor = '#eab308';

            return `
            <tr class="${isInactive ? 'row-deleted' : ''}">
                <td class="item-img-cell">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </td>
                <td>
                    <div class="item-name-text">${item.name}</div>
                    <div class="item-id-text">ID: ${item.id}</div>
                </td>
                <td>
                    <span class="badge-cat">${item.category}</span>
                </td>
                <td>
                    <span class="badge-status ${isInactive ? 'inactive' : 'active'}">
                        ${isInactive ? 'Inativo' : 'Ativo'}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 700; color: ${stockColor}">
                        ${item.stock} un.
                    </span>
                </td>
                <td class="item-price-text">₽ ${formatPrice(item.price)}</td>
                <td class="actions-cell">
                    <button class="btn-icon edit" aria-label="Editar detalhes de ${item.name}" title="Editar" data-id="${item.id}">✎</button>
                    
                    <button 
                        class="btn-icon toggle-status ${isInactive ? 'toggle-off' : 'toggle-on'}" 
                        aria-label="${isInactive ? `Reativar venda de ${item.name}` : `Pausar venda de ${item.name}`}"
                        title="${isInactive ? 'Reativar Venda' : 'Pausar Venda'}" 
                        data-id="${item.id}"
                    >
                        ${isInactive ? '✅' : '⛔'} 
                    </button>
                </td>
            </tr>
        `}).join("");

        this.renderPaginationUI(tableContainer, this.currentPage, totalPages);
    }

    renderPaginationUI(container, current, total) {
        let pagContainer = this.root.querySelector(".admin-pagination");
        if (!pagContainer) {
            pagContainer = document.createElement("div");
            pagContainer.className = "admin-pagination";
            pagContainer.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid var(--border-light); background: white; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;";
            container.appendChild(pagContainer);
        }

        const isPrevDisabled = current === 1;
        const isNextDisabled = current === total;

        pagContainer.innerHTML = `
            <span style="color: var(--text-muted); font-size: 14px;" aria-live="polite">Página ${current} de ${total}</span>
            <div style="display: flex; gap: 8px;">
                <button id="btn-prev-page" aria-label="Página anterior" ${isPrevDisabled ? 'disabled' : ''} style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-light); background: ${isPrevDisabled ? '#f3f4f6' : 'white'}; color: ${isPrevDisabled ? '#9ca3af' : 'var(--text-main)'}; font-weight: bold; cursor: ${isPrevDisabled ? 'not-allowed' : 'pointer'};">Anterior</button>
                <button id="btn-next-page" aria-label="Próxima página" ${isNextDisabled ? 'disabled' : ''} style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-light); background: ${isNextDisabled ? '#f3f4f6' : 'white'}; color: ${isNextDisabled ? '#9ca3af' : 'var(--text-main)'}; font-weight: bold; cursor: ${isNextDisabled ? 'not-allowed' : 'pointer'};">Próxima</button>
            </div>
        `;
    }
}

customElements.define("admin-page", AdminPage);