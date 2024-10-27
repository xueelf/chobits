export interface KeyboardRenderData {
  /** 按钮上的文字 */
  label: string;
  /** 点击后按钮的上文字 */
  visited_label: string;
  /** 按钮样式：0 灰色线框，1 蓝色线框 */
  style: number;
}

export interface KeyboardActionPermission {
  /**
   * - `0` 指定用户可操作
   * - `1` 仅管理者可操作
   * - `2` 所有人可操作
   * - `3` 指定身份组可操作（仅频道可用）
   */
  type: number;
  /** 有权限的用户 id 的列表 */
  specify_user_ids: string[];
  /** 有权限的身份组 id 的列表（仅频道可用） */
  specify_role_ids: string[];
}

export interface KeyboardAction {
  /**
   * - `0` 跳转按钮：http 或 小程序 客户端识别 scheme
   * - `1` 回调按钮：回调后台接口, data 传给后台
   * - `2` 指令按钮：自动在输入框插入 @bot data
   */
  type: number;
  permission: KeyboardActionPermission;
  /** 操作相关的数据 */
  data: string;
  /** 指令按钮可用，指令是否带引用回复本消息，默认 `false` */
  reply: boolean;
  /** 指令按钮可用，点击按钮后直接自动发送 data，默认 `false` */
  enter: boolean;
  /**
   * 本字段仅在指令按钮下有效，设置后后会忽略 action.enter 配置。
   * - 1 点击按钮自动唤起启手Q选图器，其他值暂无效果。
   */
  anchor: number;
  /**
   * @deprecated 可操作点击的次数，默认不限
   */
  click_limit: number;
  /**
   * @deprecated 指令按钮可用，弹出子频道选择器，默认 `false`
   */
  at_bot_show_channel_list: boolean;
  /** 客户端不支持本 action 的时候，弹出的 toast 文案 */
  unsupport_tips: string;
}

export interface KeyboardButton {
  /** 按钮 ID：在一个 keyboard 消息内设置唯一 */
  id?: string;
  render_data: KeyboardRenderData;
  action: KeyboardAction;
}
export interface KeyboardRow {
  buttons: KeyboardButton[];
}

export interface Keyboard {
  id: string;
  content: {
    rows: KeyboardRow[];
  };
}
