import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  host: '41.71.43.25',
  port: 3306,
  user: 'vatalot',
  password: 'KristyLee5483@!1',
  database: 'Vatalot',
  multipleStatements: true // Enable running multiple SQL statements
};

async function setupDatabase() {
  let connection;
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setupDb.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Create connection
    connection = await mysql.createConnection(config);
    
    // Execute the SQL statements
    await connection.query(sqlContent);
    
    console.log('Database setup completed successfully');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();