// Import the Express framework so we can build the web server
import express from 'express';
// Import Node's built-in helper for making unique ids
import { randomUUID } from 'node:crypto';
// Import the serve helper that exposes Inngest functions through Express
import { serve } from 'inngest/express';
// Import our Inngest client and both functions
import { inngest, sayHello, makeReport } from './inngest-client.js';
// Import the shared in-memory map of reports
import { reports } from './reports-store.js';

// Create the Express application instance
const app = express();

// Define the port the server listens on (Express lane uses 3000)
const PORT = 3000;

// Parse JSON request bodies, which Inngest and our endpoints need
app.use(express.json());

// Register a GET route at /health to confirm the server is alive
app.get('/health', (req, res) => {
  // Send back the JSON body the assignment requires (status 200 by default)
  res.json({ status: 'ok' });
});

// Accept a report request, hand the slow work to the background, answer fast
app.post('/reports', async (req, res) => {
  // Read the topic from the JSON body, falling back to an empty object if there is no body
  const { topic } = req.body ?? {};
  // Reject the request at the door if the topic is missing, not text, or only spaces
  if (typeof topic !== 'string' || topic.trim() === '') {
    // Answer 400 Bad Request and stop here, so no report is saved and no event is sent
    return res.status(400).json({ error: 'topic is required' });
  }
  // Make a unique id for this report
  const id = randomUUID();
  // Save the report in the map as pending
  reports.set(id, { id, topic, status: 'pending' });
  // Send the report/requested event so the background function starts
  await inngest.send({ name: 'report/requested', data: { id, topic } });
  // Answer immediately with 202 Accepted, the id and the pending status
  res.status(202).json({ id, status: 'pending' });
});

// Report the current state of one report so clients can poll for progress
app.get('/reports/:id', (req, res) => {
  // Look up the report by the id in the URL
  const report = reports.get(req.params.id);
  // If no report has that id, answer 404 Not Found
  if (!report) {
    // Send the 404 status with a short error message
    return res.status(404).json({ error: 'Report not found' });
  }
  // Otherwise send back the saved report (pending first, done later)
  res.json(report);
});

// Serve our Inngest functions at /api/inngest so the Dev Server can find them
app.use('/api/inngest', serve({ client: inngest, functions: [sayHello, makeReport] }));

// Start the server and listen for incoming requests on the chosen port
app.listen(PORT, () => {
  // Log a message so we know the server started successfully
  console.log(`Server running on http://localhost:${PORT}`);
});