// Import the Inngest class used to create the client
import { Inngest } from 'inngest';
// Import the shared in-memory map of reports
import { reports } from './reports-store.js';

// Create the Inngest client with the id the assignment requires
export const inngest = new Inngest({ id: 'report-api' });

// Define the say-hello function, triggered by the event test/hello
export const sayHello = inngest.createFunction(
  // Give the function an id and attach its trigger (v4 puts triggers here)
  { id: 'say-hello', triggers: [{ event: 'test/hello' }] },
  // The handler receives the step helper used to build durable steps
  async ({ step }) => {
    // Pause for 5 seconds as a named step the dashboard can display
    await step.sleep('wait-five-seconds', '5s');
    // Return the message the assignment asks for
    return 'Hello from the background!';
  }
);

// Define the make-report function, triggered by the event report/requested
export const makeReport = inngest.createFunction(
  // Give the function an id, allow 2 retries (3 attempts in total) and attach its trigger
  { id: 'make-report', retries: 2, triggers: [{ event: 'report/requested' }] },
  // The handler receives the event data and the step helper
  async ({ event, step }) => {
    // Read the report id and topic that the endpoint sent in the event
    const { id, topic } = event.data;
    // Wait 8 seconds as a stand-in for a real slow task such as an AI call
    await step.sleep('do-the-slow-work', '8s');
    // Run the build step, which Inngest records as its own named step
    const result = await step.run('build-report', () => {
      // Fail on purpose when the topic is "fail" so we can watch the retries
      if (topic === 'fail') {
        // Throw an error, which tells Inngest this attempt failed and should be retried
        throw new Error('The report oven is broken!');
      }
      // Build the report text from the topic
      const text = `Report about ${topic}: generated in the background.`;
      // Save the finished report in the map with status done
      reports.set(id, { id, topic, status: 'done', result: text });
      // Return the text so it shows in the dashboard as the step output
      return text;
    });
    // Return the result as the output of the whole function run
    return result;
  }
);