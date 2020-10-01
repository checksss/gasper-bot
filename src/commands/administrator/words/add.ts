import { Command } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import Admins from '../../../structures/Administrators';

export default class WordCommand extends Command {
	public constructor() {
		super('word-add', {
			aliases: ['word-add', 'add', '+'],
			cooldown: 6e4,
			ratelimit: 3,
			userPermissions: ['ADMINISTRATOR'],
			clientPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'word',
					type: 'string',
					match: 'rest',
					prompt: {
						start: (message: Message) =>
							`${message.author}, which word do you wnat to add to the filter?`,
					},
				},
			],
		});
	}

	public async exec(message: Message, { word }: { word: string }): Promise<any> {
		if (message.deletable && !message.deleted) message.delete();

		const authorMember = await message.guild!.members.fetch(message.author!.id);

		let isAdmin: boolean = await Admins.check(this.client, message.guild, authorMember);
		if (!isAdmin) return message.util!.reply('only administrators can use this command.');

		//@ts-ignore
		let list = this.client.guildsettings.get(
			message.guild,
			'moderation.filters',
			[]
		);

		word = word.toLowerCase();
		if (list.includes(word))
			return message.util.reply('that word is already being filtered.');

		list.push(word);

		//@ts-ignore
		this.client.guildsettings.set(message.guild, 'moderation.filters', list);

		message.channel.messages.fetch({ limit: 20 })
			.then((msgs) => {
				let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
				(message.channel as TextChannel | NewsChannel).bulkDelete(messages)
			});

		return message.util.send(
			`**${word}** has been added to this server's filter.`
		);
	}
}
