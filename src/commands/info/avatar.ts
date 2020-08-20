import { Command } from 'discord-akairo';
import { Message, GuildMember, MessageEmbed, ImageSize } from 'discord.js';

export default class AvatarCommand extends Command {
    public constructor() {
        super('avatar', {
            aliases: ['avatar', 'av', 'pfp'],
            category: 'Info',
            channel: 'guild',
            ratelimit: 3,
            description: {
                content: 'Display the avatar of a member',
                usage: 'avatar <member>',
                examples: [
                    ' ',
                    '@Bruh#7665',
                    'bruh'
                ]
            },
            args: [
                {
                    id: 'member',
                    type: 'member',
                    match: 'rest',
                    default: (message: Message) => message.member
                },
                {
                    id: 'size',
                    type: (_: Message, phrase: string): null | Number => {
                        if (phrase && !isNaN(Number(phrase)) && [16, 32, 64, 128, 256, 512, 1024, 2048, 4096].includes(Number(phrase))) return Number(phrase);
                        return null;
                    },
                    match: 'option',
                    flag: ['-size='],
                    default: 2048
                }
            ]
        });
    }

    public async exec(message: Message, { member, size }: { member: GuildMember, size: number }): Promise<Message> {
        let embed = new MessageEmbed({
            title: `Avatar | ${member.user.tag}`,
            color: `${member.displayHexColor}`,
            image: {
                url: member.user.displayAvatarURL({ dynamic: true, format: 'png', size: size as ImageSize })
            },
            description: `[Download!](${member.user.displayAvatarURL({ dynamic: true, format: 'png', size: size as ImageSize })})`
        });

        return message.util!.send(embed);
    }
}