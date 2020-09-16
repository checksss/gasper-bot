import { ConnectionManager } from 'typeorm';
import { GuildSettings } from '../models/GuildSettings';
import { dbSecrets } from '../config';
import { Infractions } from '../models/Infractions';
import { UserSettings } from '../models/UserSettings';

const connectionManager = new ConnectionManager();
connectionManager.create({
	logging: true,
	synchronize: true,
	name: dbSecrets.dbName,
	database: dbSecrets.dbName,
	password: dbSecrets.dbPass,
	type: 'mariadb',
	host: dbSecrets.dbHost,
	port: dbSecrets.dbPort,
	username: dbSecrets.dbUser,
	entities: [GuildSettings, Infractions, UserSettings],
});

export default connectionManager;
