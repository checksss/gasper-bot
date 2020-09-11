import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class PingCommand extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping'],
			category: 'Util',
			description: {
				content: 'check the ping of the latency to the API.',
				usages: 'ping',
			},
			ratelimit: 3,
		});
	}

	public async exec(message: Message) {
		const sent = await message.util.reply('Pong!');
		const timeDiff = (sent.editedTimestamp || sent.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp);
		return message.util.reply([
			'Pong!',
			`*response time*: ${timeDiff} ms`,
			`*ping*: ${Math.round(this.client.ws.ping)} ms`
		]);
	}
}
