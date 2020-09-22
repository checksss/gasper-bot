import { Command, Argument } from 'discord-akairo';
import { Message, MessageEmbed, GuildMember } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';

export default class UserInfoCommand extends Command {
    public constructor() {
        super('user', {
            aliases: ['user', 'userinfo', 'user-info', 'member-info', 'memberinfo'],
            description: {
                content: 'Gets info about a member.',
                usage: '[member]',
                examples: ['Gasper', '@Gasper', '673613224389640228']
            },
            category: 'Info',
            channel: 'guild',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'member',
                    match: 'content',
                    type: 'member',
                    default: (message: Message): GuildMember => message.member!
                }
            ]
        });
    }

    public async exec(message: Message, { member }: { member: GuildMember }): Promise<Message | Message[]> {

        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);

        let adminRoles: string[] = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).map((roles): string => `${roles.id}`);
        let botOwners: string | string[] = this.client.ownerID;
        let defaultMods: string[] = adminRoles.concat(guildOwner.id);
        if (typeof botOwners === 'string') {
            defaultMods = defaultMods.concat(botOwners as string);
        } else if (botOwners instanceof Object) {
            for (var owner in botOwners) {
                defaultMods.push(owner);
            }
        }
        //@ts-ignore
        let moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', defaultMods);
        if (typeof botOwners === 'string') {
            moderators = moderators.concat(botOwners as string);
        } else if (botOwners instanceof Object) {
            for (var owner in botOwners) {
                moderators.push(owner);
            }
        }

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))

        const { user } = member;

        //@ts-ignore
        const warnCount: number = await this.client.infractions.get(member.user, `warns.${message.guild.id}.count`, 0);

        let userdate: moment.Moment = moment.utc(user.createdAt);
        let uDateDay: string = userdate.format('DD');

        let memberdate: moment.Moment = moment.utc(member.joinedAt);
        let mDateDay: string = memberdate.format('DD');

        let roleString: string = member.roles.cache.filter((r) => r.id !== message.guild.id).sort((r1, r2) => r2.comparePositionTo(r1)).map((roles): string => `\n<:empty:744513757962829845><@&${roles.id}>`).join(' ');
        let roleSize: number = member.roles.cache.filter((r) => r.id !== message.guild.id).size;

        const embed = new MessageEmbed()
            .setColor(member.displayColor)
            .setDescription(`Info about **${user.tag}** (ID: ${member.id})`)
            .addField(
                '⇒ Member Details',
                stripIndents`
                ${member.nickname == undefined ? '• No nickname' : ` • Nickname: ${member.nickname}`}
				• Roles ${roleString.length < 896 ? `(${roleSize}): ${roleString}` : `: ${roleSize}`}
                • Joined at: ${memberdate.format(`${parseInt(mDateDay) === 1 ? `${mDateDay}[st]` : `${parseInt(mDateDay) === 2 ? `${mDateDay}[nd]` : `${parseInt(mDateDay) === 3 ? `${mDateDay}[rd]` : `${parseInt(mDateDay) === 21 ? `${mDateDay}[st]` : `${parseInt(mDateDay) === 22 ? `${mDateDay}[nd]` : `${parseInt(mDateDay) === 23 ? `${mDateDay}[rd]` : `${parseInt(mDateDay) === 31 ? `${mDateDay}[st]` : `${mDateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
                ${member.guild.owner == member ? '• Server Owner' : ''}
            `)
            .addField(
                '⇒ User Details',
                stripIndents`
				• ID: ${member.id}
				• Username: ${member.user.tag}
                • Created at: ${userdate.format(`${parseInt(uDateDay) === 1 ? `${uDateDay}[st]` : `${parseInt(uDateDay) === 2 ? `${uDateDay}[nd]` : `${parseInt(uDateDay) === 3 ? `${uDateDay}[rd]` : `${parseInt(uDateDay) === 21 ? `${uDateDay}[st]` : `${parseInt(uDateDay) === 22 ? `${uDateDay}[nd]` : `${parseInt(uDateDay) === 23 ? `${uDateDay}[rd]` : `${parseInt(uDateDay) === 31 ? `${uDateDay}[st]` : `${uDateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}${user.bot ? '\n• Bot account' : ''}
				• Status: ${user.presence.status.toUpperCase()}
                • Activity: ${user.presence.activities[0] ? `${user.presence.activities[0].type}: ${user.presence.activities[0].name}` : 'None'}
                ${moderators.includes(message.author!.id) || modrole.size > 0 ? `• Warns: ${warnCount === 0 ? 'Not warned yet' : `${warnCount} ${warnCount > 1 ? 'warns' : 'warn'}`}` : ''}
            `)
            .setThumbnail(user.displayAvatarURL({ format: 'png', dynamic: true }));


        return message.util!.send(embed);
    }
}