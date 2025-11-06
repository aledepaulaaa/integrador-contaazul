// ARQUIVO: /public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Armazena os dados formatados da última busca para uso na exportação
    let formattedData = [];

    // --- FUNÇÕES DE FORMATAÇÃO E TRANSFORMAÇÃO DE DADOS ---

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
            </div>
        `;
    }

    /** Formata dados de VENDAS */
    function formatSalesData(rawData) {
        return rawData.map(venda => {
            const clienteDetails = { Nome: venda.cliente?.nome, Email: venda.cliente?.email };
            return {
                'Data': formatDateTime(venda.data),
                'Criado em': formatDateTime(venda.criado_em, true),
                'Alterado em': formatDateTime(venda.data_alteracao, true),
                'Tipo': venda.tipo === 'SALE' ? 'Venda' : venda.tipo,
                'Item': venda.itens === 'PRODUCT' ? 'Produto' : venda.itens,
                'Pago': venda.condicao_pagamento ? 'Sim' : 'Não',
                'Total': venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Cliente': createAccordion(venda.id, venda.cliente?.nome, clienteDetails),
                'Situação': venda.situacao?.descricao || 'N/A'
            };
        });
    }

    /** Formata dados de PESSOAS */
    function formatPeopleData(rawData) {
        return rawData.map(pessoa => {
            const endereco = pessoa.endereco || {};
            const enderecoDetails = {
                Logradouro: `${endereco.logradouro}, ${endereco.numero}`,
                Bairro: endereco.bairro,
                Cidade: `${endereco.cidade} - ${endereco.estado}`,
                CEP: endereco.cep
            };
            return {
                'Nome': pessoa.nome,
                'Email': pessoa.email,
                'Telefone': pessoa.telefone,
                'Tipo': pessoa.tipo_pessoa === 'FISICA' ? 'Física' : 'Jurídica',
                'Perfis': pessoa.perfis ? pessoa.perfis.join(', ') : 'N/A',
                'Endereço': createAccordion(pessoa.id, `${endereco.logradouro}, ${endereco.numero}`, enderecoDetails),
                'Ativo': pessoa.ativo ? 'Sim' : 'Não'
            };
        });
    }

    /** Formata dados de PRODUTOS */
    function formatProductsData(rawData) {
        return rawData.map(produto => ({
            'Código': produto.codigo,
            'Nome': produto.nome,
            'Valor de Venda': (produto.valor_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Custo Médio': (produto.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Saldo': produto.saldo,
            'Status': produto.status === 'ATIVO' ? 'Ativo' : 'Inativo',
            'Variações': produto.produtos_variacao ? `${produto.produtos_variacao.length} variações` : 'Nenhuma',
            'Atualizado em': formatDateTime(produto.ultima_atualizacao, true)
        }));
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function renderTable(data, entityName) {
        const container = $('#table-responsive-container');
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="text-center p-3">Nenhum dado de "${entityName}" encontrado para os filtros selecionados.</p>`;
            return;
        }
        const headers = Object.keys(data[0]);
        const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
        const bodyHtml = `<tbody>${data.map(row => `<tr>${headers.map(header => `<td>${row[header]}</td>`).join('')}</tr>`).join('')}</tbody>`;
        container.innerHTML = `<table class="table table-dark table-hover data-table">${headerHtml}${bodyHtml}</table>`;
    }

    function filterTable(searchText) {
        const table = $('.data-table');
        if (!table) return;
        const lowerCaseSearchText = searchText.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(row => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(lowerCaseSearchText) ? '' : 'none';
        });
    }

    // --- EVENT LISTENERS ---

    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');

    $('#btn-filtrar').addEventListener('click', async () => {
        const entityValue = $('#filter-entity').value;
        const entityName = $('#filter-entity').selectedOptions[0].text;
        const startDate = $('#filter-startDate').value;
        const endDate = $('#filter-endDate').value;
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('data_inicio', startDate);
            if (endDate) params.append('data_fim', endDate);

            const res = await fetch(`/api/${entityValue}?${params.toString()}`);
            const json = await res.json();

            if (json.ok) {
                // Roteador de formatação: chama a função correta para a entidade selecionada
                switch (entityValue) {
                    case 'vendas':
                        formattedData = formatSalesData(json.data);
                        break;
                    case 'pessoas':
                        formattedData = formatPeopleData(json.data);
                        break;
                    case 'produtos':
                        formattedData = formatProductsData(json.data);
                        break;
                    // Adicione um case para 'notas' quando criar a função formatNotesData
                    default:
                        formattedData = json.data; // Fallback para dados não formatados
                }

                renderTable(formattedData, entityName);
                dataContainer.style.display = 'block';
                outputDiv.innerHTML = '';
            } else {
                throw new Error(json.error || 'Erro ao buscar dados.');
            }
        } catch (error) {
            outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
            dataContainer.style.display = 'none';
        }
    });

    $('#btn-mostrar-historico').addEventListener('click', async () => {
        const res = await fetch('/api/historico');
        const json = await res.json();
        $('#data-container').style.display = 'none';
        $('#output').innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
    });

    $('#table-filter').addEventListener('keyup', (e) => filterTable(e.target.value));

    // --- FUNÇÕES DE EXPORTAÇÃO APRIMORADAS ---

    function getExportData() {
        // Para exportação, removemos colunas com HTML e extraímos o texto puro.
        return formattedData.map(row => {
            const cleanRow = { ...row };
            for (const key in cleanRow) {
                if (typeof cleanRow[key] === 'string' && cleanRow[key].includes('accordion')) {
                    const match = cleanRow[key].match(/<button.*?>(.*?)<\/button>/);
                    cleanRow[key] = match ? match[1].trim() : 'N/A';
                }
            }
            return cleanRow;
        });
    }

    $('#btn-export-pdf').addEventListener('click', () => {
        if (formattedData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = Object.keys(exportData[0]);
        const body = exportData.map(row => headers.map(header => row[header]));
        doc.autoTable({ head: [headers], body: body, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 36] } });
        doc.save(`relatorio_${$('#filter-entity').value}.pdf`);
    });

    $('#btn-export-excel').addEventListener('click', () => {
        if (formattedData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
        XLSX.writeFile(workbook, `relatorio_${$('#filter-entity').value}.xlsx`);
    });
});