import type { Request } from '@/client/request.js';

import channels from '@/api/channels.js';
import dms from '@/api/dms.js';
import gateway from '@/api/gateway.js';
import groups from '@/api/groups.js';
import users from '@/api/users.js';

export function createApi(request: Request) {
  const instance = request.create({
    baseURL: 'https://api.sgroup.qq.com',
  });

  return {
    ...channels(instance),
    ...dms(instance),
    ...groups(instance),
    ...users(instance),
    ...gateway(instance),
  };
}
