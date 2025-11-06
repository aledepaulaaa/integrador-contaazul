//src/controllers/peopleController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');
const { buildDateFilters } = require('../utils/dateUtils');

module.exports = {
    listPeople: async (req, res) => {
        try {
            const filters = buildDateFilters(req.query);
            const params = { ...req.query, ...filters };
            // Usar endpoint de contatos/people (verificar path na API)
            const result = await contaAzul.get('/pessoas', { params });
            const saved = await jsonManager.save('pessoas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};
