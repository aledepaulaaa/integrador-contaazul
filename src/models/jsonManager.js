//src/models/jsonManager.js
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function save(type, payload) {
    const id = uuidv4();
    const dir = path.join(DATA_DIR, type);
    await fs.ensureDir(dir);
    const file = path.join(dir, `${id}.json`);
    const content = {
        id,
        type,
        timestamp: new Date().toISOString(),
        payload
    };
    await fs.writeJson(file, content, { spaces: 2 });
    return { id, file: file };
}


async function listAll() {
    const types = await fs.readdir(DATA_DIR);
    const result = {};
    for (const t of types) {
        const dir = path.join(DATA_DIR, t);
        const files = await fs.readdir(dir).catch(() => []);
        result[t] = files.map(f => f.replace('.json', ''));
    }
    return result;
}


async function read(type, id) {
    const file = path.join(DATA_DIR, type, `${id}.json`);
    if (!await fs.pathExists(file)) return null;
    return fs.readJson(file);
}


async function remove(type, id) {
    const file = path.join(DATA_DIR, type, `${id}.json`);
    return fs.remove(file);
}


module.exports = { save, listAll, read, remove };