const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');

router.get('/check', updateController.checkUpdate);

module.exports = router;
