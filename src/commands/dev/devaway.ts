import { stripIndents } from 'common-tags';
import { Argument } from 'discord-akairo';
import { Command } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import moment from 'moment';

export default class DevAwayCommand extends Command {
    public constructor() {
        super('devaway', {
            aliases: ['devaway', 'daw', 'daway', 'weg.de'],
            description: {
                content: 'Set away status for bot-owner',
                examples: ['I\'m away, because i want to be.'],
                usage: '<reason>',
                ownerOnly: true
            },
            category: 'Dev',
            ownerOnly: true,
            ratelimit: 2,
            args: [
                {
                    id: 'status',
                    match: 'option',
                    type: Argument.union('number', (_, phrase) => {
                        let bools: number[] = [0, 1];
                        if (bools.includes(parseInt(phrase))) return parseInt(phrase);
                        return null;
                    }),
                    flag: ['-s ', 's='],
                    default: 1
                },
                {
                    id: 'reason',
                    match: 'rest',
                    type: 'sring',
                    prompt: {
                        start: (message: Message): string => `${message.author}, why will you be away?`
                    }
                }
            ],
        });
    }

    public async exec(message: Message, { reason, status }: { reason: string, status: number }): Promise<Message | Message[]> {

        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');
        let embed = new MessageEmbed({
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ format: 'png', dynamic: true })
            }
        })
        switch (status) {
            case 0:
                //@ts-ignore
                var curStatus: boolean = await this.client.guildsettings.get('global', `away.${message.author.id}.status`, true);
                if (!curStatus) return message.util!.reply(`You aren't set as away yet.`).then(async m => {
                    return await m.delete({ timeout: 5000 });
                })
                embed.title = `${message.author.tag} | Back`;
                embed.description = stripIndents`
                    You're now back! 
                    \`\`\`
                    ${reason}
                    \`\`\`
                    `;
                embed.footer = {
                    text: `${message.author.id === this.client.ownerID[0] ? `Maintainer: ` : `Developer: `}${message.author.tag} is back! ✧ ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                    iconURL: this.client.user.avatarURL({ format: 'png', dynamic: true })
                }

                //@ts-ignore
                await this.client.guildsettings.set('global', `away.${message.author.id}.status`, false);
                //@ts-ignore
                await this.client.guildsettings.set('global', `away.${message.author.id}.reason`, '');
                //@ts-ignore
                let users: string[] = await this.client.guildsettings.get('global', `away.${message.author.id}.missed_users`, []);
                users.forEach(async u => {
                    await this.client.users.cache.get(u).send(`${message.author.tag} is back again.\n\n*You got this information, because you mentioned them during their absence.*`).catch(e => {
                        if (e) return;
                    });
                })
            default:
                //@ts-ignore
                var curStatus: boolean = await this.client.guildsettings.get('global', `away.${message.author.id}.status`, true);
                if (curStatus) return message.util!.reply(`You're already set as away.`).then(async m => {
                    return await m.delete({ timeout: 5000 });
                })
                embed.title = `${message.author.tag} | Away`;
                embed.description = stripIndents`
                    You're now set as away: 
                    \`\`\`
                    ${reason}
                    \`\`\`
                    `;
                embed.footer = {
                    text: `${message.author.id === this.client.ownerID[0] ? `Maintainer: ` : `Developer: `}${message.author.tag} set away ✧ ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                    iconURL: this.client.user.avatarURL({ format: 'png', dynamic: true })
                }

                //@ts-ignore
                await this.client.guildsettings.set('global', `away.${message.author.id}.status`, true);
                //@ts-ignore
                await this.client.guildsettings.set('global', `away.${message.author.id}.reason`, reason);
                //@ts-ignore
                await this.client.guildsettings.set('global', `away.${message.author.id}.missed_users`, []);
        }
        return await message.util.reply(embed);
    }
}
