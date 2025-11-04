//integrador_conta_azul/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 7575;

// Cria diretórios de data se não existirem
fs.ensureDirSync(path.join(__dirname, 'data'));
fs.ensureDirSync(path.join(__dirname, 'data', 'auth'));
fs.ensureDirSync(path.join(__dirname, 'data', 'vendas'));
fs.ensureDirSync(path.join(__dirname, 'data', 'pessoas'));
fs.ensureDirSync(path.join(__dirname, 'data', 'produtos'));
fs.ensureDirSync(path.join(__dirname, 'data', 'notas_fiscais'));
fs.ensureDirSync(path.join(__dirname, 'data', 'cobrancas'));

// View engine
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Use layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');  // define layout padrão

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
const indexRoutes = require('./src/routes/index');
const authRoutes = require('./src/routes/authRoutes');
const apiRoutes = require('./src/routes/apiRoutes');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
