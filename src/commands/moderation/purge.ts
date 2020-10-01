import { Command } from 'discord-akairo';
import {
    Message,
    MessageEmbed,
    GuildMember,
    NewsChannel,
    TextChannel
} from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import wh from '../../structures/webHook'
import Mods from '../../structures/Moderators';

export default class PurgeCommand extends Command {
    public constructor() {
        super('purge', {
            aliases: ['purge', 'delete', 'clear'],
            description: {
                content: 'Deletes a specific number of messages, optionally from a specific member.',
                usage: '<amount> -u=[member]',
                examples: ['42', '42 @Spammer#1337']
            },
            category: 'Moderation',
            clientPermissions: ['MANAGE_MESSAGES'],
            userPermissions: ['MANAGE_MESSAGES'],
            ratelimit: 2,
            args: [
                {
                    id: 'amount',
                    type: 'integer',
                    prompt: {
                        start: (message: Message): string => `${message.author}, how many message would you like to delete?`,
                        retry: (message: Message): string => `${message.author}, please enter a valid number.`,
                        retries: 2
                    }
                },
                {
                    id: 'member',
                    type: 'member',
                    match: 'phrase',
                    default: null
                }
            ]
        });
    }

    public async exec(message: Message, { amount, member }: { amount: number, member: GuildMember }): Promise<Message | Message[] | void> {
        if (message.deletable && !message.deleted) await message.delete();

        let isMod: boolean = await Mods.check(this.client, message.guild, message.member);
        if (!isMod) return message.util!.reply('only moderators can use this command.');

        const clientMember = await message.guild!.members.fetch(this.client.user!.id);

        if (!clientMember.permissions.has('MANAGE_MESSAGES')) return message.util!.reply('I\'m not allowed to delete messages.');

        if (amount < 2 || amount > 99) return message.util!.send('You can only bulk-delete between 1 and 100 messages.');

        //@ts-ignore
        const modlog = this.client.guildsettings.get(message.guild, 'config.message_logchannel', '');

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        try {
            if (member && member != null) {

                message.channel.messages.fetch({ limit: 20 })
                    .then((msgs) => {
                        let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                        (message.channel as TextChannel).bulkDelete(messages)
                    });

                message.channel.messages.fetch({ limit: 100 })
                    .then((msgs) => {
                        let messages: Message[] = msgs.filter(m => m.author.id === member.id && Date.now() - m.createdTimestamp < 1209600000).array().slice(0, amount);
                        (message.channel as TextChannel).bulkDelete(messages).then(async (deleted) => {
                            const embed = new MessageEmbed({
                                author: {
                                    name: `#${(message.channel as TextChannel).name}`,
                                    url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}`
                                },
                                color: member.displayHexColor,
                                description: stripIndents`
                                ${deleted.size} ${deleted.size > 1 ? 'messages were' : 'message was'} deleted
                                from ${member.user.tag} (${member.id})
                                by ${message.author.tag} (${message.author.id})
                                `,
                                footer: {
                                    text: `${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                                }
                            });
                            message.util!.send(embed).then(m => {
                                // @ts-ignore
                                m.delete({ timeout: 3000 });
                            });
                            if (message.guild.channels.cache.has(modlog)) {

                                let logchannel = message.guild.channels.cache.get(modlog) as TextChannel;
                                let webhook = await wh.get('mod-log', this.client.user, logchannel as TextChannel);
                                wh.send(webhook, message.guild, this.client.user, embed);
                            };
                        });
                    });
            } else {

                message.channel.messages.fetch({ limit: 20 })
                    .then((msgs) => {
                        let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author && Date.now() - m.createdTimestamp < 1209600000).array();
                        (message.channel as TextChannel).bulkDelete(messages)
                    });

                (message.channel as TextChannel).bulkDelete(amount, true).then(async (deleted) => {
                    const embed = new MessageEmbed({
                        author: {
                            name: `#${(message.channel as TextChannel).name}`,
                            url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}`
                        },
                        color: message.member.displayHexColor,
                        description: stripIndents`
                        ${deleted.size} ${deleted.size > 1 ? 'messages were' : 'message was'} deleted
                        by ${message.author.tag} (${message.author.id})
                        `,
                        footer: {
                            text: `${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        }
                    });
                    message.util!.send(embed).then(m => {
                        // @ts-ignore
                        m.delete({ timeout: 3000 });
                    });
                    if (message.guild.channels.cache.has(modlog)) {

                        let logchannel = message.guild.channels.cache.get(modlog) as TextChannel;
                        let webhook = await wh.get('mod-log', this.client.user, logchannel as TextChannel);
                        wh.send(webhook, message.guild, this.client.user, embed);
                    };
                });
            };

        } catch (error) {
            console.log(error.stack)
            const fail = new MessageEmbed()
                .setColor([245, 155, 55])
                .setDescription('Something went wrong.\n\n```' + error + '```');

            message.channel.messages.fetch({ limit: 20 })
                .then((msgs) => {
                    let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                    (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
                });

            return message.util!.send(fail);
        }

    }
}