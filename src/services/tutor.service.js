const TutorRepository = require('../repositories/tutor.repository');
const CertificateRepository = require('../repositories/certificate.repository');
const UserRepository = require('../repositories/user.repository');
const CloudinaryService = require('./cloudinary.service');
const { TutorProfileStatus } = require('../constants/enums');

/**
 * Tutor Service - Business Logic Layer
 * Handles tutor and certificate business logic
 */
class TutorService {
    constructor() {
        this.tutorRepo = new TutorRepository();
        this.certificateRepo = new CertificateRepository();
        this.userRepo = new UserRepository();
        this.cloudinaryService = new CloudinaryService();
    }

    /**
     * Get tutor profile by user ID
     * @param {string} userId - User ID
     * @param {boolean} throwError - Throw error if not found (default: true)
     * @returns {Promise<Object>} Tutor profile
     */
    async getTutorByUserId(userId, throwError = true) {
        const tutor = await this.tutorRepo.findByUserId(userId);

        if (!tutor && throwError) {
            const error = new Error('Tutor profile not found');
            error.statusCode = 404;
            throw error;
        }

        return tutor;
    }

    /**
     * Get tutor detailed info by ID (public view)
     * Only returns approved and completed profiles with certificates
     * @param {string} tutorId - Tutor ID
     * @returns {Promise<Object>} Tutor detailed info with certificates
     */
    async getTutorDetailById(tutorId) {
        // Get tutor info (only approved and completed)
        const tutor = await this.tutorRepo.findByIdDetailed(tutorId);

        if (!tutor) {
            const error = new Error('Tutor not found or not available');
            error.statusCode = 404;
            throw error;
        }

        // Get certificates for this tutor
        const certificates = await this.certificateRepo.findByTutorId(tutorId);

        return {
            ...tutor,
            certificates: certificates || [],
        };
    }

    /**
     * Get feedbacks for a tutor with pagination
     * Only returns visible feedbacks
     * @param {string} tutorId - Tutor ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Feedbacks with pagination
     */
    async getTutorFeedbacks(tutorId, options = {}) {
        const FeedbackRepository = require('../repositories/feedback.repository');
        const feedbackRepo = new FeedbackRepository();
        const { FeedbackStatus } = require('../constants/enums');

        // Verify tutor exists and is approved
        const tutor = await this.tutorRepo.findByIdDetailed(tutorId);
        if (!tutor) {
            const error = new Error('Tutor not found or not available');
            error.statusCode = 404;
            throw error;
        }

        // Get feedbacks (only visible ones)
        const result = await feedbackRepo.findByTutorId(tutorId, {
            page: options.page || 1,
            limit: options.limit || 10,
            status: FeedbackStatus.VISIBLE, // Only show visible feedbacks
        });

        return result;
    }

    /**
     * Search and filter tutors
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} Search results with pagination
     */
    async searchTutors(searchParams) {
        return await this.tutorRepo.searchTutors(searchParams);
    }

    /**
     * Get all approved tutors
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Tutors list with pagination
     */
    async getAllApprovedTutors(options) {
        return await this.tutorRepo.findAllApproved(options);
    }

    /**
     * Create tutor profile (Step 1)
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data
     * @returns {Promise<Object>} Created tutor profile
     */
    async createProfile(userId, profileData) {
        // Check if profile already exists
        const existing = await this.tutorRepo.findByUserId(userId);
        if (existing) {
            const error = new Error('Tutor profile already exists');
            error.statusCode = 400;
            throw error;
        }

        // Create profile with Step 1 data
        const profile = await this.tutorRepo.create({
            userId,
            fullName: profileData.fullName,
            dateOfBirth: profileData.dateOfBirth,
            placeOfBirth: profileData.placeOfBirth,
            gender: profileData.gender,
            hourlyRate: profileData.hourlyRate,
            teachingArea: profileData.teachingArea,
            currentStep: 2,  // Move to step 2
            completedSteps: [1],  // Step 1 completed
            profileStatus: TutorProfileStatus.DRAFT,
        });

        return profile;
    }

