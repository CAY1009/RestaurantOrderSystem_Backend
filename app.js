const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (for API requests)
app.use(express.json());

// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Hello World! The API is running.');
});

// Define a basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Running', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
