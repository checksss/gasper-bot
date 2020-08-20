import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { User } from 'discord.js';

export default class BlacklistCommand extends Command {
	public constructor() {
		super('blacklist', {
			aliases: ['blacklist', 'black', 'bl'],
			category: 'Dev',
			ownerOnly: true,
			description: {
				content: 'blacklist user',
				examples: ['234566453434'],
				usages: 'blaklist [user ID]',
				ownerOnly: true
			},
			ratelimit: 3,
			args: [
				{
					id: 'user',
					match: 'content',
					type: 'user',
					prompt: {
						start: (message: Message) =>
							`${message.author}, which user do you want to set to the blacklist?`,
						retry: (message: Message) =>
							`${message.author}, please provide a **valid** user.`,
						retries: 2
					},
				},
			],
		});
	}

	public exec(message: Message, { user }: { user: User }): any {
		message.delete().catch(e => {
			if (e) console.log(e.stack);
		});
		//@ts-ignore
		let list = this.client.guildsettings.get('global', 'users.blacklisted', []);

		if (list.includes(user.id)) {
			list.splice(list.indexOf(user.id), 1);
			//@ts-ignore
			this.client.guildsettings.get('global', 'users.blacklisted', list);

			message.channel.messages.fetch({ limit: 20 })
				.then((msgs) => {
					let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
					message.channel.bulkDelete(messages)
				});

			return message.util
				.reply(`you removed \`${user.tag}\` from blacklist!`)
				.then((msg) => {
					(msg as Message)
						.delete({ timeout: 10000, reason: 'saving some space...' })
						.catch((e) => {
							if (e) console.log(e);
						});
				})
				.catch((e) => {
					if (e) console.log(e);
				});
		} else {
			list.push(user.id);
			//@ts-ignore
			this.client.guildsettings.set('global', 'users.blacklisted', list);

			message.channel.messages.fetch({ limit: 20 })
				.then((msgs) => {
					let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
					message.channel.bulkDelete(messages)
				});

			return message.util
				.reply(`you successfully added \`${user.tag}\`to the blacklist!`)
				.then((msg) => {
					(msg as Message)
						.delete({ timeout: 10000, reason: 'saving some space...' })
						.catch((e) => {
							if (e) console.log(e);
						});
				})
				.catch((e) => {
					if (e) console.log(e);
				});
		}
	}
}
