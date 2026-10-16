// Import the Express framework so we can build the web server
import express from 'express';

// Create the Express application instance
const app = express();

// Define the port the server listens on (Express lane uses 3000)
const PORT = 3000;

// Register a GET route at /health to confirm the server is alive
app.get('/health', (req, res) => {
  // Send back the JSON body the assignment requires (status 200 by default)
  res.json({ status: 'ok' });
});

// Start the server and listen for incoming requests on the chosen port
app.listen(PORT, () => {
  // Log a message so we know the server started successfully
  console.log(`Server running on http://localhost:${PORT}`);
});