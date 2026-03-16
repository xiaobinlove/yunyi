export interface ClientRecord {
  id: string;
  appId: string;
  name: string | null;
  group: string | null;
  order: number;
  topOrder: number;
  disabled: number;
  userid: string | null;
  username: string | null;
  avatar: string | null;
  transSetting: string | null;
  proxySetting: string | null;
  agentSetting: string | null;
  createTime: string;
  website?: string | null;
}

export interface ContactRecord {
  id: number;
  appId: string;
  account: string;
  contactId: string;
  nickname: string | null;
  country: string | null;
  gender: string | null;
  level: string | null;
  remark: string | null;
}

export interface ContactSettingRecord {
  id: number;
  appId: string;
  account: string;
  contactId: string;
  transSetting: string;
}

export interface ContactSettingUpsertInput {
  appId: string;
  account: string;
  contactId: string;
  transSetting: string;
}

export interface QuickReplyGroupRecord {
  id: number;
  title: string;
}

export interface QuickReplyRecord {
  id: number;
  group: string;
  title: string;
  content: string;
}
