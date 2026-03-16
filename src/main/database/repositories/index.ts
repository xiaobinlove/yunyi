import type { SqliteDatabase } from "../sqlite";
import { ClientRepository } from "./client-repository";
import { ContactRepository } from "./contact-repository";
import { ContactSettingRepository } from "./contact-setting-repository";
import { QuickReplyRepository } from "./quick-reply-repository";

export interface MainDatabaseRepositories {
  clients: ClientRepository;
  contacts: ContactRepository;
  contactSettings: ContactSettingRepository;
  quickReplies: QuickReplyRepository;
}

export function createMainDatabaseRepositories(database: SqliteDatabase): MainDatabaseRepositories {
  return {
    clients: new ClientRepository(database),
    contacts: new ContactRepository(database),
    contactSettings: new ContactSettingRepository(database),
    quickReplies: new QuickReplyRepository(database),
  };
}
