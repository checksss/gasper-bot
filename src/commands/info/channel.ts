import { Command } from 'discord-akairo';
import { Message, MessageEmbed, GuildChannel, DMChannel, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';

export default class ChannelInfoCommand extends Command {
    public constructor() {
        super('channel', {
            aliases: ['channel', 'channelinfo', 'channel-info'],
            description: {
                content: 'Gets info about a channel',
                usage: '[channel]',
                examples: ['#general', 'general', '606069531592491050']
            },
            category: 'Info',
            channel: 'guild',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'channel',
                    match: 'content',
                    type: 'channel',
                    default: (message: Message): GuildChannel | DMChannel => message.channel
                }
            ]
        });
    }

    public async exec(message: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[]> {

        let channeldate: moment.Moment = moment.utc(channel.createdAt);
        let dateDay: string = channeldate.format('DD');

        const embed = new MessageEmbed()
            .setColor(Math.floor(Math.random() * 12777214) + 1)
            .setDescription(`Info about **${channel.name}**`)
            .addField(
                '⇒ Info',
                stripIndents`
                • Type: ${channel.type}
				• Topic: ${channel.topic ? channel.topic : 'None'}
				• NSFW: ${channel.nsfw ? 'Yes' : 'No'}
				• Creation Date: ${channeldate.format(`${parseInt(dateDay) === 1 ? `${dateDay}[st]` : `${parseInt(dateDay) === 2 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 3 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 21 ? `${dateDay}[st]` : `${parseInt(dateDay) === 22 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 23 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 31 ? `${dateDay}[st]` : `${dateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
			    `
            )
            .setThumbnail(message.guild!.iconURL()!);

        return message.util!.send(embed);
    }
}