import { Command, Argument } from 'discord-akairo';
import { Message, Channel, TextChannel, NewsChannel } from 'discord.js';
import botConfig from '../../config/botConfig';
import Mods from '../../structures/Moderators';

export default class SayCommand extends Command {
    public constructor() {
        super('say', {
            aliases: ['say', 'echo', 'print'],
            description: {
                content: 'Spread your word through me!',
                usage: ['[-c <channel>] <text>'],
                examples: ['Hey!', '-c #general Yo!', 'c=#general eyyyy']
            },
            category: 'Moderation',
            clientPermissions: ['MANAGE_MESSAGES'],
            userPermissions: ['MANAGE_MESSAGES'],
            ratelimit: 2,
            args: [
                {
                    id: 'channel',
                    match: 'option',
                    type: 'channel',
                    flag: ['-c', 'c='],
                    default: (message: Message): Channel => message.channel!
                },
                {
                    id: 'content',
                    match: 'rest',
                    type: 'string',
                    prompt: {
                        start: (msg: Message) => `${msg.author}, please provide some Text!`
                    }
                }
            ]
        });
    }

    public async exec(message: Message, { content, channel }: { content: string, channel: Channel }): Promise<Message | Message[]> {
        let textChannel = channel as TextChannel;
        if (message.author.id !== this.client.ownerID && !message.guild.channels.cache.has(channel.id)) return message.reply('I don\'t think that other servers will like this.\n' + (channel as TextChannel).name)

        let isMod: boolean = await Mods.check(this.client, message.guild, message.member);
        if (!isMod) return message.util!.reply('only moderators can use this command.');

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        if (message.deletable && !message.deleted) await message.delete();
        return await textChannel.send(content);
    }
}