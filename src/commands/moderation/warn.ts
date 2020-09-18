import { Command } from 'discord-akairo';
import { 
    Message, 
    GuildMember, 
    MessageEmbed, 
    TextChannel, 
    NewsChannel
} from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import { owners } from '../../config';
import wh from '../../structures/webHook'

export default class WarnCommand extends Command {
    public constructor() {
        super('warn', {
            aliases: ['warn', 'w'],
            category: 'Moderation',
            channel: 'guild',
            clientPermissions: ['MANAGE_WEBHOOKS'],
            description: {
                content: stripIndents`
                Warn a member.
                Optionally you can remove a specified amount of warns from a member with the
                \`-r\`-flag and the amount of warns to remove.`,
                usage: '<member> [reason]',
                examples: [
                    '@Pleberino#1234',
                    'plebboy trolling',
                    '@Casual#4321 -r 2'
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
                    id: 'remove',
                    type: 'number',
                    match: 'option',
                    flag: '-r '
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

    public async exec(message: Message, { member, remove, reason }: { member: GuildMember, remove: number, reason: string }): Promise<Message> {
        if (message.deletable && !message.deleted) await message.delete();
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

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0 && message.author.id != this.client.ownerID) return message.util!.reply('You\'re not allowed to manage warns.');

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== guildOwner.id) {
            return message.util.reply("This member's roles are higher or equal than yours!");
        }


        if (remove != 0 && remove != null && remove <= 1) {
            let msg = await message.util!.reply(`Are you sure you want to unwarn \`${member.user.tag}\` and remove ${remove} warns from them? Y/N`);
            const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
            if (!responses || responses.size < 1) return msg.edit('Request timed out.');
            const response = responses.first();
            if (response.deletable && !response.deleted) response.delete();

            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                msg.edit(`Unwarning **${member.user.tag}**`);
            } else {
                return msg.edit('unwarn cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }

            try {
                await member.user.send(stripIndents`
                    **You have been unwarned on ${this.client.ownerID.includes(member.user.id) || this.client.ownerID === member.user.id ? `from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                    ${reason ? `\n**Reason:** ${reason}\n` : ''}
                    **Warns removed:** ${remove}`)
            } catch (error) {
                return msg.edit(`Ooops! Something went wrong:\n\`\`\`${error}\`\`\`.`);
            }

            let now: moment.Moment = moment.utc(Date.now());
            let nowDay: string = now.format('DD');

            //@ts-ignore
            const modLog = await this.client.guildsettings.get(message.guild!, 'config.warn_logchannel', '');
            const logchannel = message.guild.channels.cache.get(modLog);

            //@ts-ignore
            let count: number = await this.client.infractions.get(member.user, `warns.${message.guild.id}.count`, 0);
            if (count < remove && count != 0) {
                remove = count;
            } else if (count === 0) {
                return msg.edit(`\`${member.user.tag}\` doesn't have any warns yet.`).then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }
            //@ts-ignore
            await this.client.infractions.set(member.user, `warns.${message.guild.id}.count`, count - remove);

            //@ts-ignore
            let reasons: string[] = await this.client.infractions.get(member.user, `warns.${message.guild.id}.reasons`, []);
            if (!reasons.includes(reason))
                reasons = reasons.concat(reason);
            //@ts-ignore
            await this.client.infractions.set(member.user, `warns.${message.guild.id}.reasons`, reasons);

            if (message.guild.channels.cache.has(modLog)) {
                const embed = new MessageEmbed({
                    color: message.guild.me.displayHexColor,
                    author: {
                        name: `${member.user.tag} (${member.user.id})`,
                        icon_url: member.user.displayAvatarURL()
                    },
                    description: stripIndents`
                    **Action**: Unwarn
                    **Reason:** ${reason ? reason : 'No reason'}
                    **Old Count:** ${count}
                    **New Count:** ${count - remove}
            `,
                    footer: {
                        text: `Member Unwarned by ${authorMember.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
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

            await msg.edit(`Successfully warned **${member.user.tag}**`);
            return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
        } else {
            let msg = await message.util!.send(`Are you sure you want to warn \`${member.user.tag}\`? Y/N`);
            const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
            if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
            const response = responses.first();
            if (response.deletable && !response.deleted) response.delete();

            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                msg.edit(`Warning **${member.user.tag}**`);
            } else {
                return message.util!.reply('warn cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }

            try {
                await member.user.send(stripIndents`
                    **You have been warned on ${this.client.ownerID.includes(member.user.id) || this.client.ownerID === member.user.id ? `from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                    ${reason ? `\n**Reason:** ${reason}\n` : ''}
                    You can appeal your warn by DMing \`${guildOwner.tag}\``)
            } catch (error) {
                return message.util!.reply(`Ooops! Something went wrong:\n\`\`\`${error}\`\`\`.`);
            }

            let now: moment.Moment = moment.utc(Date.now());
            let nowDay: string = now.format('DD');

            //@ts-ignore
            const modLog = await this.client.guildsettings.get(message.guild!, 'config.warn_logchannel', '');
            const logchannel = message.guild.channels.cache.get(modLog);

            //@ts-ignore
            let count: number = await this.client.infractions.get(member.user, `warns.${message.guild.id}.count`, 0);
            //@ts-ignore
            await this.client.infractions.set(member.user, `warns.${message.guild.id}.count`, count + 1);
            //@ts-ignore
            let mods: string[] = await this.client.infractions.get(member.user, `warns.${message.guild.id}.moderators`, []);
            if (!mods.includes(message.author.id))
                mods = mods.concat(message.author.id);
            //@ts-ignore
            await this.client.infractions.set(member.user, `warns.${message.guild.id}.moderators`, mods);
            //@ts-ignore
            let reasons: string[] = await this.client.infractions.get(member.user, `warns.${message.guild.id}.reasons`, []);
            if (!reasons.includes(reason))
                reasons = reasons.concat(reason);
            //@ts-ignore
            await this.client.infractions.set(member.user, `warns.${message.guild.id}.reasons`, reasons);

            if (message.guild.channels.cache.has(modLog)) {
                const embed = new MessageEmbed({
                    color: message.guild.me.displayHexColor,
                    author: {
                        name: `${member.user.tag} (${member.user.id})`,
                        icon_url: member.user.displayAvatarURL()
                    },
                    description: stripIndents`
                    **Action**: Warn
                    **Reason:** ${reason ? reason : 'No reason'}
                    **Count:** ${count + 1}
            `,
                    footer: {
                        text: `Member Warned by ${authorMember.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
                    }
                })

                let webhook = await wh.get('warn', this.client.user, logchannel as TextChannel);
                if(!webhook) {
                    webhook = await wh.create('warn', this.client.user, logchannel as TextChannel);
                }
                wh.send(webhook, message.guild, this.client.user, embed);
            }

            message.channel.messages.fetch({ limit: 20 })
                .then((msgs) => {
                    let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                    (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
                });

            await msg.edit(`Successfully warned **${member.user.tag}**`);
            return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
        }
    }
}