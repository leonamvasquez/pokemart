export function normalizeText(text) {
    const safeText = String(text ?? "");

    return safeText
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const PASSWORD_REQUIREMENTS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function isValidPassword(password) {
    return PASSWORD_REQUIREMENTS.test(password);
}

export const formatPrice = (value) => {
    const number = Number(value) || 0;
    return number.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
};