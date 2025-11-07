// ARQUIVO: /public/js/utils.js

/**
 * Funções utilitárias globais para a aplicação.
 */

/**
 * Formata data/hora do formato ISO para o padrão brasileiro.
 * @param {string} isoString - A data no formato ISO.
 * @param {boolean} includeTime - Se deve incluir a hora.
 * @returns {string} - A data formatada.
 */
function formatDateTime(isoString, includeTime = false) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    let formatted = date.toLocaleDateString('pt-BR', options);
    if (includeTime) {
        formatted += ` - ${date.toLocaleTimeString('pt-BR')}`;
    }
    return formatted;
}

/**
 * Cria um Accordion do Bootstrap para exibir dados complexos.
 * @param {string} id - Um ID único para o accordion.
 * @param {string} buttonText - O texto a ser exibido no botão do accordion.
 * @param {Object} details - Um objeto com os detalhes a serem mostrados no corpo do accordion.
 * @returns {string} - O HTML do accordion.
 */
function createAccordion(id, buttonText, details) {
    if (!buttonText || buttonText.trim() === 'undefined, undefined') buttonText = 'Ver Detalhes';
    const detailsHtml = Object.entries(details)
        .map(([key, value]) => `<strong>${key}:</strong> ${value || 'N/A'}<br>`)
        .join('');

    return `
        <div class="accordion accordion-flush" id="accordion-${id}">
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}">
                        ${buttonText}
                    </button>
                </h2>
                <div id="collapse-${id}" class="accordion-collapse collapse" data-bs-parent="#accordion-${id}">
                    <div class="accordion-body">${detailsHtml}</div>
                </div>
            </div>
        `;
}