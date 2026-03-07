const { Router } = require('express');
const AdminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { UserRole } = require('../constants/enums');
const { error } = require('../utils/response');

const router = Router();
const controller = new AdminController();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return error(res, {
      message: 'You do not have permission to access admin resources',
      statusCode: 403,
    });
  }

  next();
}

router.get('/profile/me', authenticate, requireAdmin, controller.getAdminProfile.bind(controller));
router.put('/profile/me', authenticate, requireAdmin, controller.updateAdminProfile.bind(controller));
router.put('/profile/me/password', authenticate, requireAdmin, controller.changeAdminPassword.bind(controller));
router.get('/reference-data', authenticate, requireAdmin, controller.getReferenceData.bind(controller));
router.get('/feedbacks/tutors', authenticate, requireAdmin, controller.getFeedbackTutors.bind(controller));
router.get('/feedbacks', authenticate, requireAdmin, controller.getFeedbackList.bind(controller));
router.delete('/feedbacks/:feedbackId', authenticate, requireAdmin, controller.deleteFeedback.bind(controller));
router.get('/users', authenticate, requireAdmin, controller.getUserManagementList.bind(controller));
router.get('/users/tutors/:userId/detail', authenticate, requireAdmin, controller.getTutorDetail.bind(controller));
router.get('/users/parents/:userId/detail', authenticate, requireAdmin, controller.getParentDetail.bind(controller));
router.get('/users/students/:userId/detail', authenticate, requireAdmin, controller.getStudentDetail.bind(controller));
router.put('/users/tutors/:userId/detail', authenticate, requireAdmin, controller.updateTutorDetail.bind(controller));
router.put('/users/parents/:userId/detail', authenticate, requireAdmin, controller.updateParentDetail.bind(controller));
router.put('/users/students/:userId/detail', authenticate, requireAdmin, controller.updateStudentDetail.bind(controller));
router.patch('/users/:userId/status', authenticate, requireAdmin, controller.updateUserStatus.bind(controller));
router.get('/statistics/overview', authenticate, requireAdmin, controller.getOverviewStatistics.bind(controller));

module.exports = router;
