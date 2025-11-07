// ARQUIVO: /public/js/pessoas.js
window.appHandlers.pessoas = {
    format: function (rawData) {
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
                'Ativo': pessoa.ativo ? 'Sim' : 'Não'
            };
        });

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};