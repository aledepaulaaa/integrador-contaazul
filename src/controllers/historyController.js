// ARQUIVO: /src/controllers/historyController.js
const jsonManager = require('../models/jsonManager');

module.exports = {
    // GET /api/historico
    getHistory: async (req, res) => {
        try {
            const list = await jsonManager.listAll();
            return res.json({ ok: true, list });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Failed to read history' });
        }
    },

    // DELETE /api/historico/:type/:filename
    deleteHistoryFile: async (req, res) => {
        try {
            const { type, filename } = req.params;
            await jsonManager.delete(type, filename);
            return res.json({ ok: true, message: 'File deleted' });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Failed to delete file' });
        }
    }
};