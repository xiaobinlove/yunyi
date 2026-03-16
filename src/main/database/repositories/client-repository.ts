import type { ClientInsertInput, ClientRecord, ClientUpdateInput } from "../entities";
import type { SqliteDatabase } from "../sqlite";

export class ClientRepository {
  constructor(private readonly database: SqliteDatabase) {}

  insert(record: ClientInsertInput): unknown {
    return this.database
      .prepare(
        `
          INSERT INTO client (
            id,
            appId,
            name,
            \`group\`,
            \`order\`,
            topOrder,
            disabled,
            website,
            userid,
            username,
            avatar,
            transSetting,
            proxySetting,
            agentSetting,
            createTime
          ) VALUES (
            $id,
            $appId,
            $name,
            $group,
            $order,
            $topOrder,
            $disabled,
            $website,
            $userid,
            $username,
            $avatar,
            $transSetting,
            $proxySetting,
            $agentSetting,
            $createTime
          );
        `
      )
      .run({
        id: record.id,
        appId: record.appId,
        name: record.name ?? null,
        group: record.group ?? null,
        order: record.order,
        topOrder: record.topOrder,
        disabled: record.disabled,
        website: record.website ?? null,
        userid: record.userid ?? null,
        username: record.username ?? null,
        avatar: record.avatar ?? null,
        transSetting: record.transSetting ?? null,
        proxySetting: record.proxySetting ?? null,
        agentSetting: record.agentSetting ?? null,
        createTime: record.createTime,
      });
  }

  listAll(): ClientRecord[] {
    return this.database.prepare<ClientRecord>("SELECT * FROM client;").all();
  }

  listPinnedByAppId(appId: string): ClientRecord[] {
    return this.database
      .prepare<ClientRecord>("SELECT * FROM client WHERE appId = ? AND topOrder >= 0 ORDER BY topOrder DESC;")
      .all(appId);
  }

  listUnpinnedByAppId(appId: string): ClientRecord[] {
    return this.database
      .prepare<ClientRecord>("SELECT * FROM client WHERE appId = ? AND topOrder < 0 ORDER BY `order` DESC;")
      .all(appId);
  }

  getMaxOrder(appId: string): number | null {
    return (this.database.prepare("SELECT MAX(`order`) FROM client WHERE appId = ?;").pluck(true).get(appId) as
      | number
      | null
      | undefined) ?? null;
  }

  getMaxTopOrder(appId: string): number | null {
    return (this.database.prepare("SELECT MAX(topOrder) FROM client WHERE appId = ?;").pluck(true).get(appId) as
      | number
      | null
      | undefined) ?? null;
  }

  update(record: ClientUpdateInput): unknown {
    const assignments: string[] = [];
    const values: Record<string, unknown> = { id: record.id };
    const mapping: Record<Exclude<keyof ClientUpdateInput, "id">, string> = {
      appId: "appId",
      name: "name",
      group: "`group`",
      order: "`order`",
      topOrder: "topOrder",
      disabled: "disabled",
      userid: "userid",
      username: "username",
      avatar: "avatar",
      transSetting: "transSetting",
      proxySetting: "proxySetting",
      agentSetting: "agentSetting",
      website: "website",
    };

    for (const [key, column] of Object.entries(mapping) as [Exclude<keyof ClientUpdateInput, "id">, string][]) {
      const value = record[key];
      if (value === undefined) {
        continue;
      }

      assignments.push(`${column} = $${key}`);
      values[key] = value;
    }

    if (assignments.length === 0) {
      return null;
    }

    return this.database
      .prepare(
        `
          UPDATE client SET
            ${assignments.join(", ")}
          WHERE id = $id;
        `
      )
      .run(values);
  }

  deleteByIds(ids: readonly string[]): unknown {
    if (ids.length === 0) {
      return null;
    }

    if (ids.length === 1) {
      return this.database.prepare("DELETE FROM client WHERE id = ?;").run(ids[0]);
    }

    return this.database
      .prepare(`DELETE FROM client WHERE id IN (${ids.map(() => "?").join(", ")});`)
      .run(ids);
  }

  updateOrder(id: string, order: number): unknown {
    return this.database.prepare("UPDATE client SET `order` = ? WHERE id = ?;").run(order, id);
  }

  updateTopOrder(id: string, topOrder: number): unknown {
    return this.database.prepare("UPDATE client SET topOrder = ? WHERE id = ?;").run(topOrder, id);
  }

  updatePinState(id: string, topOrder: number, order: number): unknown {
    return this.database.prepare("UPDATE client SET topOrder = ?, `order` = ? WHERE id = ?;").run(topOrder, order, id);
  }
}
