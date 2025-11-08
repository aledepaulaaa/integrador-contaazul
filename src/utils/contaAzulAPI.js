//src/utils/contaAzulAPI.js
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const qs = require('querystring');

const API_BASE = process.env.API_BASE_URL || 'https://api-v2.contaazul.com/v1';
const SESSION_FILE = path.join(__dirname, '..', '..', 'data', 'auth', 'session.json');
const TOKEN_URL = process.env.AUTH_TOKEN_URL || 'https://auth.contaazul.com/oauth2/token';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI

async function getSession() {
    if (!await fs.pathExists(SESSION_FILE)) return null;
    return await fs.readJson(SESSION_FILE);
}

async function saveSession(session) {
    await fs.ensureFile(SESSION_FILE);
    await fs.writeJson(SESSION_FILE, session, { spaces: 2 });
}

async function refreshTokenIfNeeded(session) {
    // A lógica para verificar a expiração do token permanece a mesma
    const now = Date.now() / 1000;
    // expires_in é retornado pela API em segundos
    const expiresAt = session.created_at + session.expires_in;

    // Renova se estiver a 60 segundos de expirar
    if (now >= expiresAt - 60) {
        console.log('Token expirado ou prestes a expirar. Renovando...');

        // 1. Crie o cabeçalho de autorização Basic
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        console.log("Credenciais: ", credentials)

        // 2. Monte o payload SEM as credenciais
        const payload = qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: session.refresh_token,
            redirect_uri: REDIRECT_URI
        });

        // 3. Faça a requisição com o header de autorização
        const response = await axios.post(TOKEN_URL, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            }
        });

        const newSession = response.data;
        console.log("Nova Sessão gerada: ", newSession)
        // Salva o timestamp de quando o token foi criado para calcular a expiração futura
        newSession.created_at = Date.now() / 1000;
        await saveSession(newSession);
        console.log('Token renovado com sucesso.');
        return newSession;
    }
    return session;
}

async function ensureAuthHeaders() {
    let session = await getSession();
    if (!session || !session.access_token) throw new Error('Not authenticated with Conta Azul.');

    session = await refreshTokenIfNeeded(session);
    return {
        Authorization: `Bearer ${session.access_token}`
    };
}

async function get(pathUrl, opts = {}) {
    const headers = await ensureAuthHeaders();
    const url = `${API_BASE}${pathUrl}`;
    console.log("URL :", url)
    const response = await axios.get(url, { headers, ...opts });
    return response.data;
}

async function post(pathUrl, body, opts = {}) {
    const headers = await ensureAuthHeaders();
    const url = `${API_BASE}${pathUrl}`;
    console.log("URL :", url)
    const response = await axios.post(url, body, { headers, ...opts });
    return response.data;
}

module.exports = { get, post };
