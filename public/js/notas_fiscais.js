// ARQUIVO: /public/js/notas_fiscais.js
const notasFiscaisHandler = {
    format: function (rawData) {
        const formattedData = rawData.map(nota => ({
            'Número': nota.numero || 'N/A', // Adicionado fallback
            'Data Emissão': formatDateTime(nota.data_emissao || null), // Adicionado fallback (assumindo que formatDateTime aceita null)
            'Valor': (nota.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Status': nota.status || 'N/A', // Adicionado fallback
            'Cliente': nota.cliente?.nome || 'N/A'
        }));

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};