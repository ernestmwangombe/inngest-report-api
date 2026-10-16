// Import the Inngest class used to create the client
import { Inngest } from 'inngest';

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