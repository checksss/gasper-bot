import { Command, AkairoClient } from "discord-akairo"
import { Message, MessageEmbed, User, Guild } from "discord.js"
import { owners } from "../../config";
import moment from "moment";
import { stripIndents } from "common-tags";
import { TextChannel } from "discord.js";

export default class SuggestionsCommand extends Command {
    public constructor() {
        super('suggestion', {
            aliases: ['suggestion', 'suggest', 'featurerequest', 'botidea'],
            category: 'Util',
            description: {
                content: 'Suggest new features to my Devs. You\'ll be asked some questions via DM!',
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
        const owner: User = await this.client.users.fetch(owners[0]);
        const homeID: string = this.client.guilds.cache.filter((g) => g.ownerID === owner.id && g.name === "Gasper's Playground").map((guild) => guild.id)[0];
        const home: Guild = this.client.guilds.cache.get(homeID);
        const client: AkairoClient = this.client;
        let answers: string[] = [];

        let description = stripIndents`
        **Which command(s) or function(s) du you suggest?**


        *make a list in __one single message__
        you can explain each in the next step*
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
        **Could you explain\* or give examples?**


        \**please in __one single message__ & as detailed as you can!*
        `;
        pageNr = '#2';
        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);
        responses = await msg.channel.awaitMessages((r: Message) => r.author!.id === author!.id, { max: 1, time: 240000 });
        if (!responses || responses.size < 1) return msg.edit('Request timed out.').then(m => m.delete({ timeout: 10000 }));
        answers.push(responses.first().content);


        description = stripIndents`
        **submitting...**
        `
        pageNr = 'submitting...';

        embed = await makeEmbed(message, client, description, pageNr);
        await msg.edit(embed);

        let submitEmbed = await makeSuggestEmbed(message, client, author, answers);
        //@ts-ignore
        let scID: string = this.client.guildsettings.get('global', 'config.suggestion_logchannel', '')
        let suggestionChannel = home.channels.cache.get(scID);
        if (suggestionChannel && scID !== '') {
            (suggestionChannel as TextChannel).send(submitEmbed);
        } else {
            owner.send(submitEmbed);
        }

        description = stripIndents`
        **Sugesstion successfully submitted!**
        
        *Thanks for helping to make me even better!*
        `;
        pageNr = 'submitted!'

        embed = await makeEmbed(message, client, description, pageNr);
        return msg.edit(embed);

    }
}


const makeEmbed = async function (message: Message, client: AkairoClient, description: string, pageNr: string) {

    let now: moment.Moment = moment.utc(Date.now());
    let nowDay: string = now.format('DD');

    const embed = new MessageEmbed({
        author: {
            name: `${client.user.tag} | SUGGESTION`,
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

const makeSuggestEmbed = async function (message: Message, client: AkairoClient, user: User, answers: string[]) {

    let now: moment.Moment = moment.utc(Date.now());
    let nowDay: string = now.format('DD');

    const embed = new MessageEmbed({
        author: {
            name: `${user.tag} | SUGGESTION`,
            icon_url: user.displayAvatarURL({ format: 'png', dynamic: true }),
            url: 'https://discord.gasper.fun'
        },
        color: message.guild ? message.member.displayHexColor : Math.floor(Math.random() * 12777214) + 1,
        fields: [
            {
                name: '⇒ Suggested Command(s)/Function(s)',
                value: answers[0]
            },
            {
                name: '⇒ Examples & Explanation',
                value: answers[1]
            }
        ],
        footer: {
            text: `${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
            iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true })
        }
    });

    return embed;
}