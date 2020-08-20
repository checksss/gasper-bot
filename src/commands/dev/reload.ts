import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class ReloadCommand extends Command {
    public constructor() {
        super('reload', {
            aliases: ['reload'],
            description: {
                content: 'Reloads all commands, inhibitors, listeners, and settings.',
                ownerOnly: true,
            },
            category: 'Dev',
            ownerOnly: true
        });
    }

    public async exec(message: Message): Promise<void> {
        //@ts-ignore
        await this.client.commandHandler.reloadAll();
        //@ts-ignore
        await this.client.inhibitorHandler.reloadAll();
        //@ts-ignore
        await this.client.listenerHandler.reloadAll();

        message.util!.send('Sucessfully reloaded.').then((m: Message): void => {
            if (m.deletable && !m.deleted) m.delete({ timeout: 3000 });
            if (message.deletable && !message.deleted) message.delete({ timeout: 3000 });
        });

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                message.channel.bulkDelete(messages)
            });

    }
}