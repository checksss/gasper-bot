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
import { owners } from '../../config';
import wh from '../../structures/webHook'

export default class BanCommand extends Command {
    public constructor() {
        super('ban', {
            aliases: ['ban'],
            description: {
                content: 'Bans a member.\nYou can specify the amout of days to delete messages with\n`d=`, `days=`, `delete=`, `remove=`, `del=`, `rm=` (default is 7 days, max 14)',
                usage: '<member> [d=<days>] [reason]',
                examples: ['@overtroll', '@soupguy annoying', '@spambot#1337 d=7 spamming'],
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
                    id: 'amount',
                    type: 'number',
                    match: 'option',
                    flag: ['delete=', 'remove=', 'del=', 'rm=', 'days=', 'd='],
                    default: 0
                },
                {
                    id: 'reason',
                    match: 'rest',
                    default: ''
                }
            ],
        });
    }

    public async exec(message: Message, { user, reason, amount }: { user: User, reason: string, amount: number }): Promise<Message | Message[]> {
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

        const clientMember = await message.guild!.me!;
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

        amount = amount > 14 ? 14 : amount;

        let msg = await message.util!.send(`Are you sure you want to ban \`${user.tag}\`? Y/N`);
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
            let ownerMsg = await user.send(`Do you agree to get banned by \`${message.member.user.tag} | (${message.member.id})\`? Y/N`);
            const responses = await ownerMsg.channel.awaitMessages((r: Message) => r.author!.id === user.id, { max: 1, time: 30000 });
            if (!responses || responses.size < 1) return message.util!.send('Request timed out.');
            const response = responses.first();

            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                ownerMsg.edit(`Ok, you'll get banned now from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\``);
            } else {
                return message.util!.reply('ban cancelled by Bot-Owner.').then(reply => reply.delete({ timeout: 5000, reason: 'Keep chat clean' }));
            }
        }


        try {
            await user.send(stripIndents`
                **You have been banned from ${this.client.ownerID.includes(user.id) || this.client.ownerID === user.id ? `from **${message.guild.name + ' | (' + message.guild.id})** by \`${message.member.user.tag} | (${message.member.id})\`` : `${message.guild!.name}`}**
                ${reason ? `\n**Reason:** ${reason}\n` : ''}
                You can appeal your ban by DMing \`${guildOwner.tag}\``)
            await member.ban({ reason: `${reason} || Banned by ${authorMember!.user.tag}`, days: amount })
        } catch {
            try {
                await message.guild!.members.ban(user, { reason: `${reason} || Banned by ${message.author.tag}`, days: amount });
            } catch (error) {
                return message.util!.reply(`Ooops! Something went wrong:\n\`\`\`${error}\`\`\`.`);
            }
        }

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        //@ts-ignore
        const modLog = await this.client.guildsettings.get(message.guild!, 'config.ban_logchannel', '');
        const logchannel = await message.guild.channels.cache.get(modLog);
        if (message.guild.channels.cache.has(modLog)) {
            const embed = new MessageEmbed({
                color: clientMember.displayHexColor,
                author: {
                    name: `${user.tag} (${user.id})`,
                    icon_url: user.displayAvatarURL()
                },
                description: stripIndents`
                **Action**: Ban
                **Reason:** ${reason ? reason : 'No reason'}
                **Messages deleted:** ${amount > 0 ? `last ${amount} ${amount > 1 ? 'days' : 'day'}` : 'No messages deleted'}
            `,
                footer: {
                    text: `Member Banned by ${authorMember.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`
                }
            })

            let webhook = await wh.get('ban', this.client.user, logchannel as TextChannel);
            if(!webhook) {
                webhook = await wh.create('ban', this.client.user, logchannel as TextChannel);
            }
            wh.send(webhook, message.guild, this.client.user, embed);
        }


        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });


        await msg.edit(`Successfully banned **${user.tag}**`);
        return await msg.delete({ timeout: 5000, reason: 'Keeping chat clean' });
    }
}
