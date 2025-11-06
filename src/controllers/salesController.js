//src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

// Funções exemplares que consultam a API e salvam o resultado localmente.
module.exports = {
    searchSales: async (req, res) => {
        try {
            const params = req.query;
            // Exemplo de endpoint - pode precisar ajustar à doc oficial
            const result = await contaAzul.get('/v1/venda/busca', { params });

            // salva o resultado localmente
            const saved = await jsonManager.save('vendas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
}