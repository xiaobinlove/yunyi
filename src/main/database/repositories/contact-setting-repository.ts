import type { ContactSettingRecord, ContactSettingUpsertInput } from "../entities";
import type { SqliteDatabase } from "../sqlite";

const CONTACT_SETTING_UPSERT_SQL = `
  INSERT INTO contact_setting (appId, account, contactId, transSetting)
  VALUES ($appId, $account, $contactId, $transSetting)
  ON CONFLICT(appId, account, contactId)
  DO UPDATE SET transSetting = excluded.transSetting;
`;

export class ContactSettingRepository {
  constructor(private readonly database: SqliteDatabase) {}

  upsert(record: ContactSettingUpsertInput): unknown {
    return this.database.prepare(CONTACT_SETTING_UPSERT_SQL).run(record);
  }

  findByKey(appId: string, account: string, contactId: string): ContactSettingRecord | null {
    return (
      this.database
        .prepare<ContactSettingRecord>("SELECT * FROM contact_setting WHERE appId = ? AND account = ? AND contactId = ?;")
        .get(appId, account, contactId) ?? null
    );
  }

  listAll(): ContactSettingRecord[] {
    return this.database.prepare<ContactSettingRecord>("SELECT * FROM contact_setting;").all();
  }

  deleteByAccount(appId: string, account: string): unknown {
    return this.database.prepare("DELETE FROM contact_setting WHERE appId = ? AND account = ?;").run(appId, account);
  }
}
