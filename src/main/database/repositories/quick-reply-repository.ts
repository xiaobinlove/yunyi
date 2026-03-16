import type {
  QuickReplyGroupInsertInput,
  QuickReplyGroupRecord,
  QuickReplyInsertInput,
  QuickReplyRecord,
  QuickReplyUpdateInput,
} from "../entities";
import type { SqliteDatabase } from "../sqlite";

export class QuickReplyRepository {
  constructor(private readonly database: SqliteDatabase) {}

  insertGroup(record: QuickReplyGroupInsertInput): unknown {
    return this.database.prepare("INSERT INTO quick_reply_group (title) VALUES ($title);").run(record);
  }

  deleteGroupByTitle(title: string): unknown {
    return this.database.prepare("DELETE FROM quick_reply_group WHERE title = ?;").run(title);
  }

  updateGroupTitle(nextTitle: string, previousTitle: string): unknown {
    return this.database.prepare("UPDATE quick_reply_group SET title = ? WHERE title = ?;").run(nextTitle, previousTitle);
  }

  listGroups(): QuickReplyGroupRecord[] {
    return this.database.prepare<QuickReplyGroupRecord>("SELECT * FROM quick_reply_group;").all();
  }

  insertReply(record: QuickReplyInsertInput): unknown {
    return this.database
      .prepare("INSERT INTO quick_reply (`group`, title, content) VALUES ($group, $title, $content);")
      .run(record);
  }

  updateReply(record: QuickReplyUpdateInput): unknown {
    return this.database
      .prepare("UPDATE quick_reply SET `group` = $group, title = $title, content = $content WHERE id = $id;")
      .run(record);
  }

  deleteRepliesByIds(ids: readonly number[]): unknown {
    if (ids.length === 0) {
      return null;
    }

    if (ids.length === 1) {
      return this.database.prepare("DELETE FROM quick_reply WHERE id = ?;").run(ids[0]);
    }

    return this.database
      .prepare(`DELETE FROM quick_reply WHERE id IN (${ids.map(() => "?").join(", ")});`)
      .run(ids);
  }

  deleteRepliesByGroup(group: string): unknown {
    return this.database.prepare("DELETE FROM quick_reply WHERE `group` = ?;").run(group);
  }

  updateReplyGroup(nextGroup: string, previousGroup: string): unknown {
    return this.database.prepare("UPDATE quick_reply SET `group` = ? WHERE `group` = ?;").run(nextGroup, previousGroup);
  }

  listReplies(): QuickReplyRecord[] {
    return this.database.prepare<QuickReplyRecord>("SELECT * FROM quick_reply;").all();
  }

  listRepliesByGroup(group: string): QuickReplyRecord[] {
    return this.database.prepare<QuickReplyRecord>("SELECT * FROM quick_reply WHERE `group` = ? ORDER BY id ASC;").all(group);
  }
}
