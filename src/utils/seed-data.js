const SubjectModel = require('../models/subject.model');
const GradeModel = require('../models/grade.model');
const { EntityStatus } = require('../constants/enums');

/**
 * Seed subjects data
 */
const seedSubjects = async () => {
  const subjects = [
    { code: 'MATH', name: 'Toán học', description: 'Môn Toán học từ cơ bản đến nâng cao', status: EntityStatus.ACTIVE },
    { code: 'PHYSICS', name: 'Vật lý', description: 'Môn Vật lý', status: EntityStatus.ACTIVE },
    { code: 'CHEMISTRY', name: 'Hóa học', description: 'Môn Hóa học', status: EntityStatus.ACTIVE },
    { code: 'BIOLOGY', name: 'Sinh học', description: 'Môn Sinh học', status: EntityStatus.ACTIVE },
    { code: 'LITERATURE', name: 'Ngữ văn', description: 'Môn Ngữ văn', status: EntityStatus.ACTIVE },
    { code: 'ENGLISH', name: 'Tiếng Anh', description: 'Môn Tiếng Anh', status: EntityStatus.ACTIVE },
    { code: 'HISTORY', name: 'Lịch sử', description: 'Môn Lịch sử', status: EntityStatus.ACTIVE },
    { code: 'GEOGRAPHY', name: 'Địa lý', description: 'Môn Địa lý', status: EntityStatus.ACTIVE },
    { code: 'CIVICS', name: 'Giáo dục công dân', description: 'Môn Giáo dục công dân', status: EntityStatus.ACTIVE },
    { code: 'INFORMATICS', name: 'Tin học', description: 'Môn Tin học', status: EntityStatus.ACTIVE },
  ];

  try {
    for (const subject of subjects) {
      await SubjectModel.findOneAndUpdate(
        { code: subject.code },
        subject,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Subjects seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
  }
};

/**
 * Seed grades data (Lớp 1-12)
 */
const seedGrades = async () => {
  const grades = [];
  for (let i = 1; i <= 12; i++) {
    grades.push({
      code: `GRADE_${i}`,
      name: `Lớp ${i}`,
      orderNumber: i,
      status: EntityStatus.ACTIVE,
    });
  }

  try {
    for (const grade of grades) {
      await GradeModel.findOneAndUpdate(
        { code: grade.code },
        grade,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Grades seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding grades:', error);
  }
};

/**
 * Run all seeders
 */
const runSeeders = async () => {
  try {
    await seedSubjects();
    await seedGrades();
    console.log('✅ All seed data loaded successfully');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    throw error;
  }
};

module.exports = {
  seedSubjects,
  seedGrades,
  runSeeders,
};
