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
        const scope = 'openid profile aws.cognito.signin.user.admin sales customers products';
        const url = `${AUTHORIZE_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`;

        console.log('Redirecting to:', url);
        return res.redirect(url);
    },


    callback: async (req, res) => {
        const { code, state, error } = req.query;
        if (error) return res.status(400).send(`Erro authorization: ${error}`);
        if (!code) return res.status(400).send('Code não recebido');

        try {
            // --- INÍCIO DA ALTERAÇÃO ---

            // 1. Crie o cabeçalho de autorização Basic
            const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

            // 2. Monte o payload SEM as credenciais
            const payload = qs.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            });

            // 3. Faça a requisição com o header de autorização
            const response = await axios.post(TOKEN_URL, payload, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                }
            });

            // --- FIM DA ALTERAÇÃO ---

            const sessionData = response.data;
            sessionData.created_at = Date.now() / 1000;

            // Salva sessão localmente (isso permanece igual)
            await fs.ensureFile(SESSION_FILE);
            await fs.writeJson(SESSION_FILE, sessionData, { spaces: 2 });

            // Redireciona para o dashboard em produção. Para testes locais, pode ser para o localhost.
            // Como o callback é no servidor, o ideal é renderizar uma página de sucesso
            // ou redirecionar para a página principal da sua aplicação no Render.
            return res.redirect('https://integrador-contaazul.onrender.com');

        } catch (err) {
            // Log aprimorado para o servidor
            console.error('--- ERRO DETALHADO NO CALLBACK ---');
            console.error('Status:', err?.response?.status);
            console.error('Data:', err?.response?.data);
            console.error('------------------------------------');

            // Envia o erro detalhado para o navegador para depuração
            const detailedError = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
            return res.status(500).send(`<h1>Erro no callback de OAuth</h1><p>Resposta da API:</p><pre>${detailedError}</pre>`);
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