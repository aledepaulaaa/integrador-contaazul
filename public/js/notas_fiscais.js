// ARQUIVO: /public/js/notas_fiscais.js

const notasFiscaisHandler = {
    format: function (rawData) {
        // Garantir que rawData seja um array e que cada item não seja nulo antes de mapear.
        const safeRawData = Array.isArray(rawData) ? rawData.filter(item => item) : [];

        const formattedData = safeRawData.map(nota => ({
            'Número': nota.numero || 'N/A',
            'Data Emissão': formatDateTime(nota.data_emissao || null),
            'Valor': (nota.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Status': nota.status || 'N/A',
            // Acesso à propriedade 'cliente' mais robusto.
            'Cliente': nota.cliente?.nome || 'N/A'
        }));

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};