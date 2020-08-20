import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class KillCommand extends Command {
	public constructor() {
		super('kill', {
			aliases: ['kill', 'destroy', 'off', 'exit'],
			category: 'Dev',
			ownerOnly: true,
			description: {
				content: 'Kill this instance.',
				usages: 'kill',
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

		return message.util.reply('Ok..').then(async (m) => {
			try {
				await m.delete({
					timeout: 5000,
					reason: 'Leave no trace...',
				});
				return process.exit();
			} catch (e) {
				console.log(e);
			}
		});
	}
}
