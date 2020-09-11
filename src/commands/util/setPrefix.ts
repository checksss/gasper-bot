import { Command } from 'discord-akairo';
import { Message, TextChannel, NewsChannel } from 'discord.js';
import { defaultPrefix } from '../../config';
import { stripIndents } from 'common-tags';
import { owners } from '../../config';

export default class SetPrefixCommand extends Command {
	public constructor() {
		super('setprefix', {
			aliases: ['setprefix', 'newprefix', 'pcustom', 'prefix', 'pfx'],
			category: 'Util',
			description: {
				content: stripIndents`
				Add custom prefixes for global use.
				Optionally, server admins can change server's prefix.
				Valid methods are:
				- \`delete\`/\`remove\`/\`del\`/\`rm\` to remove a prefix from your individual prefix-list
				- \`server\`/\`guild\`/\`local\`/\`community\` to change the server's prefix [Admin-Only]
				- \`user\`/\`me\`/\`member\`/\`custom\`/\`private\`/\`global\` to add a prefix to your prefix-list [DEFAULT]
				Don't forget the \`-o\` identifier to provide a method!`,
				examples: ['!', '? -o server'],
				usages: ['<new prefix>', '<new prefix> -o <method>']
			},
			ratelimit: 3,
			args: [
				{
					id: 'prefix',
					type: 'string',
					prompt: {
						start: (message: Message): string =>
							`${message.author}, specify a prefix!`,
					},
				},
				{
					id: 'method',
					type: 'lowercase',
					match: 'option',
					flag: ['-o '],
					default: 'user'
				}
			],
		});
	}

	public async exec(message: Message, { prefix, method }: { prefix: string, method: string }): Promise<any> {
		if (message.deletable && !message.deleted) message.delete();
		const guildOwner = await this.client.users.fetch(message.guild!.ownerID);

		let guildMethods: string[] = ['server', 'guild', 'local', 'community'];
		let userMethods: string[] = ['user', 'me', 'member', 'custom', 'private', 'global'];
		let removeMethods: string[] = ['delete', 'remove', 'del', 'rm']

		if (guildMethods.includes(method)) {

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
			if (!administrators.includes(message.author!.id) && adminrole.size == 0 && !owners.includes(message.author.id)) return message.util!.reply('only administrators can use this method.');
			//@ts-ignore
			this.client.guildsettings.set(message.guild, 'config.prefix', prefix);
		} else if (userMethods.includes(method)) {
			//@ts-ignore
			let userpfx = this.client.usersettings.get(message.author, 'config.prefixes', [defaultPrefix]);
			if (!userpfx.includes(prefix)) {
				//@ts-ignore
				this.client.usersettings.set(message.author, 'config.prefixes', userpfx.concat(prefix));

				return message.util
					.reply(`prefix \`${prefix}\` added!`)
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
				return message.util!.reply(`\`${prefix}\` is already set as prefix.`);
			}
		} else if (removeMethods.includes(method)) {
			//@ts-ignore
			let pfxAr = this.client.usersettings.get(message.author, 'config.prefixes', [defaultPrefix]);
			if (!pfxAr.includes(prefix)) return message.util!.reply(`\`${prefix}\` is not set as prefix for you yet.`);
			let newPfx: string[] = [];
			pfxAr.forEach((p: string) => {
				if (p !== prefix) newPfx.push(p);
			});
			//@ts-ignore
			await this.client.usersettings.set(message.author, 'config.prefixes', newPfx);

			return message.util
				.reply(`prefix \`${prefix}\` removed!`)
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
			//@ts-ignore
			const pfx = message.guild ? this.client.guildsettings.get(message.guild, 'config.prefix', defaultPrefix) : this.client.usersettings.get(message.author, 'config.prefixes', [defaultPrefix]);
			return message.util!.send(stripIndents`
			That method doesn't exist on \`setprefix\`;
			Try \`${message.guild ? pfx : pfx[0]}help setprefix\` for help.`);
		}

		if (message.guild!) {
			message.channel.messages.fetch({ limit: 20 })
				.then((msgs) => {
					let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
					(message.channel as TextChannel | NewsChannel).bulkDelete(messages)
				});
		}

		return message.util
			.reply(`prefix changed to \`${prefix}\` !`)
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
