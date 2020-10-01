import { AkairoClient } from "discord-akairo";
import { Guild, GuildMember, Role } from "discord.js";
import Owner from './ServerOwner';

export default class Admins {

    // get saved admins
    private static getAdmins = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        let adminRoles: string[] = guild.roles.cache.filter(r => r.permissions.has('ADMINISTRATOR')).map(ar => ar.id);
        let defaultAdmins: string[] = adminRoles.concat(await Owner.get(client, guild));
        //@ts-ignore
        let savedAdmins: string[] = await client.guildsettings.get(guild!, 'config.administrators', defaultAdmins);

        // let admin roles, guild-owner && bot-devs always are admin
        for (const dA in defaultAdmins) {
            if (!savedAdmins.includes(dA)) {
                savedAdmins.push(dA);
                //@ts-ignore
                await client.guildsettings.set(guild!, 'config.administrators', savedAdmins);
            }
        }
        return savedAdmins;
    };

    // return admins list as array 
    public static get = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        return await Admins.getAdmins(client, guild);
    };

    // return TRUE if given ID is included in admins list or is server admin
    public static check = async (client: AkairoClient, guild: Guild, mod: GuildMember | Role): Promise<boolean> => {
        let admins: string[] = await Admins.get(client, guild);
        let isMember: boolean = guild.members.cache.has(mod.id);
        let isRole: boolean = guild.roles.cache.has(mod.id);
        let isAdmin: boolean = isMember ?
            (mod as GuildMember).roles.cache
                .filter(r => r.permissions.has('ADMINISTRATOR'))
                .map(ar => ar.id).length > 0 :
            isRole ?
                (mod as Role).permissions.has('ADMINISTRATOR') : false;

        return isAdmin || admins.includes(mod.id);
    };

    // save given ID into admins list and return the new list as array
    public static save = async (client: AkairoClient, guild: Guild, mod: GuildMember | Role): Promise<string[]> => {
        let admins: string[] = await Admins.get(client, guild);
        let isAdmin: boolean = await Admins.check(client, guild, mod);
        if (!isAdmin) admins.push(mod.id);
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.administrators', admins);
        return admins;
    };

    // remove given ID from admins list and return the new list as array
    public static remove = async (client: AkairoClient, guild: Guild, id: string): Promise<string[]> => {
        let admins: string[] = await Admins.get(client, guild);
        let newAdmins: string[] = [];
        for (const a in admins) {
            if (a !== id) newAdmins.push(a);
        }
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.administrators', newAdmins);
        return newAdmins;
    };
}