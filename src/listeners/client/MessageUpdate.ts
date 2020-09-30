import { Listener } from "discord-akairo";
import { Message, TextChannel, User, GuildMember, MessageEmbed } from "discord.js";
import MessageLogger from '../../logger/Messagelog';
import wordFilters from '../../structures/wordFilter';
import botConfig from '../../config/botConfig';
import wh from "../../structures/webHook";

export default class MessageUpdateListener extends Listener {
    public constructor() {
        super('messageUpdate', {
            emitter: 'client',
            event: 'messageUpdate',
            category: 'client',
        });
    }

    public async exec(oldMessage: Message, newMessage: Message): Promise<any> {

        const mentioned: User[] = newMessage.mentions.users.array();
        const devIDs: string[] = this.client.ownerID as string[];

        devIDs.forEach(async d => {
            let dev: User = this.client.users.cache.get(d);
            let devMember: GuildMember = newMessage.guild.members.cache.get(d);
            if (mentioned.filter(m => m.id === d).length > 0) {
                //@ts-ignore
                var awayStatus: boolean = this.client.guildsettings.get('global', `away.${d}.status`, false);
                //@ts-ignore
                var awayReason: string = this.client.guildsettings.get('global', `away.${d}.reason`, '');
                //@ts-ignore
                var missedUsers: string[] = this.client.guildsettings.get('global', `away.${d}.missed_users`, []);

                switch (awayStatus) {
                    case true:
                        if (!missedUsers.includes(newMessage.author.id)) {
                            missedUsers.push(newMessage.author.id);
                            //@ts-ignore
                            this.client.guildsettings.set('global', `away.${d}.missed_users`, missedUsers);
                        }

                        let embed = new MessageEmbed({
                            title: '[AWAY]',
                            description: await wh.sensitivePatterns(awayReason, this.client, newMessage),
                            footer: {
                                text: `${dev.tag} is currently away!`,
                                icon_url: dev.displayAvatarURL({ format: 'png', dynamic: true })
                            },
                            color: devMember.displayHexColor
                        })

                        let hook = await wh.get('awaymessage', this.client.user, newMessage.channel as TextChannel)
                        return await wh.send(hook, newMessage.guild, this.client.user, embed, {
                            username: devMember.displayName,
                            avatarURL: dev.displayAvatarURL({ format: 'png', dynamic: true })
                        })
                            .then(async w => {
                                return await w.delete({ timeout: 5000 })
                                    .catch()
                            })
                            .catch();
                    default:
                        break;
                }
            }
        })

        //@ts-ignore
        const userprefixes: string[] = this.client.usersettings.get(newMessage.author, 'config.prefixes', [botConfig.botDefaultPrefix]);
        //@ts-ignore
        const guildprefix: string = this.client.guildsettings.get(newMessage.guild, 'config.prefix', botConfig.botDefaultPrefix);

        let n: number = 0;

        let prefixArr: string[] = userprefixes.concat(guildprefix);
        for (const p in prefixArr) {
            if (oldMessage.content.startsWith(p)) n++;
            if (newMessage.content.startsWith(p)) n++;
        }

        const answersArray: string[] = ['hey there!', 'you called me?', 'you mentioned me?', 'how can i help you?', 'what\'s up?', 'need help?', 'ok.', 'forgot my prefix?'];
        var randomAnswers: number = Math.floor(Math.random() * answersArray.length);
        var answer: string = answersArray[randomAnswers];

        if (newMessage.author.bot || !newMessage.guild) return;

        if (newMessage.mentions.users.first() === this.client.user) {

            return newMessage.reply(
                answer +
                '\n*my local Prefix here is:* \n`' +
                //@ts-ignore
                guildprefix +
                '`' +
                `${userprefixes.length >= 1 ? `\n\n*your global Prefixes are:* \n${botConfig.botDefaultPrefix}${userprefixes.filter((p) => p !== botConfig.botDefaultPrefix).map((pfx) => `\n- \`${pfx}\``).join(' ')}` : ''}`
            ).then(sent => {
                if (sent.deletable && !sent.deleted) {
                    sent.delete({ timeout: 5000, reason: 'keeping chat clean!' }).catch(e => { if (e) console.log(e.stack) });
                }
            });
        }
        //@ts-ignore
        const logchannel = this.client.guildsettings.get(newMessage.guild, 'config.message_edit_logchannel', '');
        const msglog = this.client.channels.cache.get(logchannel) as TextChannel;

        if (msglog && msglog != null && n === 0) {
            MessageLogger.onEdit(oldMessage, newMessage, msglog)
        }

        //@ts-ignore
        let list: string[] = this.client.guildsettings.get(
            newMessage.guild,
            'moderation.filters',
            []
        );

        return wordFilters.check(this.client, newMessage, list);
    }
}