    /**
     * Update tutor profile (Step 2, 3)
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated tutor profile
     */
    async updateProfile(userId, updateData) {
        const tutor = await this.getTutorByUserId(userId);

        // Determine which step is being updated based on data
        let stepCompleted = null;

        // Step 2: Identity number
        if (updateData.identityNumber !== undefined) {
            tutor.identityNumber = updateData.identityNumber;
            stepCompleted = 2;
        }

        // Step 4: Teaching info (subjects, grades, availableDays, timeSlots)
        if (updateData.subjects !== undefined) tutor.subjects = updateData.subjects;
        if (updateData.grades !== undefined) tutor.grades = updateData.grades;
        if (updateData.availableDays !== undefined) tutor.availableDays = updateData.availableDays;
        if (updateData.availableTimeSlots !== undefined) tutor.availableTimeSlots = updateData.availableTimeSlots;

        if (updateData.subjects || updateData.grades) {
            stepCompleted = 4;  // Step 4
        }

        // Update other fields if provided
        if (updateData.fullName !== undefined) tutor.fullName = updateData.fullName;
        if (updateData.dateOfBirth !== undefined) tutor.dateOfBirth = updateData.dateOfBirth;
        if (updateData.placeOfBirth !== undefined) tutor.placeOfBirth = updateData.placeOfBirth;
        if (updateData.gender !== undefined) tutor.gender = updateData.gender;
        if (updateData.hourlyRate !== undefined) tutor.hourlyRate = updateData.hourlyRate;
        if (updateData.teachingArea !== undefined) tutor.teachingArea = updateData.teachingArea;
        if (updateData.bio !== undefined) tutor.bio = updateData.bio;
        if (updateData.address !== undefined) tutor.address = updateData.address;
        if (updateData.avatarUrl !== undefined) tutor.avatarUrl = updateData.avatarUrl;

        // Update progress tracking
        if (stepCompleted && !tutor.completedSteps.includes(stepCompleted)) {
            tutor.completedSteps.push(stepCompleted);

            // Set currentStep
            if (stepCompleted === 4) {
                tutor.currentStep = 4;  // Đã hoàn thành
            } else {
                tutor.currentStep = stepCompleted + 1;
            }
        }

        // Check if all 4 steps completed
        if (tutor.completedSteps.length === 4 &&
            tutor.completedSteps.includes(1) &&
            tutor.completedSteps.includes(2) &&
            tutor.completedSteps.includes(3) &&
            tutor.completedSteps.includes(4)) {
            tutor.isProfileComplete = true;
            tutor.profileStatus = TutorProfileStatus.SUBMITTED;
        }

        await tutor.save();
        return tutor;
    }

    /**
     * Get profile progress
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Profile progress
     */
    async getProfileProgress(userId) {
        const tutor = await this.getTutorByUserId(userId, false);

        if (!tutor) {
            return {
                hasProfile: false,
                currentStep: 1,
                completedSteps: [],
                isProfileComplete: false,
            };
        }

        return {
            hasProfile: true,
            currentStep: tutor.currentStep,
            completedSteps: tutor.completedSteps,
            isProfileComplete: tutor.isProfileComplete,
            profile: tutor,
        };
    }

    /**
     * Add certificate with images (Step 3)
     * @param {string} tutorId - Tutor ID
     * @param {Object} certificateData - Certificate data
     * @param {Array<string>} imagePaths - Array of local file paths
     * @returns {Promise<Object>} Created certificate
     */
    async addCertificate(tutorId, certificateData, imagePaths = []) {
        try {
            // Upload images to Cloudinary if provided
            let imageUrls = [];
            if (imagePaths && imagePaths.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadMultipleImages(
                    imagePaths,
                    { folder: 'tutor-certificates' }
                );
                imageUrls = uploadResults.map((result) => result.url);
            }

            // Create certificate with image URLs
            const certificate = await this.certificateRepo.create({
                tutorId,
                schoolName: certificateData.schoolName,
                major: certificateData.major,
                educationStatus: certificateData.educationStatus,
                images: imageUrls,
            });

            // Update tutor profile progress (Step 3 completed)
            const tutor = await this.tutorRepo.findById(tutorId);
            if (tutor) {
                if (!tutor.completedSteps.includes(3)) {
                    tutor.completedSteps.push(3);
                    tutor.currentStep = 4;  // Move to step 4
                }

                await tutor.save();
            }

            return certificate;
        } catch (error) {
            // If there's an error, try to clean up uploaded images
            if (imagePaths && imagePaths.length > 0) {
                // Cleanup will be handled by cloudinaryService
            }
            throw error;
        }
    }

