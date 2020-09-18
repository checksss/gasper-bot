import { Command } from 'discord-akairo';
import {
    Message,
    GuildMember,
    MessageEmbed,
    TextChannel,
    NewsChannel,
    Role
} from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import { owners } from '../../config';
import ms from 'ms';
import wh from '../../structures/webHook';

export default class MuteCommand extends Command {
    public constructor() {
        super('mute', {
            aliases: ['mute', 'm'],
            category: 'Moderation',
            channel: 'guild',
            description: {
                content: stripIndents`
                Mute a member.
                Optionally you can set a duration time with the
                \`t=\`-flag and the time.

                *Note: time is always a number and the unit
                e.g. 5m (5 minutes)
                ms = milliseconds
                s = seconds
                m = minutes
                h = hours
                d = days*`,
                usage: '<member> [reason]',
                examples: [
                    '@Pleberino#1234',
                    'plebboy trolling',
                    '@Casual#4321 t=2d'
                ]
            },
            ratelimit: 3,
            args: [
                {
                    id: 'member',
                    type: 'member',
                    prompt: {
                        start: (message: Message) => `${message.author}, who do you want to warn?`,
                        retry: (message: Message) => `${message.author}, you must provide a valid member!`,
                        retries: 2
                    }
                },
                {
                    id: 'time',
                    type: 'string',
                    match: 'option',
                    flag: ['t=', 'time='],
                    default: 0
                },
                {
                    id: 'reason',
                    type: 'string',
                    match: 'rest',
                    default: 'No reason given.'
                }
            ]
        });
    }

    public async exec(message: Message, { member, time, reason }: { member: GuildMember, time: string, reason: string }): Promise<Message> {
        if (message.deletable && !message.deleted) message.delete();
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);

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

        const clientMember = message.guild!.me!;
        const authorMember = await message.guild!.members.fetch(message.author!.id);

        const isMember = message.guild.members.cache.has(member.id);

