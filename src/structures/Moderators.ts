import { AkairoClient } from 'discord-akairo';
import { Guild, GuildMember, Role } from 'discord.js';
import Admins from './Administrators';

export default class Mods {

    // get moderators
    private static getMods = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        let defaultMods: string[] = await Admins.get(client, guild);
        //@ts-ignore
        let savedMods: string[] = await client.guildsettings.get(guild!, 'config.moderators', defaultMods);

        // let admins always be mods
        for (const dM in defaultMods) {
            if (!savedMods.includes(dM)) savedMods.push(dM);
            //@ts-ignore
            await client.guildsettings.set(guild!, 'config.moderators', savedMods);
        }

        return savedMods;
    };

    // return mods list as array
    public static get = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        return await Mods.getMods(client, guild);
    };


    // return TRUE if given ID is included in mods list or is server admin
    public static check = async (client: AkairoClient, guild: Guild, mr: GuildMember | Role): Promise<boolean> => {
        let mods: string[] = await Mods.get(client, guild);
        let isMember: boolean = guild.members.cache.has(mr.id);
        let isRole: boolean = guild.roles.cache.has(mr.id);
        let isMod: boolean = isMember ?
            (mr as GuildMember).roles.cache
                .filter(r => r.permissions.has('MANAGE_GUILD'))
                .map(ar => ar.id).length > 0 :
            isRole ?
                (mr as Role).permissions.has('MANAGE_GUILD') : false;

        return isMod || mods.includes(mr.id);
    };

    // save given ID into mods list and return the new list as array
    public static save = async (client: AkairoClient, guild: Guild, mr: GuildMember | Role): Promise<string[]> => {
        let mods: string[] = await Mods.get(client, guild);
        let isMod: boolean = await Mods.check(client, guild, mr);
        if (!isMod) mods.push(mr.id);
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.moderators', mods);
        return mods;
    };

    // remove given ID from mods list and return the new list as array
    public static remove = async (client: AkairoClient, guild: Guild, id: string): Promise<string[]> => {
        let mods: string[] = await Mods.get(client, guild);
        let newMods: string[] = [];
        for (const a in mods) {
            if (a !== id) newMods.push(a);
        }
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.moderators', newMods);
        return newMods;
    };
}