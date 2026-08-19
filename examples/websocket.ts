import { createClient } from '~/examples/client';
import { registerHandlers } from '~/examples/handlers';

const client = createClient();

registerHandlers(client);
await client.online();
