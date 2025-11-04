//src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.get('/connect', authController.connect);
router.get('/callback', authController.callback);
router.get('/disconnect', authController.disconnect);


module.exports = router;