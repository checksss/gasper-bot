import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class ModLogCommand extends Command {
    public constructor() {
        super('modlog', {
            aliases: ['modlog', 'log', 'logs'],
            description: {
                content: 'Adds or removes log channel of specified logtype for this server. Valid logtypes are:\n`kick`, `ban`, `warn`, `mute`\n`message`, `message_edit/update`, `message_delete`',
                usage: '<add/remove> <logtype> <channel>',
                examples: ['add message_update message-logs', 'remove message_delete #member-logs', 'add kick 606582348552601600']
            },
            category: 'Administrator',
            clientPermissions: ['MANAGE_WEBHOOKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'method',
                    type: 'lowercase',
                    prompt: {
                        start: (message: Message): string => `${message.author}, would you add or remove a logchannel?`
                    },
                },
                {
                    id: 'logtype',
                    type: 'lowercase',
                    prompt: {
                        start: (message: Message): string => `${message.author}, which type of log should be set?`,
                    }
                },
                {
                    id: 'channel',
                    type: 'channel',
                    prompt: {
                        start: (message: Message): string => `${message.author}, which channel would you like to set as logchannel?`,
                        retry: (message: Message): string => `${message.author}, please provide a valid channel.`,
                        retries: 2
                    }
                }
            ]
        });
    }

    public async exec(message: Message, { method, logtype, channel }: { method: string, logtype: string, channel: TextChannel }): Promise<Message | Message[]> {
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

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var adminrole = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id))
        if (!administrators.includes(message.author!.id) && adminrole.size == 0) return message.util!.reply('only administrators can use this command.');

        const editTypes: string[] = ['message_edit', 'message_update', 'msgedit', 'messageedit'];
        const deleteTypes: string[] = ['message_delete', 'messagedelete', 'msgdelete'];

        if (editTypes.includes(logtype)) {
            logtype = 'message_edit';
        } else if (deleteTypes.includes(logtype)) {
            logtype = 'message_delete'
        }
        // dunno why this doesn't work. it always returns 'message_delete' if i use one of these

        const typecheck = async function (logtype: string) {
            switch (logtype) {
                case 'kick':
                    return true
                case 'ban':
                    return true
                case 'mute':
                    return true
                case 'warn':
                    return true
                case 'message':
                    return true
                case 'message_edit':
                    return true
                case 'message_delete':
                    return true
                default:
                    return false;
            }
        }

        const prefix = await (this.handler.prefix as PrefixSupplier)(message);
        var rnd = Math.floor(Math.random() * prefix.length) - 1;
        const checktype = await typecheck(logtype)
        if (checktype === false) return message.util!.send(stripIndents`
        That logtype doesn't exist on \`modlog\`;
        Try \`${prefix[rnd]}help modlog\` for help.`);

        //@ts-ignore
        var logchannel: string = await this.client.guildsettings.get(message.guild!, `config.${logtype}_logchannel`, '');
        //@ts-ignore
        if (logchannel === '') this.client.guildsettings.set(message.guild!, `config.${logtype}_logchannel`, '');

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        switch (method) {
            case 'add':
                if (logchannel === channel.id) return message.util!.send(`${channel} is already set as ${logtype}-log.`);
                try {
                    logchannel = channel.id;
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, `config.${logtype}_logchannel`, logchannel);
                } catch {
                    return message.util!.send('Something went wrong.');
                }

                return message.util!.send(`${channel} is now set as ${logtype}-log.`);
            case 'remove':
                if (logchannel !== channel.id) return message.util!.send(`${channel} isn't set as ${logtype}-log.`);
                try {
                    //@ts-ignore
                    await this.client.guildsettings.delete(message.guild!, `config.${logtype}_logchannel`);
                } catch {
                    return message.util!.send('Something went wrong.');
                }

                return message.util!.send(`${channel} is no longer set as ${logtype}-log.`);
            default:
                return message.util!.send(stripIndents`
                That method doesn't exist on \`modlog\`;
                Try \`${prefix}help modlog\` for help.`);
        }
    }
}