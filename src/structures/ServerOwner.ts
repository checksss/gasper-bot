import { AkairoClient } from "discord-akairo";
import { Guild, GuildMember } from "discord.js";

export default class Owner {

    // get bot-developers as array
    private static getDev = (client: AkairoClient): string[] => {
        return client.ownerID as string[];
    };

    // get guild-owner
    private static getOwner = (guild: Guild): string => {
        return guild.ownerID;
    };

    // return owners list as array 
    public static get = async (client: AkairoClient, guild: Guild): Promise<string[]> => {
        return Owner.getDev(client).concat(Owner.getOwner(guild));
    };

    // return TRUE if given ID is included in owner list or is server admin
    public static check = async (client: AkairoClient, guild: Guild, member: GuildMember): Promise<boolean> => {
        let owner: string[] = await Owner.get(client, guild);
        let isMember: boolean = guild.members.cache.has(member.id);

        return isMember && owner.includes(member.id);
    };
}