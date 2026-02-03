const UserModel = require('../models/user.model');
const TutorModel = require('../models/tutor.model');
const StudentModel = require('../models/student.model');
const ParentModel = require('../models/parent.model');
const SubjectModel = require('../models/subject.model');
const GradeModel = require('../models/grade.model');
const CertificateModel = require('../models/certificate.model');
const FeedbackModel = require('../models/feedback.model');
const { hashPassword } = require('./hash');
const {
    UserRole,
    UserStatus,
    Gender,
    TutorProfileStatus,
    EducationStatus,
    FeedbackStatus,
    FeedbackAuthorRole,
} = require('../constants/enums');

/**
 * Clear all data
 */
async function clearAllData() {
    console.log('🗑️  Clearing existing data...');
    await UserModel.deleteMany({});
    await TutorModel.deleteMany({});
    await StudentModel.deleteMany({});
    await ParentModel.deleteMany({});
    await CertificateModel.deleteMany({});
    await FeedbackModel.deleteMany({});
    console.log('✅ Data cleared\n');
}

/**
 * Seed users
 */
async function seedUsers() {
    console.log('👥 Seeding users...');

    const password = await hashPassword('123456');

    const users = [
        // Tutors
        {
            email: 'tutor1@example.com',
            password,
            phone: '0912345678',
            role: UserRole.TUTOR,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'tutor2@example.com',
            password,
            phone: '0923456789',
            role: UserRole.TUTOR,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'tutor3@example.com',
            password,
            phone: '0934567890',
            role: UserRole.TUTOR,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'tutor4@example.com',
            password,
            phone: '0945678901',
            role: UserRole.TUTOR,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'tutor5@example.com',
            password,
            phone: '0956789012',
            role: UserRole.TUTOR,
            status: UserStatus.ACTIVE,
        },
        // Students
        {
            email: 'student1@example.com',
            password,
            phone: '0901234567',
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'student2@example.com',
            password,
            phone: '0902345678',
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
        },
        // Parents
        {
            email: 'parent1@example.com',
            password,
            phone: '0945678901',
            role: UserRole.PARENT,
            status: UserStatus.ACTIVE,
        },
        {
            email: 'parent2@example.com',
            password,
            phone: '0956789012',
            role: UserRole.PARENT,
            status: UserStatus.ACTIVE,
        },
    ];

    const createdUsers = await UserModel.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
}

/**
 * Seed tutors
 */
