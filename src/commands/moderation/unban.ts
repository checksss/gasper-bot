import { Command, Argument } from 'discord-akairo';
import { Message, MessageEmbed, TextChannel, User, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import wh from '../../structures/webHook'
import Mods from '../../structures/Moderators';

export default class UnbanCommand extends Command {
    public constructor() {
        super('unban', {
            aliases: ['unban'],
            description: {
                content: 'Unbans a member.',
                usage: '<member> [reason]',
                examples: ['@overtroll', '@soupguy mistake'],
            },
            category: 'Moderation',
            clientPermissions: ['BAN_MEMBERS', 'MANAGE_WEBHOOKS'],
            args: [
                {
                    id: 'user',
                    type: Argument.union('user', async (_, phrase) => {
                        let u: User = (await _.guild.fetchBans()).filter(b => b.user.id === phrase || b.user.username === phrase || b.user.tag === phrase).map(b => b.user)[0];
                        if (u)
                            return u;
                        return null;
                    }),
                    prompt: {
                        start: (message: Message): string => `${message.author}, who would you like to ban?`,
                        retry: (message: Message): string => `${message.author}, please provide a valid user-id/-name/-tag.`,
                        retries: 2
                    }
                },
                {
                    id: 'reason',
                    match: 'rest',
                    default: ''
                },
            ],
        });
    }

    public async exec(message: Message, { user, reason }: { user: User, reason: string }): Promise<Message | Message[]> {
        if (message.deletable && !message.deleted) message.delete();
        if (message.deletable && !message.deleted) await message.delete();

        let isMod: boolean = await Mods.check(this.client, message.guild, message.member);
        if (!isMod) return message.util!.reply('only moderators can use this command.');

        const clientMember = message.guild!.me!;
        const authorMember = await message.guild!.members.fetch(message.author!.id);

        if (!clientMember.permissions.has('BAN_MEMBERS')) return message.util!.reply('I\'m not allowed to unban members.');

        if (user.id === clientMember.user.id) return message.util!.reply('you can\'t unban me.');
        if (message.author!.id === user.id) return message.util!.reply('you can\'t unban yourself.');

        let msg = await message.util!.send(`Are you sure you want to unban \`${user.tag}\`? Y/N`);
        const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
        if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
        const response = responses.first();
        if (response.deletable && !response.deleted) response.delete();

        if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
            msg.edit(`Unbanning **${user.tag}**`);
        } else {
            return message.util!.reply('unban cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
        }

        try {
            await user.send(stripIndents`
                **You have been unbanned from ${message.guild!.name}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}`)
            await message.guild!.members.unban(user, `${reason}\nUnbanned by ${authorMember!.user.tag}`);
        } catch {
            try {
                await message.guild!.members.unban(user, `${reason}\nUnbanned by ${authorMember!.user.tag}`);
            } catch (error) {
                return message.util!.reply(`Ooops! Something went wrong:\n\`\`\`${error}\`\`\`.`);
            }
        }

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        //@ts-ignore
        const modLog = await this.client.guildsettings.get(message.guild!, 'config.ban_logchannel', '');
        const logchannel = message.guild.channels.cache.get(modLog);
        if (message.guild.channels.cache.has(modLog)) {
            const embed = new MessageEmbed()
                .setColor(clientMember.displayColor)
                .setAuthor(`${user.tag} (${user.id})`, user.displayAvatarURL())
                .setDescription(stripIndents`
                    **Action**: Unban
                    **Reason:** ${reason ? reason : 'No reason'}
                `)
                .setFooter(`User Unbanned by ${authorMember.user.tag} ✧ ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`);

            let webhook = await wh.get('infractions-log', this.client.user, logchannel as TextChannel);
            wh.send(webhook, message.guild, this.client.user, embed);
        }

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        await msg.edit(`Successfully unbanned **${user.tag}**`);
        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}