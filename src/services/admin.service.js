const UserModel = require('../models/user.model');
const TutorModel = require('../models/tutor.model');
const ParentModel = require('../models/parent.model');
const StudentModel = require('../models/student.model');
const SubjectModel = require('../models/subject.model');
const GradeModel = require('../models/grade.model');
const CertificateModel = require('../models/certificate.model');
const FeedbackModel = require('../models/feedback.model');
const { comparePassword, hashPassword } = require('../utils/hash');
const {
  UserRole,
  UserStatus,
  TutorProfileStatus,
  FeedbackAuthorRole,
} = require('../constants/enums');

class AdminService {
  async getAdminProfile(userId) {
    const user = await UserModel.findById(userId).select('email phone role status createdAt updatedAt').lean();

    if (!user || user.role !== UserRole.ADMIN) {
      const error = new Error('Admin profile not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      userId: user._id,
      fullName: user.email?.split('@')[0] || 'admin',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      dateOfBirth: null,
      gender: null,
      avatarUrl: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateAdminProfile(userId, payload = {}) {
    const user = await UserModel.findById(userId);

    if (!user || user.role !== UserRole.ADMIN) {
      const error = new Error('Admin profile not found');
      error.statusCode = 404;
      throw error;
    }

    if (payload.email !== undefined) user.email = String(payload.email).trim().toLowerCase();
    if (payload.phone !== undefined) user.phone = String(payload.phone).trim();

    await user.save();

    return this.getAdminProfile(userId);
  }

  async changeAdminPassword(userId, payload = {}) {
    const user = await UserModel.findById(userId).select('+password');

    if (!user || user.role !== UserRole.ADMIN) {
      const error = new Error('Admin profile not found');
      error.statusCode = 404;
      throw error;
    }

    const currentPassword = String(payload.currentPassword || '');
    const newPassword = String(payload.newPassword || '');
    const confirmPassword = String(payload.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      const error = new Error('Missing password fields');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword !== confirmPassword) {
      const error = new Error('Password confirmation does not match');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return true;
  }

  async getFeedbackTutors({ search = '' }) {
    const feedbacks = await FeedbackModel.find({})
      .populate('tutorId', 'fullName avatarUrl')
      .lean();

    const map = new Map();
    feedbacks.forEach((item) => {
      if (!item.tutorId?._id) return;
      const key = String(item.tutorId._id);
      const current = map.get(key) || {
        tutorId: key,
        tutorName: item.tutorId.fullName || '-',
        tutorAvatar: item.tutorId.avatarUrl || null,
        totalFeedbacks: 0,
        averageRating: 0,
        totalRating: 0,
      };

      current.totalFeedbacks += 1;
      current.totalRating += Number(item.rating || 0);
      map.set(key, current);
    });

    const q = search.trim().toLowerCase();
    return Array.from(map.values())
      .map((it) => ({
        tutorId: it.tutorId,
        tutorName: it.tutorName,
        tutorAvatar: it.tutorAvatar,
        totalFeedbacks: it.totalFeedbacks,
        averageRating: it.totalFeedbacks ? Number((it.totalRating / it.totalFeedbacks).toFixed(1)) : 0,
      }))
      .filter((it) => !q || it.tutorName.toLowerCase().includes(q))
      .sort((a, b) => b.totalFeedbacks - a.totalFeedbacks);
  }

  async getFeedbackList({ tutorId, search = '', page = 1, limit = 20 }) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));

    const match = tutorId ? { tutorId } : {};

    const feedbacks = await FeedbackModel.find(match)
      .populate('authorUserId', 'email')
      .populate('tutorId', 'fullName')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const q = search.trim().toLowerCase();
    const filtered = q
      ? feedbacks.filter((item) => {
          const str = [item.comment, item.authorUserId?.email, item.tutorId?.fullName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return str.includes(q);
        })
      : feedbacks;

    return {
      items: await Promise.all(filtered.map(async (item) => {
        let authorFullName = item.authorUserId?.email || '-';

        if (item.authorRole === FeedbackAuthorRole.STUDENT) {
          const s = await StudentModel.findOne({ userId: item.authorUserId?._id }).select('fullName').lean();
          if (s?.fullName) authorFullName = s.fullName;
        } else {
          const p = await ParentModel.findOne({ userId: item.authorUserId?._id }).select('fullName').lean();
          if (p?.fullName) authorFullName = p.fullName;
        }

        return {
          id: item._id,
          authorName: authorFullName,
          authorEmail: item.authorUserId?.email || '-',
          tutorId: item.tutorId?._id,
          tutorName: item.tutorId?.fullName || '-',
          rating: item.rating,
          comment: item.comment || '',
          createdAt: item.createdAt,
        };
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
      },
    };
  }

  async deleteFeedback(feedbackId) {
    const deleted = await FeedbackModel.findByIdAndDelete(feedbackId);
    if (!deleted) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }
    return true;
  }

  async getReferenceData() {
    const [subjects, grades] = await Promise.all([
      SubjectModel.find({ status: 1 }).select('name').sort({ name: 1 }).lean(),
      GradeModel.find({ status: 1 }).select('name orderNumber').sort({ orderNumber: 1 }).lean(),
    ]);

    return {
      subjects: subjects.map((s) => s.name),
      grades: grades.map((g) => g.name),
    };
  }

  async updateTutorDetail(userId, payload = {}) {
    const tutor = await TutorModel.findOne({ userId });
    const user = await UserModel.findById(userId);

    if (!user || user.role !== UserRole.TUTOR) {
      const error = new Error('Tutor not found');
      error.statusCode = 404;
      throw error;
    }

    if (payload.phone !== undefined) user.phone = payload.phone;
    await user.save();

    if (tutor) {
      if (payload.fullName !== undefined) tutor.fullName = payload.fullName;
      if (payload.dateOfBirth !== undefined) tutor.dateOfBirth = payload.dateOfBirth || null;
      if (payload.gender !== undefined) tutor.gender = payload.gender || null;
      if (payload.placeOfBirth !== undefined) tutor.placeOfBirth = payload.placeOfBirth;
      if (payload.address !== undefined) tutor.address = payload.address;
      if (payload.teachingArea !== undefined) tutor.teachingArea = payload.teachingArea;
      if (payload.identityNumber !== undefined) tutor.identityNumber = payload.identityNumber;
      if (payload.subjects !== undefined) {
        const subjectDocs = await SubjectModel.find({ name: { $in: payload.subjects } }).select('_id').lean();
        tutor.subjects = subjectDocs.map((s) => s._id);
      }
      if (payload.grades !== undefined) {
        const gradeDocs = await GradeModel.find({ name: { $in: payload.grades } }).select('_id').lean();
        tutor.grades = gradeDocs.map((g) => g._id);
      }
      if (payload.availableDays !== undefined) tutor.availableDays = payload.availableDays;
      if (payload.bio !== undefined) tutor.bio = payload.bio;
      if (payload.hourlyRate !== undefined) tutor.hourlyRate = payload.hourlyRate;
      await tutor.save();
    }

    return this.getTutorDetailForAdmin(userId);
  }

  async updateParentDetail(userId, payload = {}) {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== UserRole.PARENT) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      throw error;
    }

    if (payload.phone !== undefined) user.phone = payload.phone;
    await user.save();

    let parent = await ParentModel.findOne({ userId });
    if (parent) {
      if (payload.fullName !== undefined) parent.fullName = payload.fullName;
      if (payload.address !== undefined) parent.address = payload.address;
      await parent.save();
    }

    if (payload.child) {
      const child = await StudentModel.findById(payload.child.id);
      if (child) {
        if (payload.child.fullName !== undefined) child.fullName = payload.child.fullName;
        if (payload.child.dateOfBirth !== undefined) child.dateOfBirth = payload.child.dateOfBirth || null;
        if (payload.child.gender !== undefined) child.gender = payload.child.gender || null;
        if (payload.child.grade !== undefined) child.grade = payload.child.grade;
        if (payload.child.school !== undefined) child.school = payload.child.school;
        await child.save();
      }
    }

    return this.getParentDetailForAdmin(userId);
  }

  async updateStudentDetail(userId, payload = {}) {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== UserRole.STUDENT) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    if (payload.phone !== undefined) user.phone = payload.phone;
    await user.save();

    let student = await StudentModel.findOne({ userId });
    if (student) {
      if (payload.fullName !== undefined) student.fullName = payload.fullName;
      if (payload.dateOfBirth !== undefined) student.dateOfBirth = payload.dateOfBirth || null;
      if (payload.gender !== undefined) student.gender = payload.gender || null;
      if (payload.grade !== undefined) student.grade = payload.grade;
      if (payload.school !== undefined) student.school = payload.school;
      await student.save();
    }

    return this.getStudentDetailForAdmin(userId);
  }

