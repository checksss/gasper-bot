import {
    User,
    TextChannel,
    NewsChannel,
    MessageEmbed,
    Webhook,
    Guild
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
        embed: MessageEmbed
    ) {
        return await webhook
            .send(
                {
                    username: guild.me.displayName,
                    avatarURL: client.displayAvatarURL({ format: 'png', dynamic: true }),
                    embeds: [embed]
                }
            );
    }
}