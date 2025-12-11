// // /public/js/print.js

// const PrintHandler = {
//     // Gera o HTML para o modelo "Venda Condicional"
//     generateCondicionalHTML: function (data, edits = {}) {
//         const item = data.itens && data.itens.length > 0 ? data.itens[0] : { nome: 'N/A', quantidade: 1, valor_unitario: data.total };

//         const header = edits.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
//         const prazo = edits.prazo ? `PRAZO DE DEVOLUCAO: ${edits.prazo}` : 'PRAZO DE DEVOLUCAO';
//         const modalidade = edits.modalidade || '';
//         const vencimento = edits.vencimento ? formatISODate(edits.vencimento) : formatDateTime(data.data);
//         const footer = edits.footer || `Reconheço que as mercadorias acima descritas
// estão sob minha responsabilidade e se não forem
// devolvidas dentro do prazo estipulado,
// esta nota condicional será convertida em venda.`;

//         return `
//             <pre class="print-preview">
// ${header}

// ** PEDIDO / VENDA CONDICIONAL **
// DOC: ${data.numero || data.id_legado}  DATA: ${formatDateTime(data.data)}
// *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
// CLIENTE: ${data.cliente.nome.toUpperCase()}
// END: ${data.cliente.endereco || 'N/A'}
// BAIRRO: ${data.cliente.bairro || 'N/A'}
// CIDADE: ${data.cliente.cidade || 'N/A'}
// ///////////////////////////////////////////////////////////
// MODALIDADE: ${modalidade}                  ${prazo}
// ---------------------------------------------------------------
// CÓDIGO      DESCRICAO                  QTD   VALOR UNIT   VALOR TOTAL
//             ${item.nome || 'SERVIÇO PRESTADO'}            ${item.quantidade || 1} X    ${(item.valor_unitario || data.total).toFixed(2)}      ${data.total.toFixed(2)}
// ---------------------------------------------------------------
// TOTAL/ITENS: 1
// VALOR TOTAL DA COMPRA . . . R$ ${data.total.toFixed(2)}
// VENC:                             VALOR
// ${vencimento}                      ${data.total.toFixed(2)}
// ***************************************************************
// ${footer}
// ***************************************************************

// __________________________________________
// Assinatura
//             </pre>
//         `;
//     },

//     // Gera o HTML para o modelo "Promissória"
//     generatePromissoriaHTML: function (data, edits = {}) {
//         const header = edits.header || `METTA CONTABILIDADE
// CNPJ 20316861000190 IE ISENTO
// AV GERALDO MAGELA, 96, CENTRO
// STA BARBARA DO LESTE/MG`;
//         const footer = edits.footer || `Reconheço (emos) a exatidão desta duplicata de
// venda mercantil/prestacao de serviços, na
// importância acima que pagarei à METTA
// CONTABILIDADE, ou a sua ordem na praça e
// vencimentos indicados.`;

//         return `
//             <pre class="print-preview">
// ${header}

// Op: Venda           Data: ${formatDateTime(data.data)}
// Seq: ${data.numero || data.id_legado}
// ---------------------------------------------------------------
// Nome: ${data.cliente.nome.toUpperCase()}
// CPF/CNPJ: ${data.cliente.documento || 'N/A'}

// *** DETALHAR PAGAMENTO ***
// TIPO      VENCIMENTO           VALOR R$
// à vista   ${formatDateTime(data.data)}        ${data.total.toFixed(2)}
//                              Valor R$: ${data.total.toFixed(2)}

// ${footer}


// _______________________________________
// ${data.cliente.nome.toUpperCase()}
//             </pre>
//         `;
//     }
// };

