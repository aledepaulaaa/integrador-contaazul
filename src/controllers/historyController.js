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

    // NOVA FUNÇÃO: GET /api/historico/:type/:filename
    getHistoryFile: async (req, res) => {
        try {
            const { type, filename } = req.params;
            // A função 'read' já espera o nome do arquivo sem a extensão .json
            const data = await jsonManager.read(type, filename);
            if (!data) {
                return res.status(404).json({ ok: false, error: 'File not found' });
            }
            // Retornamos o payload que contém os dados da API original
            return res.json({ ok: true, data: data.payload });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Failed to read history file' });
        }
    },

    // DELETE /api/historico/:type/:filename
    deleteHistoryFile: async (req, res) => {
        try {
            const { type, filename } = req.params;
            // A função 'remove' do jsonManager espera o id (filename sem .json)
            await jsonManager.remove(type, filename.replace('.json', ''));
            return res.json({ ok: true, message: 'File deleted' });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Failed to delete file' });
        }
    }
};