import { Command } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import validator from 'validator';

export default class TestCommand extends Command {
    public constructor() {
        super('test', {
            aliases: ['test'],
            description: {
                content: 'For testing stuff.',
                ownerOnly: true,
            },
            category: 'Dev',
            ownerOnly: true,
            // args: [
            //     {
            //         id: 'charCodes',
            //         type: 'charCodes',
            //         match: 'content'
            //     }
            // ]
        });
    }

    public async exec(message: Message): Promise<Message | Message[] | void> {
        if (message.deletable && !message.deleted) message.delete();

        //@ts-ignore
        let titleRaw: string = await this.client.guildsettings.get(message.guild!, `snipbuilds.heeey.title`, 'notitle');

        message.util!.reply(titleRaw);

    }
}