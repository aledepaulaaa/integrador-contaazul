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
                // Retorna estrutura padrão vazia se não existir
                return res.json({ ok: true, data: { condicional: {}, promissoria: {} } });
            }
            const data = await fs.readJson(FILE_PATH);
            return res.json({ ok: true, data });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Erro ao ler configurações.' });
        }
    },

    // POST /api/settings/print
    // Agora espera um body: { type: 'condicional' | 'promissoria', settings: { ... } }
    savePrintSettings: async (req, res) => {
        try {
            const { type, settings } = req.body;

            if (!['condicional', 'promissoria'].includes(type)) {
                return res.status(400).json({ ok: false, error: 'Tipo de configuração inválido.' });
            }

            await fs.ensureDir(SETTINGS_DIR);

            // Lê existente ou cria novo
            let currentData = { condicional: {}, promissoria: {} };
            if (await fs.pathExists(FILE_PATH)) {
                currentData = await fs.readJson(FILE_PATH);
            }

            // Atualiza apenas a chave específica
            currentData[type] = settings;

            await fs.writeJson(FILE_PATH, currentData, { spaces: 2 });
            return res.json({ ok: true, message: `Configurações de ${type} salvas.` });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Erro ao salvar configurações.' });
        }
    },

    // DELETE /api/settings/print (Reseta tudo)
    deletePrintSettings: async (req, res) => {
        try {
            if (await fs.pathExists(FILE_PATH)) {
                await fs.remove(FILE_PATH);
            }
            return res.json({ ok: true, message: 'Todas as configurações foram apagadas.' });
        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Erro ao apagar configurações.' });
        }
    }
};