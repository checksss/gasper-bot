//    Gasper - One bot to rule 'em all!
//    Copyright (C) 2020 Florian Meyer
//
//    Contact:
//    datflow@gasper.fun
//    https://gasper.fun
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Affero General Public License as published
//    by the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Affero General Public License for more details.
//
//    You should have received a copy of the GNU Affero General Public License
//    along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { ShardingManager } from 'discord.js';
import { token } from './config';
import moment from 'moment';

const shards = new ShardingManager('./dist/src/index.js', {
  token: token,
  totalShards: 'auto'
});

shards.on('shardCreate', shard => {

  let now: moment.Moment = moment.utc(Date.now());
  let nowDay: string = now.format('DD');

  console.log(`[${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss`)} UTC] - Shard #${shard.id} launched.`);
});

shards.spawn(shards.totalShards, 5000, 20000);

const spawnShards = function (shards: ShardingManager) {
  shards.fetchClientValues('guilds.cache.size').then(res => {
    var totalGuilds: number = res.reduce((prev, val) => prev + val, 0);
    var shardTotal: number | 'auto' = totalGuilds > 1200 ? Math.round((totalGuilds / 1150) * 2) : 'auto';
    if (shards.totalShards < shardTotal) {
      shards.totalShards = shardTotal
      return shards.spawn(shards.totalShards, 5000, 20000);
    }
    return shards.respawnAll();
  });
};

setTimeout(spawnShards, 6666666, shards);