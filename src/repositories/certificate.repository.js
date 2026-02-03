const CertificateModel = require('../models/certificate.model');

/**
 * Certificate Repository - Data Access Layer
 */
class CertificateRepository {
  /**
   * Find certificate by ID
   */
  async findById(id) {
    return CertificateModel.findById(id).populate('tutorId', 'fullName');
  }

  /**
   * Find certificates by tutor ID
   */
  async findByTutorId(tutorId) {
    return CertificateModel.find({ tutorId }).sort({ createdAt: -1 });
  }

  /**
   * Create new certificate
   */
  async create(certificateData) {
    return CertificateModel.create(certificateData);
  }

  /**
   * Update certificate by ID
   */
  async updateById(id, updateData) {
    return CertificateModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete certificate by ID
   */
  async deleteById(id) {
    return CertificateModel.findByIdAndDelete(id);
  }

  /**
   * Delete all certificates by tutor ID
   */
  async deleteByTutorId(tutorId) {
    return CertificateModel.deleteMany({ tutorId });
  }

  /**
   * Find all certificates with pagination
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      CertificateModel.find(filter)
        .populate('tutorId', 'fullName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      CertificateModel.countDocuments(filter),
    ]);

    return { certificates, total };
  }
}

module.exports = CertificateRepository;
