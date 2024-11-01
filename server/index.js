const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// Database configuration
const dbConfig = {
  host: process.env.VITE_DB_HOST || '41.71.43.25',
  port: parseInt(process.env.VITE_DB_PORT || '3306'),
  user: process.env.VITE_DB_USERNAME || 'vatalot',
  password: process.env.VITE_DB_PASSWORD || 'KristyLee5483@!1',
  database: process.env.VITE_DB_DATABASE || 'Vatalot',
};

// Create MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());

// Data endpoints
app.get('/api/data/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT data FROM user_data WHERE user_id = ?',
      [req.params.userId]
    );
    res.json(rows[0]?.data ? JSON.parse(rows[0].data) : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data/:userId', async (req, res) => {
  try {
    await pool.query(
      'REPLACE INTO user_data (user_id, data) VALUES (?, ?)',
      [req.params.userId, JSON.stringify(req.body)]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/data/:userId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_data WHERE user_id = ?',
      [req.params.userId]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// History endpoints
app.get('/api/history/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM data_imports WHERE user_id = ? ORDER BY imported_at DESC',
      [req.params.userId]
    );
    res.json(rows.map(row => ({
      id: row.id,
      filename: row.filename,
      data: JSON.parse(row.data),
      recordCount: row.record_count,
      importedBy: row.imported_by,
      importedAt: row.imported_at.toISOString()
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/history/:userId', async (req, res) => {
  try {
    const { id, filename, data, recordCount, importedBy, importedAt } = req.body;
    await pool.query(
      'INSERT INTO data_imports (id, user_id, filename, data, record_count, imported_by, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.userId, filename, JSON.stringify(data), recordCount, importedBy, new Date(importedAt)]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history/:userId/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM data_imports WHERE id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});