const PrintHandler = {
    // Gera o HTML para "Venda Condicional" com LISTA DE PRODUTOS
    generateCondicionalHTML: function (data, settings = {}) {
        // Fallback se settings vier nulo
        const config = settings || {};

        const header = config.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
        const footer = config.footer || `Reconheço que as mercadorias acima descritas\nestão sob minha responsabilidade...`;

        // Formatação de datas e campos extras
        const prazo = config.prazo ? `PRAZO DE DEVOLUCAO: ${config.prazo}` : '';
        const modalidade = config.modalidade ? `MODALIDADE: ${config.modalidade}` : '';
        const vencimento = config.vencimento ? formatISODate(config.vencimento) : formatDateTime(data.data);

        // --- LÓGICA DE ITENS (PRODUTOS) ---
        let itemsHtml = '';
        let totalCalculado = 0;

        // Verifica se existe array de itens (da API detalhada)
        // A API da Conta Azul costuma retornar 'items' ou 'itens'
        const listaItens = data.itens || data.items || [];

        if (listaItens.length > 0 && Array.isArray(listaItens)) {
            itemsHtml = listaItens.map(item => {
                // Tenta extrair dados, tratando variações da API (item.item.nome ou item.descricao)
                const nome = item.descricao || item.item?.nome || 'Produto sem nome';
                const qtd = item.quantidade || 1;
                const valorUnit = item.valor_unitario || item.valor || 0;
                const totalItem = item.valor_total || (qtd * valorUnit);

                // Soma ao total se necessário (ou usa o total da venda)
                totalCalculado += totalItem;

                return `
                <tr>
                    <td style="padding: 2px 0;">${nome}</td>
                    <td style="text-align: center;">${qtd}</td>
                    <td style="text-align: right;">${Number(valorUnit).toFixed(2)}</td>
                    <td style="text-align: right;">${Number(totalItem).toFixed(2)}</td>
                </tr>`;
            }).join('');
        } else {
            // Caso não tenha itens (fallback)
            itemsHtml = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 10px;">DETALHES DOS ITENS NÃO DISPONÍVEIS</td>
            </tr>`;
            totalCalculado = data.total || 0;
        }

        const totalFinal = (data.total || totalCalculado).toFixed(2);

        return `
            <div class="print-container">
                <div class="text-center fw-bold mb-2">${header}</div>
                
                <div class="text-center mb-2">
                    ** PEDIDO / VENDA CONDICIONAL **<br>
                    DOC: ${data.numero || data.id_legado || 'N/A'} - DATA: ${formatDateTime(data.data)}
                </div>

                <div class="border-dashed mb-2"></div>

                <div class="mb-2">
                    CLIENTE: ${data.cliente?.nome?.toUpperCase() || 'CONSUMIDOR'}<br>
                    END: ${data.cliente?.endereco?.logradouro || ''}, ${data.cliente?.endereco?.numero || ''}<br>
                    CIDADE: ${data.cliente?.endereco?.cidade || ''}/${data.cliente?.endereco?.estado || ''}
                </div>

                <div class="mb-2 fw-bold">
                    ${modalidade}<br>
                    ${prazo}
                </div>

                <div class="border-dashed mb-1"></div>
                
                <!-- TABELA DE PRODUTOS -->
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px dashed #000;">
                            <th style="text-align: left; width: 45%;">DESCRIÇÃO</th>
                            <th style="text-align: center; width: 15%;">QTD</th>
                            <th style="text-align: right; width: 20%;">UNIT</th>
                            <th style="text-align: right; width: 20%;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="border-dashed mt-1 mb-2"></div>

                <div class="d-flex justify-content-between fw-bold" style="font-size: 16px;">
                    <span>TOTAL DA COMPRA:</span>
                    <span>R$ ${totalFinal}</span>
                </div>
                
                <div class="mt-2">
                    VENCIMENTO: ${vencimento}
                </div>

                <div class="border-dashed mt-2 mb-2"></div>

                <div class="text-center" style="font-size: 12px; white-space: pre-wrap;">
${footer}
                </div>

                <div class="mt-5 text-center">
                    __________________________________________<br>
                    Assinatura
                </div>
            </div>
        `;
    },

    // Gera o HTML para "Promissória" (Mantido similar, mas usando o config correto)
    generatePromissoriaHTML: function (data, settings = {}) {
        const config = settings || {};
        const header = config.header || 'METTA CONTABILIDADE\n...';
        const footer = config.footer || 'Reconheço (emos) a exatidão...';

        return `
            <div class="print-container">
                <div class="text-center fw-bold mb-3" style="white-space: pre-wrap;">${header}</div>

                <div class="mb-2">
                    Op: Venda           Data: ${formatDateTime(data.data)}<br>
                    Seq: ${data.numero || data.id_legado}
                </div>

                <div class="border-dashed mb-2"></div>

                <div class="mb-2">
                    Nome: ${data.cliente?.nome?.toUpperCase() || 'N/A'}<br>
                    CPF/CNPJ: ${data.cliente?.documento || 'N/A'}
                </div>

                <div class="text-center fw-bold mb-2">*** DETALHAR PAGAMENTO ***</div>
                
                <table style="width: 100%; margin-bottom: 10px;">
                    <tr>
                        <td align="left">TIPO</td>
                        <td align="center">VENCIMENTO</td>
                        <td align="right">VALOR R$</td>
                    </tr>
                    <tr>
                        <td align="left">à vista</td>
                        <td align="center">${formatDateTime(data.data)}</td>
                        <td align="right">${(data.total || 0).toFixed(2)}</td>
                    </tr>
                </table>

                <div class="text-end fw-bold mb-3" style="font-size: 16px;">
                    Valor R$: ${(data.total || 0).toFixed(2)}
                </div>

                <div class="text-center mb-4" style="font-size: 12px; white-space: pre-wrap;">
                    ${footer}
                </div>

                <div class="mt-5 text-center">
                    _______________________________________<br>
                    ${data.cliente?.nome?.toUpperCase() || 'CLIENTE'}
                </div>
            </div>
        `;
    }
};