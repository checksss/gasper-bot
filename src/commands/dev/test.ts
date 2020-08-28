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

        let reply = await message.util!.reply('Starting test script.');

        await reply.edit('Running test script..');

        await reply.edit('Running test script....');

        await message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        return reply.edit('Done!');
    }
}