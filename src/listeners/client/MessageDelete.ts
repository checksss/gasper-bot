import { Listener } from "discord-akairo";
import { Message, TextChannel, PartialMessage } from "discord.js";
import MessageLogger from '../../logger/Messagelog';
import botConfig from '../../config/botConfig';

export default class MessageDeleteListener extends Listener {
    public constructor() {
        super('messageDelete', {
            emitter: 'client',
            event: 'messageDelete',
            category: 'client',
        });
    }

    public async exec(message: Message | PartialMessage): Promise<any> {
        if (!message.guild) return;
        //@ts-ignore
        const userprefixes: string[] = this.client.usersettings.get(message.author, 'config.prefixes', [botConfig.botDefaultPrefix]);
        //@ts-ignore
        const guildprefix: string = this.client.guildsettings.get(message.guild, 'config.prefix', botConfig.botDefaultPrefix);

        let n: number = 0;

        let prefixArr: string[] = userprefixes.concat(guildprefix);
        for (const p in prefixArr) {
            if (message.content.startsWith(p)) n++;
        }

        if (message.author.bot || !message.guild) return;

        //@ts-ignore
        const logchannel = this.client.guildsettings.get(message.guild, 'config.message_delete_logchannel', '');
        const msglog = this.client.channels.cache.get(logchannel) as TextChannel;

        if (msglog && msglog != null && n === 0) {
            return MessageLogger.onDelete(message, msglog)
        }
    }
}