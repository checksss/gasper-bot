import { Provider } from 'discord-akairo';
import { Guild } from 'discord.js';
import { Repository, InsertResult, DeleteResult } from 'typeorm';
import { GuildSettings } from '../models/GuildSettings';
import * as _ from 'dot-prop';

export default class GuildSettingsProvider extends Provider {
	public repo: Repository<any>;

	public constructor(repository: Repository<any>) {
		super();
		this.repo = repository;
	}

	public async init(): Promise<void> {
		const settings = await this.repo.find();
		for (const setting of settings) {
			this.items.set(setting.guild, JSON.parse(setting.settings));
		}
	}

	public get<T>(
		guild: string | Guild,
		key: string,
		defaultValue: any
	): T | any {
		const id = (this.constructor as typeof GuildSettingsProvider).getGuildID(guild);
		if (this.items.has(id)) {
			return _.get(this.items.get(id), key, defaultValue);
		}
		return defaultValue;
	}

	public getRaw(guild: string | Guild) {
		const id = (this.constructor as typeof GuildSettingsProvider).getGuildID(guild);
		return this.items.get(id);
	}

	public set(
		guild: string | Guild,
		key: string,
		value: any
	): Promise<InsertResult> {
		const id = (this.constructor as typeof GuildSettingsProvider).getGuildID(guild);
		const data = this.items.get(id) || {};
		_.set(data, key, value);
		this.items.set(id, data);

		return this.repo
			.createQueryBuilder()
			.insert()
			.into(GuildSettings)
			.values({ guild: id, settings: JSON.stringify(data) })
			.onConflict('("guild") DO UPDATE SET "settings" = :settings')
			.setParameter('settings', JSON.stringify(data))
			.execute();
	}

	public delete(guild: string | Guild, key: string): Promise<InsertResult> {
		const id = (this.constructor as typeof GuildSettingsProvider).getGuildID(guild);
		const data = this.items.get(id) || {};
		_.delete(data, key);

		return this.repo
			.createQueryBuilder()
			.insert()
			.into(GuildSettings)
			.values({ guild: id, settings: JSON.stringify(data) })
			.onConflict('("guild") DO UPDATE SET "settings" = :settings')
			.setParameter('settings', JSON.stringify(data))
			.execute();
	}

	public clear(guild: string | Guild): Promise<DeleteResult> {
		const id = (this.constructor as typeof GuildSettingsProvider).getGuildID(guild);
		this.items.delete(id);
		return this.repo.delete(id);
	}

	private static getGuildID(guild: string | Guild): string {
		if (guild instanceof Guild) return guild.id;
		if (guild === 'global' || guild === null) return '0';
		if (typeof guild === 'string' && /^\d+$/.test(guild)) return guild;
		throw new TypeError(
			'Invalid guild specified. Must be a Guild instance, guild ID, "global", or null.'
		);
	}
}
