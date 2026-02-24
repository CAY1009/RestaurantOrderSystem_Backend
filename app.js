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



//  Customers          

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Customer ORDER BY customerId ASC');
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
    const result = await pool.query('SELECT * FROM Customer WHERE customerId = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
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
    const { fullName, email, phone, createdBy } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'fullName and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO Customer (fullName, email, phone, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [fullName, email, phone, createdBy]
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
    const { fullName, email, phone, updatedBy } = req.body;

    const existing = await pool.query('SELECT * FROM Customer WHERE customerId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const result = await pool.query(
      `UPDATE Customer
       SET fullName  = COALESCE($1, fullName),
           email     = COALESCE($2, email),
           phone     = COALESCE($3, phone),
           updatedBy = $4,
           updatedAt = NOW()
       WHERE customerId = $5
       RETURNING *`,
      [fullName, email, phone, updatedBy, id]
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

    const existing = await pool.query('SELECT * FROM Customer WHERE customerId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
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
       ORDER BY o.orderId DESC`
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
      [customerId]
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
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, m.itemName, m.description
       FROM OrderItem oi
       JOIN MenuItem m ON oi.itemId = m.itemId
       WHERE oi.orderId = $1
       ORDER BY oi.orderItemId ASC`,
      [id]
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
      [customerId]
    );
    if (custCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch prices from DB 
    const itemIds = items.map((i) => i.itemId);
    const menuResult = await client.query(
      'SELECT itemId, price FROM MenuItem WHERE itemId = ANY($1::int[])',
      [itemIds]
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
      [customerId, totalCharge.toFixed(2), createdBy]
    );
    const newOrder = orderResult.rows[0];

    // Insert each order item
    for (const line of orderLines) {
      await client.query(
        `INSERT INTO OrderItem (orderId, itemId, quantity, price, createdBy, createdAt)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [newOrder.orderid, line.itemId, line.quantity, line.price, createdBy]
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

    const existing = await client.query('SELECT * FROM "Order" WHERE orderId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
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
      [orderId]
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
      return res.status(400).json({ success: false, message: 'orderId, itemId, and quantity are required' });
    }

    const menuResult = await client.query('SELECT price FROM MenuItem WHERE itemId = $1', [itemId]);
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'MenuItem not found' });
    }
    const price = menuResult.rows[0].price;

    const result = await client.query(
      `INSERT INTO OrderItem (orderId, itemId, quantity, price, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [orderId, itemId, quantity, price, createdBy]
    );

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT SUM(price * quantity) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId]
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
      return res.status(400).json({ success: false, message: 'quantity must be at least 1' });
    }

    const existing = await client.query('SELECT * FROM OrderItem WHERE orderItemId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const result = await client.query(
      `UPDATE OrderItem
       SET quantity = $1, updatedBy = $2, updatedAt = NOW()
       WHERE orderItemId = $3
       RETURNING *`,
      [quantity, updatedBy, id]
    );

    const orderId = existing.rows[0].orderid;

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT SUM(price * quantity) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId]
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

    const existing = await client.query('SELECT * FROM OrderItem WHERE orderItemId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const orderId = existing.rows[0].orderid;
    await client.query('DELETE FROM OrderItem WHERE orderItemId = $1', [id]);

    // Recalculate order total
    await client.query(
      `UPDATE "Order"
       SET totalCharge = (SELECT COALESCE(SUM(price * quantity), 0) FROM OrderItem WHERE orderId = $1),
           updatedAt   = NOW()
       WHERE orderId = $1`,
      [orderId]
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
      'SELECT userId, fullName, email, phone, createdAt FROM "User" ORDER BY userId ASC'
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
      'SELECT userId, fullName, email, phone, createdAt FROM "User" WHERE userId = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
    const { fullName, email, phone, createdBy } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'fullName and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO "User" (fullName, email, phone, createdBy, createdAt)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING userId, fullName, email, phone, createdAt`,
      [fullName, email, phone, createdBy]
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
    const { fullName, email, phone, updatedBy } = req.body;

    const existing = await pool.query('SELECT * FROM "User" WHERE userId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await pool.query(
      `UPDATE "User"
       SET fullName  = COALESCE($1, fullName),
           email     = COALESCE($2, email),
           phone     = COALESCE($3, phone),
           updatedBy = $4,
           updatedAt = NOW()
       WHERE userId = $5
       RETURNING userId, fullName, email, phone, updatedAt`,
      [fullName, email, phone, updatedBy, id]
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

    const existing = await pool.query('SELECT * FROM "User" WHERE userId = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query('DELETE FROM "User" WHERE userId = $1', [id]);
    res.json({ success: true, message: `User ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
