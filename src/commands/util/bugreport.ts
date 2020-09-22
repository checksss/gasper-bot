import { Command, AkairoClient } from "discord-akairo"
import { Message, MessageEmbed, User, Guild } from "discord.js"
import botConfig from "../../config/botConfig";
import moment from "moment";
import { stripIndents } from "common-tags";
import { TextChannel } from "discord.js";
import wh from '../../structures/webHook'

export default class BugreportCommand extends Command {
    public constructor() {
        super('bugreport', {
            aliases: ['bugreport', 'bugs', 'reportbug', 'botfail'],
            category: 'Util',
            description: {
                content: 'Report bug to my Devs. You\'ll be asked some questions via DM!',
                usage: '',
                examples: ['']
            },
            ratelimit: 3
        }
        )
    }

    public async exec(message: Message): Promise<Message | Message[] | void> {
        if (message.deletable && !message.deleted) message.delete();
        let guildOwner: User;

        if (message.guild) {
            guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        }
        const author = await this.client.users.fetch(message.author!.id);
        const owner: User = await this.client.users.fetch(this.client.ownerID[0]);
        const homeID: string = this.client.guilds.cache.filter((g) => g.ownerID === owner.id && g.name === "Gasper's Playground").map((guild) => guild.id)[0];
        const home: Guild = this.client.guilds.cache.get(homeID);
        const client: AkairoClient = this.client;
        let answers: string[] = [];

        let description = stripIndents`
        **Which command(s) or function(s) of the Bot was/were affected?**


        *make a list in __one single message__*
        `;
        let pageNr = '#1';

        let embed = await makeEmbed(message, client, description, pageNr);

        let msg = await message.author.send(embed).catch((e) => {
            if (e)
                return message.util!.reply('Please don\'t block DMs from me, if you want to use this command! If you don\'t check privacy settings if you accept DMs from Server Members!')
        });
        let responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);

        description = stripIndents`
        **Could you explain\*, what you've done in that moment?**


        \**please in __one single message__ & as detailed as you can!*
        `;
        pageNr = '#2';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);

        description = stripIndents`
        **Which problem happened?**
        

        *please describe in __one single message__ & as detailed as you can!*
        `;
        pageNr = '#3';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);


        description = stripIndents`
        **Did i have the needed permissions to perform the action?**


        *e.g. 'Manage Messages', 'Embed Links', 'Ban Members', 'Kick Members', 'Manage Roles'*
        `;
        pageNr = '#4';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);

        description = stripIndents`
        **Did it happen on a server or via DM?**


        *some commands/functions are not for DM use*
        `;
        pageNr = '#5';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);

        description = stripIndents`
        **Do you have an invite link?**

        Please answer with \`Y\` for 'yes' and \`N\` for 'no;

        *if it happened on a server, dev could join to check*
        `;
        pageNr = '#6';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        if (/^y(?:e(?:a|s)?)?$/i.test(responses.first()!.content)) {
            answers.push('yes');

            description = stripIndents`
            **Please post __now__ the invite link**
    
    
            *if it happened on a server, dev could join to check*
            `;
            pageNr = '#7';
            embed = await makeEmbed(message, client, description, pageNr);
            await msg.edit(embed);
            responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
            if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));

            let res = responses.first().content.toLowerCase();

            let inviteURL: string;

            let regx = /(?:https?:\/)?((?:www|m)\.)?discord(?:app.com\/invite|.gg|.com\/invite)/gi
            let isInvite = regx.test(res);

            if (isInvite) {
                description = stripIndents`
                **Thank you for your submission!**
                `
                inviteURL = res;
            } else {
                description = stripIndents`
                **Thank you for your submission!**

                *Invite-URL was invalid!*
                `;
                inviteURL = '';
                answers[5] = 'no'
            }

            pageNr = 'Submitted!';

            embed = await makeEmbed(message, client, description, pageNr);
            await msg.edit(embed);

            let submitEmbed = await makeReportEmbed(message, client, author, answers, inviteURL)
            //@ts-ignore
            let rcID: string = this.client.guildsettings.get('global', 'config.bugreport_logchannel', '')
            let reportChannel = home.channels.cache.get(rcID);
            if (reportChannel && rcID !== '') {
                return (reportChannel as TextChannel).send(submitEmbed);
            } else {
                return owner.send(submitEmbed);
            }

        } else {
            description = stripIndents`
            **Thank you for your submission!**
            `
            pageNr = 'Submitted!';
            answers.push('no');
            embed = await makeEmbed(message, client, description, pageNr);
            await msg.edit(embed);

            let submitEmbed = await makeReportEmbed(message, client, author, answers, '')
            //@ts-ignore
            let rcID: string = this.client.guildsettings.get('global', 'config.bugreport_logchannel', '')
            let reportChannel = home.channels.cache.get(rcID);
            if (reportChannel && rcID !== '') {
                let webhook = await wh.get('bugreport', this.client.user, reportChannel as TextChannel);
                if (!webhook) {
                    webhook = await wh.create('bugreport', this.client.user, reportChannel as TextChannel);
                }
                return wh.send(webhook, home, this.client.user, submitEmbed);
            } else {
                return owner.send(submitEmbed);
            }
        }


    }
}


const makeEmbed = async function (message: Message, client: AkairoClient, description: string, pageNr: string) {

    let now: moment.Moment = moment.utc(Date.now());
    let nowDay: string = now.format('DD');

    const embed = new MessageEmbed({
        author: {
            name: `${client.user.tag} | BUGREPORT`,
            icon_url: client.user.displayAvatarURL({ format: 'png', dynamic: true }),
            url: `https://discord.gasper.fun`
        },
        color: message.guild ? message.member.displayHexColor : Math.floor(Math.random() * 12777214) + 1,
        description: `${description}`,
        footer: {
            text: `${pageNr} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
            iconURL: message.author.displayAvatarURL({ format: 'png', dynamic: true })
        }
    });

    return embed;
}

const makeReportEmbed = async function (message: Message, client: AkairoClient, user: User, answers: string[], inviteURL: string) {

    let now: moment.Moment = moment.utc(Date.now());
    let nowDay: string = now.format('DD');

    const embed = new MessageEmbed({
        author: {
            name: `${user.tag} | BUGREPORT`,
            icon_url: user.displayAvatarURL({ format: 'png', dynamic: true }),
            url: `${inviteURL !== '' ? inviteURL : 'https://discord.gasper.fun'}`
        },
        color: message.guild ? message.member.displayHexColor : Math.floor(Math.random() * 12777214) + 1,
        fields: [
            {
                name: '⇒ Affected Command(s)/Function(s)',
                value: answers[0]
            },
            {
                name: '⇒ Action done while bug happened',
                value: answers[1]
            },
            {
                name: '⇒ Problem',
                value: answers[2]
            },
            {
                name: '⇒ Permissions given?',
                value: answers[3]
            },
            {
                name: '⇒ Channel-Type (Server or DM?)',
                value: answers[4]
            },
            {
                name: '⇒ Invite given?',
                value: answers[5]
            }
        ],
        footer: {
            text: `${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
            iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true })
        }
    });

    return embed;
}