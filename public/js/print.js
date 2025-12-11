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

// ARQUIVO: /public/js/print.js

const PrintHandler = {
    // Formata moeda
    formatCurrency: (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),

    // Gera o HTML para o modelo "Venda Condicional"
    generateCondicionalHTML: function (data, settings = {}) {
        const config = settings || {};
        
        const header = config.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
        const footer = config.footer || `Reconheço que as mercadorias acima descritas\nestão sob minha responsabilidade...`;
        
        const prazo = config.prazo ? `PRAZO DE DEVOLUCAO: ${config.prazo}` : 'PRAZO DE DEVOLUCAO: A COMBINAR';
        const modalidade = config.modalidade ? `MODALIDADE: ${config.modalidade}` : '';
        const vencimento = config.vencimento ? formatISODate(config.vencimento) : formatDateTime(data.data);

        // --- LÓGICA DE ITENS (CORREÇÃO DO ERRO .map) ---
        let itensBlock = '';
        let lista = [];

        // Verifica explicitamente se é um array antes de atribuir
        if (Array.isArray(data.items)) lista = data.items;
        else if (Array.isArray(data.itens)) lista = data.itens;
        
        // Se a lista tiver itens, monta o loop
        if (lista.length > 0) {
            itensBlock = lista.map(item => {
                // Tratamento de nomes e valores
                const desc = (item.description || item.descricao || item.item?.nome || 'PRODUTO').toUpperCase();
                const qtd = (item.quantity || item.quantidade || 1);
                const valUnit = (item.value || item.valor_unitario || item.valor || 0);
                const subtotal = (item.total || item.valor_total || (qtd * valUnit));

                // Formato: 
                // NOME DO PRODUTO
                //    1 X 50.00 = R$ 50.00
                return `${desc}\n` +
                       `   ${qtd} X ${PrintHandler.formatCurrency(valUnit)} = R$ ${PrintHandler.formatCurrency(subtotal)}`;
            }).join('\n---------------------------------------------------------------\n');
        } else {
            // Fallback caso não venha itens (evita tela branca)
            itensBlock = `            LISTA DE ITENS INDISPONÍVEL\n            (Verifique o cadastro da venda)`;
        }

        const totalFinal = (data.total || 0);

        return `
<pre class="print-preview">
${header}

** PEDIDO / VENDA CONDICIONAL **
DOC: ${data.numero || data.id_legado || 'N/A'}  DATA: ${formatDateTime(data.data)}
*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
CLIENTE: ${data.customer?.name?.toUpperCase() || data.cliente?.nome?.toUpperCase() || 'CONSUMIDOR'}
END: ${data.customer?.address?.street || data.cliente?.endereco?.logradouro || ''}, ${data.customer?.address?.number || data.cliente?.endereco?.numero || ''}
CIDADE: ${data.customer?.address?.city || data.cliente?.endereco?.cidade || ''}
///////////////////////////////////////////////////////////
${modalidade}
${prazo}
---------------------------------------------------------------
DESCRIÇÃO / QTD X UNIT = TOTAL
---------------------------------------------------------------
${itensBlock}
---------------------------------------------------------------
TOTAL/ITENS: ${lista.length}
VALOR TOTAL DA COMPRA . . . . . . . . . . . . R$ ${PrintHandler.formatCurrency(totalFinal)}

VENCIMENTO:
${vencimento}                      R$ ${PrintHandler.formatCurrency(totalFinal)}
***************************************************************
${footer}
***************************************************************


__________________________________________
Assinatura
</pre>
        `;
    },

    // Gera o HTML para o modelo "Promissória"
    generatePromissoriaHTML: function (data, settings = {}) {
        const config = settings || {};
        const header = config.header || `METTA CONTABILIDADE\nCNPJ 20316861000190 IE ISENTO\n...`;
        const footer = config.footer || `Reconheço (emos) a exatidão desta duplicata...`;
        
        const total = (data.total || 0);

        // Tenta listar parcelas se houver
        let parcelasBlock = '';
        let parcelas = [];
        if (Array.isArray(data.payment?.installments)) parcelas = data.payment.installments;
        else if (Array.isArray(data.parcelas)) parcelas = data.parcelas;

        if (parcelas.length > 0) {
            parcelasBlock = parcelas.map(p => {
                return `PARC. ${p.number || p.numero}   ${formatISODate(p.due_date || p.data_vencimento)}        ${PrintHandler.formatCurrency(p.value || p.valor)}`;
            }).join('\n');
        } else {
            // Se não tiver parcelas detalhadas, mostra resumo à vista
            parcelasBlock = `à vista   ${formatDateTime(data.data)}        ${PrintHandler.formatCurrency(total)}`;
        }

        return `
<pre class="print-preview">
${header}

Op: Venda           Data: ${formatDateTime(data.data)}
Seq: ${data.numero || data.id_legado || 'N/A'}
---------------------------------------------------------------
Nome: ${data.customer?.name?.toUpperCase() || data.cliente?.nome?.toUpperCase() || 'CLIENTE'}
CPF/CNPJ: ${data.customer?.document || data.cliente?.documento || 'N/A'}

*** DETALHAR PAGAMENTO ***
TIPO      VENCIMENTO           VALOR R$
---------------------------------------------------------------
${parcelasBlock}
---------------------------------------------------------------
                             Valor R$: ${PrintHandler.formatCurrency(total)}

${footer}


_______________________________________
${data.customer?.name?.toUpperCase() || data.cliente?.nome?.toUpperCase() || 'CLIENTE'}
</pre>
        `;
    }
};