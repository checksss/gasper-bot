import { Command, Argument } from 'discord-akairo';
import { Message, Channel, TextChannel, NewsChannel } from 'discord.js';
import { owners } from '../../config';

export default class SayCommand extends Command {
    public constructor() {
        super('say', {
            aliases: ['say', 'echo', 'print'],
            description: {
                content: 'Spread your word through me!',
                usage: ['Wassup?!', '#general Hi!']
            },
            category: 'Moderation',
            clientPermissions: ['MANAGE_MESSAGES'],
            userPermissions: ['MANAGE_MESSAGES'],
            ratelimit: 2,
            args: [
                {
                    id: 'channel',
                    match: 'phrase',
                    //type: 'channel',
                    type: Argument.union('channel', async (message, phrase) => {
                        let ch = await this.client.channels.fetch(phrase).catch((e) => { if (e) return { id: message.channel.id, channel: message.channel } });
                        if (ch) return { id: ch.id, channel: ch };
                        return { id: message.channel.id, channel: message.channel };
                    }),
                    default: (message: Message): Channel => message.channel!
                },
                {
                    id: 'content',
                    match: 'content',
                    type: 'string',
                    default: (message: Message) => {
                        let contAr: string[] = message.content.split(' ');
                        let content: string = message.content.replace(contAr[0], '');
                        let isChannel: boolean =
                            message.guild.channels.cache.has(contAr[1]) ||
                            contAr[1] === message.channel.id ||
                            contAr[1] === (message.channel as TextChannel).name ||
                            contAr[1] === `<#${message.channel.id}>` ||
                            contAr[1] === `#${(message.channel as TextChannel).name}` ||
                            contAr[1] === `${message.channel}`;

                        if (isChannel) {
                            content = content.replace(contAr[1], '');
                        }
                        return content;
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

        let contAr: string[] = content.split(' ');
        let isChannel: boolean =
            message.guild.channels.cache.has(contAr[0]) ||
            contAr[0] === textChannel.id ||
            contAr[0] === textChannel.name ||
            contAr[0] === `<#${textChannel.id}>` ||
            contAr[0] === `#${textChannel.name}` ||
            contAr[0] === `${textChannel}`;

        if (isChannel) {
            content = content.replace(contAr[0], '');
        } else {
            textChannel = message.channel as TextChannel;
        }
        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        return textChannel.send(content);
    }
}