import { AkairoClient } from "discord-akairo";
import { Guild, GuildMember, Role } from "discord.js";
import Mods from './Moderators';

export default class Staff {

    // get staff members
    private static getStaff = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        let defaultStaff: string[] = await Mods.get(client, guild);
        //@ts-ignore
        let savedStaff: string[] = await client.guildsettings.get(guild!, 'config.staff', defaultStaff);

        // let mods always be staff
        for (const dS in defaultStaff) {
            if (!savedStaff.includes(dS)) savedStaff.push(dS);
            //@ts-ignore
            await client.guildsettings.set(guild!, 'config.staff', savedStaff);
        }

        return savedStaff;
    };

    // return staff list as array
    public static get = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        return await Staff.getStaff(client, guild);
    };

    // return TRUE if given ID is included in staff list or is server admin
    public static check = async (client: AkairoClient, guild: Guild, mr: GuildMember | Role): Promise<boolean> => {
        let staff: string[] = await Staff.get(client, guild);
        let isMember: boolean = guild.members.cache.has(mr.id);
        let isRole: boolean = guild.roles.cache.has(mr.id);
        let isStaff: boolean = isMember ?
            (mr as GuildMember).roles.cache
                .filter(r => r.permissions.has('ADMINISTRATOR'))
                .map(ar => ar.id).length > 0 :
            isRole ?
                (mr as Role).permissions.has('ADMINISTRATOR') : false;

        return isStaff || staff.includes(mr.id);
    };

    // save given ID into staff list and return the new list as array
    public static save = async (client: AkairoClient, guild: Guild, mr: GuildMember | Role): Promise<string[]> => {
        let staff: string[] = await Staff.get(client, guild);
        let isStaff: boolean = await Staff.check(client, guild, mr);
        if (!isStaff) staff.push(mr.id);
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.administrators', staff);
        return staff;
    };

    // remove given ID from staff list and return the new list as array
    public static remove = async (client: AkairoClient, guild: Guild, id: string): Promise<string[]> => {
        let staff: string[] = await Staff.get(client, guild);
        let newStaff: string[] = [];
        for (const a in staff) {
            if (a !== id) newStaff.push(a);
        }
        //@ts-ignore
        client.guildsettings.set(guild!, 'config.administrators', newStaff);
        return newStaff;
    };
}