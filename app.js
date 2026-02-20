const express = require('express');
const { Pool } = require('pg')
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');


// Middleware to parse JSON bodies (for API requests)
app.use(express.json());

//PostgreSQL Connection Pool
const pool = new Pool({
  host:     'localhost',//your local host
  port:     5432,
  database: 'RestaurantOrderSystem',
  user:     'postgres',
  password: '1009',//your password
});

// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Hello World! The API is running.');
});

// Define a basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Running', timestamp: new Date().toISOString() });
});

                //Menu Items//

//Get all menue items
app.get('/api/menu-items', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM MenuItem';
    const params = [];

    if (search) {
      query += ' WHERE itemName ILIKE $1 OR description ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY itemId ASC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Get single item by ID
app.get('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM MenuItem WHERE itemId = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create a new menu item
app.post('/api/menu-items', async (req, res) => {
  try {
    const { itemName, description, price, createdBy } = req.body;

    if (!itemName || !price) {
      return res.status(400).json({ success: false, message: 'itemName and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO MenuItem (itemName, description, price, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [itemName, description, price, createdBy]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Put Update Menu Item
app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, description, price, updatedBy } = req.body;

    const existing = await pool.query('SELECT * FROM MenuItem WHERE itemId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const result = await pool.query(
      `UPDATE MenuItem
       SET itemName    = COALESCE($1, itemName),
           description = COALESCE($2, description),
           price       = COALESCE($3, price),
           updatedBy   = $4,
           updatedAt   = NOW()
       WHERE itemId = $5
       RETURNING *`,
      [itemName, description, price, updatedBy, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Delete a menue item
app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM MenuItem WHERE itemId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await pool.query('DELETE FROM MenuItem WHERE itemId = $1', [id]);
    res.json({ success: true, message: `Menu item ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
