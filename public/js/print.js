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
    // Formata valor monetário
    formatMoney: (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    
    // Auxiliares para alinhar texto
    pad: (str, len) => (str || '').toString().substring(0, len).padEnd(len, ' '),
    padLeft: (str, len) => (str || '').toString().substring(0, len).padStart(len, ' '),

    generateCondicionalHTML: function (data, settings = {}) {
        const config = settings || {};
        
        // --- CONFIGURAÇÕES GERAIS ---
        const header = config.header || 'METTA CONTABILIDADE\nSTA BARBARA DO LESTE';
        const footer = config.footer || '';
        const prazo = config.prazo ? `PRAZO: ${config.prazo}` : '';
        const modalidade = config.modalidade ? `MODALIDADE: ${config.modalidade}` : '';
        const docNum = data.numero || data.id_legado || '---';
        const dataEmissao = formatDateTime(data.data);

        // --- TÍTULO PERSONALIZADO (MUDANÇA SOLICITADA) ---
        const tituloDocumento = `NOTA CONDICIONAL Nº ${docNum}`;

        // --- DADOS CLIENTE ---
        const cliNome = (data.cliente?.nome || data.customer?.name || 'CLIENTE NÃO IDENTIFICADO').toUpperCase();
        const cliDoc = data.cliente?.documento || data.cliente?.cpf_cnpj || '';
        
        const end = data.cliente?.endereco || data.customer?.address || {};
        const endStr = `${end.logradouro || ''}, ${end.numero || ''} - ${end.bairro || ''}\n${end.cidade || ''}-${end.estado || ''}`;

        // --- DADOS ITENS ---
        let itensTxt = '';
        let listaItens = [];

        // Verifica array de itens
        if (Array.isArray(data.itens)) listaItens = data.itens;
        else if (Array.isArray(data.items)) listaItens = data.items;

        if (listaItens.length > 0) {
            itensTxt = listaItens.map(item => {
                // 1. CORREÇÃO DO NOME: O log mostrou que vem em 'item.nome'
                const nome = (item.nome || item.descricao || item.item?.nome || 'PRODUTO').toUpperCase();
                
                // Dados numéricos
                const qtdVal = item.quantidade || item.quantity || 1;
                const unitVal = item.valor || item.valor_unitario || item.value || 0;
                
                // 2. CORREÇÃO DO TOTAL 0,00: Calculamos se a API não mandar
                const totalVal = item.valor_total || item.total || (qtdVal * unitVal);

                // Formatação para string
                const qtdStr = qtdVal.toString();
                const unitStr = this.formatMoney(unitVal);
                const subStr = this.formatMoney(totalVal);
                
                // Layout:
                // 2   PRODUTO 01
                //     UNIT: 25,00         TOTAL:      50,00
                return `${this.pad(qtdStr, 3)} ${nome}\n` +
                       `    UNIT: ${this.pad(unitStr, 10)}    TOTAL: ${this.padLeft(subStr, 10)}`;
            }).join('\n- - - - - - - - - - - - - - - - - - - - - -\n');
        } else {
            itensTxt = '    DETALHES DOS ITENS NÃO DISPONÍVEIS';
        }

        // --- DADOS PAGAMENTO ---
        let pagtosTxt = '';
        let parcelas = [];
        
        if (Array.isArray(data.parcelas)) parcelas = data.parcelas;
        else if (data.payment && Array.isArray(data.payment.installments)) parcelas = data.payment.installments;
        
        if (parcelas.length > 0) {
            pagtosTxt = parcelas.map(p => {
                const num = (p.numero || p.number || '1').toString() + 'º';
                const venc = formatISODate(p.data_vencimento || p.due_date);
                const val = this.formatMoney(p.valor || p.value);
                return `${this.pad(num, 4)} ${this.pad(venc, 12)} ${this.padLeft(val, 12)}`;
            }).join('\n');
        } else {
            pagtosTxt = `À VISTA                    ${this.formatMoney(data.total)}`;
        }

        const totalFinal = this.formatMoney(data.total);

        return `
<pre class="print-preview">
${header}

${tituloDocumento}
DATA: ${dataEmissao}
-----------------------------------------------
CLIENTE: ${cliNome}
CPF/CNPJ: ${cliDoc}
END: ${endStr}
-----------------------------------------------
${modalidade}
PRAZO EM DIAS: ${prazo}
===============================================
ITEM DESCRIÇÃO
    VALOR UNIT.               SUBTOTAL
===============================================
${itensTxt}
===============================================
TOTAL DA VENDA . . . . . . R$ ${this.padLeft(totalFinal, 10)}

CONDIÇÃO DE PAGAMENTO:
Nº   VENCIMENTO             VALOR(R$)
-----------------------------------------------
${pagtosTxt}
-----------------------------------------------

${footer}

_______________________________________
Assinatura
</pre>
        `;
    },

    generatePromissoriaHTML: function (data, settings = {}) {
        // --- TÍTULO PERSONALIZADO PARA PROMISSÓRIA ---
        const docNum = data.numero || data.id_legado || '---';
        const tituloDocumento = `NOTA PROMISSÓRIA Nº ${docNum}`;

        // Reutilizamos a lógica, mas injetando o título correto
        // Criamos uma cópia do HTML da condicional e substituímos o título manualmente
        // ou duplicamos a função para controle total. 
        // Para simplificar e manter seguro, vou replicar a estrutura principal aqui:

        const config = settings || {};
        const header = config.header || 'METTA CONTABILIDADE\nSTA BARBARA DO LESTE';
        const footer = config.footer || '';
        const dataEmissao = formatDateTime(data.data);
        const cliNome = (data.cliente?.nome || 'CLIENTE').toUpperCase();
        const cliDoc = data.cliente?.documento || '';
        const totalFinal = this.formatMoney(data.total);

        // Parcelas
        let pagtosTxt = '';
        let parcelas = data.parcelas || (data.payment ? data.payment.installments : []) || [];
        if (parcelas.length > 0) {
            pagtosTxt = parcelas.map(p => {
                const num = (p.numero || '1').toString() + 'º';
                const venc = formatISODate(p.data_vencimento || p.due_date);
                const val = this.formatMoney(p.valor || p.value);
                return `${this.pad(num, 4)} ${this.pad(venc, 12)} ${this.padLeft(val, 12)}`;
            }).join('\n');
        } else {
            pagtosTxt = `À VISTA                    ${totalFinal}`;
        }

        return `
<pre class="print-preview">
${header}

${tituloDocumento}
DATA: ${dataEmissao}
-----------------------------------------------
CLIENTE: ${cliNome}
CPF/CNPJ: ${cliDoc}

CONDIÇÃO DE PAGAMENTO:
Nº   VENCIMENTO             VALOR(R$)
-----------------------------------------------
${pagtosTxt}
-----------------------------------------------
TOTAL . . . . . . . . . . . R$ ${this.padLeft(totalFinal, 10)}

${footer}

_______________________________________
Assinatura
</pre>
        `;
    }
};