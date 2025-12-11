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
    // Utilitário para formatar moeda
    formatCurrency: (value) => {
        return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // Gera o HTML estilo "Documento Auxiliar / Recibo" (Igual ao PDF)
    generateCondicionalHTML: function (data, settings = {}) {
        const config = settings || {};

        // Cabeçalho e Rodapé configuráveis (ou padrão)
        const headerTitle = config.header || 'BELISSIMA\nGERALDO MAGELA, 31 - CENTRO\n(33) 3326-1022';
        const footerText = config.footer || ''; // Rodapé opcional

        // Dados da Venda
        const numeroVenda = data.numero || data.id_legado || 'N/A';
        const dataVenda = formatDateTime(data.data); // Função global utils.js
        const dataVendaSoData = dataVenda.split(' ')[0]; // Pega só a data se vier com hora

        // Dados do Cliente
        const clienteNome = data.customer?.name || data.cliente?.nome || 'CLIENTE NÃO IDENTIFICADO';
        const clienteDoc = data.customer?.document || data.cliente?.documento || ''; // CPF/CNPJ
        // Endereço do Cliente (tratando variações da API)
        const end = data.customer?.address || data.cliente?.endereco || {};
        const enderecoCompleto = `${end.street || end.logradouro || ''}, ${end.number || end.numero || ''} - ${end.neighborhood || end.bairro || ''} - ${end.city || end.cidade || ''}/${end.state || end.estado || ''} - CEP: ${end.zip_code || end.cep || ''}`;

        // --- TABELA DE ITENS ---
        let itemsRows = '';
        // A API de detalhes retorna 'items' (inglês) ou 'itens'
        const listaItens = data.items || data.itens || [];

        if (listaItens.length > 0) {
            itemsRows = listaItens.map(item => {
                const desc = (item.description || item.descricao || item.item?.nome || 'PRODUTO').toUpperCase();
                const code = item.code || item.codigo || ''; // Se tiver código
                const descCompleta = code ? `${code} - ${desc}` : desc;
                const qtd = item.quantity || item.quantidade || 1;
                const valUnit = item.value || item.valor_unitario || 0;
                const subtotal = item.total || item.valor_total || (qtd * valUnit);

                return `
                <tr>
                    <td class="text-center">${qtd}</td>
                    <td class="text-left">${descCompleta}</td>
                    <td class="text-right">${PrintHandler.formatCurrency(valUnit)}</td>
                    <td class="text-right">${PrintHandler.formatCurrency(subtotal)}</td>
                </tr>`;
            }).join('');
        } else {
            itemsRows = `<tr><td colspan="4" class="text-center py-2">DETALHES DOS ITENS NÃO DISPONÍVEIS NA CONSULTA</td></tr>`;
        }

        // --- TABELA DE PAGAMENTOS (PARCELAS) ---
        // A Conta Azul geralmente retorna 'payment' -> 'installments'
        let paymentRows = '';
        const parcelas = data.payment?.installments || data.parcelas || [];

        if (parcelas.length > 0) {
            paymentRows = parcelas.map(p => `
                <tr>
                    <td class="text-center">${p.number || p.numero || '-'}</td>
                    <td class="text-center">${formatISODate(p.due_date || p.data_vencimento)}</td>
                    <td class="text-right">${PrintHandler.formatCurrency(p.value || p.valor)}</td>
                </tr>
            `).join('');
        } else {
            // Se não tiver parcelas, exibe À Vista ou pega do settings
            const condicao = data.payment_terms || 'À VISTA';
            paymentRows = `<tr><td colspan="3" class="text-left">${condicao}</td></tr>`;
        }

        const totalFinal = data.total || 0;

        return `
            <div class="print-container">
                <!-- CABEÇALHO -->
                <div class="header-box">
                    <div class="row-flex">
                        <div class="logo-area">
                           <!-- Se tiver logo em base64, insira aqui -->
                           <!-- <img src="..." /> -->
                        </div>
                        <div class="company-info">
                            <pre style="margin:0; font-family: inherit;">${headerTitle}</pre>
                        </div>
                        <div class="sale-info">
                            <div class="sale-id">Venda <strong>${numeroVenda}</strong></div>
                            <div class="sale-date">${dataVendaSoData}</div>
                        </div>
                    </div>
                </div>

                <!-- CLIENTE -->
                <div class="section-box mt-2">
                    <div class="box-title"><strong>${clienteNome.toUpperCase()}</strong></div>
                    <div class="box-content">
                        <div>CPF/CNPJ: ${clienteDoc}</div>
                        <div>${enderecoCompleto}</div>
                    </div>
                </div>

                <!-- TABELA DE ITENS -->
                <table class="items-table mt-2">
                    <thead>
                        <tr>
                            <th class="w-10 text-center">Qt.</th>
                            <th class="w-50 text-left">Produto/Serviço</th>
                            <th class="w-20 text-right">Valor unitário</th>
                            <th class="w-20 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3" class="text-right">Total</td>
                            <td class="text-right">${PrintHandler.formatCurrency(totalFinal)}</td>
                        </tr>
                        <tr class="net-row">
                            <td colspan="3" class="text-right"><strong>Valor líquido</strong></td>
                            <td class="text-right"><strong>${PrintHandler.formatCurrency(totalFinal)}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <!-- CONDIÇÃO DE PAGAMENTO -->
                <div class="mt-2 mb-1"><strong>Condição de pagamento:</strong></div>
                <table class="payment-table">
                    <thead>
                        <tr>
                            <th class="text-center">Nº</th>
                            <th class="text-center">Vencimento</th>
                            <th class="text-right">Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentRows}
                    </tbody>
                </table>

                <!-- DADOS EXTRAS / RODAPÉ -->
                <div class="footer-box mt-4">
                    <div class="text-center small">
                        ${footerText.replace(/\n/g, '<br>')}
                    </div>
                    <div class="signature-line mt-4"></div>
                    <div class="text-center">Assinatura do Cliente</div>
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