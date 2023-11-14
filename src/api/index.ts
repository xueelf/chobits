import type { Token } from '@/client/token';

import { Request } from '@/client/request';
import { deepAssign } from '@/utils/common';
import dm from '@/api/dm';
import user from '@/api/user';
import group from '@/api/group';
import channel from '@/api/channel';
import gateway from '@/api/gateway';

export function createApi(token: Token) {
  const request = new Request(token.config.appid);

  request.useRequestInterceptor(async config => {
    await token.renew();
    deepAssign(config, {
      baseURL: 'https://api.sgroup.qq.com',
      headers: {
        'Authorization': token.authorization,
        'X-Union-Appid': token.config.appid,
      },
    });
    return config;
  });

  return {
    ...dm(request),
    ...user(request),
    ...group(request),
    ...channel(request),
    ...gateway(request),
  };
}
