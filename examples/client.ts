import { Client } from '#/index';
import { logger } from '~/examples/logger';

const { APP_ID: appId, CLIENT_SECRET: clientSecret } = import.meta.env;

if (!appId || !clientSecret) {
  throw new Error('请在 .env 中配置 APP_ID 和 CLIENT_SECRET');
}

export const createClient = (): Client => new Client({ appId, clientSecret, logger, maxRetry: Infinity });