async function seedTutors(users, subjects, grades) {
    console.log('👨‍🏫 Seeding tutors...');

    const tutorUsers = users.filter((u) => u.role === UserRole.TUTOR);

    // Get some subjects and grades
    const mathSubject = subjects.find((s) => s.code === 'MATH');
    const physicsSubject = subjects.find((s) => s.code === 'PHYSICS');
    const englishSubject = subjects.find((s) => s.code === 'ENGLISH');
    const chemistrySubject = subjects.find((s) => s.code === 'CHEMISTRY');
    const literatureSubject = subjects.find((s) => s.code === 'LITERATURE');

    const grade8 = grades.find((g) => g.orderNumber === 8);
    const grade9 = grades.find((g) => g.orderNumber === 9);
    const grade10 = grades.find((g) => g.orderNumber === 10);
    const grade11 = grades.find((g) => g.orderNumber === 11);
    const grade12 = grades.find((g) => g.orderNumber === 12);

    const tutors = [
        {
            userId: tutorUsers[0]._id,
            fullName: 'Nguyễn Văn An',
            avatarUrl: 'https://i.pravatar.cc/150?img=12',
            gender: Gender.MALE,
            dateOfBirth: new Date('1995-05-15'),
            placeOfBirth: 'Hà Nội',
            address: 'Quận 1, TP.HCM',
            teachingArea: 'TP.HCM (Quận 1, 2, 3, Bình Thạnh)',
            bio: 'Giáo viên Toán có 7 năm kinh nghiệm. Tốt nghiệp ĐH Bách Khoa TP.HCM. Chuyên luyện thi THPT Quốc Gia.',
            hourlyRate: 200000,
            // Step 2: Identity
            identityNumber: '079195012345',
            identityImages: [],
            // Step 3: Certificates (will be added separately)
            // Step 4: Teaching Info
            subjects: [mathSubject._id, physicsSubject._id],
            grades: [grade10._id, grade11._id, grade12._id],
            availableDays: [2, 3, 4, 5, 6], // Mon-Fri
            availableTimeSlots: ['evening', 'night'],
            // Profile Status
            profileStatus: TutorProfileStatus.APPROVED,
            currentStep: 4,
            completedSteps: [1, 2, 3, 4],
            isProfileComplete: true,
            // Ratings
            averageRating: 4.8,
            totalFeedback: 15,
        },
        {
            userId: tutorUsers[1]._id,
            fullName: 'Trần Thị Bình',
            avatarUrl: 'https://i.pravatar.cc/150?img=47',
            gender: Gender.FEMALE,
            dateOfBirth: new Date('1993-08-20'),
            placeOfBirth: 'TP.HCM',
            address: 'Quận 3, TP.HCM',
            teachingArea: 'TP.HCM (Quận 1, 3, 10, Phú Nhuận)',
            bio: 'Cựu học sinh THPT Chuyên Lê Hồng Phong. Thạc sĩ Vật Lý. Đam mê giảng dạy và truyền cảm hứng cho học sinh.',
            hourlyRate: 250000,
            // Step 2: Identity
            identityNumber: '079193067890',
            identityImages: [],
            // Step 4: Teaching Info
            subjects: [physicsSubject._id],
            grades: [grade10._id, grade11._id, grade12._id],
            availableDays: [2, 3, 5, 6, 7], // Mon, Tue, Thu, Fri, Sat
            availableTimeSlots: ['afternoon', 'evening'],
            // Profile Status
            profileStatus: TutorProfileStatus.APPROVED,
            currentStep: 4,
            completedSteps: [1, 2, 3, 4],
            isProfileComplete: true,
            // Ratings
            averageRating: 4.9,
            totalFeedback: 22,
        },
        {
            userId: tutorUsers[2]._id,
            fullName: 'Lê Minh Tuấn',
            avatarUrl: 'https://i.pravatar.cc/150?img=33',
            gender: Gender.MALE,
            dateOfBirth: new Date('1997-03-10'),
            placeOfBirth: 'Đà Nẵng',
            address: 'Quận Tân Bình, TP.HCM',
            teachingArea: 'TP.HCM (Tân Bình, Quận 10, Gò Vấp)',
            bio: 'Tốt nghiệp Đại học Ngoại Ngữ. IELTS 8.0. Kinh nghiệm giảng dạy tiếng Anh giao tiếp và luyện thi.',
            hourlyRate: 180000,
            // Step 2: Identity
            identityNumber: '079197034567',
            identityImages: [],
            // Step 4: Teaching Info
            subjects: [englishSubject._id],
            grades: [grade10._id, grade11._id, grade12._id],
            availableDays: [2, 3, 4, 5, 6, 7], // Mon-Sat
            availableTimeSlots: ['morning', 'afternoon', 'evening'],
            // Profile Status
            profileStatus: TutorProfileStatus.APPROVED,
            currentStep: 4,
            completedSteps: [1, 2, 3, 4],
            isProfileComplete: true,
            // Ratings
            averageRating: 4.6,
            totalFeedback: 8,
        },
        {
            userId: tutorUsers[3]._id,
            fullName: 'Phạm Thị Mai',
            avatarUrl: 'https://i.pravatar.cc/150?img=20',
            gender: Gender.FEMALE,
            dateOfBirth: new Date('1994-11-25'),
            placeOfBirth: 'Huế',
            address: 'Quận Bình Thạnh, TP.HCM',
            teachingArea: 'TP.HCM (Bình Thạnh, Quận 1, 2, Thủ Đức)',
            bio: 'Cử nhân Hóa học ĐH Khoa học Tự nhiên. 6 năm kinh nghiệm dạy Hóa THPT. Chuyên gia ôn thi đại học khối B.',
            hourlyRate: 220000,
            // Step 2: Identity
            identityNumber: '079194098765',
            identityImages: [],
            // Step 4: Teaching Info
            subjects: [chemistrySubject._id],
            grades: [grade10._id, grade11._id, grade12._id],
            availableDays: [3, 4, 5, 6, 7], // Tue-Sat
            availableTimeSlots: ['afternoon', 'evening', 'night'],
            // Profile Status
            profileStatus: TutorProfileStatus.APPROVED,
            currentStep: 4,
            completedSteps: [1, 2, 3, 4],
            isProfileComplete: true,
            // Ratings
            averageRating: 4.7,
            totalFeedback: 12,
        },
        {
            userId: tutorUsers[4]._id,
            fullName: 'Đỗ Văn Hùng',
            avatarUrl: 'https://i.pravatar.cc/150?img=15',
            gender: Gender.MALE,
            dateOfBirth: new Date('1992-07-08'),
            placeOfBirth: 'Nam Định',
            address: 'Quận 10, TP.HCM',
            teachingArea: 'TP.HCM (Quận 10, 5, 6, Tân Phú)',
            bio: 'Thạc sĩ Ngữ văn ĐH KHXH&NV. Chuyên dạy Văn THPT và ôn thi THPT Quốc Gia. Phương pháp dạy sáng tạo, dễ hiểu.',
            hourlyRate: 190000,
            // Step 2: Identity
            identityNumber: '079192076543',
            identityImages: [],
            // Step 4: Teaching Info
            subjects: [literatureSubject._id],
            grades: [grade8._id, grade9._id, grade10._id, grade11._id, grade12._id],
            availableDays: [2, 3, 4, 5], // Mon-Thu
            availableTimeSlots: ['evening', 'night'],
            // Profile Status
            profileStatus: TutorProfileStatus.APPROVED,
            currentStep: 4,
            completedSteps: [1, 2, 3, 4],
            isProfileComplete: true,
            // Ratings
            averageRating: 4.5,
            totalFeedback: 18,
        },
    ];

    const createdTutors = await TutorModel.insertMany(tutors);
    console.log(`✅ Created ${createdTutors.length} tutors`);
    return createdTutors;
}

