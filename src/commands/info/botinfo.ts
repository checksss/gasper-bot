import { Command, AkairoClient } from 'discord-akairo';
import { Message, MessageEmbed, User } from 'discord.js';
import * as Discord from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';
import {
	version,
	description,
} from '../../../package.json';
import { defaultPrefix } from '../../config';
import { TextChannel } from 'discord.js';
import { strip } from 'node-emoji';

export default class StatsCommand extends Command {
	public constructor() {
		super('bot', {
			aliases: ['bot', 'bot-info', 'stats'],
			description: {
				content: 'Displays statistics about the bot.',
			},
			category: 'Info',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS'],
			ratelimit: 2
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const owner: User = await this.client.users.fetch(this.client.ownerID[0]!);
		const online = '✅';
		const offline = '🔴';

		const memAlloc = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
		const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
		const memPercent = (memUsed / memAlloc * 100).toFixed(2);

		var userCount: number = await getUserCount(this.client);
		var humanUserCount: number = await getHumanUserCount(this.client);
		var botUserCount: number = await getBotUserCount(this.client);
		var channelCount: number = await getChannelCount(this.client);
		var serverCount: number = await getServerCount(this.client);

		var boostedServerCountArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.premiumSubscriptionCount > 0).size`)
		var boostedServerCount: number;
		boostedServerCountArr.forEach((bg) => {
			boostedServerCount = + bg
		});

		var tier1ServerCountArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.premiumTier === 1).size`)
		var tier1ServerCount: number;
		tier1ServerCountArr.forEach((t1) => {
			tier1ServerCount = + t1
		})

		var tier2ServerCountArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.premiumTier === 2).size`)
		var tier2ServerCount: number;
		tier2ServerCountArr.forEach((t2) => {
			tier2ServerCount = + t2
		})

		var tier3ServerCountArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.premiumTier === 3).size`)
		var tier3ServerCount: number;
		tier3ServerCountArr.forEach((t3) => {
			tier3ServerCount = + t3
		})

		var categoryCountArr: number[] = await this.client.shard.broadcastEval(`this.channels.cache.filter((ch) => ch.type === 'category').size`);
		var totalCategoryChannels: number = 0;
		for (var i = 0; i < categoryCountArr.length; i++) {
			totalCategoryChannels = + categoryCountArr[i];
		};

		var textChannelCountArr: number[] = await this.client.shard.broadcastEval(`this.channels.cache.filter((ch) => ch.type === 'text').size`);
		var totalTextChannels: number = 0;
		for (var i = 0; i < textChannelCountArr.length; i++) {
			totalTextChannels = + textChannelCountArr[i];
		};

		var nsfwChannelCountArr: number[] = await this.client.shard.broadcastEval(`this.channels.cache.filter((ch) => ch.nsfw).size`);
		var totalNSFWChannels: number = 0;
		for (var i = 0; i < nsfwChannelCountArr.length; i++) {
			totalNSFWChannels = + nsfwChannelCountArr[i];
		};

		var newsChannelCountArr: number[] = await this.client.shard.broadcastEval(`this.channels.cache.filter((ch) => ch.type === 'news').size`);
		var totalNewsChannels: number = 0;
		for (var i = 0; i < newsChannelCountArr.length; i++) {
			totalNewsChannels = + newsChannelCountArr[i];
		};

		var voiceChannelCountArr: number[] = await this.client.shard.broadcastEval(`this.channels.cache.filter((ch) => ch.type === 'voice').size`);
		var totalVoiceChannels: number = 0;
		for (var i = 0; i < voiceChannelCountArr.length; i++) {
			totalVoiceChannels = + voiceChannelCountArr[i];
		};

		var partneredServersArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.partnered).size`);
		var partneredServers: number = 0;
		for (var i = 0; i < partneredServersArr.length; i++) {
			partneredServers = + partneredServersArr[i];
		};

		var verifiedServersArr: number[] = await this.client.shard.broadcastEval(`this.guilds.cache.filter((g) => g.verified).size`);
		var verifiedServers: number = 0;
		for (var i = 0; i < verifiedServersArr.length; i++) {
			verifiedServers = + verifiedServersArr[i];
		};


		let memberdate: moment.Moment = moment.utc(message.guild.me!.joinedAt);
		let mDateDay: string = memberdate.format('DD');

		const embed: MessageEmbed = new MessageEmbed({
			color: message.guild.me!.displayColor,
			description: stripIndents`
			**${this.client.user!.username} Statistics**\n
			*${description} .... soon™*\n**¯\\_(ツ)_/¯**`,
			fields: [
				{
					name: '⇒ General',
					value: stripIndents`
					• Joined ${message.guild.name}: ${memberdate.format(`${parseInt(mDateDay) === 1 ? `${mDateDay}[st]` : `${parseInt(mDateDay) === 2 ? `${mDateDay}[nd]` : `${parseInt(mDateDay) === 3 ? `${mDateDay}[rd]` : `${parseInt(mDateDay) === 21 ? `${mDateDay}[st]` : `${parseInt(mDateDay) === 22 ? `${mDateDay}[nd]` : `${parseInt(mDateDay) === 23 ? `${mDateDay}[rd]` : `${parseInt(mDateDay) === 31 ? `${mDateDay}[st]` : `${mDateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
					• Shard: ${message.guild.shardID + 1} | ${this.client.shard.count}
					• Discord.js: v${Discord.version}
					• NodeJS: ${process.version/*@ts-ignore*/}
					• Local Prefix: ${this.client.guildsettings.get(message.guild, 'config.prefix', defaultPrefix)}
					• Uptime: ${moment.duration(this.client.uptime!).format('d[d ]h[h ]m[m ]s[s ]')}
					• Memory Usage: ${memUsed}MB/${memAlloc}MB (${memPercent}%)
					`,
					inline: true
				},
				{
					name: '<:empty:744513757962829845>',
					value: '<:empty:744513757962829845>',
					inline: true
				},
				{
					name: '<:empty:744513757962829845>',
					value: '<:empty:744513757962829845>',
					inline: true
				},
				{
					name: '⇒ Server Stats',
					value: stripIndents`
					• ${serverCount} Total Servers
					${boostedServerCount > 0 ? `${boostedServerCount > 1 ? `• ${boostedServerCount} Boosted Servers` : `• ${boostedServerCount} Boosted Server`}` : ''}${tier1ServerCount > 0 ? `\n${tier1ServerCount > 1 ? `• ${tier1ServerCount} Tier 1 Servers` : `• ${tier1ServerCount} Tier 1 Server`}` : ``}${tier2ServerCount > 0 ? `\n${tier2ServerCount > 1 ? `• ${tier2ServerCount} Tier 2 Servers` : `• ${tier2ServerCount} Tier 2 Server`}` : ``}${tier3ServerCount > 0 ? `\n${tier3ServerCount > 1 ? `• ${tier3ServerCount} Tier 3 Servers` : `• ${tier3ServerCount} Tier 3 Server`}` : ``}
					${verifiedServers > 0 ? `${verifiedServers > 1 ? `• ${verifiedServers} Verified Servers` : `• ${verifiedServers} Verified Server`}` : ''}${partneredServers > 0 ? `\n${partneredServers > 1 ? `• ${partneredServers} Pertnered Servers` : `• ${partneredServers} Partnered Server`}` : ''}
					`,
					inline: true
				},
				{
					name: '⇒ Channel Stats',
					value: stripIndents`
					• ${channelCount} Total Channels
					${totalCategoryChannels > 0 ? `${totalCategoryChannels > 1 ? `• ${totalCategoryChannels} Categories` : `• ${totalCategoryChannels} Category`}` : ''}${totalTextChannels > 0 ? `\n• ${totalTextChannels} Text${totalNSFWChannels > 0 ? ` (${totalNSFWChannels} NSFW)` : ''}` : ''}${totalVoiceChannels > 0 ? `\n• ${totalVoiceChannels} Voice` : ''}${totalNewsChannels > 0 ? `\n• ${totalNewsChannels} News` : ''}
					`,
					inline: true
				},
				{
					name: '⇒ User Stats',
					value: stripIndents`
					${userCount > 1 ? `• ${userCount} Total Users` : `${userCount === 1 ? `• ${userCount} Total User` : '• No Users'}`}
					${botUserCount > 1 ? `• ${botUserCount} Bots` : `${botUserCount === 1 ? `• ${botUserCount} Bot` : '• No bots'}`}
					${humanUserCount > 1 ? `• ${humanUserCount} Humans` : `${humanUserCount === 1 ? `• ${humanUserCount} Human` : '• No humans'}`}
					`,
					inline: true
				},
				{
					name: '⇒ Version',
					value: `[v${version}](https://github.com/datflowts/gasper-bot 'view my GitHub Repository!')`,
					inline: true
				},
				{
					name: '⇒ Shards',
					value: `${this.client.ws.shards.map(s => {
						return stripIndents`
							${s.status === 0 ? online : offline} ${s.id} • ${shardStatus[s.status]} (${Math.round(s.ping)} ms)\n
						`;
					}).join('\n')}`,
					inline: true
				},
				{
					name: '<:empty:744513757962829845>',
					value: '<:empty:744513757962829845>',
					inline: true
				},
				{
					name: '⇒ Invite',
					value: '[Discord](https://discordapp.com/api/oauth2/authorize?client_id=673613224389640228&permissions=0&scope=bot)',
					inline: true
				},
				{
					name: '⇒ Development server',
					value: '[Gasper\'s Playground](https://discord.gg/GrmxKeZ)',
					inline: true
				},
				{
					name: '<:empty:744513757962829845>',
					value: '<:empty:744513757962829845>',
					inline: true
				}
			],
			thumbnail: {
				url: this.client.user!.displayAvatarURL()
			},
			footer: {
				text: `© 2020 ${owner.tag}`
			}
		})

		return message.util!.send(embed);
	}
}

const shardStatus: ShardStatus = {
	0: 'Ready',
	1: 'Connecting',
	2: 'Reconnecting',
	3: 'Idle',
	4: 'Nearly',
	5: 'Disconnected'
};

interface ShardStatus {
	[key: number]: string;
}

var getUserCount = async function (client: AkairoClient) {
	var count: number;
	while (!client.shard || client.shard == null) {
		count = client.users.cache.size;
		return count;
	}
	var shardUsers = client.shard.fetchClientValues('users.cache.size').then(async (res) => {
		var c: number = await res.reduce((prev, val) => prev + val, 0);
		return c;
	}).catch(e => {
		if (e) return 0;
	});
	count = await shardUsers;
	return count;
}
var getHumanUserCount = async function (client: AkairoClient) {
	var count: number;
	while (!client.shard || client.shard == null) {
		count = client.users.cache.filter((u): boolean => !u.bot).size;
		return count;
	}
	var shardsUsers = await client.shard.broadcastEval('this.users.cache.filter((u)=>!u.bot).size');
	shardsUsers.forEach((u) => {
		count = + parseInt(u);
	});
	return count;
}
var getBotUserCount = async function (client: AkairoClient) {
	var count: number;
	while (!client.shard || client.shard == null) {
		count = client.users.cache.filter((u): boolean => u.bot).size;
		return count;
	}
	var shardsUsers = await client.shard.broadcastEval('this.users.cache.filter((u)=>u.bot).size');
	shardsUsers.forEach((u) => {
		count = + parseInt(u);
	});
	return count;
}
var getChannelCount = async function (client: AkairoClient) {
	var count: number;
	while (!client.shard || client.shard == null) {
		count = client.channels.cache.size;
		return count;
	}
	var shardChannels = client.shard.fetchClientValues('channels.cache.size').then(async (res) => {
		var c: number = await res.reduce((prev, val) => prev + val, 0);
		return c;
	}).catch(e => {
		if (e) return 0;
	});
	count = await shardChannels;
	return count;
}
var getServerCount = async function (client: AkairoClient) {
	var count: number;
	while (!client.shard || client.shard == null) {
		count = client.guilds.cache.size;
		return count;
	}
	var shardGuilds = client.shard.fetchClientValues('guilds.cache.size').then(async (res) => {
		var c: number = await res.reduce((prev, val) => prev + val, 0);
		return c;
	}).catch(e => {
		if (e) return 0;
	});
	count = await shardGuilds;
	return count;
}