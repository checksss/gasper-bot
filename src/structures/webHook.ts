import {
    User,
    TextChannel,
    NewsChannel,
    MessageEmbed,
    Webhook,
    Guild
} from "discord.js";

export default {
    async create(
        whType: string,
        client: User,
        channel: TextChannel | NewsChannel,
    ) {
        let webhook: Webhook =
            await channel
                .createWebhook(
                    `${channel.name}-${client.username.toLowerCase()}-${whType}-log`,
                    {
                        avatar: client.displayAvatarURL({ format: 'png', dynamic: true }),
                        reason: `Logging ${whType} enabled in this channel.`
                    }
                )
        return webhook;
    },
    async get(
        whType: string,
        client: User,
        channel: TextChannel | NewsChannel
    ) {
        let webhook: Webhook =
            (await channel
                .fetchWebhooks())
                .filter(w => w.name === `${channel.name}-${client.username.toLowerCase()}-${whType}-log`)
                .first();
        return webhook;
    },
    async send(
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