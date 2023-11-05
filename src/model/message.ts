export interface MessageEmbedThumbnail {
  /** 图片地址 */
  url: string;
}

export interface MessageEmbedField {
  /** 字段名 */
  name: string;
}

export interface MessageArkObjKv {
  key: string;
  value: string;
}

export interface MessageArkObj {
  /** ark obj kv 列表 */
  obj_kv: MessageArkObjKv[];
}

export interface MessageArkKv {
  key: string;
  value: string;
  /** ark obj 类型的列表 */
  obj: MessageArkObj[];
}

export interface MessageArk {
  /** ark 模板 id（需要先申请） */
  template_id: number;
  /** kv 值列表 */
  kv: MessageArkKv;
}

export interface MessageEmbed {
  /** 标题 */
  title: string;
  /** 消息弹窗内容 */
  prompt: string;
  /** 缩略图 */
  thumbnail: MessageEmbedThumbnail;
  /** embed 字段数据 */
  fields: MessageEmbedField[];
}

export interface MessageReference {
  /** 需要引用回复的消息 id */
  message_id: string;
  /** 是否忽略获取引用消息详情错误，默认否 */
  ignore_get_message_error: boolean;
}

interface MessageMarkdownParams {
  /** markdown 模版 key */
  key: string;
  /** markdown 模版 key 对应的 values ，列表长度大小为 `1`，传入多个会报错 */
  values: string[];
}

export interface MessageMarkdown {
  /** markdown 模板 id */
  template_id: number;
  /** markdown 自定义模板 id */
  custom_template_id: string;
  /** markdown 模板模板参数 */
  params: MessageMarkdownParams;
  /** 原生 markdown 内容,与上面三个参数互斥,参数都传值将报错。 */
  content: string;
}

export interface MessageAttachment {
  /** 下载地址 */
  url: string;
}
