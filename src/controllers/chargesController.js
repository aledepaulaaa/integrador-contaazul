//src/controllers/chargesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');
const { buildDateFilters } = require('../utils/dateUtils');

module.exports = {
    listCharges: async (req, res) => {
        try {
            const filters = buildDateFilters(req.query);
            const params = { ...req.query, ...filters };
            const result = await contaAzul.get('/v1/charges', { params });
            const saved = await jsonManager.save('cobrancas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};
