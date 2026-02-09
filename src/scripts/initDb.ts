import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');

    // Run migrations
    const migrationFiles = [
      'migration-add-fields.sql',
      'migration-fix-shops.sql',
      'migration-reviews.sql',
    ];

    for (const file of migrationFiles) {
      const migrationPath = path.join(__dirname, '../database', file);
      if (fs.existsSync(migrationPath)) {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migration);
        console.log(`✅ Migration applied: ${file}`);
      }
    }

    console.log('✅ All migrations applied!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
