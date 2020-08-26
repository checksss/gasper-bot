import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import { owners } from '../../config';

export default class DevLogCommand extends Command {
    public constructor() {
        super('devlog', {
            aliases: ['devlog'],
            description: {
                content: 'Adds or removes log channel of specified logtype. Valid logtypes are:\n`bugreport`, `suggestion`',
                usage: '<add/remove> <logtype> <channel>',
                examples: ['add suggestion suggestions-log', 'remove suggestion error-log', 'add bugreport 606582348552601600']
            },
            category: 'Administrator',
            ratelimit: 2,
            ownerOnly: true,
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
        if (message.deletable && !message.deleted) message.delete();

        if (!this.client.ownerID.includes(message.author.id)) return message.util!.reply('only bot owners can use this command.');
        const typecheck = async function (logtype: string) {
            switch (logtype) {
                case 'bugreport':
                    return true
                case 'suggestion':
                    return true
                default:
                    return false;
            }
        }

        const prefix: string | string[] = await (this.handler.prefix as PrefixSupplier)(message)
        const checktype = await typecheck(logtype)
        if (checktype === false) return message.util!.send(stripIndents`
        That logtype doesn't exist on \`devlog\`;
        Try \`${prefix}help devlog\` for help.`);

        //@ts-ignore
        var logchannel: string = await this.client.guildsettings.get('global', `config.${logtype}_logchannel`, '');
        //@ts-ignore
        if (logchannel === '') this.client.guildsettings.set('global', `config.${logtype}_logchannel`, '');

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
                    await this.client.guildsettings.set('global', `config.${logtype}_logchannel`, logchannel);
                } catch {
                    return message.util!.send('Something went wrong.');
                }

                return message.util!.send(`${channel} is now set as ${logtype}-log.`);
            case 'remove':
                if (logchannel !== channel.id) return message.util!.send(`${channel} isn't set as ${logtype}-log.`);
                try {
                    let newLog: string = '';
                    //@ts-ignore
                    await this.client.guildsettings.set('global', `config.${logtype}_logchannel`, newLog);
                } catch {
                    return message.util!.send('Something went wrong.');
                }

                return message.util!.send(`${channel} is no longer set as ${logtype}-log.`);
            default:
                return message.util!.send(stripIndents`
                That method doesn't exist on \`devlog\`;
                Try \`${prefix}help devlog\` for help.`);
        }
    }
}