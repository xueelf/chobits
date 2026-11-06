import { type EmbusInstance } from 'embus';

/** 申请图片上传所需的文件信息。 */
export interface PrepareMediaImagePayload {
  /** 文件名（含扩展名，如 kline.png）。 */
  file_name: string;
  /** 文件大小（字节）。 */
  file_size: number;
  /** 图片 MIME 类型：image/png / image/jpeg / image/gif / image/webp。 */
  content_type: string;
  /** 文件内容 MD5（32 位十六进制）。 */
  md5: string;
  /** 文件内容 SHA1（40 位十六进制）。 */
  sha1: string;
}

/** 图片上传任务与预签名 URL。 */
export interface MediaImageUpload {
  /** 上传任务 ID，4 小时内有效。 */
  upload_id: string;
  /** 预签名上传 URL，用 HTTP PUT 直传图片二进制。 */
  presigned_url: string;
  /** 预签名 URL 有效期（秒），过期后需重新申请。 */
  expires_in: number;
}

/** 完成图片上传所需的上传任务信息。 */
export interface FinishMediaImagePayload {
  /** prepare 返回的上传任务 ID。 */
  upload_id: string;
  /** 上传返回的 ETag（文件 MD5，32 位十六进制）。服务端会与 COS 对象实际 ETag 比对，不一致返回 40035003。 */
  md5: string;
}

/** 图片信息与 Markdown 引用链接。 */
export interface MediaImage {
  /** 图片 ID，用于查询与删除。 */
  image_id: string;
  /** Markdown 引用链接：`qqbot-media://image/v1/<token>`。 */
  url: string;
  /** 临时预览链接（外网 COS 预签名，短时效），仅供预览与发送前自查，请勿持久化存储。 */
  preview_url: string;
  /** 滑动有效期窗口（秒）。每次发送消息引用该图片后自动顺延；90 天（7776000 秒）内未被引用则失效。完成图片上传时返回。 */
  ttl?: number;
  /** 上传时的文件名。查询有效图片时返回。 */
  file_name?: string;
  /** 上传时间（Unix 秒）。查询有效图片时返回。 */
  created_at?: number;
  /** 过期时间（Unix 秒），每次被引用后自动顺延。查询有效图片时返回。 */
  expires_at?: number;
}

/** 有效图片列表的查询游标。 */
export interface GetMediaImageListPayload {
  /** 分页游标。首页不传 cursor，翻页使用上一页返回的 next_cursor，为空表示已到末页。 */
  cursor?: string;
}

/** 有效图片列表。 */
export interface MediaImageList {
  /** 图片列表。 */
  images: MediaImage[];
  /** 下一页游标，为空表示末页。 */
  next_cursor: string;
  /** 当前有效图片总数（与数量上限同一口径）。 */
  total: number;
}

export default (request: EmbusInstance) => ({
  /**
   * 申请图片上传
   *
   * 开发者可将 Markdown 消息所需的图片预先上传到平台，获得 qqbot-media:// 引用后写入 Markdown 消息，无需依赖网络资源。
   *
   * 图片在有效期内可反复引用，发送时由平台自动转存。
   *
   * 申请上传，获得预签名 URL。
   *
   * 限制说明:
   *
   * - 单张图片大小：不超过 10MB
   * - 支持格式：png / jpeg / gif / webp
   * - 文件名与 Content-Type：扩展名需与 Content-Type 一致
   * - 单机器人数量上限：100 张（可通过删除接口释放）
   * - 图片有效期：滑动过期，自最后一次被消息引用起 90 天内未使用则失效
   * - 上传任务有效期：4 小时（prepare 返回的 upload_id 超过 4 小时失效，需重新申请）
   * - 预签名 URL 有效期：以 prepare 响应的 expires_in 为准
   *
   * 使用返回的 presigned_url，以 HTTP PUT 直传图片二进制。请求头中的 Content-Type 必须与 prepare 时声明的 content_type 完全一致，否则 COS 会拒绝（403）。COS 返回响应头中的 ETag 即文件 MD5（去掉引号），供下一步使用。
   *
   * @returns
   *
   * - upload_id：上传任务 ID，4 小时内有效
   * - presigned_url：预签名上传 URL，用 HTTP PUT 直传图片二进制
   * - expires_in：预签名 URL 有效期（秒），过期后需重新申请
   * @throws 40035001 图片格式不支持（扩展名与 Content-Type 需为 png/jpeg/gif/webp 且一致）
   * @throws 40035002 图片超过大小上限（默认 10MB）
   * @throws 40035006 服务端内部错误（COS 处理、链接生成等失败），可稍后重试
   * @throws 40035007 图片数量超过上限（100 张），删除部分图片后重试
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html}
   */
  prepareMediaImage(payload: PrepareMediaImagePayload): Promise<MediaImageUpload> {
    return request.post('/v2/media-images/prepare', payload);
  },

  /**
   * 完成图片上传
   *
   * 服务端会与 COS 对象实际 ETag 比对，不一致返回 40035003。
   *
   * @returns
   *
   * - image_id：图片 ID，用于查询与删除
   * - url：Markdown 引用链接：`qqbot-media://image/v1/<token>`
   * - ttl：滑动有效期窗口（秒）。每次发送消息引用该图片后自动顺延；90 天（7776000 秒）内未被引用则失效
   * - preview_url：临时预览链接（外网 COS 预签名，短时效），仅供预览与发送前自查，请勿持久化存储
   * @throws 40035003 上传任务不存在、已过期（超过 4 小时）或不属于当前机器人
   * @throws 40035006 服务端内部错误（COS 处理、链接生成等失败），可稍后重试
   * @throws 40035007 图片数量超过上限（100 张），删除部分图片后重试
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html}
   */
  finishMediaImage(payload: FinishMediaImagePayload): Promise<MediaImage> {
    return request.post('/v2/media-images/complete', payload);
  },

  /**
   * 查询有效图片
   *
   * 查询当前机器人的有效图片列表，按上传时间倒序。首页不传 cursor，翻页使用上一页返回的 next_cursor，为空表示已到末页。
   *
   * @returns
   *
   * - images：图片列表
   * - next_cursor：下一页游标，为空表示末页
   * - total：当前有效图片总数（与数量上限同一口径）
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html}
   */
  getMediaImageList(payload: GetMediaImageListPayload = {}): Promise<MediaImageList> {
    return request.get('/v2/media-images', payload);
  },

  /**
   * 删除图片
   *
   * 删除指定图片，释放数量配额。
   *
   * 删除后图片从查询列表消失，total 相应减少，引用链接立即失效，不能再被新消息引用。已发送消息不受影响（发送时平台已转存图片副本）。
   *
   * @param image_id - 图片 ID
   * @throws 40035008 图片不存在或已被删除
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html}
   */
  deleteMediaImage(image_id: string): Promise<Record<string, never>> {
    return request.delete(`/v2/media-images/${image_id}/delete`);
  },
});
