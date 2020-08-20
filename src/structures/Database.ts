import { ConnectionManager } from 'typeorm';
import { GuildSettings } from '../models/GuildSettings';
import { databaseName } from '../config';
import { Infractions } from '../models/Infractions';
import { UserSettings } from '../models/UserSettings';

const connectionManager = new ConnectionManager();
connectionManager.create({
	name: databaseName,
	type: 'sqlite',
	database: './db.sqlite',
	entities: [GuildSettings, Infractions, UserSettings],
});

export default connectionManager;
