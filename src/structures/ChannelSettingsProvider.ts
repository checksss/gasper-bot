import { Provider } from 'discord-akairo';
import { Channel } from 'discord.js';
import { Repository, InsertResult, DeleteResult, UpdateResult } from 'typeorm';
import { ChannelSettings } from '../models/ChannelSettings';
import * as _ from 'dot-prop';

export default class ChannelSettingsProvider extends Provider {
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
        channel: string | Channel,
        key: string,
        defaultValue: any
    ): T | any {
        const id = (this.constructor as typeof ChannelSettingsProvider).getChannelID(channel);
        if (this.items.has(id)) {
            return _.get(this.items.get(id), key, defaultValue);
        }
        return defaultValue;
    }

    public getRaw(channel: string | Channel) {
        const id = (this.constructor as typeof ChannelSettingsProvider).getChannelID(channel);
        return this.items.get(id);
    }

    public async set(
        channel: string | Channel,
        key: string,
        value: any
    ): Promise<InsertResult | UpdateResult> {
        const id = (this.constructor as typeof ChannelSettingsProvider).getChannelID(channel);
        const data = this.items.get(id) || {};
        _.set(data, key, value);
        this.items.set(id, data);

        return this.repo
            .createQueryBuilder()
            .insert()
            .into(ChannelSettings)
            .values({ channel: id, settings: JSON.stringify(data) })
            .setParameter('settings', JSON.stringify(data))
            .execute()
            .catch(e => {
                if (e) {
                    return this.repo
                        .createQueryBuilder()
                        .update(ChannelSettings)
                        .set({ settings: () => `'${JSON.stringify(data)}'` })
                        .where("channel = :channel", { channel: id })
                        .execute();
                }
            });
    }

    public async delete(
        channel: string | Channel,
        key: string
    ): Promise<InsertResult | UpdateResult> {
        const id = (this.constructor as typeof ChannelSettingsProvider).getChannelID(channel);
        const data = this.items.get(id) || {};
        _.delete(data, key);

        return this.repo
            .createQueryBuilder()
            .insert()
            .into(ChannelSettings)
            .values({ channel: id, settings: JSON.stringify(data) })
            .setParameter('settings', JSON.stringify(data))
            .execute()
            .catch(e => {
                if (e) {
                    return this.repo
                        .createQueryBuilder()
                        .update(ChannelSettings)
                        .set({ settings: () => `'${JSON.stringify(data)}'` })
                        .where("channel = :channel", { channel: id })
                        .execute();
                }
            });


    }

    public clear(channel: string | Channel): Promise<DeleteResult> {
        const id = (this.constructor as typeof ChannelSettingsProvider).getChannelID(channel);
        this.items.delete(id);
        return this.repo.delete(id);
    }

    private static getChannelID(channel: string | Channel): string {
        if (channel instanceof Channel) return channel.id;
        if (channel === 'global' || channel === null) return '0';
        if (typeof channel === 'string' && /^\d+$/.test(channel)) return channel;
        throw new TypeError(
            'Invalid channel specified. Must be a channel instance, channel ID, "global", or null.'
        );
    }
}
