import { Listener } from "discord-akairo";
import { Message, TextChannel, PartialMessage } from "discord.js";
import MessageLogger from '../../logger/Messagelog';
import { defaultPrefix } from '../../config';

export default class MessageDeleteListener extends Listener {
    public constructor() {
        super('messageDelete', {
            emitter: 'client',
            event: 'messageDelete',
            category: 'client',
        });
    }

    public async exec(message: Message | PartialMessage): Promise<any> {
        //@ts-ignore
        const userprefixes: string[] = this.client.usersettings.get(message.author, 'config.prefixes', [defaultPrefix]);
        //@ts-ignore
        const guildprefix: string = this.client.guildsettings.get(message.guild, 'config.prefix', defaultPrefix);
        const prefixarray: string[] = userprefixes.length > 0 ? userprefixes.concat(guildprefix) : [guildprefix];

        if (message.author.bot || !message.guild) return;

        prefixarray.forEach(pfx => {
            if (message.content.startsWith(pfx))
                return;
        })

        //@ts-ignore
        const logchannel = this.client.guildsettings.get(message.guild, 'config.message_delete_logchannel', '');
        const msglog = message.guild.channels.cache.get(logchannel) as TextChannel;

        if (msglog && msglog != null && !message.content.startsWith(guildprefix)) {
            return MessageLogger.onDelete(message, msglog)
        }
    }
}