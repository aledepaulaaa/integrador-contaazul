// /public/js/print.js

const PrintHandler = {
    // Gera o HTML para o modelo "Venda Condicional"
    generateCondicionalHTML: function (data, edits = {}) {
        const item = data.itens && data.itens.length > 0 ? data.itens[0] : { nome: 'N/A', quantidade: 1, valor_unitario: data.total };

        const header = edits.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
        const prazo = edits.prazo ? `PRAZO DE DEVOLUCAO: ${edits.prazo}` : 'PRAZO DE DEVOLUCAO';
        const modalidade = edits.modalidade || '';
        const vencimento = edits.vencimento ? formatISODate(edits.vencimento) : formatDateTime(data.data);
        const footer = edits.footer || `Reconheço que as mercadorias acima descritas
estão sob minha responsabilidade e se não forem
devolvidas dentro do prazo estipulado,
esta nota condicional será convertida em venda.`;

        return `
            <pre class="print-preview">
${header}

** PEDIDO / VENDA CONDICIONAL **
DOC: ${data.numero || data.id_legado}  DATA: ${formatDateTime(data.data)}
*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
CLIENTE: ${data.cliente.nome.toUpperCase()}
END: ${data.cliente.endereco || 'N/A'}
BAIRRO: ${data.cliente.bairro || 'N/A'}
CIDADE: ${data.cliente.cidade || 'N/A'}
///////////////////////////////////////////////////////////
MODALIDADE: ${modalidade}                  ${prazo}
---------------------------------------------------------------
CÓDIGO      DESCRICAO                  QTD   VALOR UNIT   VALOR TOTAL
            ${item.nome || 'SERVIÇO PRESTADO'}            ${item.quantidade || 1} X    ${(item.valor_unitario || data.total).toFixed(2)}      ${data.total.toFixed(2)}
---------------------------------------------------------------
TOTAL/ITENS: 1
VALOR TOTAL DA COMPRA . . . R$ ${data.total.toFixed(2)}
VENC:                             VALOR
${vencimento}                      ${data.total.toFixed(2)}
***************************************************************
${footer}
***************************************************************

__________________________________________
Assinatura
            </pre>
        `;
    },

    // Gera o HTML para o modelo "Promissória"
    generatePromissoriaHTML: function (data, edits = {}) {
        const header = edits.header || `METTA CONTABILIDADE
CNPJ 20316861000190 IE ISENTO
AV GERALDO MAGELA, 96, CENTRO
STA BARBARA DO LESTE/MG`;
        const footer = edits.footer || `Reconheço (emos) a exatidão desta duplicata de
venda mercantil/prestacao de serviços, na
importância acima que pagarei à METTA
CONTABILIDADE, ou a sua ordem na praça e
vencimentos indicados.`;

        return `
            <pre class="print-preview">
${header}

Op: Venda           Data: ${formatDateTime(data.data)}
Seq: ${data.numero || data.id_legado}
---------------------------------------------------------------
Nome: ${data.cliente.nome.toUpperCase()}
CPF/CNPJ: ${data.cliente.documento || 'N/A'}

*** DETALHAR PAGAMENTO ***
TIPO      VENCIMENTO           VALOR R$
à vista   ${formatDateTime(data.data)}        ${data.total.toFixed(2)}
                             Valor R$: ${data.total.toFixed(2)}

${footer}


_______________________________________
${data.cliente.nome.toUpperCase()}
            </pre>
        `;
    }
};