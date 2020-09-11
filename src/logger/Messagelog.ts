import { Message } from 'discord.js';
import { MessageEmbed, TextChannel, Guild, PartialMessage } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';

export default class MessageLogger {

    public static onSend = async (msg: Message, log: TextChannel) => {

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        if (!msg.guild.me.permissions.has('EMBED_LINKS')) {
            return log.send(stripIndents`
            __**${msg.author.tag} | ${msg.member.displayName}** (${msg.author.id})__
            **New Message**
            https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}

            *#${msg.channel} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}*
            `, { split: true })
        }
        const embed = new MessageEmbed({
            color: msg.member.displayHexColor,
            author: {
                name: `${msg.author.tag} | ${msg.member.displayName} (${msg.author.id})`
            },
            title: '**New Message** | ' + msg.id,
            thumbnail: {
                url: msg.author.displayAvatarURL({ format: 'png', dynamic: true })
            },
            description: `${msg.content}\n\n**[Jump to message!](https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})**`,
            footer: {
                text: `#${(msg.channel as TextChannel).name} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                iconURL: msg.guild.me.user.displayAvatarURL({ format: 'png', dynamic: true })
            }
        });

        return log.send(embed);
    }

    public static onEdit = async (oldMsg: Message, newMsg: Message, log: TextChannel) => {

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        if (!newMsg.guild.me.permissions.has('EMBED_LINKS')) {
            return log.send(stripIndents`
            __**${oldMsg.author.tag} | ${newMsg.member.displayName}** (${oldMsg.author.id})__
            **Message edited** | ${oldMsg.id}
            __Old Content:__
            ${oldMsg.content}


            https://discord.com/channels/${newMsg.guild.id}/${newMsg.channel.id}/${newMsg.id}

            *${newMsg.channel} ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}*
            `, { split: true })
        }
        const embed = new MessageEmbed({
            author: {
                name: `${oldMsg.author.tag} | ${newMsg.member.displayName} (${oldMsg.author.id})`
            },
            title: '**Message edited** | ' + oldMsg.id,
            //color: newMsg.member.displayHexColor,
            thumbnail: {
                url: newMsg.author.displayAvatarURL({ format: 'png', dynamic: true })
            },
            description: stripIndents`
            **[Jump to message!](https://discord.com/channels/${newMsg.guild.id}/${newMsg.channel.id}/${newMsg.id})**
            `,
            fields: [
                {
                    name: "Old Content:",
                    value: oldMsg.content
                },
                {
                    name: '<:empty:744513757962829845>',
                    value: '<:empty:744513757962829845>'
                },
                {
                    name: "New Content:",
                    value: newMsg.content
                },
                {
                    name: '<:empty:744513757962829845>',
                    value: '<:empty:744513757962829845>'
                }
            ],
            footer: {
                text: `#${(newMsg.channel as TextChannel).name} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                iconURL: newMsg.guild.me.user.displayAvatarURL({ format: 'png', dynamic: true })
            }
        });
        return log.send(embed);
    }

    public static onDelete = async (msg: Message | PartialMessage, log: TextChannel) => {

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        const auditLog = await msg.guild.fetchAuditLogs({ type: 'MESSAGE_DELETE' }).then(audit => audit.entries.first());
        const executor = auditLog.executor;

        if (!msg.guild.me.permissions.has('EMBED_LINKS')) {
            return log.send(stripIndents`
            __**${msg.author.tag} | ${msg.member.displayName}** (${msg.author.id})__
            **Deleted Message** | ${msg.id}
            ${msg}


            in: ${msg.channel} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
            
            
            `, { split: true })
        }

        const embed = new MessageEmbed({
            author: {
                name: `${msg.author.tag} | ${msg.member.displayName} (${msg.author.id})`
            },
            title: '**Deleted Message** | ' + msg.id,
            color: msg.member.displayHexColor,
            thumbnail: {
                url: msg.author.displayAvatarURL({ format: 'png', dynamic: true })
            },
            description: stripIndents`
            ${msg.content}
            
            `,
            footer: {
                text: `#${(msg.channel as TextChannel).name} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                iconURL: msg.guild.me.user.displayAvatarURL({ format: 'png', dynamic: true })
            }
        });
        return log.send(embed);
    }

    public static onBulkDelete = async (guild: Guild, amount: number, log: TextChannel, channel: TextChannel) => {

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        const auditLog = await guild.fetchAuditLogs({ type: 'MESSAGE_BULK_DELETE' }).then(audit => audit.entries.first());
        const executor = auditLog.executor;
        const execMember = guild.members.cache.get(executor.id);

        if (!guild.me.permissions.has('EMBED_LINKS')) {
            return log.send(stripIndents`
            __**${executor.tag} | ${execMember.displayName}** (${executor.id})__
            **Bulk Delete**
            ${amount} ${amount > 1 ? 'Messages were' : 'Message was'} deleted
            in: ${channel}
            ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}*
            `, { split: true })
        }
        const embed = new MessageEmbed({
            color: execMember.displayHexColor,
            author: {
                name: `${executor.tag} | ${execMember.displayName} (${executor.id})`
            },
            title: '**Bulk Delete**',
            thumbnail: {
                url: executor.displayAvatarURL({ format: 'png', dynamic: true })
            },
            description: stripIndents`
            **${amount} ${amount > 1 ? 'Messages were' : 'Message was'} deleted**
            `,
            footer: {
                text: `#${channel.name} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                iconURL: guild.me.user.displayAvatarURL({ format: 'png', dynamic: true })
            }
        });
        return log.send(embed);
    }
}