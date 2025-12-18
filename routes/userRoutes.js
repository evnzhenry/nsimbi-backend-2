const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getUsers);
router.post('/', authMiddleware, roleMiddleware(['admin']), userController.createUser);
router.post('/reset-pin', authMiddleware, roleMiddleware(['admin']), userController.resetPin);
router.post('/sync-nfc', authMiddleware, roleMiddleware(['admin']), userController.syncNfc);

module.exports = router;
