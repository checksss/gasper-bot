import { Command } from 'discord-akairo';
import {
    GuildMember,
    Message,
    MessageEmbed,
    TextChannel,
    NewsChannel
} from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import wh from '../../structures/webHook'

export default class BanCommand extends Command {
    public constructor() {
        super('kick', {
            aliases: ['kick'],
            description: {
                content: 'Kicks a mermber.',
                usage: '<member> [reason]',
                examples: ['@overtroll', '@soupguy annoying'],
            },
            category: 'Moderation',
            clientPermissions: ['KICK_MEMBERS', 'MANAGE_WEBHOOKS'],
            args: [
                {
                    id: 'member',
                    type: 'member',
                    prompt: {
                        start: (message: Message): string => `${message.author}, who would you like to ban?`,
                        retry: (message: Message): string => `${message.author}, please mention a valid member.`,
                        retries: 2
                    },
                },
                {
                    id: 'reason',
                    match: 'rest',
                    default: ''
                },
            ],
        });
    }

    public async exec(message: Message, { member, reason }: { member: GuildMember, reason: string }): Promise<Message | Message[]> {
        if (message.deletable && !message.deleted) message.delete();
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
        owners.forEach(o => {
            if (!moderators.includes(o)) {
                moderators.push(o);
            }
        })

        const clientMember = await message.guild!.members.fetch(this.client.user!.id);
        const authorMember = await message.guild!.members.fetch(message.author!.id);

        if (!clientMember.permissions.has('KICK_MEMBERS')) return message.util!.reply('I\'m not allowed to kick members.');

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        if (!moderators.includes(message.author!.id) && modrole.size == 0) return message.util!.reply('only moderators can kick members.');

        if (member.user.id === clientMember.user.id) return message.util!.reply('you can\'t kick me.');
        if (message.author!.id === member.user.id) return message.util!.reply('you can\'t kick yourself.');
        if (member.roles.highest.position >= authorMember!.roles.highest.position) return message.util!.reply('you can\'t kick members with roles equal to or higher than you.');
        if (member.roles.highest.position >= clientMember.roles.highest.position) return message.util!.reply(`my highest role is equal to or lower than ${member}'s highest role.`);
        if (!member.kickable) return message.util!.send(`${member} isn't kickable for some reason.`);

        let msg = await message.util!.send(`Are you sure you want to kick ${member}? Y/N`);
        const responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
        if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
        const response = responses.first();
        if (response.deletable && !response.deleted) response.delete();

        if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
            msg.edit(`Kicking **${member.user.tag}**`);
        } else {
            return message.util!.reply('kick cancelled.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));;
        }

        try {
            await member.send(stripIndents`
                **You have been kicked from ${message.guild!.name}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}`).catch(e => { if (e) console.log(e.stack) });
            await member.kick(`${reason} || Kicked by ${authorMember!.user.tag}`);
        } catch (error) {
            return message.util!.reply(`something went wrong: \`${error}\`.`);
        }

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        //@ts-ignore
        const modLog = await this.client.guildsettings.get(message.guild!, 'config.kick_logchannel', '');
        const logchannel = await message.guild.channels.cache.get(modLog);
        if (message.guild.channels.cache.has(modLog)) {
            const embed = new MessageEmbed()
                .setColor(clientMember.displayColor)
                .setAuthor(`${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL())
                .setDescription(stripIndents`
                    **Action**: Kick
                    **Reason:** ${reason ? reason : 'No reason'}
                `)
                .setFooter(`Member Kicked by ${authorMember.user.tag} ✧ ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`);
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


        await msg.edit(`Successfully kicked **${member.user.tag}**`);
        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}