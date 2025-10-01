const { Pool } = require('pg');
require('dotenv').config();

async function resetMigrations() {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    
    try {
        console.log('Dropping migrations table...');
        await client.query('DROP TABLE IF EXISTS migrations CASCADE');
        console.log('Successfully dropped migrations table');
    } catch (error) {
        console.error('Error resetting migrations:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

resetMigrations().catch(console.error);
