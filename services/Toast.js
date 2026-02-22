export const Toast = {
    init() {
        if (document.getElementById('toast-container')) return;
        const container = document.createElement('div');
        container.id = 'toast-container';
        
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('role', 'status');
        
        document.body.appendChild(container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;

        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
        };

        const iconSvg = icons[type] || icons.info;

        toast.innerHTML = `${iconSvg} <span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }
};