import { type EmbusInstance } from 'embus';

/** 互动事件的回调结果。 */
export interface RespondToInteractionPayload {
  /**
   * 回调结果：
   *
   * 0=成功，1=操作失败，2=操作频繁，3=重复操作，4=没有权限，5=仅管理员操作。
   */
  code?: 0 | 1 | 2 | 3 | 4 | 5;
}

export default (request: EmbusInstance) => {
  return {
    /**
     * 互动事件响应
     *
     * 收到 INTERACTION_CREATE 事件后需调用此接口回应，告知 QQ 后台事件已收到。
     *
     * 否则客户端会一直处于 loading 状态直到超时。
     *
     * 仅 type=11（消息按钮）和 type=12（快捷菜单）的互动事件需要调用此接口回应，其他类型无需回应（调用也不会报错）。
     *
     * 需在事件触发的有效时间内回应，超时后 interaction_id 失效。
     *
     * 同一 interaction_id 只能回应一次。
     *
     * 接口频率限制：50 QPS
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html}
     *
     * @param interaction_id 互动事件 ID，从 INTERACTION_CREATE 事件的 d.id 字段获取，注意该 ID 不带“INTERACTION_CREATE:”前缀
     * @throws 630001 param invalid
     * @throws 630002 get appid failed
     * @throws 630003 appid invalid
     * @throws 630004 set interaction data failed
     * @throws 630005 get interaction data failed
     * @throws 630006 get header appid failed
     * @throws 630007 data too large
     * @throws 630008 interaction preprocess failed
     */
    respondToInteraction(interaction_id: string, payload: RespondToInteractionPayload): Promise<Record<string, never>> {
      return request.put(`/interactions/${interaction_id}`, payload);
    },
  };
};
