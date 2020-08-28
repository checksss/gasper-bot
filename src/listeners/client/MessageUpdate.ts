import { Listener } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import MessageLogger from '../../logger/Messagelog';
import wordFilters from '../../structures/wordFilter';
import { defaultPrefix } from '../../config';

export default class MessageUpdateListener extends Listener {
    public constructor() {
        super('messageUpdate', {
            emitter: 'client',
            event: 'messageUpdate',
            category: 'client',
        });
    }

    public async exec(oldMessage: Message, newMessage: Message): Promise<any> {
        //@ts-ignore
        const userprefixes: string[] = this.client.usersettings.get(newMessage.author, 'config.prefixes', [defaultPrefix]);
        //@ts-ignore
        const guildprefix: string = this.client.guildsettings.get(message.guild, 'config.prefix', defaultPrefix);

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
                `${userprefixes.length > 1 ? `\n\n*your global Prefixes are:* ${userprefixes.filter((p) => p !== defaultPrefix).map((pfx) => `\n- \`${pfx}\``).join(' ')}` : ''}`
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