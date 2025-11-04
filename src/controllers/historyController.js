//src/controllers/historyController.js
const jsonManager = require('../models/jsonManager');

module.exports = {
    list: async (req, res) => {
        try {
            const list = await jsonManager.listAll();
            return res.json({ ok: true, list });
        } catch (err) {
            return res.status(500).json({ ok: false, error: err.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { type, id } = req.params;
            const item = await jsonManager.read(type, id);
            if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
            return res.json({ ok: true, item });
        } catch (err) {
            return res.status(500).json({ ok: false, error: err.message });
        }
    },

    remove: async (req, res) => {
        try {
            const { type, id } = req.params;
            await jsonManager.remove(type, id);
            return res.json({ ok: true });
        } catch (err) {
            return res.status(500).json({ ok: false, error: err.message });
        }
    }
};