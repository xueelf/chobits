import request from '@/utils/request.js';

export const instance = request.create({
  baseURL: 'https://api.sgroup.qq.com',
  // TODO: ／人◕ ‿‿ ◕人＼
  // headers: {
  //   'Authorization': `QQBot ${access_token}`,
  //   'X-Union-Appid': appid,
  // },
});