  async getParentDetailForAdmin(userId) {
    const user = await UserModel.findById(userId).select('email phone status role createdAt').lean();

    if (!user || user.role !== UserRole.PARENT) {
      const error = new Error('Parent profile not found');
      error.statusCode = 404;
      throw error;
    }

    const parent = await ParentModel.findOne({ userId }).lean();
    const children = parent ? await StudentModel.find({ parentId: parent._id }).lean() : [];

    return {
      userId,
      email: user.email || '-',
      phone: user.phone || '-',
      userStatus: user.status,
      parent: {
        id: parent?._id || null,
        fullName: parent?.fullName || user.email?.split('@')[0] || '-',
        avatarUrl: parent?.avatarUrl || null,
        dateOfBirth: null,
        gender: null,
        address: parent?.address || '-',
        hometown: '-',
      },
      children: children.map((child) => ({
        id: child._id,
        fullName: child.fullName || '-',
        dateOfBirth: child.dateOfBirth || null,
        gender: child.gender || null,
        grade: child.grade || '-',
        phone: user.phone || '-',
        school: child.school || '-',
        learningMode: 'online',
        area: parent?.address || '-',
      })),
    };
  }

  async getStudentDetailForAdmin(userId) {
    const user = await UserModel.findById(userId).select('email phone status role createdAt').lean();

    if (!user || user.role !== UserRole.STUDENT) {
      const error = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const student = await StudentModel.findOne({ userId }).lean();

    return {
      userId,
      email: user.email || '-',
      phone: user.phone || '-',
      userStatus: user.status,
      student: {
        id: student?._id || null,
        fullName: student?.fullName || user.email?.split('@')[0] || '-',
        avatarUrl: student?.avatarUrl || null,
        dateOfBirth: student?.dateOfBirth || null,
        gender: student?.gender || null,
        grade: student?.grade || '-',
        school: student?.school || '-',
      },
    };
  }

  async getTutorDetailForAdmin(userId) {
    const tutor = await TutorModel.findOne({ userId })
      .populate('userId', 'email phone status createdAt')
      .populate('subjects', 'name')
      .populate('grades', 'name orderNumber')
      .lean();

    if (!tutor) {
      const user = await UserModel.findById(userId).select('email phone status role').lean();

      if (!user || user.role !== UserRole.TUTOR) {
        const error = new Error('Tutor profile not found');
        error.statusCode = 404;
        throw error;
      }

      return {
        id: null,
        userId: userId,
        avatarUrl: null,
        fullName: user.email?.split('@')[0] || '-',
        email: user.email || '-',
        phone: user.phone || '-',
        dateOfBirth: null,
        gender: null,
        address: '-',
        placeOfBirth: '-',
        identityNumber: '-',
        teachingArea: '-',
        profileStatus: null,
        userStatus: user.status,
        subjects: [],
        grades: [],
        availableDays: [],
        availableTimeSlots: [],
        certificates: [],
      };
    }

    const certificates = await CertificateModel.find({ tutorId: tutor._id }).sort({ createdAt: -1 }).lean();

    return {
      id: tutor._id,
      userId: tutor.userId?._id,
      avatarUrl: tutor.avatarUrl || null,
      fullName: tutor.fullName || '-',
      email: tutor.userId?.email || '-',
      phone: tutor.userId?.phone || '-',
      dateOfBirth: tutor.dateOfBirth || null,
      gender: tutor.gender || null,
      address: tutor.address || '-',
      placeOfBirth: tutor.placeOfBirth || '-',
      identityNumber: tutor.identityNumber || '-',
      teachingArea: tutor.teachingArea || '-',
      profileStatus: tutor.profileStatus,
      userStatus: tutor.userId?.status,
      subjects: (tutor.subjects || []).map((s) => s.name),
      grades: (tutor.grades || []).map((g) => g.name),
      availableDays: tutor.availableDays || [],
      availableTimeSlots: tutor.availableTimeSlots || [],
      certificates: certificates.map((c) => ({
        id: c._id,
        schoolName: c.schoolName || '-',
        major: c.major || '-',
        educationStatus: c.educationStatus,
        images: c.images || [],
      })),
    };
  }

  async updateUserStatus(userId, status) {
    const safeStatus = Number(status);

    if (![1, 2, 3].includes(safeStatus)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await UserModel.findById(userId).select('role');
    if (!existingUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Parent và Student chỉ cho phép ACTIVE/INACTIVE
    if ([UserRole.PARENT, UserRole.STUDENT].includes(existingUser.role) && safeStatus === 3) {
      const error = new Error('Parent/Student status cannot be pending');
      error.statusCode = 400;
      throw error;
    }

    // Đối với gia sư: admin luôn có thể đổi trạng thái.
    // Đồng thời đồng bộ profileStatus để phục vụ hiển thị/tạo lớp, nhưng KHÔNG chặn thao tác.
    if (existingUser.role === UserRole.TUTOR) {
      const tutor = await TutorModel.findOne({ userId }).select('profileStatus');

      if (tutor) {
        if (safeStatus === UserStatus.ACTIVE) {
          // Khi admin kích hoạt tài khoản gia sư, coi như hồ sơ đã được duyệt
          tutor.profileStatus = TutorProfileStatus.APPROVED;
          await tutor.save();
        } else if (safeStatus === UserStatus.PENDING) {
          // Khi đưa về trạng thái chờ duyệt, đánh dấu hồ sơ ở trạng thái SUBMITTED
          tutor.profileStatus = TutorProfileStatus.SUBMITTED;
          await tutor.save();
        }
        // Với INACTIVE: giữ nguyên profileStatus hiện tại
      }
    }

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { status: safeStatus },
      { new: true }
    ).select('email phone role status createdAt updatedAt');

    return updated;
  }

  async getUserManagementList({ role = UserRole.TUTOR, status, search = '', page = 1, limit = 8 }) {
    const safeRole = Number(role);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 8));

    if (![UserRole.TUTOR, UserRole.PARENT, UserRole.STUDENT].includes(safeRole)) {
      const error = new Error('Invalid role for user management');
      error.statusCode = 400;
      throw error;
    }

    const match = { role: safeRole };

    if (status) {
      match.status = Number(status);
    }

    if (search && search.trim()) {
      const q = search.trim();
      match.$or = [
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await UserModel.find(match)
      .select('email phone role status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await UserModel.countDocuments(match);

    return {
      items: users.map((user, index) => ({
        id: user._id,
        userId: user._id,
        code: `KH${String((safePage - 1) * safeLimit + index + 1).padStart(3, '0')}`,
        fullName: user.email?.split('@')[0] || 'N/A',
        phone: user.phone || '-',
        email: user.email,
        teachingArea: safeRole === UserRole.TUTOR ? 'Hà Nội' : '-',
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getOverviewStatistics() {
    const [studentCount, tutorCount, parentCount] = await Promise.all([
      UserModel.countDocuments({ role: UserRole.STUDENT }),
      UserModel.countDocuments({ role: UserRole.TUTOR }),
      UserModel.countDocuments({ role: UserRole.PARENT }),
    ]);

    const monthlyTrend = await this.getMonthlyUserTrend();
    const loyalTutors = await this.getLoyalTutors();

    return {
      summary: {
        students: studentCount,
        tutors: tutorCount,
        parents: parentCount,
      },
      chart: monthlyTrend,
      loyalTutors,
    };
  }

  async getMonthlyUserTrend() {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: `T${date.getMonth() + 1}`,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }

    const startDate = new Date(months[0].year, months[0].month - 1, 1);

    const [baseCounts, grouped] = await Promise.all([
      UserModel.aggregate([
        {
          $match: {
            role: { $in: [UserRole.STUDENT, UserRole.TUTOR, UserRole.PARENT] },
            createdAt: { $lt: startDate },
          },
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
      UserModel.aggregate([
        {
          $match: {
            role: { $in: [UserRole.STUDENT, UserRole.TUTOR, UserRole.PARENT] },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const baseMap = new Map();
    baseCounts.forEach((item) => {
      baseMap.set(item._id, item.count);
    });

    const monthlyNewMap = new Map();
    grouped.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${item._id.role}`;
      monthlyNewMap.set(key, item.count);
    });

    let cumulativeStudents = baseMap.get(UserRole.STUDENT) || 0;
    let cumulativeTutors = baseMap.get(UserRole.TUTOR) || 0;
    let cumulativeParents = baseMap.get(UserRole.PARENT) || 0;

    return months.map((m) => {
      cumulativeStudents += monthlyNewMap.get(`${m.key}-${UserRole.STUDENT}`) || 0;
      cumulativeTutors += monthlyNewMap.get(`${m.key}-${UserRole.TUTOR}`) || 0;
      cumulativeParents += monthlyNewMap.get(`${m.key}-${UserRole.PARENT}`) || 0;

      return {
        month: m.label,
        students: cumulativeStudents,
        tutors: cumulativeTutors,
        parents: cumulativeParents,
      };
    });
  }

  async getLoyalTutors(limit = 10) {
    const tutors = await TutorModel.find({})
      .populate('userId', 'email createdAt')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return tutors
      .map((tutor) => {
        const totalSpent = tutor.packageSpent || tutor.totalSpent || tutor.subscriptionSpent || 0;

        return {
          tutorId: tutor._id,
          fullName: tutor.fullName,
          avatarUrl: tutor.avatarUrl || null,
          joinedAt: tutor.createdAt,
          email: tutor.userId?.email || null,
          totalSpent,
        };
      })
      .sort((a, b) => {
        const joinedDiff = new Date(a.joinedAt) - new Date(b.joinedAt);
        if (joinedDiff !== 0) return joinedDiff;
        return b.totalSpent - a.totalSpent;
      });
  }
}

module.exports = AdminService;
