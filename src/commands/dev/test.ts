import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

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
            args: [
                {
                    id: 'charCodes',
                    type: 'charCodes',
                    match: 'content'
                }
            ]
        });
    }

    public async exec(message: Message): Promise<void> {
    }
}