import { Command } from 'discord-akairo';
import { Message, MessageEmbed, Role, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';

interface Permissions {
    [key: string]: string;
}

const PERMISSIONS: Permissions = {
    ADMINISTRATOR: 'Administrator',
    VIEW_AUDIT_LOG: 'View audit log',
    MANAGE_GUILD: 'Manage server',
    MANAGE_ROLES: 'Manage roles',
    MANAGE_CHANNELS: 'Manage channels',
    KICK_MEMBERS: 'Kick members',
    BAN_MEMBERS: 'Ban members',
    CREATE_INSTANT_INVITE: 'Create instant invite',
    CHANGE_NICKNAME: 'Change nickname',
    MANAGE_NICKNAMES: 'Manage nicknames',
    MANAGE_EMOJIS: 'Manage emojis',
    MANAGE_WEBHOOKS: 'Manage webhooks',
    VIEW_CHANNEL: 'Read text channels and see voice channels',
    SEND_MESSAGES: 'Send messages',
    SEND_TTS_MESSAGES: 'Send TTS messages',
    MANAGE_MESSAGES: 'Manage messages',
    EMBED_LINKS: 'Embed links',
    ATTACH_FILES: 'Attach files',
    READ_MESSAGE_HISTORY: 'Read message history',
    MENTION_EVERYONE: 'Mention everyone',
    USE_EXTERNAL_EMOJIS: 'Use external emojis',
    ADD_REACTIONS: 'Add reactions',
    CONNECT: 'Connect',
    SPEAK: 'Speak',
    MUTE_MEMBERS: 'Mute members',
    DEAFEN_MEMBERS: 'Deafen members',
    MOVE_MEMBERS: 'Move members',
    USE_VAD: 'Use voice activity'
};

export default class RoleInfoCommand extends Command {
    public constructor() {
        super('role', {
            aliases: ['role', 'roleinfo', 'role-info'],
            description: {
                content: 'Gets info about a role.',
                usage: '[role]',
                examples: ['Admin', '@Admin']
            },
            category: 'Info',
            channel: 'guild',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'role',
                    match: 'content',
                    type: 'role',
                    default: (message: Message): Role => message.member!.roles.highest
                }
            ]
        });
    }

    public async exec(message: Message, { role }: { role: Role }): Promise<Message | Message[]> {

        let roledate: moment.Moment = moment.utc(role.createdAt);
        let dateDay: string = roledate.format('DD');

        const permissions = Object.keys(PERMISSIONS).filter(
            // @ts-ignore
            (permission): string => role.permissions.serialize()[permission]
        );
        const embed = new MessageEmbed()
            .setColor(role.color)
            .setDescription(`Info about **${role.name}** (ID: ${role.id})`)
            .addField(
                '⇒ Info',
                stripIndents`
				• Color: ${role.hexColor.toUpperCase()}
				• Hoisted: ${role.hoist ? 'Yes' : 'No'}
                • Mentionable: ${role.mentionable ? 'Yes' : 'No'}
                • Members: ${role.guild.members.cache.filter((m) => m.roles.cache.has(role.id)).size}
				• Creation Date: ${roledate.format(`${parseInt(dateDay) === 1 ? `${dateDay}[st]` : `${parseInt(dateDay) === 2 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 3 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 21 ? `${dateDay}[st]` : `${parseInt(dateDay) === 22 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 23 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 31 ? `${dateDay}[st]` : `${dateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
            `)
            .addField(
                '⇒ Permissions',
                stripIndents`
				${permissions.map((permission): string => `• ${PERMISSIONS[permission]}`).join('\n') || 'None'}
            `)
            .setThumbnail(message.guild!.iconURL()!);

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        return message.util!.send(embed);
    }
}