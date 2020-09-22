import { Listener } from "discord-akairo";
import { Guild, TextChannel, Collection, Message, PartialMessage } from "discord.js";
import MessageLogger from '../../logger/Messagelog';

export default class MessageDeleteListener extends Listener {
    public constructor() {
        super('messageDeleteBulk', {
            emitter: 'client',
            event: 'messageDeleteBulk',
            category: 'client',
        });
    }

    public async exec(messages: Collection<string, Message | PartialMessage>): Promise<any> {

        const guildID: string = messages.map(msg => msg.guild.id)[0];
        const channelID: string = messages.map(msg => msg.channel.id)[0];
        const guild: Guild = this.client.guilds.cache.get(guildID);
        const channel: TextChannel = this.client.channels.cache.get(channelID) as TextChannel;

        if (!guild) return;

        const amount = messages.size;


        //@ts-ignore
        const logchannel = this.client.guildsettings.get(guild, 'config.message_delete_logchannel', '');
        const msglog = this.client.channels.cache.get(logchannel) as TextChannel;

        if (msglog && msglog != null) {
            return MessageLogger.onBulkDelete(guild, amount, msglog, channel)
        }
    }
}