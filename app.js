import express from 'express';
import hamburger from './menuItem1.json' with { type: 'json' };

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (for API requests)
app.use(express.json());

// Middleware to disable CORS for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    `${req.protocol}://${req.get('host')}`, // same origin
    'http://localhost:5173', // frontend dev server
  ];

  // Allow requests from allowed origins
  if (!origin || allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // For preflight requests, deny if not from allowed origins
  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).end();
      return;
    }
  }
  next();
});

// Rest Controllers:
// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Hello World! The API is running.');
});

// Define a basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Running', timestamp: new Date().toISOString() });
});

app.get('/api/menuItems', (request, response) => {
  response.json(hamburger);
});

app.post('/api/menuItems', (request, response) => {
  const newItem = request.body;
  console.log('Received new menu item:', newItem);
  response.status(201).json({ message: 'Menu item created', item: newItem });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
