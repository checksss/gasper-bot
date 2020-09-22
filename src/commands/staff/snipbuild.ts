import { stripIndents } from 'common-tags';
import { Command, Argument } from 'discord-akairo';
import { MessageReaction, MessageEmbed, User, Message, Channel, TextChannel } from 'discord.js';
import botConfig from '../../config/botConfig';

export default class SnipbuildCommand extends Command {
    public constructor() {
        super('snipbuild', {
            aliases: ['snipbuild', 'customembed', 'snippet', 'snip', 'embed'],
            description: {
                content: 'Design custom embeds for server staff members',
                usage: ['<method> <name> [c=<channel>]'],
                examples: ['create welcome', 'send c=#general']
            },
            category: 'Staff',
            ratelimit: 2,
            args: [
                {
                    id: 'method',
                    match: 'phrase',
                    type: Argument.union('string', async (_, phrase) => {
                        let validMethods: string[] = ['create', 'edit', 'delete', 'send'];
                        if (validMethods.includes(phrase)) return phrase;
                        return null;
                    }),
                    prompt: {
                        start: (msg: Message) => `${msg.author}, do you wish to \`create\`, \`edit\`, \`delete\` or just \`send\` a snippet?`,
                        retry: (msg: Message) => `${msg.author}, please provide a __valid__ method.\n*Do you wish to \`create\`, \`edit\`, \`delete\` or just \`send\` a snippet?*`
                    }
                },
                {
                    id: 'name',
                    match: 'phrase',
                    type: 'string',
                    prompt: {
                        start: (msg: Message) => `${msg.author}, please provide at least the name of your snippet.`
                    }
                },
                {
                    id: 'channel',
                    match: 'option',
                    type: 'channel',
                    flag: ['-c', 'c='],
                    prompt: {
                        retry: (msg: Message) => `${msg.author}, please provide a __valid__ channel.`,
                        start: (msg: Message) => `${msg.author}, please provide a channel.`
                    }
                },
            ]
        });
    }

    public async exec(message: Message, { method, name, channel }: { method: string, name: string, channel: Channel }): Promise<Message | Message[]> {

        if (message.deletable && !message.deleted) await message.delete();

        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        const owners: string[] = this.client.ownerID as string[]

        let textChannel = channel as TextChannel;

        if (message.author.id !== this.client.ownerID && !message.guild.channels.cache.has(channel.id)) return message.reply('I don\'t think that other servers will like this.\n' + (channel as TextChannel).name)

        let defaultAdmins: string[] = [guildOwner.id];
        for (var owner in owners) {
            defaultAdmins.push(owner);
        }
        //@ts-ignore
        let administrators: string[] = await this.client.guildsettings.get(message.guild!, 'config.administrators', defaultAdmins);
        defaultAdmins.forEach(dA => {
            if (!administrators.includes(dA)) {
                administrators = administrators.concat(dA);
            }
        })

        let adminRoles: string[] = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).map((roles): string => `${roles.id}`);
        let defaultMods: string[] = adminRoles.concat(guildOwner.id);
        for (var owner in owners) {
            defaultMods.push(owner);
        }

        //@ts-ignore
        let moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', defaultMods);
        owners.forEach(o => {
            if (!moderators.includes(o)) {
                moderators.push(o);
            }
        })

        let defaultStaff: string[] = []
        for (let m in moderators) {
            defaultStaff.push(m);
        }
        for (let a in administrators) {
            defaultStaff.push(a);
        }
        //@ts-ignore
        let staff: string[] = await this.client.guildsettings.get(message.guild!, 'config.staff', [])
        if (staff.length === 0) {
            staff = defaultStaff
            //@ts-ignore
            this.client.guildsettings.set(message.guild!, 'config.staff', staff);
        }

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var modrole = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id))
        var staffrole = authorMember.roles.cache.filter((r): boolean => staff.includes(r.id))
        if (
            !moderators.includes(message.author!.id) &&
            modrole.size == 0 &&
            !staff.includes(message.author!.id) &&
            staffrole.size == 0 &&
            message.author.id != this.client.ownerID
        ) return message.util!.reply('You\'re not allowed to use custom embeds and snipbuilds.');

        switch (method) {
            case 'create':
                let msg = await MainMenu(textChannel, message.author, this.client.user, method, name);
            case 'edit':

            case 'delete':

            default:

        }
    }
}

async function MainMenu(channel: TextChannel, user: User, client: User, method: string, name: string) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild [${method.toUpperCase()}-${name.toUpperCase()}]`,
        description: `${method === 'create' ? stripIndents`
        #Create custom embed

        :one: => Set Title
        :two: => Set Color
        :three: => Set Description
        :four: => Add Field
        :five: => Set Footer
        :six: => Set Image / Thumbnail
        ` : `${method === 'edit' ? stripIndents`
        #Edit custom embed

        :one: => Edit Title
        :two: => Edit Color
        :three: => Edit Description
        :four: => Edit Fields
        :five: => Edit Footer
        :six: => Set Image / Thumbnail
        :seven: => Change Name
        ` : `${method === 'delete' ? stripIndents`
        #Do you really want to delete ${name} ?

        ✅ => Confirm
        ❎ => Cancel
        ` : `Snippet sent.`}`}`}`,
        footer: {
            icon_url: client.displayAvatarURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ ${method.toUpperCase()} | ${name}`
        }
    })

    let msg = await channel.send(embed);
    if (method != 'delete') {
        await msg.react(':one:');
        await msg.react(':two:');
        await msg.react(':three:');
        await msg.react(':four:');
        await msg.react(':five:');
        await msg.react(':six:');
        if (method === 'edit') await msg.react(':seven:');
    } else {
        await msg.react('✅');
        await msg.react('❎');
    }
    const reactions = await msg.awaitReactions((r: MessageReaction) => r.users.cache.first().id === user!.id, { max: 1, time: 10000 });
    if (reactions.size > 0) {
        await msg.reactions.removeAll();
    }
}

async function titleManager(msg: Message, method: string, name: string, user: User, client: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild [${method.toUpperCase()}-${name.toUpperCase()}]`,
        description: `${method === 'create' ? stripIndents`
        #Set Title

        Provide a title now.
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        #Edit Title

        You can now change the title.
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: client.displayAvatarURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ ${method.toUpperCase()} | ${name}`
        }
    })
}