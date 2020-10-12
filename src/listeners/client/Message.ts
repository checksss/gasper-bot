import { Listener } from 'discord-akairo';
import { Message, TextChannel, User, GuildMember, MessageEmbed } from 'discord.js';
import wordFilters from '../../structures/wordFilter';
import botConfig from '../../config/botConfig';
import MessageLogger from '../../logger/Messagelog';
import wh from '../../structures/webHook';

export default class MessageListener extends Listener {
	public constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
			category: 'client',
		});
	}

	public async exec(message: Message): Promise<any> {

		const mentioned: User[] = message.mentions.users.array();
		const devIDs: string[] = this.client.ownerID as string[];

		if (!message.guild) return;
		
		devIDs.forEach(async d => {
			let dev: User = this.client.users.cache.get(d);
			let devMember: GuildMember = message.guild.members.cache.get(d);
			if (mentioned.filter(m => m.id === d).length > 0) {
				//@ts-ignore
				var awayStatus: boolean = this.client.guildsettings.get('global', `away.${d}.status`, false);
				//@ts-ignore
				var awayReason: string = this.client.guildsettings.get('global', `away.${d}.reason`, '');
				//@ts-ignore
				var missedUsers: string[] = this.client.guildsettings.get('global', `away.${d}.missed_users`, []);

				switch (awayStatus) {
					case true:
						if (!missedUsers.includes(message.author.id)) {
							missedUsers.push(message.author.id);
							//@ts-ignore
							this.client.guildsettings.set('global', `away.${d}.missed_users`, missedUsers);
						}

						let embed = new MessageEmbed({
							title: '[AWAY]',
							description: await wh.sensitivePatterns(awayReason, this.client, message),
							footer: {
								text: `${dev.tag} is currently away!`,
								icon_url: dev.displayAvatarURL({ format: 'png', dynamic: true })
							},
							color: devMember.displayHexColor
						})

						let hook = await wh.get('awaymessage', this.client.user, message.channel as TextChannel)
						return await wh.send(hook, message.guild, this.client.user, embed, {
							username: devMember.displayName,
							avatarURL: dev.displayAvatarURL({ format: 'png', dynamic: true })
						})
							.then(async w => {
								return await w.delete({ timeout: 10000 })
									.catch()
							})
							.catch();
					default:
						break;
				}
			}
		})

		//@ts-ignore
		const userprefixes: string[] = await this.client.usersettings.get(message.author, 'config.prefixes', [botConfig.botDefaultPrefix]);
		//@ts-ignore
		const guildprefix: string = await this.client.guildsettings.get(message.guild, 'config.prefix', botConfig.botDefaultPrefix);

		let n: number = 0;

		let prefixArr: string[] = userprefixes.concat(guildprefix);
		for (const p in prefixArr) {
			if (message.content.startsWith(p)) n++;
		}

		const answersArray: string[] = ['hey there!', 'you called me?', 'you mentioned me?', 'how can i help you?', 'what\'s up?', 'need help?', 'ok.', 'forgot my prefix?'];
		var randomAnswers: number = Math.floor(Math.random() * answersArray.length);
		var answer: string = answersArray[randomAnswers];

		if (message.author.bot || !message.guild) return;

		if (message.mentions.users.first() === this.client.user) {

			return message.reply(
				answer +
				'\n*my local Prefix here is:* \n`' +
				//@ts-ignore
				guildprefix +
				'`' +
				`${userprefixes.length >= 1 ? `\n\n*your global Prefixes are:*\n\`${botConfig.botDefaultPrefix}\`${userprefixes.filter((p) => p !== botConfig.botDefaultPrefix).map((pfx) => `\n\`${pfx}\``).join(' ')}` : ''}`
			).then(sent => {
				if (sent.deletable && !sent.deleted) {
					sent.delete({ timeout: 5000, reason: 'keeping chat clean!' }).catch(e => { if (e) console.log(e.stack) });
				}
			});
		}

		//@ts-ignore
		let list: string[] = this.client.guildsettings.get(
			message.guild,
			'moderation.filters',
			[]
		);

		//@ts-ignore
		const logchannel = await this.client.guildsettings.get(message.guild, 'config.message_logchannel', '');
		const msglog = this.client.channels.cache.get(logchannel) as TextChannel;

		if (msglog && msglog != null && n === 0) {
			MessageLogger.onSend(message, msglog)
		}

		return wordFilters.check(this.client, message, list);
	}
}
