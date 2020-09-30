import { AkairoClient } from 'discord-akairo';
import {
    User,
    TextChannel,
    NewsChannel,
    MessageEmbed,
    Webhook,
    Guild,
    Message,
    WebhookMessageOptions
} from "discord.js";

export default class wh {
    private static async create(
        whType: string,
        client: User,
        channel: TextChannel | NewsChannel,
    ) {
        let webhook: Webhook =
            await channel
                .createWebhook(
                    `${client.username.toLowerCase()}-${whType}-${channel.name}`,
                    {
                        avatar: client.displayAvatarURL({ format: 'png', dynamic: true }),
                        reason: `Logging ${whType} enabled in this channel.`
                    }
                ).catch(async e => {
                    if (e) {
                        (await channel
                            .fetchWebhooks())
                            .filter(w => {
                                var owner: User = w.owner as User;
                                var whClient = w.client
                                if (!owner && owner.id !== client.id) return whClient.user.id === client.id;
                                return owner.id === client.id
                            })
                            .first()
                            .delete('Webhook-Limit reached!');
                        return await channel
                            .createWebhook(
                                `${client.username.toLowerCase()}-${whType}-${channel.name}`,
                                {
                                    avatar: client.displayAvatarURL({ format: 'png', dynamic: true }),
                                    reason: `Logging ${whType} enabled in this channel.`
                                }
                            )
                    }
                })
        return webhook;
    }
    public static async get(
        whType: string,
        client: User,
        channel: TextChannel | NewsChannel
    ) {
        let webhook: Webhook =
            (await channel
                .fetchWebhooks())
                .filter(w => w.name === `${client.username.toLowerCase()}-${whType}-${channel.name}`)
                .first();
        if (!webhook) {
            webhook = await wh.create(whType, client, channel);
        }
        return webhook;
    }
    public static async send(
        webhook: Webhook,
        guild: Guild,
        client: User,
        embed: MessageEmbed,
        options?: WebhookMessageOptions
    ) {
        if (!options) {
            options = {
                username: guild.me.displayName,
                avatarURL: client.displayAvatarURL({ format: 'png', dynamic: true })
            }
        }
        options.embeds = [embed];
        return await webhook
            .send(options);
    }
    public static async sensitivePatterns(str: string, client: AkairoClient, message: Message, action?: string) {
        switch (action) {
            case 'hide':
                return str
                    .replace(new RegExp(`${client.token}`, 'g'), '--snip--')
                    .replace(new RegExp(`${message.guild.id}`, 'g'), ' %gid ')
                    .replace(new RegExp("'", 'g'), ' %sq ')
                    .replace(new RegExp('"', 'g'), ' %dq ')
                    .replace(new RegExp("```", 'g'), ' %tbt ')
                    .replace(new RegExp("`", 'g'), ' %bt ')
                    .replace(new RegExp('\\*\\*', 'g'), ' %b ')
                    .replace(new RegExp('\\*', 'g'), ' %i ')
                    .replace(new RegExp('__', 'g'), ' %ul ')
                    .replace(new RegExp('_', 'g'), ' %i ')
                    .replace(new RegExp('\\n', 'g'), ' %n ')
                    .replace(new RegExp('\\[', 'g'), ' %obr ')
                    .replace(new RegExp('\\]', 'g'), ' %cbr ')
                    .replace(new RegExp("\\?", 'g'), ' %qm ');
            default:
                return str
                    .replace(new RegExp(`${client.token}`, 'g'), '--snip--')
                    .replace(new RegExp(' %gid ', 'g'), `${message.guild.id}`)
                    .replace(new RegExp(' %sq ', 'g'), "'")
                    .replace(new RegExp(' %dq ', 'g'), '"')
                    .replace(new RegExp(' %tbt ', 'g'), "```")
                    .replace(new RegExp(' %bt ', 'g'), "`")
                    .replace(new RegExp(' %b ', 'g'), '**')
                    .replace(new RegExp(' %i ', 'g'), '*')
                    .replace(new RegExp(' %ul ', 'g'), '__')
                    .replace(new RegExp(' %n ', 'g'), '\n')
                    .replace(new RegExp(' %obr ', 'g'), '[')
                    .replace(new RegExp(' %cbr ', 'g'), ']')
                    .replace(new RegExp(' %qm ', 'g'), "?");
        }
    }
}