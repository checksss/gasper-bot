import { Listener } from 'discord-akairo';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import wordFilters from '../../structures/wordFilter';
import { defaultPrefix } from '../../config';
import MessageLogger from '../../logger/Messagelog';
import { stripIndents } from 'common-tags';
import moment from 'moment';

export default class MessageListener extends Listener {
	public constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
			category: 'client',
		});
	}

	public async exec(message: Message): Promise<any> {
		//@ts-ignore
		const userprefixes: string[] = this.client.usersettings.get(message.author, 'config.prefixes', [defaultPrefix]);
		//@ts-ignore
		const guildprefix: string = this.client.guildsettings.get(message.guild, 'config.prefix', defaultPrefix);

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
				`${userprefixes.length > 1 ? `\n\n*your global Prefixes are:* ${userprefixes.filter((p) => p !== defaultPrefix).map((pfx) => `\n\`${pfx}\``).join(' ')}` : ''}`
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
		const logchannel = this.client.guildsettings.get(message.guild, 'config.message_logchannel', '');
		const msglog = message.guild.channels.cache.get(logchannel) as TextChannel;

		// if (msglog && msglog != null && !message.content.startsWith(guildprefix)) {
		// 	MessageLogger.onSend(message, msglog)
		// }

		return wordFilters.check(this.client, message, list);
	}
}
