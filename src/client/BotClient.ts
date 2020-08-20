import {
	CommandHandler,
	ListenerHandler,
	AkairoClient,
	InhibitorHandler,
} from 'discord-akairo';
import { Message } from 'discord.js';
import { join } from 'path';
import { owners, defaultPrefix, databaseName } from '../config';
import { Connection } from 'typeorm';
import Database from '../structures/Database';
import GuildSettingsProvider from '../structures/GuildSettingsProvider';
import { GuildSettings } from '../models/GuildSettings';
import InfractionsProvider from '../structures/InfractionsProvider';
import { Infractions } from '../models/Infractions';
import UserSettingsProvider from '../structures/UserSettingsProvider';
import { UserSettings } from '../models/UserSettings';

declare module 'discord-akairo' {
	interface AkairoCLient {
		inhibitorHandler: InhibitorHandler;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		config: BotOptions;
		guildsettings: GuildSettingsProvider;
		infractions: InfractionsProvider;
		usersettings: UserSettingsProvider;
	}
}

interface BotOptions {
	token?: string;
	owners?: string | string[];
}

export default class BotClient extends AkairoClient {
	public db!: Connection;

	public guildsettings!: GuildSettingsProvider;

	public infractions!: InfractionsProvider;

	public usersettings!: UserSettingsProvider;

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message) => {
			let guildprefix: string = this.guildsettings.get(msg.guild, 'config.prefix', defaultPrefix);
			let userprefixes: string[] = this.usersettings.get(msg.author, 'config.prefixes', [defaultPrefix]);
			if (msg.guild) {
				return userprefixes.concat(guildprefix);
			} else {
				return userprefixes;
			}
		},
		ignorePermissions: owners,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 1e4,
		argumentDefaults: {
			prompt: {
				modifyStart: (_, str): string =>
					`${str}\n\nType \`cancel\` to cancel the command...`,
				modifyRetry: (_, str): string =>
					`${str}\n\nType \`cancel\` to cancel the command...`,
				timeout: 'You took too long, the command has now been cancelled...',
				ended:
					'You exceeded the maximum amount of tries, this command has now been cancelled...',
				retries: 3,
				time: 3e4,
			},
			otherwise: '',
		},
	});

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
	});

	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
	});

	public constructor(config: BotOptions) {
		super({
			ownerID: owners,
			shards: 'auto',
			shardCount: 1,
		});

		//@ts-ignore
		this.config = config;
	}

	private async _init(): Promise<void> {
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			listenerHandler: this.listenerHandler,
			process: process,
		});

		this.commandHandler.loadAll();
		this.listenerHandler.loadAll();
		this.inhibitorHandler.loadAll();

		this.db = Database.get(databaseName);
		await this.db.connect();
		await this.db.synchronize();

		this.guildsettings = new GuildSettingsProvider(this.db.getRepository(GuildSettings));
		await this.guildsettings.init();

		this.infractions = new InfractionsProvider(this.db.getRepository(Infractions));
		await this.infractions.init();

		this.usersettings = new UserSettingsProvider(this.db.getRepository(UserSettings));
		await this.usersettings.init();
	}

	public async start(): Promise<string> {
		await this._init();
		//@ts-ignore
		return this.login(this.config.token);
	}
}
