//src/utils/contaAzulAPI.js
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const qs = require('querystring');

const API_BASE = process.env.API_BASE_URL || 'https://api.contaazul.com';
const SESSION_FILE = path.join(__dirname, '..', '..', 'data', 'auth', 'session.json');
const TOKEN_URL = process.env.AUTH_TOKEN_URL || 'https://auth.contaazul.com/oauth2/token';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

async function getSession() {
    if (!await fs.pathExists(SESSION_FILE)) return null;
    return await fs.readJson(SESSION_FILE);
}

async function saveSession(session) {
    await fs.ensureFile(SESSION_FILE);
    await fs.writeJson(SESSION_FILE, session, { spaces: 2 });
}

async function refreshTokenIfNeeded(session) {
    const now = Date.now() / 1000;
    // Assume session.expires_at (timestamp in seconds) stored
    if (!session.expires_at || now >= session.expires_at - 60) {
        // Token expired or about to expire: refresh
        const payload = qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: session.refresh_token,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI
        });
        const response = await axios.post(TOKEN_URL, payload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const newSession = response.data;
        // calculate expiry timestamp
        newSession.expires_at = now + (newSession.expires_in || 3600);
        await saveSession(newSession);
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
    const response = await axios.get(url, { headers, ...opts });
    return response.data;
}

async function post(pathUrl, body, opts = {}) {
    const headers = await ensureAuthHeaders();
    const url = `${API_BASE}${pathUrl}`;
    const response = await axios.post(url, body, { headers, ...opts });
    return response.data;
}

module.exports = { get, post };
