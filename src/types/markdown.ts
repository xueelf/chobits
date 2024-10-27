export interface MarkdownParam {
  key: string;
  values: string[];
}

/** Markdown 消息 */
export interface Markdown {
  /** 原生 Markdown 文本内容 */
  content?: string;
  /** Markdown 模版 id，申请模版后获得 */
  custom_template_id?: string;
  /** 模版内变量与填充值的 kv 映射 */
  params?: MarkdownParam[];
}
