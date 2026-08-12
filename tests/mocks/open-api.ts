import { type AccessToken, type AccessTokenError, type BotInfo, type Gateway, type GenerateShareLink } from '#/api/bot';
import {
  type CreateGroupJoinApprovalStrategy,
  type GroupBotState,
  type GroupInfo,
  type GroupJoinApprovalStrategyList,
  type PrepareGroupFileUpload,
  type SendGroupMessage,
  type UpdateGroupJoinApprovalStrategy,
  type UpdateGroupJoinApprovalStrategyWhitelist,
  type UploadGroupFile,
} from '#/api/groups';
import {
  type PrepareUserFileUpload,
  type SendUserMessage,
  type SendUserStreamMessage,
  type UploadUserFile,
} from '#/api/users';

export class MockOpenApi {
  public invalidRequestData() {
    return {
      message: '请求数据异常',
      code: 40011000,
      err_code: 40011000,
      trace_id: 'trace-id',
    };
  }

  public notGroupAdmin() {
    return {
      message: 'not group admin',
      code: 11703,
      err_code: 11703,
      trace_id: 'trace-id',
    };
  }

  public getAccessToken(data: Partial<AccessToken> = {}): AccessToken {
    return {
      access_token: 'access-token',
      expires_in: '7200',
      ...data,
    };
  }

  public getAccessTokenError(data: Partial<AccessTokenError> = {}): AccessTokenError {
    return {
      code: 100007,
      message: 'appid invalid',
      ...data,
    };
  }

  public getGateway(data: Partial<Gateway> = {}): Gateway {
    return {
      url: 'wss://gateway.example.com',
      ...data,
    };
  }

  public getBotInfo(data: Partial<BotInfo> = {}): BotInfo {
    return {
      avatar: '',
      id: 'bot-id',
      share_url: 'https://example.com/bot',
      username: 'bot',
      welcome_msg: '',
      ...data,
    };
  }

  public generateShareLink(data: Partial<GenerateShareLink> = {}): GenerateShareLink {
    return {
      retcode: 0,
      msg: 'success',
      data: { url: 'https://example.com/share' },
      ...data,
    };
  }

  public sendUserMessage(data: Partial<SendUserMessage> = {}): SendUserMessage {
    return {
      id: 'user-message-id',
      timestamp: new Date().toISOString(),
      ext_info: { ref_idx: 'user-message-index' },
      ...data,
    };
  }

  public sendUserStreamMessage(data: Partial<SendUserStreamMessage> = {}): SendUserStreamMessage {
    return {
      id: 'user-stream-message-id',
      timestamp: new Date().toISOString(),
      ext_info: { ref_idx: 'user-message-index' },
      remain_msg_len: 0,
      ...data,
    };
  }

  public uploadUserFile(data: Partial<UploadUserFile> = {}): UploadUserFile {
    return {
      file_uuid: 'user-file-uuid',
      file_info: 'user-file-info',
      ttl: 86400,
      id: '',
      raw_url: '',
      ...data,
    };
  }

  public prepareUserFileUpload(data: Partial<PrepareUserFileUpload> = {}): PrepareUserFileUpload {
    return {
      upload_id: 'user-upload-id',
      block_size: '5242880',
      parts: [
        {
          index: 1,
          presigned_url: 'https://example.com/user-upload-part',
          block_size: '5242880',
        },
      ],
      upload_config: {
        concurrency: 1,
        retry_timeout: 300,
        retry_delay: 1,
      },
      ...data,
    };
  }

  public sendGroupMessage(data: Partial<SendGroupMessage> = {}): SendGroupMessage {
    return {
      id: 'group-message-id',
      timestamp: new Date().toISOString(),
      ext_info: { ref_idx: 'group-message-index' },
      ...data,
    };
  }

  public uploadGroupFile(data: Partial<UploadGroupFile> = {}): UploadGroupFile {
    return {
      file_uuid: 'group-file-uuid',
      file_info: 'group-file-info',
      ttl: 86400,
      id: '',
      raw_url: '',
      ...data,
    };
  }

  public prepareGroupFileUpload(data: Partial<PrepareGroupFileUpload> = {}): PrepareGroupFileUpload {
    return {
      upload_id: 'group-upload-id',
      block_size: '5242880',
      parts: [
        {
          index: 1,
          presigned_url: 'https://example.com/group-upload-part',
          block_size: '5242880',
        },
      ],
      upload_config: {
        concurrency: 1,
        retry_timeout: 300,
        retry_delay: 1,
      },
      ...data,
    };
  }

  public getGroupInfo(data: Partial<GroupInfo> = {}): GroupInfo {
    return {
      group_openid: 'group-openid',
      group_name: '测试群',
      group_finger_memo: '',
      group_class_text: '游戏',
      group_tags: [],
      group_member_num: 3,
      ...data,
    };
  }

  public getGroupBotState(data: Partial<GroupBotState> = {}): GroupBotState {
    return {
      member_openid: 'bot-member-openid',
      joined_at: new Date().toISOString(),
      allow_proactive_msg: true,
      recv_msg_setting: 'all',
      member_role: 'member',
      ...data,
    };
  }

  public getGroupJoinApprovalStrategyList(
    data: Partial<GroupJoinApprovalStrategyList> = {},
  ): GroupJoinApprovalStrategyList {
    const timestamp = new Date().toISOString();

    return {
      strategies: [
        {
          strategy_id: 'strategy-id',
          group_openids: ['group-openid'],
          group_ids: [],
          whitelist_user_count: 0,
          is_enable: 'off',
          expire_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
          remark: 'Chobits OpenAPI 测试',
        },
      ],
      next_cursor: '',
      ...data,
    };
  }

  public createGroupJoinApprovalStrategy(
    data: Partial<CreateGroupJoinApprovalStrategy> = {},
  ): CreateGroupJoinApprovalStrategy {
    return {
      strategy_id: 'strategy-id',
      is_enable: 'on',
      expire_at: new Date().toISOString(),
      ...data,
    };
  }

  public updateGroupJoinApprovalStrategy(
    data: Partial<UpdateGroupJoinApprovalStrategy> = {},
  ): UpdateGroupJoinApprovalStrategy {
    return {
      is_enable: 'off',
      expire_at: new Date().toISOString(),
      ...data,
    };
  }

  public updateGroupJoinApprovalStrategyWhitelist(
    data: Partial<UpdateGroupJoinApprovalStrategyWhitelist> = {},
  ): UpdateGroupJoinApprovalStrategyWhitelist {
    return {
      strategy_id: 'strategy-id',
      whitelist_user_count: 0,
      updated_at: new Date().toISOString(),
      ...data,
    };
  }

  public recallUserMessage(): Record<string, never> {
    return {};
  }

  public finishUserFileUploadPart(): Record<string, never> {
    return {};
  }

  public recallGroupMessage(): Record<string, never> {
    return {};
  }

  public finishGroupFileUploadPart(): Record<string, never> {
    return {};
  }

  public executeGroupJoinApprovalStrategy(): Record<string, never> {
    return {};
  }

  public deleteGroupJoinApprovalStrategy(): Record<string, never> {
    return {};
  }

  public respondToInteraction(): Record<string, never> {
    return {};
  }
}
