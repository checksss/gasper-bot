import { Command } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';
import { TextChannel } from 'discord.js';

interface HumanLevels {
    [key: string]: string;
}
interface GuildFeatures {
    [key: string]: string;
}

const HUMAN_LEVELS: HumanLevels = {
    'NONE': '[0] None',
    'LOW': '[1] Low',
    'MEDIUM': '[2] Medium',
    'HIGH': '[3] High\n(╯°□°）╯︵ ┻━┻',
    'VERY_HIGH': '[4] Highest\n┻━┻ ﾐヽ(ಠ益ಠ)ノ彡┻━┻'
};

const GUILD_FEATURES: GuildFeatures = {
    'ANIMATED_ICON': 'Animated Icon',
    'BANNER': 'Banner',
    'COMMERCE': 'Commerce',
    'COMMUNITY': 'Community',
    'DISCOVERABLE': 'Discoverable',
    'FEATUREABLE': 'Featurable',
    'INVITE_SPLASH': 'Splash Invite',
    'NEWS': 'News Channel',
    'PARTNERED': 'Partnered',
    'VANITY_URL': 'Vanity URL',
    'VIP_REGIONS': 'VIP Server Regions',
    'WELCOME_SCREEN_ENABLED': 'Welcome Screen'
}

export default class ServerInfoCommand extends Command {
    public constructor() {
        super('server', {
            aliases: ['server', 'server-info', 'serverinfo', 'guild', 'guild-info', 'guildinfo'],
            description: {
                content: 'Gets info about a server',
            },
            category: 'Info',
            channel: 'guild',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2
        });
    }

