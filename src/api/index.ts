import type { Token } from '@/client/token';

import { Request } from '@/client/request';
import { deepAssign } from '@/utils/common';
import channels from '@/api/channels';
import dms from '@/api/dms';
import gateway from '@/api/gateway';
import groups from '@/api/groups';
import users from '@/api/users';

export function createApi(token: Token) {
  const request = new Request(token.config.appid);

  request.useRequestInterceptor(async config => {
    await token.renew();
    deepAssign(config, {
      baseURL: 'https://api.sgroup.qq.com',
      headers: {
        'Authorization': `QQBot ${token.value}`,
        'X-Union-Appid': token.config.appid,
      },
    });
    return config;
  });

  return {
    ...channels(request),
    ...dms(request),
    ...groups(request),
    ...users(request),
    ...gateway(request),
  };
}
