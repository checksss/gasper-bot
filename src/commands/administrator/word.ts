import { Command, Flag } from 'discord-akairo';
import { Message } from 'discord.js';

export default class WordCommand extends Command {
	public constructor() {
		super('word', {
			aliases: ['word', 'words'],
			category: 'Administrator',
			description: {
				content: 'Add/Remove words from filter',
				examples: ['add swear', 'del swear'],
				usages: 'word <add/del> <value>',
			},
			channel: 'guild',
			userPermissions: ['ADMINISTRATOR'],
			clientPermissions: ['MANAGE_MESSAGES'],
			ratelimit: 3,
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['word-add', 'add', '+'],
				['word-del', 'del', 'rm', 'remove', '-'],
			],
			otherwise: (message: Message): string => {
				//@ts-ignore
				const prefix = this.handler.prefix(message);
				return `Use \`${prefix}word add swear\` or \`${prefix}word del swear\``;
			},
		};

		return Flag.continue(method);
	}
}
