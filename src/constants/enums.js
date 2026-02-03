/**
 * Enums for the Tutor Platform
 * Using integers as per database design
 */

// User Roles
const UserRole = {
    STUDENT: 1,
    TUTOR: 2,
    PARENT: 3,
};

const UserRoleLabel = {
    [UserRole.STUDENT]: 'STUDENT',
    [UserRole.TUTOR]: 'TUTOR',
    [UserRole.PARENT]: 'PARENT',
};

// User Status
const UserStatus = {
    ACTIVE: 1,
    INACTIVE: 2,
    PENDING: 3,
};

const UserStatusLabel = {
    [UserStatus.ACTIVE]: 'ACTIVE',
    [UserStatus.INACTIVE]: 'INACTIVE',
    [UserStatus.PENDING]: 'PENDING',
};

// Gender
const Gender = {
    MALE: 1,
    FEMALE: 2,
    OTHER: 3,
};

const GenderLabel = {
    [Gender.MALE]: 'MALE',
    [Gender.FEMALE]: 'FEMALE',
    [Gender.OTHER]: 'OTHER',
};

// Tutor Profile Status
const TutorProfileStatus = {
    DRAFT: 1,
    SUBMITTED: 2,
    APPROVED: 3,
    REJECTED: 4,
};

const TutorProfileStatusLabel = {
    [TutorProfileStatus.DRAFT]: 'DRAFT',
    [TutorProfileStatus.SUBMITTED]: 'SUBMITTED',
    [TutorProfileStatus.APPROVED]: 'APPROVED',
    [TutorProfileStatus.REJECTED]: 'REJECTED',
};

// Education Status
const EducationStatus = {
    STUDYING: 1,
    GRADUATED: 2,
    NOT_GRADUATED: 3,
};

const EducationStatusLabel = {
    [EducationStatus.STUDYING]: 'STUDYING',
    [EducationStatus.GRADUATED]: 'GRADUATED',
    [EducationStatus.NOT_GRADUATED]: 'NOT_GRADUATED',
};

// Subject/Grade Status
const EntityStatus = {
    ACTIVE: 1,
    INACTIVE: 2,
};

const EntityStatusLabel = {
    [EntityStatus.ACTIVE]: 'ACTIVE',
    [EntityStatus.INACTIVE]: 'INACTIVE',
};

// Feedback Status
const FeedbackStatus = {
    VISIBLE: 1,
    HIDDEN: 2,
    REPORTED: 3,
};

const FeedbackStatusLabel = {
    [FeedbackStatus.VISIBLE]: 'VISIBLE',
    [FeedbackStatus.HIDDEN]: 'HIDDEN',
    [FeedbackStatus.REPORTED]: 'REPORTED',
};

// Feedback Author Role
const FeedbackAuthorRole = {
    STUDENT: 1,
    PARENT: 2,
};

const FeedbackAuthorRoleLabel = {
    [FeedbackAuthorRole.STUDENT]: 'STUDENT',
    [FeedbackAuthorRole.PARENT]: 'PARENT',
};

module.exports = {
    UserRole,
    UserRoleLabel,
    UserStatus,
    UserStatusLabel,
    Gender,
    GenderLabel,
    TutorProfileStatus,
    TutorProfileStatusLabel,
    EducationStatus,
    EducationStatusLabel,
    EntityStatus,
    EntityStatusLabel,
    FeedbackStatus,
    FeedbackStatusLabel,
    FeedbackAuthorRole,
    FeedbackAuthorRoleLabel,
};
