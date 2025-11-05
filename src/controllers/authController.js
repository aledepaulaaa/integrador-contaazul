//src/controllers/authController.js
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const qs = require('querystring');

const SESSION_FILE = path.join(__dirname, '..', '..', 'data', 'auth', 'session.json');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const AUTHORIZE_URL = process.env.AUTH_AUTHORIZE_URL || 'https://auth.contaazul.com/oauth2/authorize';
const TOKEN_URL = process.env.AUTH_TOKEN_URL || 'https://auth.contaazul.com/oauth2/token';

module.exports = {
    connect: (req, res) => {
        // Monta a URL de autorização
        const state = Date.now();
        const scope = 'sales+contacts+product';
        const url = `${AUTHORIZE_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`;

        console.log('Redirecting to:', url);
        return res.redirect(url);
    },


    callback: async (req, res) => {
        const { code, state, error } = req.query;
        if (error) return res.status(400).send(`Erro authorization: ${error}`);
        if (!code) return res.status(400).send('Code não recebido');


        try {
            const payload = qs.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            });


            const response = await axios.post(TOKEN_URL, payload, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });


            // Salva sessão localmente
            await fs.ensureFile(SESSION_FILE);
            await fs.writeJson(SESSION_FILE, response.data, { spaces: 2 });


            return res.render('dashboard', { title: 'Integrador Conta Azul' });
        } catch (err) {
            console.error(err?.response?.data || err.message);
            return res.status(500).send('Erro no callback de OAuth');
        }
    },


    disconnect: async (req, res) => {
        try {
            await fs.remove(SESSION_FILE);
        } catch (err) {
            console.warn('Falha ao remover sessão:', err.message);
        }
        return res.redirect('/');
    }
};