import { Command, Argument } from 'discord-akairo';
import { Message, Channel, TextChannel, NewsChannel } from 'discord.js';
import { owners } from '../../config';

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
        if (message.deletable && !message.deleted) await message.delete();
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        let textChannel = channel as TextChannel;
        if (message.author.id !== this.client.ownerID && !message.guild.channels.cache.has(channel.id)) return message.reply('I don\'t think that other servers will like this.\n' + (channel as TextChannel).name)

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

        let adminRoles: string[] = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).map((roles): string => `${roles.id}`);
        let defaultMods: string[] = adminRoles.concat(guildOwner.id);
        for (var owner in owners) {
            defaultMods.push(owner);
        }

        //@ts-ignore
        let moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', defaultMods);
        owners.forEach(o => {
            if (!moderators.includes(o)) {
                moderators.push(o);
            }
        })

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0 && message.author.id != this.client.ownerID) return message.util!.reply('You\'re not allowed to speak through me.');

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        return textChannel.send(content);
    }
}