import { Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

export default class BlacklistInhibitor extends Inhibitor {
	public constructor() {
		super('blacklist', {
			reason: 'blacklist',
			type: 'all',
		});
	}

	public exec(message: Message) {
		//@ts-ignore
		const list = this.client.guildsettings.get('global', 'users.blacklisted', []);

		return list.includes(message.author.id);
	}
}
