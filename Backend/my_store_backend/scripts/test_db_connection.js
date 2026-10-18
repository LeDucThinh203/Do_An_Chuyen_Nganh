/** Check the PostgreSQL URL and shared application pool. */
import dotenv from 'dotenv';
import db from '../db.js';

dotenv.config();

try {
  const [rows] = await db.query(
    'SELECT current_database() AS database, current_user AS db_user, NOW() AS server_time'
  );
  console.log('PostgreSQL connection is healthy.');
  console.log(`Database: ${rows[0].database}`);
  console.log(`User: ${rows[0].db_user}`);
  console.log(`Server time: ${rows[0].server_time}`);
} catch (error) {
  console.error('PostgreSQL connection failed:', error.message);
  console.error('If using Neon, check that DATABASE_URL uses the pooled host ending in -pooler.');
  process.exitCode = 1;
} finally {
  await db.end();
}
