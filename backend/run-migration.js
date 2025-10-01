const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    
    try {
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                run_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure they're processed in order

        for (const file of migrationFiles) {
            // Check if this migration has already been run
            const result = await client.query(
                'SELECT id FROM migrations WHERE name = $1',
                [file]
            );

            if (result.rows.length === 0) {
                console.log(`Running migration: ${file}`);
                
                const migrationPath = path.join(migrationsDir, file);
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                
                await client.query('BEGIN');
                
                try {
                    await client.query(migrationSQL);
                    
                    // Record the migration
                    await client.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [file]
                    );
                    
                    await client.query('COMMIT');
                    console.log(`✅ Successfully applied migration: ${file}`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Failed to apply migration ${file}:`, error.message);
                    throw error;
                }
            } else {
                console.log(`✓ Migration already applied: ${file}`);
            }
        }
        
        console.log('\nAll migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(console.error);
