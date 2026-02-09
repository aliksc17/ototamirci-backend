import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Convert Supabase direct connection to pooler (IPv4) in production
let connectionString = process.env.DATABASE_URL || '';

if (process.env.NODE_ENV === 'production' && connectionString.includes('db.') && connectionString.includes('.supabase.co')) {
  // Extract project ref from: db.XXXX.supabase.co
  const match = connectionString.match(/db\.([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    // Use Supabase Transaction Pooler (IPv4) instead of direct connection
    connectionString = connectionString
      .replace(`db.${projectRef}.supabase.co:5432`, `aws-0-eu-central-1.pooler.supabase.com:6543`)
      .replace('postgres:', `postgres.${projectRef}:`);
    console.log('🔄 Using Supabase IPv4 Pooler for production');
  }
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
