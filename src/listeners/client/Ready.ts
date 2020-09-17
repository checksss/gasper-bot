import { stripIndents } from 'common-tags';
import { AkairoClient, Listener } from 'discord-akairo';
import { MessageEmbed, Webhook, TextChannel, User } from 'discord.js';
import moment from 'moment';
import ms from 'ms';
import BotClient from '../../client/BotClient';

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client',
		});
	}

	public exec(): void {
		const client = this.client;

		let memberFetch = function (client: AkairoClient) {
			while (!client.shard || client.shard == null) {
				return client.guilds.cache.forEach(g => {
					g.members.fetch();
				})
			}
			return client.shard.fetchClientValues('client.guilds.cache.forEach(g => {g.members.fetch();})');
		}

		let prefixpresence = function (client: AkairoClient) {
			client.user.setPresence({
				activity: {
					type: 'PLAYING',
					name: `mention me for prefix`
				},
				status: 'online',
				afk: false,
			});
		}

		let presence = async function (client: AkairoClient) {
			var getUserCount = async function (client: AkairoClient) {
				var count: number;
				while (!client.shard || client.shard == null) {
					count = client.users.cache.filter((u): boolean => !u.bot).size;
					return count;
				}
				var shardsUsers = await client.shard.broadcastEval('this.users.cache.filter((u)=>!u.bot).size');
				shardsUsers.forEach((u) => {
					count = + parseInt(u);
				})
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

			var userCount: number = await getUserCount(client);
			var serverCount: number = await getServerCount(client);

			client.user.setPresence({
				activity: {
					type: 'WATCHING',
					name: `${serverCount} ${serverCount > 1 ? 'servers' : 'server'} with ${userCount} ${userCount > 1 ? `users` : `user`}.`
				},
				status: 'online',
				afk: false,
			});
			setTimeout(prefixpresence, 55000, client)
		};

		let softBanCheck = async function (client: AkairoClient) {
			client.guilds.cache.forEach(async (g) => {

				let bannedUsers: User[] = (await g.fetchBans()).map(b => b.user);

				bannedUsers.forEach(async (u) => {

					//@ts-ignore
					let sbts: string[] = client.infractions.get(u.id!, `softbans.${g.id}.timestamp`, []);
					//@ts-ignore
					let sbdts: string[] = client.infractions.get(u.id!, `softbans.${g.id}.duration`, []);
					//@ts-ignore
					let sbr: string[] = client.infractions.get(u.id!, `softbans.${g.id}.reason`, []);
					//@ts-ignore
					let sbubts: string[] = client.infractions.get(u.id!, `softbans.${g.id}.unbanned_timestamp`, ['0']);

					let time: string = sbts.slice(-1).pop();
					let duration: string = sbdts.slice(-1).pop();
					let reason: string = sbr.slice(-1).pop();
					let ub_time: string = sbubts.slice(-1).pop();

					let now: moment.Moment = moment.utc(Date.now());
					let nowDay: string = now.format('DD');

					//@ts-ignore
					const modLog = await client.guildsettings.get(g!, 'config.ban_logchannel', '');
					const logchannel = g.channels.cache.get(modLog);

					var checksum_1: number = Date.now() - parseInt(time);
					var checksum_2: boolean = parseInt(ub_time) > 0;

					if (checksum_1 >= parseInt(duration) && !checksum_2) {

						await g.members.unban(u, `Tempban over after ${ms(ms(duration))}`).catch((e) => {
							if (e)
								return console.log(`Ooops! Something went wrong:\n\`\`\`${e.stack}\`\`\`.`);
						});

						//@ts-ignore
						let sbu: string[] = await client.infractions.get(u.id!, `softbans.${g.id}.unbanned`, []);
						sbu.push(`${Date.now()}`);
						//@ts-ignore
						await client.infractions.set(u.id!, `softbans.${g.id}.unbanned_timestamp`, sbu);

						if (g.channels.cache.has(modLog)) {
							const embed = new MessageEmbed()
								.setColor(g.me.displayColor)
								.setAuthor(`${u.tag} (${u.id})`, u.displayAvatarURL({ format: 'png', dynamic: true }))
								.setDescription(stripIndents`
								**Action**: Unban (Softban/Tempban)
								**Reason:** ${reason ? `${reason} | Tempban over after ${ms(ms(duration))}` : `No reason | Tempban over after ${ms(ms(duration))}`}
								`)
								.setFooter(`User Unbanned by ${client.user.tag} || ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`);

							let webhook: Webhook = (await (logchannel as TextChannel).fetchWebhooks()).filter(w => w.name === `${client.user.username.toLowerCase()}-ban-log`).first();
							if (!webhook) {
								webhook = await (logchannel as TextChannel).createWebhook(`${client.user.username.toLowerCase()}-ban-log`, {
									avatar: client.user.displayAvatarURL({ format: 'png', dynamic: true }),
									reason: 'Logging bans enabled in this channel.'
								})
							}

							await webhook.send({
								username: g.me.displayName,
								avatarURL: client.user.displayAvatarURL({ format: 'png', dynamic: true }),
								embeds: [embed]
							});
						}
					}
				})
			})
		}

		presence(client);
		setInterval(presence, 60000, client);
		setInterval(memberFetch, 86400000, client);
		setInterval(softBanCheck, 10000, client as BotClient);

		console.log(stripIndents`
		${this.client.user.tag/*Gasper#5465*/} - One Bot to rule 'em all!
		Copyright (C) 2020 DatFlow#0001
			
			Contact:
			datflow@gasper.fun
			<https://discord.gasper.fun>

		This program is free software: you can redistribute it and/or modify
		it under the terms of the GNU Affero General Public License as published
		by the Free Software Foundation, either version 3 of the License, or
		(at your option) any later version.

		This program is distributed in the hope that it will be useful,
		but WITHOUT ANY WARRANTY; without even the implied warranty of
		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
		GNU Affero General Public License for more details.

		You should have received a copy of the GNU Affero General Public License
		along with this program.  If not, see <https://www.gnu.org/licenses/>.
		`);
	}
}
