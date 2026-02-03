/**
 * Full Seed Script - Initialize database with complete data
 * Run: npm run seed:full
 */

const database = require('../config/database');
const { runFullSeed } = require('../utils/seed-full-data');

async function main() {
  try {
    console.log('🌱 Starting full database seeding...\n');

    // Connect to database
    await database.connect();

    // Run full seed
    await runFullSeed();

    console.log('\n🎉 Database fully seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Full database seeding failed:', error);
    process.exit(1);
  }
}

main();
