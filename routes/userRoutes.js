const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(['super_admin', 'campus_admin']), userController.getUsers);
router.post('/', authMiddleware, roleMiddleware(['super_admin', 'campus_admin']), userController.createUser);
router.post('/reset-pin', authMiddleware, roleMiddleware(['super_admin', 'campus_admin']), userController.resetPin);
router.post('/sync-nfc', authMiddleware, roleMiddleware(['super_admin', 'campus_admin']), userController.syncNfc);

module.exports = router;
