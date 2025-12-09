// ARQUIVO: /public/js/pessoas.js
const pessoasHandler = {
    format: function (rawData) {
        window.rawApiData = window.rawApiData || {};
        rawData.forEach(pessoa => window.rawApiData[pessoa.id] = pessoa);

        const formattedData = rawData.map(pessoa => {
            const endereco = pessoa.endereco || {};
            const enderecoDetails = {
                Logradouro: `${endereco.logradouro || ''}, ${endereco.numero || ''}`,
                Bairro: endereco.bairro,
                Cidade: `${endereco.cidade || ''} - ${endereco.estado || ''}`,
                CEP: endereco.cep
            };

            const actionsHtml = `
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-info btn-print-row" 
                            data-id="${pessoa.id}" 
                            data-entity="pessoas" 
                            data-type="condicional">
                        Cond.
                    </button>
                    <button class="btn btn-sm btn-outline-warning btn-print-row" 
                            data-id="${pessoa.id}" 
                            data-entity="pessoas" 
                            data-type="promissoria">
                        Prom.
                    </button>
                </div>
            `;

            return {
                'Nome': pessoa.nome,
                'Email': pessoa.email,
                'Telefone': pessoa.telefone,
                'Tipo': pessoa.tipo_pessoa === 'FISICA' ? 'Física' : 'Jurídica',
                'Perfis': pessoa.perfis ? pessoa.perfis.join(', ') : 'N/A',
                'Endereço': createAccordion(pessoa.id, `${endereco.logradouro || 'Endereço'}, ${endereco.numero || ''}`, enderecoDetails),
                'Ativo': pessoa.ativo ? 'Sim' : 'Não',
                'Ações': actionsHtml
            };
        });

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header,
            orderable: header !== 'Ações',
            searchable: header !== 'Ações'
        }));

        return { formattedData, columnsConfig };
    }
};