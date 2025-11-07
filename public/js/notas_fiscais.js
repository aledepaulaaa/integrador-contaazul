// ARQUIVO: /public/js/notas_fiscais.js
window.appHandlers.notas = {
    format: function (rawData) {
        const formattedData = rawData.map(nota => ({
            'Número': nota.numero,
            'Data Emissão': formatDateTime(nota.data_emissao),
            'Valor': (nota.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Status': nota.status,
            'Cliente': nota.cliente?.nome || 'N/A'
        }));

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};