import { AkairoClient } from 'discord-akairo';
import { Message } from 'discord.js';

export default {
	check(client: AkairoClient, message: Message, list: string[]) {
		if (message.member.permissions.has('MANAGE_MESSAGES')) return;

		let replies = [
			'you cannot say that here!',
			"don't say that!",
			'not this word, please!',
			"this word isn't allowed here!",
		];
		let rnd = Math.floor(Math.random() * replies.length);

		if (
			message.content
				.split(' ')
				.some((word) => list.includes(word.toLowerCase()))
		)
			message.delete() && message.reply(`${replies[rnd]}`);
	},
};
