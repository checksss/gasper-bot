import { Command } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import botConfig from '../../../config/botConfig';

export default class WordCommand extends Command {
	public constructor() {
		super('word-del', {
			aliases: ['word-del', 'del', 'rm', 'remove', '-'],
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
							`${message.author}, which word do you wnat to remove from filter?`,
					},
				},
			],
		});
	}

	public async exec(message: Message, { word }: { word: string }): Promise<any> {
		const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
		const owners: string[] = this.client.ownerID as string[];
		if (message.deletable && !message.deleted) message.delete();

		let defaultAdmins: string[] = [guildOwner.id];

		for (var owner in owners) {
			defaultAdmins.push(owner);
		}

		//@ts-ignore
		let administrators: string[] = await this.client.guildsettings.get(message.guild!, 'config.administrators', defaultAdmins);
		defaultAdmins.forEach(dA => {
			if (!administrators.includes(dA)) {
				administrators = administrators.concat(dA);
			}
		})

		const authorMember = await message.guild!.members.fetch(message.author!.id);

		var adminrole = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id))
		if (!administrators.includes(message.author!.id) && adminrole.size == 0) return message.util!.reply('only administrators can use this command.');
		message.delete().catch(e => {
			if (e) console.log(e.stack);
		});
		//@ts-ignore
		let list = this.client.guildsettings.get(
			message.guild,
			'moderation.filters',
			[]
		);

		word = word.toLowerCase();
		if (!list.includes(word))
			return message.util.reply('that word is not being filtered.');

		list.splice(list.indexOf(word), 1);

		//@ts-ignore
		this.client.guildsettings.set(message.guild, 'moderation.filters', list);

		message.channel.messages.fetch({ limit: 20 })
			.then((msgs) => {
				let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
				(message.channel as TextChannel | NewsChannel).bulkDelete(messages)
			});

		return message.util.send(
			`**${word}** has been removed from this server's filter.`
		);
	}
}
