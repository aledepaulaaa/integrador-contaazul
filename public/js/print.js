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
    formatCurrency: (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),

    generateCondicionalHTML: function (data, settings = {}) {
        const config = settings || {};
        
        const header = config.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
        const footer = config.footer || `Reconheço que as mercadorias acima descritas\nestão sob minha responsabilidade...`;
        
        const prazo = config.prazo ? `PRAZO DE DEVOLUCAO: ${config.prazo}` : 'PRAZO DE DEVOLUCAO: A COMBINAR';
        const modalidade = config.modalidade ? `MODALIDADE: ${config.modalidade}` : '';
        const vencimento = config.vencimento ? formatISODate(config.vencimento) : formatDateTime(data.data || new Date().toISOString());

        // --- LÓGICA DE ITENS ---
        let itensBlock = '';
        let lista = [];

        // 1. Tenta encontrar o array de itens nas variações possíveis da API
        if (Array.isArray(data.items)) lista = data.items;       // Padrão V1 English
        else if (Array.isArray(data.itens)) lista = data.itens;  // Padrão V1 Portuguese
        else if (data.sale && Array.isArray(data.sale.items)) lista = data.sale.items; // Algumas respostas aninhadas

        if (lista.length > 0 && typeof lista[0] === 'object') {
            itensBlock = lista.map(item => {
                // 2. Mapeamento profundo das propriedades do item
                // Conta Azul pode retornar: item.description OU item.item.name OU item.descricao
                let nomeProduto = 'PRODUTO SEM NOME';
                
                if (item.description) nomeProduto = item.description;
                else if (item.item && item.item.name) nomeProduto = item.item.name;
                else if (item.descricao) nomeProduto = item.descricao;
                else if (item.name) nomeProduto = item.name;

                const qtd = item.quantity || item.quantidade || 1;
                const valor = item.value || item.unit_value || item.valor_unitario || item.valor || 0;
                const total = item.total || (qtd * valor);

                // Layout alinhado à esquerda (Retro Style)
                return `${nomeProduto.toUpperCase()}\n` +
                       `   ${qtd} X ${PrintHandler.formatCurrency(valor)} = R$ ${PrintHandler.formatCurrency(total)}`;
            }).join('\n---------------------------------------------------------------\n');
        } else {
            // Se chegou aqui, o array está vazio ou não é um array
            itensBlock = `            LISTA DE ITENS INDISPONÍVEL\n            (API retornou: ${JSON.stringify(data.itens || data.items || 'vazio').substring(0, 50)}...)`;
        }

        const totalFinal = data.total || 0;

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

    generatePromissoriaHTML: function (data, settings = {}) {
        const config = settings || {};
        const header = config.header || `METTA CONTABILIDADE...`;
        const footer = config.footer || `Reconheço (emos) a exatidão...`;
        
        const total = data.total || 0;
        
        // Lógica de Parcelas
        let parcelasBlock = '';
        let parcelas = [];
        // Mapeamento de parcelas (payment.installments ou parcelas)
        if (data.payment && Array.isArray(data.payment.installments)) parcelas = data.payment.installments;
        else if (Array.isArray(data.parcelas)) parcelas = data.parcelas;

        if (parcelas.length > 0) {
            parcelasBlock = parcelas.map(p => {
                const num = p.number || p.numero || 1;
                const date = formatISODate(p.due_date || p.data_vencimento);
                const val = PrintHandler.formatCurrency(p.value || p.valor);
                return `PARC. ${num}   ${date}        ${val}`;
            }).join('\n');
        } else {
            parcelasBlock = `À VISTA   ${formatDateTime(data.data)}        ${PrintHandler.formatCurrency(total)}`;
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