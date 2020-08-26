import { Command } from 'discord-akairo';
import { Message, GuildMember, MessageEmbed, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import { owners } from '../../config';

export default class WarnCommand extends Command {
    public constructor() {
        super('warn', {
            aliases: ['warn'],
            category: 'Moderation',
            channel: 'guild',
            description: {
                content: 'Warn a member.',
                usage: '<member> [reason]',
                examples: [
                    '@Pleberino#1234',
                    'plebboy trolling'
                ]
            },
            ratelimit: 3,
            userPermissions: ['MANAGE_MESSAGES'],
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
        if (!moderators.includes(message.author!.id) && modrole.size == 0 && message.author.id != this.client.ownerID) return message.util!.reply('You\'re not allowed to speak through me.');

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== guildOwner.id) {
            return message.util.reply("This member's roles are higher or equal than yours!");
        }


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
        const logchannel = await message.guild.channels.cache.get(modLog);

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

            await (logchannel as TextChannel).send(embed);
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