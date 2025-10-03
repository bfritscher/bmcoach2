import { Client, Account, Databases, Teams, Avatars, Storage } from 'appwrite';

export const client = new Client()
  .setEndpoint('https://appwrite.bf0.ch/v1')
  .setProject('bmcoach-test');
// TODO: setLocale based on client?

export const accountClient: Account = new Account(client);
export const databases: Databases = new Databases(client);
export const teams: Teams = new Teams(client);
export const avatars: Avatars = new Avatars(client);
export const storage: Storage = new Storage(client);