    /**
     * Get all certificates for a tutor
     * @param {string} tutorId - Tutor ID
     * @returns {Promise<Array>} Array of certificates
     */
    async getCertificatesByTutorId(tutorId) {
        return await this.certificateRepo.findByTutorId(tutorId);
    }

    /**
     * Update certificate
     * @param {string} certificateId - Certificate ID
     * @param {string} tutorId - Tutor ID (for authorization check)
     * @param {Object} updateData - Update data
     * @param {Array<string>} newImagePaths - New image paths to add
     * @returns {Promise<Object>} Updated certificate
     */
    async updateCertificate(certificateId, tutorId, updateData, newImagePaths = []) {
        // Get existing certificate
        const certificate = await this.certificateRepo.findById(certificateId);

        if (!certificate) {
            const error = new Error('Certificate not found');
            error.statusCode = 404;
            throw error;
        }

        // Check authorization
        if (certificate.tutorId.toString() !== tutorId) {
            const error = new Error('Not authorized to update this certificate');
            error.statusCode = 403;
            throw error;
        }

        // Upload new images if provided
        let newImageUrls = [];
        if (newImagePaths && newImagePaths.length > 0) {
            const uploadResults = await this.cloudinaryService.uploadMultipleImages(
                newImagePaths,
                { folder: 'tutor-certificates' }
            );
            newImageUrls = uploadResults.map((result) => result.url);
        }

        // Merge existing and new images
        const updatedImages = [...(certificate.images || []), ...newImageUrls];

        // Update certificate
        const updatedCertificate = await this.certificateRepo.updateById(certificateId, {
            ...updateData,
            images: updatedImages,
        });

        return updatedCertificate;
    }

    /**
     * Delete certificate and its images
     * @param {string} certificateId - Certificate ID
     * @param {string} tutorId - Tutor ID (for authorization check)
     * @returns {Promise<void>}
     */
    async deleteCertificate(certificateId, tutorId) {
        // Get existing certificate
        const certificate = await this.certificateRepo.findById(certificateId);

        if (!certificate) {
            const error = new Error('Certificate not found');
            error.statusCode = 404;
            throw error;
        }

        // Check authorization
        if (certificate.tutorId.toString() !== tutorId) {
            const error = new Error('Not authorized to delete this certificate');
            error.statusCode = 403;
            throw error;
        }

        // Delete images from Cloudinary
        if (certificate.images && certificate.images.length > 0) {
            const publicIds = certificate.images
                .map((url) => this.cloudinaryService.extractPublicId(url))
                .filter((id) => id !== null);

            if (publicIds.length > 0) {
                await this.cloudinaryService.deleteMultipleImages(publicIds);
            }
        }

        // Delete certificate from database
        await this.certificateRepo.deleteById(certificateId);
    }

    /**
     * Remove specific images from certificate
     * @param {string} certificateId - Certificate ID
     * @param {string} tutorId - Tutor ID (for authorization check)
     * @param {Array<string>} imageUrls - Image URLs to remove
     * @returns {Promise<Object>} Updated certificate
     */
    async removeCertificateImages(certificateId, tutorId, imageUrls) {
        // Get existing certificate
        const certificate = await this.certificateRepo.findById(certificateId);

        if (!certificate) {
            const error = new Error('Certificate not found');
            error.statusCode = 404;
            throw error;
        }

        // Check authorization
        if (certificate.tutorId.toString() !== tutorId) {
            const error = new Error('Not authorized to modify this certificate');
            error.statusCode = 403;
            throw error;
        }

        // Delete images from Cloudinary
        const publicIds = imageUrls
            .map((url) => this.cloudinaryService.extractPublicId(url))
            .filter((id) => id !== null);

        if (publicIds.length > 0) {
            await this.cloudinaryService.deleteMultipleImages(publicIds);
        }

        // Remove URLs from certificate
        const remainingImages = certificate.images.filter(
            (url) => !imageUrls.includes(url)
        );

        // Update certificate
        const updatedCertificate = await this.certificateRepo.updateById(certificateId, {
            images: remainingImages,
        });

        return updatedCertificate;
    }
}

module.exports = TutorService;
