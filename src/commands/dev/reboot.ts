import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class RebootCommand extends Command {
    public constructor() {
        super('reboot', {
            aliases: ['reboot', 'rb', 'restart', 'rs'],
            category: 'Dev',
            ownerOnly: true,
            description: {
                content: 'Reboot Host-Server.',
                usages: 'reboot',
                ownerOnly: true
            },
            ratelimit: 1,
        });
    }

    public async exec(message: Message) {
        await message.delete().catch(e => {
            if (e) console.log(e.stack);
        });

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                message.channel.bulkDelete(messages)
            });

        return message.util.reply('Rebooting Server').then(async (m) => {
            try {
                await m.delete({
                    timeout: 5000,
                    reason: 'Leave no trace...',
                });

                var out: string;
                var exec = require('child_process').exec;

                exec('reboot -i',
                    function (error: string, stdout: string, stderr: string) {
                        out = ('stdout: ' + stdout);
                        out = ('stderr: ' + stderr);
                        if (error !== null) {
                            message.util.reply('exec error: ' + error);
                            out = ('exec error: ' + error);
                        }
                    });
                console.log(out);
            } catch (e) {
                console.log(e);
            }
        });
    }
}