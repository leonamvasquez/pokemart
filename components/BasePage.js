export class BasePage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.cssLoaded = false;
    }

    async loadInfrastructure(cssPath, templateId) {
        this.setAttribute("loading", "");

        try {
            const response = await fetch(cssPath);
            if (!response.ok) throw new Error("Falha no CSS");
            const cssText = await response.text();
            
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            this.root.adoptedStyleSheets = [sheet];
            this.cssLoaded = true;

            const template = document.getElementById(templateId);
            if (template) {
                this.root.innerHTML = "";
                this.root.appendChild(template.content.cloneNode(true));
            }
        } catch (error) {
            console.error(`Erro ao carregar base de ${templateId}:`, error);
        } finally {
            this.removeAttribute("loading");
        }
    }
}