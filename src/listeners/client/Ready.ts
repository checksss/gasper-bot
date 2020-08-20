import { AkairoClient, Listener } from 'discord-akairo';
import RainbowModule from './controller/RainbowRole';
import { User } from 'discord.js';

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

		presence(client);
		setInterval(presence, 60000, client);
		setInterval(memberFetch, 86400000, client);
		//RainbowModule.Rainbow(client);

		console.log(
			`${this.client.user.tag/*Gasper#5465*/} - One Bot to rule 'em all!\n` +
			`Copyright (C) 2020 Florian Meyer\n\n` +
			`Contact:\n` +
			`datflow@gasper.fun\n\n` +
			`<https://gasper.fun>\n\n` +
			`This program is free software: you can redistribute it and/or modify\n` +
			`it under the terms of the GNU Affero General Public License as published\n` +
			`by the Free Software Foundation, either version 3 of the License, or\n` +
			`(at your option) any later version.\n\n` +
			`This program is distributed in the hope that it will be useful,\n` +
			`but WITHOUT ANY WARRANTY; without even the implied warranty of\n` +
			`MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n` +
			`GNU Affero General Public License for more details.\n\n` +
			`You should have received a copy of the GNU Affero General Public License\n` +
			`along with this program.  If not, see <https://www.gnu.org/licenses/>.`
		);
	}
}
