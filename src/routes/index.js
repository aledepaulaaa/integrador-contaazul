//src/routes/index.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Integrador Conta Azul',
  });
});

module.exports = router;
