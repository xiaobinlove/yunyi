import type { QuickReplyGroupRecord, QuickReplyRecord } from "../entities";
import type { SqliteDatabase } from "../sqlite";

export class QuickReplyRepository {
  constructor(private readonly database: SqliteDatabase) {}

  listGroups(): QuickReplyGroupRecord[] {
    return this.database.prepare<QuickReplyGroupRecord>("SELECT * FROM quick_reply_group ORDER BY id ASC;").all();
  }

  listReplies(): QuickReplyRecord[] {
    return this.database.prepare<QuickReplyRecord>("SELECT * FROM quick_reply ORDER BY id ASC;").all();
  }

  listRepliesByGroup(group: string): QuickReplyRecord[] {
    return this.database.prepare<QuickReplyRecord>("SELECT * FROM quick_reply WHERE `group` = ? ORDER BY id ASC;").all(group);
  }
}
