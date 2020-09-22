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
import wh from '../../structures/webHook';

export default class UnmuteCommand extends Command {
    public constructor() {
        super('unmute', {
            aliases: ['unmute', 'um'],
            category: 'Moderation',
            channel: 'guild',
            clientPermissions: ['MANAGE_ROLES', 'MANAGE_WEBHOOKS'],
            description: {
                content: `Unmute a member.`,
                usage: '<member> [reason]',
                examples: [
                    '@Pleberino#1234',
                    'plebboy lesson learned',
                    '@Casual#4321'
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
                    id: 'reason',
                    type: 'string',
                    match: 'rest',
                    default: 'No reason given.'
                }
            ]
        });
    }

    public async exec(message: Message, { member, reason }: { member: GuildMember, reason: string }): Promise<Message> {
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

        const isMember = message.guild.members.cache.has(member.id);

        if (!clientMember.permissions.has('MANAGE_ROLES')) return message.util!.reply('I\'m not allowed to unmute members.');

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0) return message.util!.reply('only moderators can unmute members.');

        if (member.id === clientMember.user.id) return message.util!.reply('you can\'t unmute me.');
        if (message.author!.id === member.id) return message.util!.reply('you can\'t unmute yourself.');

        var member: GuildMember;
        if (isMember) {
            member = message.guild.members.cache.get(member.id);
            if (member.roles.highest.position >= authorMember!.roles.highest.position && message.author.id != guildOwner.id) return message.util!.reply('you can\'t mute members with roles equal to or higher than you.');
            if (member.roles.highest.position >= clientMember.roles.highest.position) return message.util!.reply(`my highest role is equal to or lower than \`${member.user.tag}\`'s highest role.`);
        }

        //@ts-ignore
        let muteroleID: string = this.client.guildsettings.get(message.guild!, `config.mute-role`, '');
        let isMuted: boolean = member.roles.cache.has(muteroleID);
        let muterole: Role = await message.guild.roles.fetch(muteroleID);

        if (!isMuted) return message.util!.reply(`\`${member.user.tag}\` isn't muted yet.`);

        let msg = await message.util!.send(`Are you sure you want to unmute \`${member.user.tag}\`? Y/N`);
        const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
        if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
        const response = responses.first();
        if (response.deletable && !response.deleted) response.delete();

        if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
            msg.edit(`Unmuting **${member.user.tag}**`);
        } else {
            return message.util!.reply('unmute cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
        }
        try {
            await member.send(stripIndents`
                **You have been unmuted from ${this.client.ownerID.includes(member.id) || this.client.ownerID === member.id ? `**${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}`)
            //@ts-ignore
            let rolesAr: string[] = this.client.infractions.get(member.user!, `mutes.${message.guild.id}.roles_before`, []);
            await member.roles.add(rolesAr);
            await member.roles.remove(muterole, `Got umuted by \`${message.member.user.tag} | (${message.member.id})`);
            //@ts-ignore
            this.client.infractions.set(member.user!, `mutes.${message.guild.id}.roles_before`, []);
        } catch {
            try {
                //@ts-ignore
                let rolesAr: string[] = this.client.infractions.get(member.user!, `mutes.${message.guild.id}.roles_before`, []);
                await member.roles.add(rolesAr);
                await member.roles.remove(muterole, `Got umuted by \`${message.member.user.tag} | (${message.member.id})`);
                //@ts-ignore
                this.client.infractions.set(member.user!, `mutes.${message.guild.id}.roles_before`, []);
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
                **Action**: Unmute
                **Reason:** ${reason ? reason : 'No reason'}
            `,
                footer: {
                    text: `Member unmuted by ${authorMember.user.tag} ✧ ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
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

        await msg.edit(`Successfully unmuted **${member.user.tag}**`);

        //@ts-ignore
        let sbu: string[] = await client.infractions.get(u.id!, `mutes.${g.id}.unmuted_timestamp`, []);
        sbu.push(`${Date.now()}`);
        //@ts-ignore
        await client.infractions.set(u.id!, `mutes.${g.id}.unmuted_timestamp`, sbu);

        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}