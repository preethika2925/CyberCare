import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function applySchema() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.zshuteybuywijzbknhxb:Sasikutty%40001@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
  
  console.log('⚡ Connecting to Supabase PostgreSQL Database...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL!');

    const sqlPath = path.join(__dirname, '../../../supabase/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📜 Executing Supabase DDL, RLS Policies & Seed Data...');
    await client.query(sql);
    console.log('🎉 Supabase Schema & Seed Data Applied Successfully!');

  } catch (err: any) {
    console.error('❌ Failed to execute Supabase SQL schema:', err);
  } finally {
    await client.end();
  }
}

applySchema();
