import mysql from 'mysql2/promise';

const config = {
  host: '41.71.43.25',
  port: 3306,
  user: 'vatalot',
  password: 'KristyLee5483@!1',
  database: 'Vatalot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(config);

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err);
  });

// User data operations
export async function getUserData(userId: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM user_data WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

export async function saveUserData(userId: string, data: any) {
  try {
    const existingData = await getUserData(userId);
    
    if (existingData) {
      await pool.execute(
        'UPDATE user_data SET data = ?, updated_at = NOW() WHERE user_id = ?',
        [JSON.stringify(data), userId]
      );
    } else {
      await pool.execute(
        'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(data)]
      );
    }
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

// User settings operations
export async function getUserSettings(userId: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
}

export async function saveUserSettings(userId: string, settings: any) {
  try {
    const existingSettings = await getUserSettings(userId);
    
    if (existingSettings) {
      await pool.execute(
        'UPDATE user_settings SET settings = ?, updated_at = NOW() WHERE user_id = ?',
        [JSON.stringify(settings), userId]
      );
    } else {
      await pool.execute(
        'INSERT INTO user_settings (user_id, settings) VALUES (?, ?)',
        [userId, JSON.stringify(settings)]
      );
    }
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
}

// Data import history operations
export async function getDataHistory(userId: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM data_imports WHERE user_id = ? ORDER BY imported_at DESC',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting data history:', error);
    throw error;
  }
}

export async function saveDataImport(userId: string, importData: any) {
  try {
    await pool.execute(
      `INSERT INTO data_imports (
        user_id, 
        filename, 
        data, 
        record_count, 
        imported_by
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        importData.filename,
        JSON.stringify(importData.data),
        importData.recordCount,
        importData.importedBy
      ]
    );
  } catch (error) {
    console.error('Error saving data import:', error);
    throw error;
  }
}

// Close the pool when the application shuts down
process.on('SIGINT', () => {
  pool.end().then(() => {
    console.log('MySQL connection pool closed');
    process.exit(0);
  });
});