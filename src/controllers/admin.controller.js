const AdminService = require('../services/admin.service');
const { success } = require('../utils/response');

const adminService = new AdminService();

class AdminController {
  async getAdminProfile(req, res, next) {
    try {
      const data = await adminService.getAdminProfile(req.user.id);

      return success(res, {
        data,
        message: 'Admin profile fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAdminProfile(req, res, next) {
    try {
      const data = await adminService.updateAdminProfile(req.user.id, req.body);

      return success(res, {
        data,
        message: 'Admin profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async changeAdminPassword(req, res, next) {
    try {
      await adminService.changeAdminPassword(req.user.id, req.body);

      return success(res, {
        data: true,
        message: 'Admin password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackTutors(req, res, next) {
    try {
      const { search } = req.query;
      const data = await adminService.getFeedbackTutors({ search });

      return success(res, {
        data,
        message: 'Feedback tutors fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackList(req, res, next) {
    try {
      const { tutorId, search, page, limit } = req.query;
      const data = await adminService.getFeedbackList({ tutorId, search, page, limit });

      return success(res, {
        data,
        message: 'Feedback list fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedback(req, res, next) {
    try {
      const { feedbackId } = req.params;
      await adminService.deleteFeedback(feedbackId);

      return success(res, {
        data: true,
        message: 'Feedback deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getReferenceData(req, res, next) {
    try {
      const data = await adminService.getReferenceData();

      return success(res, {
        data,
        message: 'Reference data fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserManagementList(req, res, next) {
    try {
      const { role, status, search, page, limit } = req.query;
      const data = await adminService.getUserManagementList({ role, status, search, page, limit });

      return success(res, {
        data,
        message: 'Admin user management list fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTutorDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.getTutorDetailForAdmin(userId);

      return success(res, {
        data,
        message: 'Tutor detail fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getParentDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.getParentDetailForAdmin(userId);

      return success(res, {
        data,
        message: 'Parent detail fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.getStudentDetailForAdmin(userId);

      return success(res, {
        data,
        message: 'Student detail fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTutorDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.updateTutorDetail(userId, req.body);

      return success(res, {
        data,
        message: 'Tutor detail updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateParentDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.updateParentDetail(userId, req.body);

      return success(res, {
        data,
        message: 'Parent detail updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStudentDetail(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await adminService.updateStudentDetail(userId, req.body);

      return success(res, {
        data,
        message: 'Student detail updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const data = await adminService.updateUserStatus(userId, status);

      return success(res, {
        data,
        message: 'User status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getOverviewStatistics(req, res, next) {
    try {
      const data = await adminService.getOverviewStatistics();

      return success(res, {
        data,
        message: 'Admin statistics fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
