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

export interface ClientInsertInput {
  id: string;
  appId: string;
  name?: string | null;
  group?: string | null;
  order: number;
  topOrder: number;
  disabled: number;
  website?: string | null;
  userid?: string | null;
  username?: string | null;
  avatar?: string | null;
  transSetting?: string | null;
  proxySetting?: string | null;
  agentSetting?: string | null;
  createTime: string;
}

export interface ClientUpdateInput {
  id: string;
  appId?: string | null;
  name?: string | null;
  group?: string | null;
  order?: number;
  topOrder?: number;
  disabled?: number;
  userid?: string | null;
  username?: string | null;
  avatar?: string | null;
  transSetting?: string | null;
  proxySetting?: string | null;
  agentSetting?: string | null;
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

export interface QuickReplyGroupInsertInput {
  title: string;
}

export interface QuickReplyRecord {
  id: number;
  group: string;
  title: string;
  content: string;
}

export interface QuickReplyInsertInput {
  group: string;
  title: string;
  content: string;
}

export interface QuickReplyUpdateInput extends QuickReplyInsertInput {
  id: number;
}

export interface MassSendTaskRecord {
  id: string;
  appId: string;
  accounts: string;
  contactSelectType: string | null;
  contacts: string;
  taskName: string;
  taskContents: string;
  isTransBeforeSend: number;
  messageInterval: string;
  sessionInterval: string;
  taskStatus: string;
  totalNum: number;
  sentNum: number;
  startTime: string | null;
  endTime: string | null;
  errorMsg: string | null;
}

export interface MassSendTaskReceiverRecord {
  id: number;
  taskId: string;
  appId: string;
  clientId: string;
  account: string;
  contactId: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  errorMsg: string | null;
}

export interface MassSendTaskReceiverInsertInput {
  taskId: string;
  appId: string;
  clientId: string;
  account: string;
  contactId: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  errorMsg?: string | null;
}

export interface MassGroupTaskRecord {
  id: string;
  appId: string;
  accounts: string;
  groupIds: string;
  taskType: string;
  taskName: string | null;
  joinInterval: string;
  cloneNum: number;
  cloneInterval: string;
  taskStatus: string;
  totalNum: number;
  doneNum: number;
  startTime: string | null;
  endTime: string | null;
  errorMsg: string | null;
}

export interface MassGroupTaskItemRecord {
  id: number;
  taskId: string;
  appId: string;
  clientId: string;
  account: string;
  groupId: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  errorMsg: string | null;
}

export interface MassGroupTaskItemInsertInput {
  taskId: string;
  appId: string;
  clientId: string;
  account: string;
  groupId: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  errorMsg?: string | null;
}
