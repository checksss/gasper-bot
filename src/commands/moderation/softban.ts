import { Command } from 'discord-akairo';
import {
    GuildMember,
    Message,
    MessageEmbed,
    TextChannel,
    User,
    NewsChannel
} from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import ms from 'ms';
import { Channel } from 'discord.js';
import botConfig from '../../config/botConfig';
import { Argument } from 'discord-akairo';
import { AkairoClient } from 'discord-akairo';
import wh from '../../structures/webHook'

export default class SoftbanCommand extends Command {
    public constructor() {
        super('softban', {
            aliases: ['softban'],
            description: {
                content: 'Bans a member temporary.\nYou can specifiy the time the user should be banned with\n`t=`, `time=` (default/minimum is 10s)\nand the amout of days to delete messages with\n`d=`, `days=`, `delete=`, `remove=`, `del=`, `rm=` (default is 7 days, max 14)',
                usage: '<member> [days] [time] [reason]',
                examples: ['@overtroll#1234 t=5m', 'soupguy t=3d annoying', '@spambot#1337 t=5d d=7 spamming'],
            },
            category: 'Moderation',
            clientPermissions: ['BAN_MEMBERS', 'MANAGE_WEBHOOKS'],
            args: [
                {
                    id: 'user',
                    type: 'user',
                    prompt: {
                        start: (message: Message): string => `${message.author}, who would you like to ban?`,
                        retry: (message: Message): string => `${message.author}, please provide a valid user.`,
                        retries: 2
                    }
                },
                {
                    id: 'time',
                    type: Argument.union('string', async (_, phrase) => {
                        if (ms(phrase) < 10000) {
                            await _.reply('you provided an invalid time value.\n*I\'ll use default **(10s)***.')
                            return null;
                        } else {
                            return phrase;
                        }
                    }),
                    match: 'option',
                    flag: ['time=', 't='],
                    default: '10s'
                },
                {
                    id: 'days',
                    type: 'number',
                    match: 'option',
                    flag: ['delete=', 'remove=', 'del=', 'rm=', 'days=', 'd='],
                    default: 7
                },
                {
                    id: 'reason',
                    match: 'rest',
                    default: ''
                }
            ],
        });
    }

    public async exec(message: Message, { user, reason, days, time }: { user: User, reason: string, days: number, time: string }): Promise<Message | Message[]> {
        if (message.deletable && !message.deleted) message.delete();
        if (message.deletable && !message.deleted) await message.delete();
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        const owners: string[] = this.client.ownerID as string[];

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
        owners
            .forEach(o => {
                if (!moderators.includes(o)) {
                    moderators.push(o);
                }
            })

        const clientMember = message.guild!.me!;
        const authorMember = await message.guild!.members.fetch(message.author!.id);

        const isMember = message.guild.members.cache.has(user.id) ? true : false;

        if (!clientMember.permissions.has('BAN_MEMBERS')) return message.util!.reply('I\'m not allowed to ban members.');

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0) return message.util!.reply('only moderators can ban members.');

        if (user.id === clientMember.user.id) return message.util!.reply('you can\'t ban me.');
        if (message.author!.id === user.id) return message.util!.reply('you can\'t ban yourself.');

        var member: GuildMember;
        if (isMember === true) {
            member = message.guild.members.cache.get(user.id);
            if (member.roles.highest.position >= authorMember!.roles.highest.position && message.author.id != guildOwner.id) return message.util!.reply('you can\'t ban members with roles equal to or higher than you.');
            if (member.roles.highest.position >= clientMember.roles.highest.position) return message.util!.reply(`my highest role is equal to or lower than \`${user.tag}\`'s highest role.`);
            if (!member.bannable) return message.util!.send(`\`${user.tag}\` isn't bannable for some reason.`);
        }

        days = days > 14 ? 14 : days;

        let msg = await message.util!.send(`Are you sure you want to softban \`${user.tag}\`? Y/N`);
        const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
        if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
        const response = responses.first();
        if (response.deletable && !response.deleted) response.delete();

        if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
            msg.edit(`Banning **${user.tag}**`);
        } else {
            return message.util!.reply('ban cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
        }

        if (this.client.ownerID.includes(user.id) || this.client.ownerID === user.id) {
            let ownerMsg = await user.send(`Do you agree to get temporary banned by \`${message.member.user.tag} | (${message.member.id})\`? Y/N`);
            const responses = await ownerMsg.channel.awaitMessages((r: Message) => r.author!.id === user.id, { max: 1, time: 30000 });
            if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
            const response = responses.first();

            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                ownerMsg.edit(`Ok, you'll get temporary banned now from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\``);
            } else {
                return message.util!.reply('tempban cancelled by Bot-Owner.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }
        }


        try {
            await user.send(stripIndents`
                **You have been temporary banned from ${this.client.ownerID.includes(user.id) || this.client.ownerID === user.id ? `from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}
                **Time:** ${ms(ms(time))}
                You can appeal your tempban by DMing \`${guildOwner.tag}\``)
            await member.ban({ reason: `${reason} || Temporary banned by ${authorMember!.user.tag}`, days: days })
        } catch {
            try {
                await message.guild!.members.ban(user, { reason: `${reason} || Temporary banned by ${message.author.tag}`, days: days });
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
            const embed = new MessageEmbed({
                color: clientMember.displayHexColor,
                author: {
                    name: `${user.tag} (${user.id})`,
                    icon_url: user.displayAvatarURL()
                },
                description: stripIndents`
                **Action**: Softban/Tempban
                **Reason:** ${reason ? reason : 'No reason'}
                **Duration:** ${ms(ms(time))}
                **Messages deleted:** ${days > 0 ? `last ${days} ${days > 1 ? 'days' : 'day'}` : 'No messages deleted'}
            `,
                footer: {
                    text: `Member Banned by ${authorMember.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
                }
            })

            let webhook = await wh.get('infractions-log', this.client.user, logchannel as TextChannel);
            if (!webhook) {
                webhook = await wh.create('infractions-log', this.client.user, logchannel as TextChannel);
            }
            wh.send(webhook, message.guild, this.client.user, embed);
        }

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });




        await msg.edit(`Successfully banned **${user.tag}** temporary for ${ms(ms(time))}`);

        //@ts-ignore
        let sbts: string[] = await this.client.infractions.get(user!, `softbans.${message.guild.id}.timestamp`, []);
        //@ts-ignore
        let sbd: string[] = await this.client.infractions.get(user!, `softbans.${message.guild.id}.duration`, []);
        //@ts-ignore
        let sbr: string[] = await this.client.infractions.get(user!, `softbans.${message.guild.id}.reason`, []);

        sbts.push(`${Date.now()}`);
        sbd.push(`${ms(time)}`);
        sbr.push(`${reason}`);

        //@ts-ignore
        this.client.infractions.set(user!, `softbans.${message.guild.id}.timestamp`, sbts);
        //@ts-ignore
        this.client.infractions.set(user!, `softbans.${message.guild.id}.duration`, sbd);
        //@ts-ignore
        this.client.infractions.set(user!, `softbans.${message.guild.id}.reason`, sbr);

        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}
