import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, GuildMember, Role } from 'discord.js';
import { stripIndents } from 'common-tags';
import { Argument } from 'discord-akairo';
import { owners } from '../../config';

export default class ModCommand extends Command {
    public constructor() {
        super('mod', {
            aliases: ['mod'],
            description: {
                content: 'Adds or removes a moderator from a guild.',
                usage: '<add/remove> <member/role>'
            },
            ratelimit: 2,
            channel: 'guild',
            category: 'Administrator',
            userPermissions: ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_GUILD'],
            args: [
                {
                    id: 'method',
                    type: 'lowercase',
                    prompt: {
                        start: (message: Message): string => `${message.author}, would you like to add or remove a moderator?`
                    }
                },
                {
                    id: 'rolemember',
                    type: Argument.union('member', 'role'),
                    prompt: {
                        start: (message: Message): string => `${message.author}, who or which role would you like to remove/add from/to moderators?`,
                        retry: (message: Message): string => `${message.author}, please provide a valid member or role.`,
                        retries: 2
                    },
                }
            ]
        });
    }

    public async exec(message: Message, { method, rolemember }: { method: string, rolemember: GuildMember | Role }): Promise<Message | Message[]> {
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        if (message.deletable && !message.deleted) message.delete();

        let defaultAdmins: string[] = [guildOwner.id];

        for (var owner in owners) {
            defaultAdmins.push(owner);
        }

        //@ts-ignore
        let administrators: string[] = await this.client.guildsettings.get(message.guild!, 'config.administrators', defaultAdmins);
        defaultAdmins.forEach(dA => {
            if (!administrators.includes(dA)) {
                administrators = administrators.concat(dA);
            }
        })

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var adminrole = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id))
        if (!administrators.includes(message.author!.id) && adminrole.size == 0) return message.util!.reply('only administrators can use this command.');

        let adminRoles: string[] = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).map((roles): string => `${roles.id}`);
        let defaultMods: string[] = adminRoles.concat(guildOwner.id).concat(this.client.ownerID);

        //@ts-ignore
        const moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', []);
        //@ts-ignore
        if (moderators.length === 0) this.client.guildsettings.set(message.guild!, 'config.moderators', defaultMods);

        const clearID: string = rolemember.id;

        var isMember: boolean = message.guild.members.cache.has(clearID);
        var isRole: boolean = message.guild.roles.cache.has(clearID);

        var modID: string;
        var addAlreadyMod: string;
        var addConf: string;
        var rmNotMod: string;
        var rmConf: string;

        var role: Role;
        if (isMember) {
            var member: GuildMember = message.guild.members.cache.get(clearID);
            modID = member.id;
            addAlreadyMod = `\`${member.user.tag}\` is already a moderator.`;
            addConf = `\`${member.user.tag}\` is now a moderator.`;
            rmNotMod = `\`${member.user.tag}\` isn't a moderator.`;
            rmConf = `\`${member.user.tag}\` is no longer a moderator.`;
        } else if (isRole) {
            var role: Role = message.guild.roles.cache.get(clearID);
            modID = role.id;
            addAlreadyMod = `\`${role.name}\` are already moderators.`;
            addConf = `\`${role.name}\` are now moderators.`;
            rmNotMod = `\`${role.name}\` aren't moderators.`;
            rmConf = `\`${role.name}\` are no longer moderators.`;
        } else {
            return message.util!.reply(stripIndents`
            I found neither a role nor a member.
            Did you get the right ID/Mention?
            `)
        }

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                message.channel.bulkDelete(messages)
            });

        switch (method) {
            case 'add':
                if (moderators.includes(modID)) return message.util!.send(addAlreadyMod);
                try {
                    moderators.push(modID);
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.moderators', moderators);
                } catch (e) {
                    this.client.users.cache.get(this.client.ownerID[0]).send(e);
                    return message.util!.send('Something went wrong.\n' + e.stack);
                }

                return message.util!.send(addConf);
            case 'remove':
                if (!moderators.includes(modID)) return message.util!.send(rmNotMod);
                try {
                    let newMods: Array<string> = [];
                    moderators.forEach(m => {
                        if (m !== modID) newMods.push(m);
                    });
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.moderators', newMods);
                } catch (e) {
                    this.client.users.cache.get(this.client.ownerID[0]).send(e);
                    return message.util!.send('Something went wrong.\n' + e.stack);
                }
                return message.util!.send(rmConf);
            default:
                const prefix = await (this.handler.prefix as PrefixSupplier)(message);
                return message.util!.reply(stripIndents`
                    that method doesn't exist on \`mod\`;
                    Try \`${prefix}help mod\` for help.`);
        }
    }
}