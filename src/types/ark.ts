export interface ArkKvObj {
  key: string;
  value: string;
}
export interface ArkKv {
  key: string;
  value: string;
  obj?: ArkKvObj[];
}

export interface Ark {
  /**
   * 模版 id，管理端可获得或内邀申请获得，以下默认可使用：
   * - 23 链接 + 文本列表模板
   * - 24 文本 + 缩略图模板
   * - 37 大图模板
   */
  template_id: string;
  /** 模版内变量与填充值的kv映射 */
  kv: ArkKv[];
}
