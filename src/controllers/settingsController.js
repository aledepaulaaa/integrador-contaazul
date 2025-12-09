// ARQUIVO: /src/controllers/settingsController.js
const path = require('path');
const fs = require('fs-extra');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SETTINGS_DIR = path.join(DATA_DIR, 'settings');
const FILE_PATH = path.join(SETTINGS_DIR, 'global_print.json');

module.exports = {
    // GET /api/settings/print
    getPrintSettings: async (req, res) => {
        try {
            if (!await fs.pathExists(FILE_PATH)) {
                return res.json({ ok: true, data: null }); // Retorna null se não houver config salva
            }
            const data = await fs.readJson(FILE_PATH);
            return res.json({ ok: true, data });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Erro ao ler configurações.' });
        }
    },

    // POST /api/settings/print
    savePrintSettings: async (req, res) => {
        try {
            const payload = req.body;
            await fs.ensureDir(SETTINGS_DIR);
            await fs.writeJson(FILE_PATH, payload, { spaces: 2 });
            return res.json({ ok: true, message: 'Configurações salvas com sucesso.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Erro ao salvar configurações.' });
        }
    },

    // DELETE /api/settings/print
    deletePrintSettings: async (req, res) => {
        try {
            if (await fs.pathExists(FILE_PATH)) {
                await fs.remove(FILE_PATH);
            }
            return res.json({ ok: true, message: 'Configurações apagadas.' });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Erro ao apagar configurações.' });
        }
    }
};