import type { ContactRecord } from "../entities";
import type { SqliteDatabase } from "../sqlite";

const CONTACT_UPSERT_SQL = `
  INSERT INTO contact (id, appId, account, contactId, nickname, country, gender, level, remark)
  VALUES ($id, $appId, $account, $contactId, $nickname, $country, $gender, $level, $remark)
  ON CONFLICT(appId, account, contactId)
  DO UPDATE SET
    id = excluded.id,
    nickname = excluded.nickname,
    country = excluded.country,
    gender = excluded.gender,
    level = excluded.level,
    remark = excluded.remark;
`;

export class ContactRepository {
  constructor(private readonly database: SqliteDatabase) {}

  upsert(record: ContactRecord): unknown {
    return this.database.prepare(CONTACT_UPSERT_SQL).run(record);
  }

  findByKey(appId: string, account: string, contactId: string): ContactRecord | null {
    return (
      this.database
        .prepare<ContactRecord>("SELECT * FROM contact WHERE appId = ? AND account = ? AND contactId = ?;")
        .get(appId, account, contactId) ?? null
    );
  }
}
