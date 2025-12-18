const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/topup', authMiddleware, roleMiddleware(['parent']), walletController.topUp);
router.post('/lookup-student', authMiddleware, roleMiddleware(['parent']), walletController.lookupStudent);
router.post('/transfer', authMiddleware, roleMiddleware(['parent']), walletController.transfer);
router.post('/charge', authMiddleware, roleMiddleware(['merchant']), walletController.charge);
router.get('/balance/:userId', authMiddleware, walletController.getBalance);
router.get('/balance', authMiddleware, walletController.getBalance); // Convenience route for self

module.exports = router;
