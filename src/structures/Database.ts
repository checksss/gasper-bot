import { ConnectionManager } from 'typeorm';
import { GuildSettings } from '../models/GuildSettings';
import dbConfig from '../config/dbConfig';
import { Infractions } from '../models/Infractions';
import { UserSettings } from '../models/UserSettings';

const connectionManager = new ConnectionManager();
connectionManager.create({
	logging: false,
	synchronize: true,
	name: dbConfig.databaseName,
	database: dbConfig.databaseName,
	password: dbConfig.databasePassword,
	type: 'mariadb',
	host: dbConfig.databaseHostname,
	port: dbConfig.databasePort,
	username: dbConfig.databaseUser,
	entities: [GuildSettings, Infractions, UserSettings],
});

export default connectionManager;
