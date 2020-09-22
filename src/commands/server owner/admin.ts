import { Command, PrefixSupplier, Argument } from 'discord-akairo';
import { Message, GuildMember, Role, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class AdminCommand extends Command {
    public constructor() {
        super('admin', {
            aliases: ['admin'],
            description: {
                content: 'Adds or removes a bot administrator from a guild.',
                usage: '<add/remove> <member/role>'
            },
            ratelimit: 2,
            channel: 'guild',
            category: 'Server Owner',
            userPermissions: ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_GUILD'],
            args: [
                {
                    id: 'method',
                    type: 'lowercase',
                    prompt: {
                        start: (message: Message): string => `${message.author}, would you like to add or remove a administrator?`
                    }
                },
                {
                    id: 'rolemember',
                    type: Argument.union('member', 'role'),
                    prompt: {
                        start: (message: Message): string => `${message.author}, who or which role would you like to remove/add from/to administrators?`,
                        retry: (message: Message): string => `${message.author}, please provide a valid member or role.`,
                        retries: 2
                    },
                }
            ]
        });
    }

    public async exec(message: Message, { method, rolemember }: { method: string, rolemember: GuildMember | Role }): Promise<Message | Message[]> {
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        const owners: string[] = this.client.ownerID as string[];
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

        //@ts-ignore
        if (administrators.length === 0) this.client.guildsettings.set(message.guild!, 'config.administrators', defaultAdmins);

        if (message.author.id !== message.guild.ownerID && !owners.includes(message.author.id)) return message.reply(`This command is **server owner** only! Please ask <@${message.guild.ownerID}>!`).then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));

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
            addAlreadyMod = `\`${member.user.tag}\` is already a administrator.`;
            addConf = `\`${member.user.tag}\` is now a administrator.`;
            rmNotMod = `\`${member.user.tag}\` isn't a administrator.`;
            rmConf = `\`${member.user.tag}\` is no longer a administrator.`;
        } else if (isRole) {
            var role: Role = message.guild.roles.cache.get(clearID);
            modID = role.id;
            addAlreadyMod = `\`${role.name}\` are already administrators.`;
            addConf = `\`${role.name}\` are now administrators.`;
            rmNotMod = `\`${role.name}\` aren't administrators.`;
            rmConf = `\`${role.name}\` are no longer administrators.`;
        } else {
            return message.util!.reply(stripIndents`
            I found neither a role nor a member.
            Did you get the right ID/Mention?
            `)
        }


        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });


        switch (method) {
            case 'add':
                if (administrators.includes(modID)) return message.util!.send(addAlreadyMod);
                try {
                    administrators.push(modID);
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.administrators', administrators);
                } catch (e) {
                    return message.util!.send('Something went wrong.\n' + e.stack).then(m => m.delete({ timeout: 5000 }));
                }

                return message.util!.send(addConf);
            case 'remove':
                if (!administrators.includes(modID)) return message.util!.send(rmNotMod);
                try {
                    let newAdmins: string[] = [];
                    administrators.forEach(m => {
                        if (m !== modID) newAdmins.push(m);
                    });
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.administrators', newAdmins);
                } catch (e) {
                    return message.util!.send('Something went wrong.\n' + e.stack).then(m => m.delete({ timeout: 5000 }));
                }
                return message.util!.send(rmConf);
            default:
                const prefix = await (this.handler.prefix as PrefixSupplier)(message);
                return message.util!.reply(stripIndents`
                    that method doesn't exist on \`admin\`;
                    Try \`${prefix}help admin\` for help.`);
        }
    }
}