        if (!clientMember.permissions.has('MANAGE_ROLES')) return message.util!.reply('I\'m not allowed to mute members.');

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0) return message.util!.reply('only moderators can mute members.');

        if (member.id === clientMember.user.id) return message.util!.reply('you can\'t mute me.');
        if (message.author!.id === member.id) return message.util!.reply('you can\'t mute yourself.');

        var member: GuildMember;
        if (isMember) {
            member = message.guild.members.cache.get(member.id);
            if (member.roles.highest.position >= authorMember!.roles.highest.position && message.author.id != guildOwner.id) return message.util!.reply('you can\'t mute members with roles equal to or higher than you.');
            if (member.roles.highest.position >= clientMember.roles.highest.position) return message.util!.reply(`my highest role is equal to or lower than \`${member.user.tag}\`'s highest role.`);
        }

        //@ts-ignore
        let muteroleID: string = this.client.guildsettings.get(message.guild!, `config.mute-role`, '');
        let muterole: Role = await message.guild.roles.fetch(muteroleID);
        if (!muterole) {
            muterole = await message.guild.roles.create({
                data: {
                    name: 'muted',
                    hoist: false,
                    mentionable: false
                },
                reason: `Auto-Created mute-role by ${authorMember.user.tag}`
            })
            await muterole.setPosition(message.guild.me.roles.highest.position - 1);
            message.guild.channels.cache.forEach(async c => {
                await c.overwritePermissions([
                    {
                        type: 'role',
                        id: muterole.id,
                        deny: [
                            'CREATE_INSTANT_INVITE',
                            'CONNECT',
                            'SEND_MESSAGES',
                            'SEND_TTS_MESSAGES',
                            'ADD_REACTIONS',
                            'ATTACH_FILES',
                            'DEAFEN_MEMBERS',
                            'EMBED_LINKS',
                            'MANAGE_MESSAGES',
                            'MANAGE_WEBHOOKS',
                            'PRIORITY_SPEAKER',
                            'MUTE_MEMBERS',
                            'DEAFEN_MEMBERS',
                            'MOVE_MEMBERS',
                            'USE_VAD',
                            'VIEW_CHANNEL',
                            'SPEAK',
                            'READ_MESSAGE_HISTORY',
                            'MENTION_EVERYONE',
                            'USE_EXTERNAL_EMOJIS',
                            'MANAGE_CHANNELS',
                            'MANAGE_ROLES'
                        ]
                    }
                ])
            })
            //@ts-ignore
            await this.client.guildsettings.set(message.guild!, `config.mute-role`, muterole.id);
        }

        let msg = await message.util!.send(`Are you sure you want to mute${ms(time) > 0 ? ` for ${ms(ms(time))}` : ''} \`${member.user.tag}\`? Y/N`);
        const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
        if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
        const response = responses.first();
        if (response.deletable && !response.deleted) response.delete();

        if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
            msg.edit(`Muting **${member.user.tag}**`);
        } else {
            return message.util!.reply('mute cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
        }

        if (this.client.ownerID.includes(member.id) || this.client.ownerID === member.id) {
            let ownerMsg = await member.send(`Do you agree to get ${ms(time) > 0 ? 'temporary ' : ''}muted by \`${message.member.user.tag} | (${message.member.id})\`? Y/N`);
            const responses = await ownerMsg.channel.awaitMessages((r: Message) => r.author!.id === member.id, { max: 1, time: 30000 });
            if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
            const response = responses.first();

            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                ownerMsg.edit(`Ok, you'll get ${ms(time) > 0 ? 'temporary ' : ''}muted now from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\``);
            } else {
                return message.util!.reply('mute cancelled by Bot-Owner.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }
        }


        try {
            await member.send(stripIndents`
                **You have been ${ms(time) > 0 ? 'temporary ' : ''}muted from ${this.client.ownerID.includes(member.id) || this.client.ownerID === member.id ? `from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}${ms(time) > 0 ? stripIndents`
                **Duration:** ${ms(ms(time))}` : ''}

                You can appeal your mute by DMing \`${guildOwner.tag}\``)
            let rolesAr: string[] = []
            member.roles.cache.forEach(async r => {
                rolesAr.push(r.id);

            })
            await member.roles.remove(rolesAr, `Got ${ms(time) > 0 ? `temporary (${ms(ms(time))}) ` : ''}muted by \`${message.member.user.tag} | (${message.member.id})`);
            //@ts-ignore
            this.client.infractions.set(member.user!, `mutes.${message.guild.id}.roles_before`, rolesAr);
            await member.roles.add(muterole);
        } catch {
            try {
                let rolesAr: string[] = []
                member.roles.cache.forEach(async r => {
                    if (r.id !== message.guild.id)
                        rolesAr.push(r.id);
                })
                await member.roles.remove(rolesAr, `Got ${ms(time) > 0 ? `temporary (${ms(ms(time))}) ` : ''}muted by \`${message.member.user.tag} | (${message.member.id})`);
                //@ts-ignore
                this.client.infractions.set(member.user!, `mutes.${message.guild.id}.roles_before`, rolesAr);
                await member.roles.add(muterole);
            } catch (error) {
                return message.util!.reply(`Ooops! Something went wrong:\n\`\`\`${error}\`\`\`.`);
            }
        }

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        //@ts-ignore
        const modLog = await this.client.guildsettings.get(message.guild!, 'config.mute_logchannel', '');
        const logchannel = message.guild.channels.cache.get(modLog);

        if (message.guild.channels.cache.has(modLog)) {
            const embed = new MessageEmbed({
                color: clientMember.displayHexColor,
                author: {
                    name: `${member.user.tag} (${member.id})`,
                    icon_url: member.user.displayAvatarURL()
                },
                description: stripIndents`
                **Action**: Mute/Tempmute
                **Reason:** ${reason ? reason : 'No reason'}${ms(time) > 0 ? `
                **Duration:** ${ms(ms(time))}` : ''}
            `,
                footer: {
                    text: `Member muted by ${authorMember.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
                }
            })

            let webhook = await wh.get('mute', this.client.user, logchannel as TextChannel);
            if(!webhook) {
                webhook = await wh.create('mute', this.client.user, logchannel as TextChannel);
            }
            wh.send(webhook, message.guild, this.client.user, embed);
        }

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });




        await msg.edit(`Successfully muted **${member.user.tag}**${ms(time) > 0 ? ` for ${ms(ms(time))}` : ''}`);

        //@ts-ignore
        let sbts: string[] = await this.client.infractions.get(member.user!, `mutes.${message.guild.id}.timestamp`, []);
        //@ts-ignore
        let sbd: string[] = await this.client.infractions.get(member.user!, `mutes.${message.guild.id}.duration`, []);
        //@ts-ignore
        let sbr: string[] = await this.client.infractions.get(member.user!, `mutes.${message.guild.id}.reason`, []);

        sbts.push(`${Date.now()}`);
        sbd.push(`${ms(time)}`);
        sbr.push(`${reason}`);

        //@ts-ignore
        this.client.infractions.set(member.user!, `mutes.${message.guild.id}.timestamp`, sbts);
        //@ts-ignore
        this.client.infractions.set(member.user!, `mutes.${message.guild.id}.duration`, sbd);
        //@ts-ignore
        this.client.infractions.set(member.user!, `mutes.${message.guild.id}.reason`, sbr);

        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}

