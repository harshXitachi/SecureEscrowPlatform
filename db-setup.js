// Simple script to create the messages table directly
import pg from 'pg';
const { Pool } = pg;

async function createMessagesTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create the messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Messages table created or already exists');
  } catch (error) {
    console.error('Error creating messages table:', error);
  } finally {
    await pool.end();
  }
}

createMessagesTable();