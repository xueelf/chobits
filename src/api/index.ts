import type { Request } from '@/utils';

import dms from '@/api/dms';
import users from '@/api/users';
import groups from '@/api/groups';
import guilds from '@/api/guilds';
import channels from '@/api/channels';
import gateway from '@/api/gateway';

export function generateApi(request: Request) {
  return {
    ...dms(request),
    ...users(request),
    ...groups(request),
    ...guilds(request),
    ...gateway(request),
    ...channels(request),
  };
}
