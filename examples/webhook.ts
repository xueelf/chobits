import { serve } from 'bun';

import { createClient } from '~/examples/client';
import { registerHandlers } from '~/examples/handlers';
import { journal } from '~/examples/logger';

const client = createClient();

registerHandlers(client);
const server = serve({
  routes: {
    '/ping': () => new Response('pong'),
    '/qq/callback': {
      POST: async request => await client.callback(request),
    },
  },
});

journal.info(`Webhook 服务已启动：${server.url}`);
