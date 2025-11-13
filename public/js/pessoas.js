// ARQUIVO: /public/js/pessoas.js
const pessoasHandler = {
    format: function (rawData) {
        // Guardamos os dados brutos
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
            return {
                'Nome': pessoa.nome,
                'Email': pessoa.email,
                'Telefone': pessoa.telefone,
                'Tipo': pessoa.tipo_pessoa === 'FISICA' ? 'Física' : 'Jurídica',
                'Perfis': pessoa.perfis ? pessoa.perfis.join(', ') : 'N/A',
                'Endereço': createAccordion(pessoa.id, `${endereco.logradouro || 'Endereço'}, ${endereco.numero || ''}`, enderecoDetails),
                'Ativo': pessoa.ativo ? 'Sim' : 'Não',
                'Ações': `
                    <div class="btn-group" role="group">
                         <button class="btn btn-sm btn-outline-success btn-edit" data-id="${pessoa.id}" data-type="condicional" data-entity="pessoas">Editar Cond.</button>
                        <button class="btn btn-sm btn-outline-success btn-edit" data-id="${pessoa.id}" data-type="promissoria" data-entity="pessoas">Editar Promis.</button>
                    </div>
                    <div class="btn-group mt-1" role="group">
                        <button class="btn btn-sm btn-outline-info btn-print" data-id="${pessoa.id}" data-type="condicional" data-entity="pessoas">Condicional</button>
                        <button class="btn btn-sm btn-outline-warning btn-print" data-id="${pessoa.id}" data-type="promissoria" data-entity="pessoas">Promissória</button>
                    </div>
                `
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