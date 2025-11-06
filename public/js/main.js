// ARQUIVO: /public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Variável global para armazenar os dados da última busca (usado para exportação)
    let currentData = [];

    // --- FUNÇÕES DE LÓGICA ---

    /**
     * Renderiza uma tabela HTML a partir de um array de objetos.
     * @param {Array<Object>} data - Os dados a serem exibidos.
     */
    function renderTable(data) {
        const container = $('#table-responsive-container');
        const entity = $('#filter-entity').selectedOptions[0].text;

        if (!data || data.length === 0) {
            container.innerHTML = `<p class="text-center p-3">Nenhum dado de "${entity}" encontrado para os filtros selecionados.</p>`;
            return;
        }

        // Cria os cabeçalhos da tabela a partir das chaves do primeiro objeto
        const headers = Object.keys(data[0]);
        const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;

        // Cria o corpo da tabela, convertendo objetos/arrays aninhados em string para exibição
        const bodyHtml = `<tbody>${data.map(row =>
            `<tr>${headers.map(header => {
                const cellData = row[header];
                const displayData = (typeof cellData === 'object' && cellData !== null) ? JSON.stringify(cellData) : cellData;
                return `<td>${displayData}</td>`;
            }).join('')}</tr>`
        ).join('')}</tbody>`;

        // Insere a tabela no container
        container.innerHTML = `<table class="table table-dark table-hover data-table">${headerHtml}${bodyHtml}</table>`;
    }

    /**
     * Filtra as linhas de uma tabela com base em um texto de busca.
     * @param {string} searchText - O texto a ser filtrado.
     */
    function filterTable(searchText) {
        const table = $('.data-table');
        if (!table) return;

        const lowerCaseSearchText = searchText.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(row => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(lowerCaseSearchText) ? '' : 'none';
        });
    }


    // --- EVENT LISTENERS PRINCIPAIS ---

    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');

    $('#btn-filtrar').addEventListener('click', async () => {
        const entity = $('#filter-entity').value;
        const startDate = $('#filter-startDate').value;
        const endDate = $('#filter-endDate').value;

        const outputDiv = $('#output');
        const dataContainer = $('#data-container');

        // Mostra feedback para o usuário e esconde a tabela antiga
        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('data_inicio', startDate); // Ajustado para o nome de parâmetro da API
            if (endDate) params.append('data_fim', endDate); // Ajustado para o nome de parâmetro da API

            const res = await fetch(`/api/${entity}?${params.toString()}`);
            const json = await res.json();

            if (json.ok) {
                currentData = json.data; // Salva os dados para as funções de exportação
                renderTable(currentData);
                dataContainer.style.display = 'block'; // Mostra o container com a tabela e botões
                outputDiv.innerHTML = ''; // Limpa a mensagem "Buscando..."
            } else {
                throw new Error(json.error || 'Ocorreu um erro ao buscar os dados.');
            }
        } catch (error) {
            outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
            dataContainer.style.display = 'none';
        }
    });

    $('#btn-mostrar-historico').addEventListener('click', async () => {
        const res = await fetch('/api/historico');
        const json = await res.json();

        $('#data-container').style.display = 'none'; // Esconde a tabela de dados
        $('#output').innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
    });

    // --- EVENT LISTENERS PARA AS NOVAS FUNCIONALIDADES ---

    // Filtro da tabela em tempo real
    $('#table-filter').addEventListener('keyup', (e) => filterTable(e.target.value));

    // Exportação para PDF
    $('#btn-export-pdf').addEventListener('click', () => {
        if (currentData.length === 0) return alert('Não há dados para exportar.');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });

        const headers = Object.keys(currentData[0]);
        const body = currentData.map(row => headers.map(header => {
            const cellData = row[header];
            return (typeof cellData === 'object' && cellData !== null) ? JSON.stringify(cellData) : cellData;
        }));

        doc.autoTable({ head: [headers], body: body });
        doc.save(`dados_${$('#filter-entity').value}.pdf`);
    });

    // Exportação para Excel
    $('#btn-export-excel').addEventListener('click', () => {
        if (currentData.length === 0) return alert('Não há dados para exportar.');

        // Converte os dados (especialmente objetos aninhados) para um formato mais simples
        const flattenedData = currentData.map(row => {
            const newRow = {};
            for (const key in row) {
                newRow[key] = (typeof row[key] === 'object' && row[key] !== null) ? JSON.stringify(row[key]) : row[key];
            }
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
        XLSX.writeFile(workbook, `dados_${$('#filter-entity').value}.xlsx`);
    });
});