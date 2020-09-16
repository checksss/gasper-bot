import { Provider } from 'discord-akairo';
import { User } from 'discord.js';
import { Repository, InsertResult, DeleteResult, UpdateResult } from 'typeorm';
import { Infractions } from '../models/Infractions';
import * as _ from 'dot-prop';
import { stripIndents } from 'common-tags';

export default class InfractionsProvider extends Provider {
    public repo: Repository<any>;

    public constructor(repository: Repository<any>) {
        super();
        this.repo = repository;
    }

    public async init(): Promise<void> {
        const infractions = await this.repo.find();
        for (const infraction of infractions) {
            this.items.set(infraction.user, JSON.parse(infraction.infractions));
        }
    }

    public get<T>(
        user: string | User,
        key: string,
        defaultValue: any
    ): T | any {
        const id = (this.constructor as typeof InfractionsProvider).getUserID(user);
        if (this.items.has(id)) {
            return _.get(this.items.get(id), key, defaultValue);
        }
        return defaultValue;
    }

    public getRaw(user: string | User) {
        const id = (this.constructor as typeof InfractionsProvider).getUserID(user);
        return this.items.get(id);
    }

    public async set(
        user: string | User,
        key: string,
        value: any
    ): Promise<InsertResult | UpdateResult> {
        const id = (this.constructor as typeof InfractionsProvider).getUserID(user);
        const data = this.items.get(id) || {};
        _.set(data, key, value);
        this.items.set(id, data);

        return this.repo
            .createQueryBuilder()
            .insert()
            .into(Infractions)
            .values({ user: id, infractions: JSON.stringify(data) })
            .onConflict(stripIndents`UPDATE \`infractions\`
			SET \`infractions\` = '${JSON.stringify(data)}'
			WHERE \`infractions\`.\`user\` = '${id}';`)
            .setParameter('infractions', JSON.stringify(data))
            .execute()
            .catch(e => {
                if (e) {
                    return this.repo
                        .createQueryBuilder()
                        .update(Infractions)
                        .set({ infractions: () => `'${JSON.stringify(data)}'` })
                        .where("user = :user", { user: id })
                        .execute();
                }
            });
    }

    public async delete(user: string | User, key: string): Promise<InsertResult | UpdateResult> {
        const id = (this.constructor as typeof InfractionsProvider).getUserID(user);
        const data = this.items.get(id) || {};
        _.delete(data, key);

        return this.repo
            .createQueryBuilder()
            .insert()
            .into(Infractions)
            .values({ user: id, infractions: JSON.stringify(data) })
            .onConflict(stripIndents`UPDATE \`infractions\`
			SET \`infractions\` = '${JSON.stringify(data)}'
			WHERE \`infractions\`.\`user\` = '${id}';`)
            .setParameter('infractions', JSON.stringify(data))
            .execute()
            .catch(e => {
                if (e) {
                    return this.repo
                        .createQueryBuilder()
                        .update(Infractions)
                        .set({ infractions: () => `'${JSON.stringify(data)}'` })
                        .where("user = :user", { user: id })
                        .execute();
                }
            });
    }

    public clear(user: string | User): Promise<DeleteResult> {
        const id = (this.constructor as typeof InfractionsProvider).getUserID(user);
        this.items.delete(id);
        return this.repo.delete(id);
    }

    private static getUserID(user: string | User): string {
        if (user instanceof User) return user.id;
        if (user === 'global' || user === null) return '0';
        if (typeof user === 'string' && /^\d+$/.test(user)) return user;
        throw new TypeError(
            'Invalid user specified. Must be a User instance, user ID, "global", or null.'
        );
    }
}
