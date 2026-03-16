import type { ClientRecord } from "../entities";
import type { SqliteDatabase } from "../sqlite";

export class ClientRepository {
  constructor(private readonly database: SqliteDatabase) {}

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
