const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const campusAdminController = require('../controllers/campusAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Super Admin Routes
router.get('/super/stats', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.getDashboardStats
);

router.post('/super/campus', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.createCampus
);

router.get('/super/campus', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.getAllCampuses
);

router.post('/super/admin', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.createCampusAdmin
);

router.get('/super/config', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.getSystemConfig
);

router.post('/super/config', 
  authMiddleware, 
  roleMiddleware(['super_admin']), 
  superAdminController.updateSystemConfig
);

// Campus Admin Routes
router.get('/campus/stats', 
  authMiddleware, 
  roleMiddleware(['campus_admin']), 
  campusAdminController.getDashboardStats
);

router.get('/campus/users', 
  authMiddleware, 
  roleMiddleware(['campus_admin']), 
  campusAdminController.getCampusUsers
);

router.post('/campus/users', 
  authMiddleware, 
  roleMiddleware(['campus_admin']), 
  campusAdminController.createUser
);

module.exports = router;
