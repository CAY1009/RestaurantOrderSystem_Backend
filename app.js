import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (for API requests)
app.use(express.json());
app.use(cors());

//PostgreSQL Connection Pool
const pool = new Pool({
  host: 'localhost', //your local host
  port: 5432,
  database: 'RestaurantOrderSystem',
  user: 'postgres', //your username
  password: 'Anhyeuem1993', //your password
});

// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Hello World! The API is running.');
});

// Define a basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Running', timestamp: new Date().toISOString() });
});

//     Menu Items

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

//Get all menu items Home Screen (no show disabled items)
app.get('/api/menu-items/home', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM MenuItem WHERE itemstatus=true';
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
    const result = await pool.query(
      'SELECT * FROM MenuItem WHERE itemId = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' });
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
    const { itemname, description, price } = req.body;

    if (!itemname || !price) {
      return res
        .status(400)
        .json({ success: false, message: 'itemName and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO MenuItem (itemName, description, price, createdBy, createdAt, itemstatus)
       VALUES ($1, $2, $3, 'Manager', NOW(), true)
       RETURNING *`,
      [itemname, description, price],
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
    const { itemname, description, price, itemstatus } = req.body;

    const existing = await pool.query(
      'SELECT * FROM MenuItem WHERE itemId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' });
    }

    const result = await pool.query(
      `UPDATE MenuItem
       SET itemName    = COALESCE($1, itemname),
           description = COALESCE($2, description),
           price       = COALESCE($3, price),
           updatedAt   = NOW(),
           itemstatus  = $4
       WHERE itemId = $5
       RETURNING *`,
      [itemname, description, price, itemstatus, id],
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

    const existing = await pool.query(
      'SELECT * FROM MenuItem WHERE itemId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' });
    }

    await pool.query('DELETE FROM MenuItem WHERE itemId = $1', [id]);
    res.json({ success: true, message: `Menu item ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//  Customers

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Customer ORDER BY customerId ASC',
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET a single customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM Customer WHERE customerId = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { fullname, email, phone, createdBy } = req.body;

    if (!fullname || !email) {
      return res
        .status(400)
        .json({ success: false, message: 'fullName and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO Customer (fullName, email, phone, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [fullname, email, phone, createdBy],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, phone } = req.body;

    const existing = await pool.query(
      'SELECT * FROM Customer WHERE customerId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    const result = await pool.query(
      `UPDATE Customer
       SET fullname  = COALESCE($1, fullname),
           email     = COALESCE($2, email),
           phone     = COALESCE($3, phone),
           updatedAt = NOW()
       WHERE customerId = $4
       RETURNING *`,
      [fullname, email, phone, id],
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE a customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM Customer WHERE customerId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    await pool.query('DELETE FROM Customer WHERE customerId = $1', [id]);
    res.json({ success: true, message: `Customer ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//  Orders

// GET all orders (includes customer name)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, c.fullName AS customerName, c.email AS customerEmail
       FROM "Order" o
       JOIN Customer c ON o.customerId = c.customerId
       ORDER BY o.orderId DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all orders for a specific customer
app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      `SELECT o.*, c.fullName AS customerName
       FROM "Order" o
       JOIN Customer c ON o.customerId = c.customerId
       WHERE o.customerId = $1
       ORDER BY o.orderId DESC`,
      [customerId],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET a single order with all its items
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, c.fullName AS customerName, c.email AS customerEmail, c.phone AS customerPhone
       FROM "Order" o
       JOIN Customer c ON o.customerId = c.customerId
       WHERE o.orderId = $1`,
      [id],
    );

    if (orderResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, m.itemName, m.description
       FROM OrderItem oi
       JOIN MenuItem m ON oi.itemId = m.itemId
       WHERE oi.orderId = $1
       ORDER BY oi.orderItemId ASC`,
      [id],
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create a new order (checkout)
// Prices are fetched from the DB automatically — total is calculated server-side
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customerId, createdBy, items } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'customerId and at least one item are required',
      });
    }

    // Check customer exists
    const custCheck = await client.query(
      'SELECT customerId FROM Customer WHERE customerId = $1',
      [customerId],
    );
    if (custCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    // Fetch prices from DB
    const itemIds = items.map((i) => i.itemId);
    const menuResult = await client.query(
      'SELECT itemId, price FROM MenuItem WHERE itemId = ANY($1::int[])',
      [itemIds],
    );

    const priceMap = {};
    menuResult.rows.forEach((row) => {
      priceMap[row.itemid] = parseFloat(row.price);
    });

    // Validate all items exist
    for (const item of items) {
      if (priceMap[item.itemId] === undefined) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `MenuItem with id ${item.itemId} not found`,
        });
      }
    }

    // Calculate total charge
    let totalCharge = 0;
    const orderLines = items.map((item) => {
      totalCharge += priceMap[item.itemId] * item.quantity;
      return { ...item, price: priceMap[item.itemId] };
    });

    // Insert order header
    const orderResult = await client.query(
      `INSERT INTO "Order" (customerId, totalCharge, createdBy, createdAt)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [customerId, totalCharge.toFixed(2), createdBy],
    );
    const newOrder = orderResult.rows[0];

    // Insert each order item
    for (const line of orderLines) {
      await client.query(
        `INSERT INTO OrderItem (orderId, itemId, quantity, price, createdBy, createdAt)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [newOrder.orderid, line.itemId, line.quantity, line.price, createdBy],
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { ...newOrder, items: orderLines },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE an order and all its items
app.delete('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const existing = await client.query(
      'SELECT * FROM "Order" WHERE orderId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    await client.query('DELETE FROM OrderItem WHERE orderId = $1', [id]);
    await client.query('DELETE FROM "Order" WHERE orderId = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: `Order ${id} deleted` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});
// ORDER ITEMS (add/update/remove items from an existing order)

// GET all items in an order
app.get('/api/order-items/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      `SELECT oi.*, m.itemName, m.description
       FROM OrderItem oi
       JOIN MenuItem m ON oi.itemId = m.itemId
       WHERE oi.orderId = $1
       ORDER BY oi.orderItemId ASC`,
      [orderId],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST add an item to an existing order
app.post('/api/order-items', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { orderId, itemId, quantity, createdBy } = req.body;

    if (!orderId || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'orderId, itemId, and quantity are required',
      });
    }

    const menuResult = await client.query(
      'SELECT price FROM MenuItem WHERE itemId = $1',
      [itemId],
    );
    if (menuResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'MenuItem not found' });
    }
    const price = menuResult.rows[0].price;

    const result = await client.query(
      `INSERT INTO OrderItem (orderId, itemId, quantity, price, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [orderId, itemId, quantity, price, createdBy],
    );

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT SUM(price * quantity) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId],
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT update the quantity of an order item
app.put('/api/order-items/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { quantity, updatedBy } = req.body;

    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: 'quantity must be at least 1' });
    }

    const existing = await client.query(
      'SELECT * FROM OrderItem WHERE orderItemId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Order item not found' });
    }

    const result = await client.query(
      `UPDATE OrderItem
       SET quantity = $1, updatedBy = $2, updatedAt = NOW()
       WHERE orderItemId = $3
       RETURNING *`,
      [quantity, updatedBy, id],
    );

    const orderId = existing.rows[0].orderid;

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT SUM(price * quantity) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId],
    );

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE remove an item from an order
app.delete('/api/order-items/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const existing = await client.query(
      'SELECT * FROM OrderItem WHERE orderItemId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Order item not found' });
    }

    const orderId = existing.rows[0].orderid;
    await client.query('DELETE FROM OrderItem WHERE orderItemId = $1', [id]);

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT COALESCE(SUM(price * quantity), 0) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId],
    );

    await client.query('COMMIT');
    res.json({ success: true, message: `Order item ${id} removed` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// USERS

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "User" ORDER BY userId ASC',
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET a single user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM "User" WHERE userid = $1',
      [id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create a new user
// Body: { "fullName": "Jane Smith", "email": "jane@email.com", "phone": "555-9999" }
app.post('/api/users', async (req, res) => {
  try {
    const { fullName, email, phone, userrole } = req.body;

    if (!fullName || !email) {
      return res
        .status(400)
        .json({ success: false, message: 'fullName and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO "User" (fullName, email, phone, userrole, createdAt)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING userId, fullName, email, phone, createdAt`,
      [fullName, email, phone, userrole],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT update a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, phone, userrole } = req.body;

    const existing = await pool.query(
      'SELECT * FROM "User" WHERE userId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const result = await pool.query(
      `UPDATE "User"
       SET fullName  = COALESCE($1, fullName),
           email     = COALESCE($2, email),
           phone     = COALESCE($3, phone),
           userrole  = COALESCE($4, userrole),
           updatedAt = NOW()
       WHERE userId = $5
       RETURNING userId, fullName, email, phone, userrole, updatedAt`,
      [fullname, email, phone, userrole, id],
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM "User" WHERE userId = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    await pool.query('DELETE FROM "User" WHERE userId = $1', [id]);
    res.json({ success: true, message: `User ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// AUTH (customer login)
// GET auth existence (do NOT return password)
app.get('/api/auth/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      'SELECT customerId FROM CustomerAuth WHERE customerId = $1',
      [customerId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Auth entry not found' });
    }

    res.json({ success: true, data: { customerId: result.rows[0].customerid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create auth entry for a customer (signup)
app.post('/api/auth', async (req, res) => {
  try {
    const { customerId, password } = req.body;

    if (!customerId || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'customerId and password are required' });
    }

    // Verify customer exists
    const cust = await pool.query(
      'SELECT customerId FROM Customer WHERE customerId = $1',
      [customerId],
    );
    if (cust.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    // Check if auth already exists
    const existing = await pool.query(
      'SELECT * FROM CustomerAuth WHERE customerId = $1',
      [customerId],
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: 'Auth entry already exists' });
    }

    // NOTE: In production, passwords MUST be hashed before storing.
    const result = await pool.query(
      `INSERT INTO CustomerAuth (customerId, password, createdAt)
       VALUES ($1, $2, NOW())
       RETURNING customerId`,
      [customerId, password],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST login - verify username (email or customerId) and password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body; // frontend may send username (email) and password

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'username and password are required' });
    }

    // Find customer by email or by id
    let custResult;
    if (/^\d+$/.test(String(username))) {
      custResult = await pool.query('SELECT * FROM Customer WHERE customerId = $1', [username]);
    } else {
      custResult = await pool.query('SELECT * FROM Customer WHERE email = $1', [username]);
    }

    if (custResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = custResult.rows[0];

    // Check auth entry exists
    const authResult = await pool.query('SELECT password FROM CustomerAuth WHERE customerId = $1', [customer.customerid]);
    if (authResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Auth entry not found' });
    }

    const storedPassword = authResult.rows[0].password;

    // NOTE: This compares plaintext passwords. Replace with hashing (bcrypt) in production.
    if (storedPassword !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Successful login — return customer info (do not return password)
    res.json({ success: true, data: { customerId: customer.customerid, fullName: customer.fullname, email: customer.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create MenuItem table
    await client.query(`
      CREATE TABLE IF NOT EXISTS MenuItem (
        itemId SERIAL PRIMARY KEY,
        itemName VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        createdBy VARCHAR(255),
        itemstatus BOOLEAN,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create Customer table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Customer (
        customerId SERIAL PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        createdBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create Order table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Order" (
        orderId SERIAL PRIMARY KEY,
        customerId INTEGER NOT NULL REFERENCES Customer(customerId),
        totalCharge DECIMAL(10,2) NOT NULL,
        createdBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create OrderItem table
    await client.query(`
      CREATE TABLE IF NOT EXISTS OrderItem (
        orderItemId SERIAL PRIMARY KEY,
        orderId INTEGER NOT NULL REFERENCES "Order"(orderId),
        itemId INTEGER NOT NULL REFERENCES MenuItem(itemId),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        createdBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create User table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        userId SERIAL PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        userrole NVARCHAR(50),
        createdBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create CustomerAuth table for login/signup
    await client.query(`
      CREATE TABLE IF NOT EXISTS CustomerAuth (
        authId SERIAL PRIMARY KEY,
        customerId INTEGER UNIQUE NOT NULL REFERENCES Customer(customerId),
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Start the server
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server is running on http://localhost:${PORT}`);
});