/**
 * Seed parents
 */
async function seedParents(users) {
    console.log('👪 Seeding parents...');

    const parentUsers = users.filter((u) => u.role === UserRole.PARENT);

    const parents = [
        {
            userId: parentUsers[0]._id,
            fullName: 'Phạm Văn Cường',
            avatarUrl: 'https://i.pravatar.cc/150?img=60',
            address: 'Quận 1, TP.HCM',
        },
        {
            userId: parentUsers[1]._id,
            fullName: 'Hoàng Thị Dung',
            avatarUrl: 'https://i.pravatar.cc/150?img=49',
            address: 'Quận 3, TP.HCM',
        },
    ];

    const createdParents = await ParentModel.insertMany(parents);
    console.log(`✅ Created ${createdParents.length} parents`);
    return createdParents;
}

/**
 * Seed students
 */
async function seedStudents(users, parents, grades) {
    console.log('👨‍🎓 Seeding students...');

    const studentUsers = users.filter((u) => u.role === UserRole.STUDENT);

    const students = [
        {
            userId: studentUsers[0]._id,
            parentId: parents[0]._id,
            fullName: 'Nguyễn Minh Anh',
            avatarUrl: 'https://i.pravatar.cc/150?img=45',
            dateOfBirth: new Date('2008-04-15'),
            gender: Gender.FEMALE,
            grade: 'Lớp 11',
            school: 'THPT Nguyễn Thị Minh Khai',
        },
        {
            userId: studentUsers[1]._id,
            parentId: parents[1]._id,
            fullName: 'Trần Hoàng Long',
            avatarUrl: 'https://i.pravatar.cc/150?img=14',
            dateOfBirth: new Date('2007-09-20'),
            gender: Gender.MALE,
            grade: 'Lớp 12',
            school: 'THPT Lê Hồng Phong',
        },
    ];

    const createdStudents = await StudentModel.insertMany(students);
    console.log(`✅ Created ${createdStudents.length} students`);
    return createdStudents;
}

/**
 * Seed certificates
 */
