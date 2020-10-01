import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, GuildMember, Role, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import { Argument } from 'discord-akairo';
import Admins from '../../structures/Administrators';
import Mods from '../../structures/Moderators';

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
        if (message.deletable && !message.deleted) message.delete();

        let isAdmin: boolean = await Admins.check(this.client, message.guild, message.member);
        if (!isAdmin) return message.util!.reply('only administrators can use this command.');

        let moderators: string[] = await Mods.get(this.client, message.guild);

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
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id  && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        switch (method) {
            case 'add':
                if (moderators.includes(modID)) return message.util!.send(addAlreadyMod);
                try {
                    //@ts-ignore
                    await Mods.save(this.client, message, guild, modID);
                } catch (e) {
                    this.client.users.cache.get(this.client.ownerID[0]).send(e);
                    return message.util!.send('Something went wrong.\n' + e.stack);
                }

                return message.util!.send(addConf);
            case 'remove':
                if (!moderators.includes(modID)) return message.util!.send(rmNotMod);
                try {
                    await Mods.remove(this.client, message.guild, modID);
                } catch (e) {
                    this.client.users.cache.get(this.client.ownerID[0]).send(e);
                    return message.util!.send('Something went wrong.\n' + e.stack);
                }
                return message.util!.send(rmConf);
            default:
                const prefix = await (this.handler.prefix as PrefixSupplier)(message);
                var rnd = Math.floor(Math.random() * prefix.length) - 1;
                return message.util!.reply(stripIndents`
                    that method doesn't exist on \`mod\`;
                    Try \`${prefix[rnd]}help mod\` for help.`);
        }
    }
}