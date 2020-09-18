import {
  Command,
  AkairoClient
} from 'discord-akairo';
import {
  Message,
  TextChannel,
  MessageEmbed,
  Webhook
} from 'discord.js';
import moment from 'moment';
import util from 'util';
const wait = util.promisify(setTimeout);
import validator from 'validator';
import url from 'url';
import wh from '../../structures/webHook'

export default class QuoteCommand extends Command {
  public constructor() {
    super('quote', {
      aliases: ['quote', 'qt'],
      category: 'Util',
      description: {
        content: 'Better than the Discord-Quotes.',
        examples: ['https://discord.com/channels/<server-id>/<channel-id>/message-id> answer'],
        usages: 'quote <message-url> [answer]',
      },
      ratelimit: 3,
    });
  }

  public async exec(message: Message) {

    let authorAvatarURL: string = message.author.displayAvatarURL({ "dynamic": true });

    let args: string[] = message.content.split(" ");

    try {
      message.delete();
      let channelID: string;
      let messageID: string;
      let guildID: string;
      let guildInfo: string = "";
      let subdomain: string;

      function splitURL(subdomain: string, client: AkairoClient, message: Message): string[] {
        let ID_split_0 = args[1].toLowerCase().replace(new RegExp(`https://${subdomain}discord.com/channels/`, 'g'), "0/").split("/");
        let ID_split_1 = args[1].toLowerCase().replace(new RegExp(`https://${subdomain}discordapp.com/channels/`, 'g'), "1/").split("/");
        var ID_split: string[];
        if (ID_split_0[0] == '0' && ID_split_1[0] != '1') {
          ID_split = ID_split_0;
        } else if (ID_split_0[0] != '0' && ID_split_1[0] == '1') {
          ID_split = ID_split_1;
        } else {
          message.util.reply(`there was an invalid hostname in this Link: <${args[1].toLowerCase()}>`);
          ID_split = [''];
        };
        if (ID_split[1] != message.guild.id && ID_split[1] != message.guild.id) {
          if (client.guilds.cache.get(ID_split[1]) != undefined && client.guilds.cache.get(ID_split[1]) != null) {
            guildInfo = `@${client.guilds.cache.get(ID_split[1]).name}`;
          } else {
            ID_split = [''];
          }
        }
        return ID_split;
      }

      function sendWebhook(webhook: Webhook, nembed: MessageEmbed, msg: Message) {
        webhook.send({
          username: message.member.displayName,
          avatarURL: authorAvatarURL,
          embeds: [nembed]
        }).then(() => {
          if (otherAttachment != "") {
            webhook.send({
              username: message.member.displayName,
              avatarURL: authorAvatarURL,
              files: [otherAttachment]
            }).then(() => {
              msg.embeds.forEach(aembed => {
                let bembed = new MessageEmbed(aembed);
                webhook.send({
                  username: message.member.displayName,
                  avatarURL: authorAvatarURL,
                  embeds: [bembed]
                })
              })
            }).catch(e => {
              if (e) console.log(e);
            })
          } else {
            msg.embeds.forEach(aembed => {
              let bembed = new MessageEmbed(aembed);
              webhook.send({
                username: message.member.displayName,
                avatarURL: authorAvatarURL,
                embeds: [bembed]
              }).catch(e => {
                if (e) console.log(e);
              });
            })
          }
        }).catch(e => {
          if (e) console.log(e);
        });
      }

      if (validator.isURL(args[1].toLowerCase())) {
        let hostnameurl: string = url.parse(args[1].toLowerCase()).hostname;

        if (hostnameurl == 'discord.com' || hostnameurl == 'discordapp.com') {
          subdomain = "";
          var ID = splitURL(subdomain, this.client, message);
          if (ID[1] == "") return message.util.reply(`there was an invalid server-id in this Link: <${args[1].toLowerCase()}>`);
          guildID = ID[1];
          channelID = ID[2];
          messageID = ID[3];
        } else if (hostnameurl == 'ptb.discord.com' || hostnameurl == 'ptb.discordapp.com') {
          subdomain = "ptb.";
          var ID = splitURL(subdomain, this.client, message);
          if (ID[1] == "") return message.util.reply(`there was an invalid server-id in this Link: <${args[1].toLowerCase()}>`);
          guildID = ID[1];
          channelID = ID[2];
          messageID = ID[3];
        } else if (hostnameurl == 'canary.discord.com' || hostnameurl == 'canary.discordapp.com') {
          subdomain = "canary.";
          var ID = splitURL(subdomain, this.client, message);
          if (ID[1] == "") return message.util.reply(`there was an invalid server-id in this Link: <${args[1].toLowerCase()}>`);
          guildID = ID[1];
          channelID = ID[2];
          messageID = ID[3];
        } else {
          return message.util.reply(`there was an invalid hostname in this Link: <${args[1].toLowerCase()}>`);
        }
      } else {
        return message.util.reply(`that was not a valid URL: <${args[1].toLowerCase()}>`);
      }

      let msg: Message = await (this.client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel).messages.fetch(messageID);
      const nembed = new MessageEmbed();
      let otherAttachment: string;
      let username: string;
      let userColor: string;

      if (msg.member != undefined && msg.member != null) {
        username = msg.member.displayName;
        userColor = msg.member.displayHexColor;
      } else {
        username = msg.author.username;
        userColor = "";
      }
      nembed.setColor(userColor);

      if (msg.content != undefined && msg.content != null && msg.content != "") {
        nembed.setDescription(msg.content);
      }
      if (msg.editedAt != null) {

        let editdate: moment.Moment = moment.utc(msg.editedTimestamp);
        let editday: string = editdate.format('DD');

        nembed.setAuthor(`${username} - #${(msg.channel as TextChannel).name}${guildInfo} - ${editdate.format(`${parseInt(editday) === 1 ? `${editday}[st]` : `${parseInt(editday) === 2 ? `${editday}[nd]` : `${parseInt(editday) === 3 ? `${editday}[rd]` : `${parseInt(editday) === 21 ? `${editday}[st]` : `${parseInt(editday) === 22 ? `${editday}[nd]` : `${parseInt(editday) === 23 ? `${editday}[rd]` : `${parseInt(editday) === 31 ? `${editday}[st]` : `${editday}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`, msg.author.displayAvatarURL({
          "dynamic": true
        }), args[1].toLowerCase());
      } else {

        let createdate: moment.Moment = moment.utc(msg.createdTimestamp);
        let createDay: string = createdate.format('DD');

        nembed.setAuthor(`${username} - #${(msg.channel as TextChannel).name}${guildInfo} - ${createdate.format(`${parseInt(createDay) === 1 ? `${createDay}[st]` : `${parseInt(createDay) === 2 ? `${createDay}[nd]` : `${parseInt(createDay) === 3 ? `${createDay}[rd]` : `${parseInt(createDay) === 21 ? `${createDay}[st]` : `${parseInt(createDay) === 22 ? `${createDay}[nd]` : `${parseInt(createDay) === 23 ? `${createDay}[rd]` : `${parseInt(createDay) === 31 ? `${createDay}[st]` : `${createDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`, msg.author.displayAvatarURL({
          "dynamic": true
        }), args[1].toLowerCase());
      }

      if ((msg.attachments).array()[0] != undefined && (msg.attachments).array()[0].url != null) {
        if ((msg.attachments).array()[0].url.endsWith(".png") || (msg.attachments).array()[0].url.endsWith(".jpg") || (msg.attachments).array()[0].url.endsWith(".jpeg") || (msg.attachments).array()[0].url.endsWith(".gif")) {
          nembed.setImage((msg.attachments).array()[0].url);
        } else {
          otherAttachment = (msg.attachments).array()[0].url;
        }
      }

      (message.channel as TextChannel).fetchWebhooks().then(async hooks => {
        let webhook = await wh.get('mute', this.client.user, message.channel as TextChannel);
        if(!webhook) {
            webhook = await wh.create('mute', this.client.user, message.channel as TextChannel);
          sendWebhook(webhook, nembed, msg);
        } else {
          sendWebhook(webhook, nembed, msg);
        }
        wait(1000).then(() => {
          if (args.length >= 2) {
            webhook.send(args.slice(2).join(" "), {
              username: message.member.displayName,
              avatarURL: authorAvatarURL
            }).catch(e => {
              if (e) console.log(e);
            })
          }
        }).catch(e => {
          if (e) console.log(e);
        })
      }).catch(e => {
        if (e) console.log(e);
      })
    } catch (e) {
      if (e) console.log(e);
    };

  }
}