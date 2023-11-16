import type { Request } from '@/utils';

import dm from '@/api/dm';
import user from '@/api/user';
import group from '@/api/group';
import guild from '@/api/guild';
import channel from '@/api/channel';
import gateway from '@/api/gateway';

export function generateApi(request: Request) {
  return {
    ...dm(request),
    ...user(request),
    ...group(request),
    ...guild(request),
    ...channel(request),
    ...gateway(request),
  };
}
