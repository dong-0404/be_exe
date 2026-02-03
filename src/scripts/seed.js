/**
 * Seed Script - Initialize database with basic data
 * Run: node src/scripts/seed.js
 */

const database = require('../config/database');
const { runSeeders } = require('../utils/seed-data');

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await database.connect();

    // Run seeders
    await runSeeders();

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  }
}

main();