    public async exec(message: Message): Promise<Message | Message[]> {

        let guilddate: moment.Moment = moment.utc(message.guild!.createdAt);
        let dateDay: string = guilddate.format('DD');

        let guildFeatures: string[] = message.guild!.features.map((f, k): string => `• ${GUILD_FEATURES[f]}\n`)
        let guildBanner: string = message.guild.features.filter((f) => GUILD_FEATURES[f] === 'Banner').length > 0 ? message.guild.bannerURL({ format: 'png', size: 4096 }) : '';
        let guildSplash: string = message.guild.features.filter((f) => GUILD_FEATURES[f] === 'Splash Invite').length > 0 ? message.guild.splashURL({ format: "png", size: 4096 }) : '';
        let vanityURL: string = message.guild.features.filter((f) => GUILD_FEATURES[f] === 'Vanity URL').length > 0 ? `https://discord.gg/${message.guild.vanityURLCode}/` : '';

        const on: string = '🟢';
        const off: string = '⚪';
        const dnd: string = '🔴';
        const afk: string = '🟡';

        var onMembers: number = message.guild.members.cache.filter((m) => m.user.presence.status === 'online' && !m.user.bot).size;
        var offMembers: number = message.guild.members.cache.filter((m) => m.user.presence.status === 'offline' && !m.user.bot).size;
        var dndMembers: number = message.guild.members.cache.filter((m) => m.user.presence.status === 'dnd' && !m.user.bot).size;
        var afkMembers: number = message.guild.members.cache.filter((m) => m.user.presence.status === 'idle' && !m.user.bot).size;

        let adminRoleString: string = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).sort((r1, r2) => r2.comparePositionTo(r1)).map((roles): string => `\n<:empty:744513757962829845><:empty:744513757962829845>• <@&${roles.id}>`).join(' ')
        let adminRoleSize: number = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).size;

        const guildOwner = await message.guild!.members.fetch(message.guild!.ownerID);
        const embed = new MessageEmbed()
            .setColor(guildOwner.displayColor)
            .setAuthor(`${message.guild!.name}`, message.guild!.iconURL({ dynamic: true, format: "png" }))
            .setDescription(`(ID: ${message.guild!.id}${guildSplash !== '' ? `, [Splash](${guildSplash})` : ''})`)
            .addField(
                '⇒ Channels',
                stripIndents`
                • ${message.guild!.channels.cache.filter((ch): boolean => ch.type === 'text').size} Text (${message.guild!.channels.cache.filter((ch) => (ch as TextChannel).nsfw).size} NSFW)
                • ${message.guild!.channels.cache.filter((ch): boolean => ch.type === 'voice').size} Voice
                ${message.guild!.afkChannelID ? `• AFK: <#${message.guild!.afkChannelID}> after ${message.guild!.afkTimeout / 60}min` : `• AFK-Timeout: ${message.guild!.afkTimeout ? `${message.guild!.afkTimeout / 60}min` : ''}`}
                • Categories: ${message.guild!.channels.cache.filter((ch): boolean => ch.type === 'category').size}
            `, true)
            .addField(
                '⇒ Members',
                stripIndents`
                • ${message.guild!.members.cache.size} members
                <:empty:744513757962829845>• ${message.guild!.members.cache.filter((m) => m.user.bot).size} bots
                <:empty:744513757962829845>• ${message.guild!.members.cache.filter((m) => !m.user.bot).size} humans
                • Owner: ${guildOwner}
                <:empty:744513757962829845>• ID: ${guildOwner.id}
                <:empty:744513757962829845>• Tag: ${guildOwner.user.tag}
            `, true)
            .addField('<:empty:744513757962829845>', '<:empty:744513757962829845>', true)
            .addField(
                '⇒ Features',
                stripIndents`
                ${guildFeatures.length > 0 ? `${message.guild!.features.map((f, k): string => `• ${GUILD_FEATURES[f]}\n`).join(' ')}${message.guild.verified ? `\n• Verified` : ''}` : '• No Features'}
            `, true)
            .addField(
                '⇒ Nitro Boosts',
                stripIndents`
                ${message.guild!.premiumSubscriptionCount > 0 ? stripIndents`
                • Boost tier: ${message.guild!.premiumTier}
                • Total boosts: ${message.guild!.premiumSubscriptionCount}
                ${message.guild!.premiumTier === 1 ? `• Perks:
                <:empty:744513757962829845>• 100 Emoji Slots
                <:empty:744513757962829845>• 128kbps max audio quality
                <:empty:744513757962829845>• High Quality Streaming` : `${message.guild!.premiumTier === 2 ? `• Perks:
                <:empty:744513757962829845>• 150 Emoji Slots
                <:empty:744513757962829845>• 256kbps max audio quality
                <:empty:744513757962829845>• 50 MB upload limit
                <:empty:744513757962829845>• 1080p @ 60fps Streaming` : `${message.guild!.premiumTier === 3 ? `• Perks:
                <:empty:744513757962829845>• 250 Emoji Slots
                <:empty:744513757962829845>• 384kbps max audio quality
                <:empty:744513757962829845>• 100 MB upload limit
                <:empty:744513757962829845>• 1080p @ 60fps Streaming` : `• No Perks`}`}`}
                ` : '• Not boosted yet.'}
            `, true)
            .addField('<:empty:744513757962829845>', '<:empty:744513757962829845>', true)
            .addField(
                '⇒ Other',
                stripIndents`
                • Roles: ${message.guild!.roles.cache.size}
                <:empty:744513757962829845>• Admin Roles: ${adminRoleSize > 0 && adminRoleString.length < 768 ? `(${adminRoleSize})${adminRoleString}` : `${adminRoleSize}`}
                • Region: ${message.guild!.region}
                • Created at: ${guilddate.format(`${parseInt(dateDay) === 1 ? `${dateDay}[st]` : `${parseInt(dateDay) === 2 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 3 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 21 ? `${dateDay}[st]` : `${parseInt(dateDay) === 22 ? `${dateDay}[nd]` : `${parseInt(dateDay) === 23 ? `${dateDay}[rd]` : `${parseInt(dateDay) === 31 ? `${dateDay}[st]` : `${dateDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}
                • Verification Level: ${HUMAN_LEVELS[message.guild!.verificationLevel]}
            `)


        let now: moment.Moment = moment.utc(Date.now());
        let nowDay: string = now.format('DD');

        embed.setFooter(`Members by Status: ${onMembers > 0 ? `${on} ${onMembers} ✧ ` : ''}${afkMembers > 0 ? `${afk} ${afkMembers} ✧ ` : ''}${dndMembers > 0 ? `${dnd} ${dndMembers} ✧ ` : ''}${offMembers > 0 ? `${off} ${offMembers} ✧ ` : ''}${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`)



        if (guildBanner !== '') embed.setImage(guildBanner);
        if (vanityURL !== '') embed.setAuthor(`${message.guild!.name}`, message.guild!.iconURL({ dynamic: true, format: "png" }), vanityURL);

        return message.util!.send(embed).catch(e => { if (e) return message.util!.send('something went wrong') });
    }
}