async function seedCertificates(tutors) {
    console.log('📜 Seeding certificates...');

    const certificates = [
        // Tutor 1 - Nguyễn Văn An
        {
            tutorId: tutors[0]._id,
            schoolName: 'Đại học Bách Khoa TP.HCM',
            major: 'Kỹ thuật Cơ điện tử',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        {
            tutorId: tutors[0]._id,
            schoolName: 'Trung tâm Giáo dục Sư phạm',
            major: 'Chứng chỉ Sư phạm',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        // Tutor 2 - Trần Thị Bình
        {
            tutorId: tutors[1]._id,
            schoolName: 'Đại học Khoa học Tự nhiên TP.HCM',
            major: 'Vật Lý',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        {
            tutorId: tutors[1]._id,
            schoolName: 'Đại học Khoa học Tự nhiên TP.HCM',
            major: 'Thạc sĩ Vật Lý Lý thuyết',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        // Tutor 3 - Lê Minh Tuấn
        {
            tutorId: tutors[2]._id,
            schoolName: 'Đại học Ngoại Ngữ - ĐHQG TP.HCM',
            major: 'Ngôn ngữ Anh',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        {
            tutorId: tutors[2]._id,
            schoolName: 'British Council',
            major: 'IELTS Teaching Certificate',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        // Tutor 4 - Phạm Thị Mai
        {
            tutorId: tutors[3]._id,
            schoolName: 'Đại học Khoa học Tự nhiên TP.HCM',
            major: 'Hóa học',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        {
            tutorId: tutors[3]._id,
            schoolName: 'Trung tâm Bồi dưỡng giáo viên',
            major: 'Chứng chỉ Giảng dạy Hóa học THPT',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        // Tutor 5 - Đỗ Văn Hùng
        {
            tutorId: tutors[4]._id,
            schoolName: 'Đại học KHXH & Nhân văn TP.HCM',
            major: 'Ngữ văn Việt Nam',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
        {
            tutorId: tutors[4]._id,
            schoolName: 'Đại học KHXH & Nhân văn TP.HCM',
            major: 'Thạc sĩ Ngữ văn',
            educationStatus: EducationStatus.GRADUATED,
            images: [],
        },
    ];

    const createdCertificates = await CertificateModel.insertMany(certificates);
    console.log(`✅ Created ${createdCertificates.length} certificates`);
    return createdCertificates;
}

/**
 * Seed feedbacks
 */
async function seedFeedbacks(tutors, students, parents) {
    console.log('💬 Seeding feedbacks...');

    const studentUsers = await UserModel.find({
        _id: { $in: students.map((s) => s.userId) },
    });
    const parentUsers = await UserModel.find({
        _id: { $in: parents.map((p) => p.userId) },
    });

    const feedbacks = [
        // Feedbacks cho Tutor 1 (Nguyễn Văn An)
        {
            tutorId: tutors[0]._id,
            authorUserId: studentUsers[0]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 5,
            comment:
                'Thầy dạy rất chi tiết và dễ hiểu. Em đã cải thiện điểm Toán rất nhiều. Cảm ơn thầy!',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[0]._id,
            authorUserId: parentUsers[0]._id,
            authorRole: FeedbackAuthorRole.PARENT,
            rating: 5,
            comment:
                'Gia sư nhiệt tình, có phương pháp giảng dạy tốt. Con tôi rất thích học với thầy.',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[0]._id,
            authorUserId: studentUsers[1]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 4,
            comment: 'Thầy giảng dạy tốt, giải đáp thắc mắc nhiệt tình.',
            status: FeedbackStatus.VISIBLE,
        },
        // Feedbacks cho Tutor 2 (Trần Thị Bình)
        {
            tutorId: tutors[1]._id,
            authorUserId: studentUsers[0]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 5,
            comment:
                'Cô dạy Vật Lý rất hay, giúp em hiểu bản chất của vấn đề. Em rất thích học với cô!',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[1]._id,
            authorUserId: parentUsers[1]._id,
            authorRole: FeedbackAuthorRole.PARENT,
            rating: 5,
            comment:
                'Cô giáo tận tâm, chuyên môn cao. Con tôi đã tiến bộ rõ rệt. Rất hài lòng!',
            status: FeedbackStatus.VISIBLE,
        },
        // Feedbacks cho Tutor 3 (Lê Minh Tuấn)
        {
            tutorId: tutors[2]._id,
            authorUserId: studentUsers[1]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 5,
            comment:
                'Thầy dạy tiếng Anh rất thú vị, em đã tự tin hơn rất nhiều trong giao tiếp.',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[2]._id,
            authorUserId: parentUsers[0]._id,
            authorRole: FeedbackAuthorRole.PARENT,
            rating: 4,
            comment: 'Giáo viên giỏi, phương pháp dạy hiệu quả.',
            status: FeedbackStatus.VISIBLE,
        },
        // Feedbacks cho Tutor 4 (Phạm Thị Mai)
        {
            tutorId: tutors[3]._id,
            authorUserId: studentUsers[0]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 5,
            comment:
                'Cô dạy Hóa rất hay, giải thích dễ hiểu. Em đã không còn sợ môn Hóa nữa!',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[3]._id,
            authorUserId: parentUsers[1]._id,
            authorRole: FeedbackAuthorRole.PARENT,
            rating: 4,
            comment: 'Cô giáo nhiệt tình, con em tiến bộ rõ rệt.',
            status: FeedbackStatus.VISIBLE,
        },
        // Feedbacks cho Tutor 5 (Đỗ Văn Hùng)
        {
            tutorId: tutors[4]._id,
            authorUserId: studentUsers[1]._id,
            authorRole: FeedbackAuthorRole.STUDENT,
            rating: 5,
            comment:
                'Thầy dạy Văn rất hay, giúp em hiểu sâu hơn về văn học. Bài văn của em đã được điểm cao hơn nhiều!',
            status: FeedbackStatus.VISIBLE,
        },
        {
            tutorId: tutors[4]._id,
            authorUserId: parentUsers[0]._id,
            authorRole: FeedbackAuthorRole.PARENT,
            rating: 4,
            comment: 'Thầy giáo tận tâm, chuyên môn tốt. Rất hài lòng!',
            status: FeedbackStatus.VISIBLE,
        },
    ];

    const createdFeedbacks = await FeedbackModel.insertMany(feedbacks);
    console.log(`✅ Created ${createdFeedbacks.length} feedbacks`);
    return createdFeedbacks;
}

/**
 * Run full seed
 */
async function runFullSeed() {
    try {
        console.log('🌱 Starting full database seeding...\n');

        // Clear existing data
        await clearAllData();

        // Get existing subjects and grades (from basic seed)
        const subjects = await SubjectModel.find({ status: 1 });
        const grades = await GradeModel.find({ status: 1 });

        if (subjects.length === 0 || grades.length === 0) {
            console.log('⚠️  Subjects or Grades not found. Running basic seed first...');
            const { seedSubjects, seedGrades } = require('./seed-data');
            await seedSubjects();
            await seedGrades();
            // Re-fetch
            const newSubjects = await SubjectModel.find({ status: 1 });
            const newGrades = await GradeModel.find({ status: 1 });

            // Seed all data
            const users = await seedUsers();
            const tutors = await seedTutors(users, newSubjects, newGrades);
            const parents = await seedParents(users);
            const students = await seedStudents(users, parents, newGrades);
            await seedCertificates(tutors);
            await seedFeedbacks(tutors, students, parents);
        } else {
            // Seed all data
            const users = await seedUsers();
            const tutors = await seedTutors(users, subjects, grades);
            const parents = await seedParents(users);
            const students = await seedStudents(users, parents, grades);
            await seedCertificates(tutors);
            await seedFeedbacks(tutors, students, parents);
        }

        console.log('\n✅ Full database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Users: ${await UserModel.countDocuments()}`);
        console.log(`   - Tutors: ${await TutorModel.countDocuments()}`);
        console.log(`   - Students: ${await StudentModel.countDocuments()}`);
        console.log(`   - Parents: ${await ParentModel.countDocuments()}`);
        console.log(`   - Subjects: ${await SubjectModel.countDocuments()}`);
        console.log(`   - Grades: ${await GradeModel.countDocuments()}`);
        console.log(`   - Certificates: ${await CertificateModel.countDocuments()}`);
        console.log(`   - Feedbacks: ${await FeedbackModel.countDocuments()}`);
        console.log('\n🔑 Test Accounts (password: 123456):');
        console.log('   - tutor1@example.com (TUTOR)');
        console.log('   - student1@example.com (STUDENT)');
        console.log('   - parent1@example.com (PARENT)');
    } catch (error) {
        console.error('❌ Full seed failed:', error);
        throw error;
    }
}

module.exports = {
    clearAllData,
    seedUsers,
    seedTutors,
    seedParents,
    seedStudents,
    seedCertificates,
    seedFeedbacks,
    runFullSeed,
};
