import { Command, PrefixSupplier, Argument } from 'discord-akairo';
import { BitFieldResolvable, PermissionString, Message, Role, TextChannel, NewsChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import botConfig from '../../config/botConfig';
import validator from 'validator';

const bindOptions: string[] = ['mute', 'moderators', 'administrators'];

interface Permissions {
    [key: string]: BitFieldResolvable<PermissionString>
}
const permissions: Permissions = {
    'admin': 'ADMINISTRATOR',
    'invite': 'CREATE_INSTANT_INVITE',
    'kick': 'KICK_MEMBERS',
    'ban': 'BAN_MEMBERS',
    'manage-channels': 'MANAGE_CHANNELS',
    'manage-guild': 'MANAGE_GUILD',
    'reactions': 'ADD_REACTIONS',
    'auditlog': 'VIEW_AUDIT_LOG',
    'priority-speaker': 'PRIORITY_SPEAKER',
    'stream': 'STREAM',
    'view-channel': 'VIEW_CHANNEL',
    'send-msg': 'SEND_MESSAGES',
    'send-tts': 'SEND_TTS_MESSAGES',
    'manage-msg': 'MANAGE_MESSAGES',
    'embed': 'EMBED_LINKS',
    'files': 'ATTACH_FILES',
    'read-history': 'READ_MESSAGE_HISTORY',
    'mention-everyone': 'MENTION_EVERYONE',
    'emoji': 'USE_EXTERNAL_EMOJIS',
    'insights': 'VIEW_GUILD_INSIGHTS',
    'connect': 'CONNECT',
    'speak': 'SPEAK',
    'mute': 'MUTE_MEMBERS',
    'deafen': 'DEAFEN_MEMBERS',
    'move': 'MOVE_MEMBERS',
    'voice-activity': 'USE_VAD',
    'change-nick': 'CHANGE_NICKNAME',
    'manage-nicks': 'MANAGE_NICKNAMES',
    'manage-roles': 'MANAGE_ROLES',
    'manage-webhooks': 'MANAGE_WEBHOOKS',
    'manage-emoji': 'MANAGE_EMOJIS'
}

export default class SetRoleCommand extends Command {
    public constructor() {
        super('setrole', {
            aliases: ['setrole', 'roleset', 'newrole', 'createrole'],
            channel: 'guild',
            clientPermissions: 'MANAGE_ROLES',
            category: 'Administrator',
            description: {
                content: stripIndents`
                Manage roles of this server.
                Bind a role to a specific operation (e.g. mute).
                Create or delete roles.
                Valid methods:
                - \`create\`|\`add\`|\`make\` to create a new role [\`-n\` option required]
                <:empty:744513757962829845>=> can be combined with \`-o\` options to directly bind the role
                - \`delete\`|\`remove\`|\`rm\`|\`del\` to delete a role [\`-r\` option required]
                <:empty:744513757962829845>=> if the role is bound to an operation,
                <:empty:744513757962829845><:empty:744513757962829845>it will be removed automatically
                - \`set\`|\`bind\` to bind a role to an operation [\`r\` option and \`-o\` option required]

                Valid options:
                - \`-o mute\` to set a role as mute-role
                - \`-o moderators\` to add a role to mods
                - \`-o administrators\` to add a role to admins
                - \`-r <role>\` to define the role to bind, unbind or delete
                - \`-n <name>\` the name of the role to create
                `,
                usage: '<method> [-o <option>] [-r <role>] [-n <rolename>]',
                examples: ['create -o administrators -n "Badass Admin"']
            },
            args: [
                {
                    id: 'method',
                    type: Argument.union('lowercase', (_, phrase) => {

                        const createMethods: string[] = ['create', 'add', 'make'];
                        const deleteMethods: string[] = ['delete', 'remove', 'rm', 'del'];
                        const setMethods: string[] = ['set', 'bind'];

                        if (createMethods.includes(phrase)) return 'create';
                        if (deleteMethods.includes(phrase)) return 'delete';
                        if (setMethods.includes(phrase)) return 'set';
                        return null;
                    }),
                    prompt: {
                        start: (message: Message) => `${message.author}, please provide a method.`,
                        retry: (message: Message) => `${message.author}, please provide a __valid__ method.\n*Need help? Use \`help setrole\` to get a list of valid methods.*`,
                        retries: 1
                    }
                },
                {
                    id: 'option',
                    type: Argument.union('lowercase', (_, phrase) => {
                        if (bindOptions.includes(phrase)) return phrase;
                        return 'none';
                    }),
                    match: 'option',
                    flag: ['-o ']
                },
                {
                    id: 'role',
                    type: 'role',
                    match: 'option',
                    flag: ['-r '],
                    default: null
                },
                {
                    id: 'rolename',
                    type: 'string',
                    match: 'option',
                    flag: ['-n '],
                    default: 'none'
                }
            ]
        });
    }

    public async exec(message: Message, { method, option, role, rolename }: { method: string, option: string, role: Role, rolename: string }): Promise<Message | Message[]> {
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        if (option === 'administrators') {
            if (message.author.id !== guildOwner.id) {
                return message.util!.reply(`${message.author}, only the server owner is allowed to manage administrators!`).then(m => m.delete({ timeout: 5000 }));
            }
        }
        if (message.deletable && !message.deleted) message.delete();

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });

        let defaultAdmins: string[] = [guildOwner.id];

        for (var owner in botConfig.botOwner) {
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
        for (var owner in botConfig.botOwner) {
            defaultMods.push(owner);
        }
        //@ts-ignore
        let moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', defaultMods);
        //@ts-ignore
        if (moderators.length === 0) await this.client.guildsettings.set(message.guild!, 'config.moderators', defaultMods);
        botConfig.botOwner.forEach(o => {
            if (!moderators.includes(o)) {
                moderators.push(o);
            }
        })

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        var adminrole = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id))
        if (!administrators.includes(message.author!.id) && adminrole.size == 0) return message.util!.reply('only administrators can use this command.');

        if (method === 'create') {
            if (bindOptions.includes(option)) {
                let msg: Message = await message.util.reply(`${option.replace(/(\b\w)/gi, (lc): string => lc.toUpperCase())}-Role creation started... ${option === 'none' ? 'No valid option provided. I won\'t consider any options.' : ''}`);
                if (rolename === 'none') {
                    await msg.edit(`you didn't provide a rolename. Please do it now.\n*Note: I'll use only the first 50 characters of your answer!*`);
                    const nameResponses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
                    if (!nameResponses || nameResponses.size < 1) return message.edit('request timed out.').then(m => m.delete({ timeout: 5000 }));
                    const nameResponse = nameResponses.first();
                    if (nameResponse.deletable && !nameResponse.deleted) await nameResponse.delete();
                    await msg.edit(`Creating role \`${rolename}\`...`);
                    rolename = nameResponse.content.length > 50 ? nameResponse.content.slice(0, 50) : nameResponse.content;
                }
                let newRole = await message.guild.roles.create({
                    data: {
                        name: rolename,
                        hoist: false,
                        mentionable: false
                    },
                    reason: `${option.toUpperCase()}-Role | Created by ${message.author.tag}`
                })

                if (option === 'mute') {
                    newRole.setPosition(message.guild.me.roles.highest.position - 1);
                    message.guild.channels.cache.forEach(c => {
                        c.overwritePermissions([
                            {
                                type: 'role',
                                id: newRole.id,
                                deny: [
                                    'CREATE_INSTANT_INVITE',
                                    'CONNECT',
                                    'SEND_MESSAGES',
                                    'SEND_TTS_MESSAGES',
                                    'ADD_REACTIONS',
                                    'ATTACH_FILES',
                                    'DEAFEN_MEMBERS',
                                    'EMBED_LINKS',
                                    'MANAGE_MESSAGES',
                                    'MANAGE_WEBHOOKS',
                                    'PRIORITY_SPEAKER',
                                    'MUTE_MEMBERS',
                                    'DEAFEN_MEMBERS',
                                    'MOVE_MEMBERS',
                                    'USE_VAD',
                                    'VIEW_CHANNEL',
                                    'SPEAK',
                                    'READ_MESSAGE_HISTORY',
                                    'MENTION_EVERYONE',
                                    'USE_EXTERNAL_EMOJIS',
                                    'MANAGE_CHANNELS',
                                    'MANAGE_ROLES'
                                ]
                            }
                        ])
                    })
                }

                if (option === 'moderators') {
                    moderators.push(newRole.id);
                    if (message.guild.members.cache.get(this.client.user.id).permissions.has('MANAGE_MESSAGES')) {
                        await newRole.setPermissions(['MANAGE_MESSAGES'], `Created Mod-Role by ${message.author.tag}.`)
                    }
                    await msg.edit(`which color the role should have?\n*Please provide a **hex-color**. You can pick one from there: <https://www.colorcodehex.com/html-color-picker.html>*`);
                    const colResponses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
                    if (!colResponses || colResponses.size < 1) return msg.edit('request timed out.').then(m => m.delete({ timeout: 5000 }));
                    const colResponse = colResponses.first();
                    if (colResponse.deletable && !colResponse.deleted) colResponse.delete();
                    let rolecolor: string;
                    if (!validator.isHexColor(colResponse.content)) {
                        rolecolor = '';
                        message.util!.reply('invalid color. Must be a **hex-color**.\n*(https://www.colorcodehex.com/html-color-picker.html)*').then(m => m.delete({ timeout: 5000 }));
                    } else {
                        rolecolor = colResponse.content;
                    }
                    await newRole.setColor(rolecolor);
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, `config.${option}`, moderators);
                } else if (option === 'administrators') {
                    if (message.author.id !== guildOwner.id) {
                        newRole.delete(`Failed to create new ${option}-role.`)
                        return msg.edit(`only the server owner is allowed to set administrators!`).then(m => m.delete({ timeout: 5000 }));
                    }
                    administrators.push(newRole.id)
                    await msg.edit(`which color the role should have?\n*Please provide a **hex-color**. You can pick one from there: <https://www.colorcodehex.com/html-color-picker.html>*`);
                    const colResponses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
                    if (!colResponses || colResponses.size < 1) return msg.edit('request timed out.').then(m => m.delete({ timeout: 5000 }));
                    const colResponse = colResponses.first();
                    if (colResponse.deletable && !colResponse.deleted) colResponse.delete();
                    let rolecolor: string;
                    if (!validator.isHexColor(colResponse.content)) {
                        rolecolor = '';
                        message.util!.reply('invalid color. Must be a **hex-color**.\n*(https://www.colorcodehex.com/html-color-picker.html)*').then(m => m.delete({ timeout: 5000 }));
                    } else {
                        rolecolor = colResponse.content;
                    }
                    await newRole.setColor(rolecolor);
                    if (message.guild.members.cache.get(this.client.user.id).permissions.has('ADMINISTRATOR')) {
                        await newRole.setPermissions(['ADMINISTRATOR'], `Created Admin-Role by ${message.author.tag}.`);
                    }
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, `config.${option}`, administrators);
                } else {
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, `config.${option}-role`, newRole.id);
                }
                return msg.edit(`role \`${newRole.name}\` successfully created and added as ${option}-role!`);
            }

            let msg: Message = await message.util.reply('Role creation started...');
            rolename = rolename.length > 50 ? rolename.slice(0, 50) : rolename;
            if (rolename === 'none') {
                await msg.edit(`you didn't provide a rolename. Please do it now.\n*Note: I'll use only the first 50 characters of your answer!*`);
                const nameResponses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
                if (!nameResponses || nameResponses.size < 1) return message.edit('request timed out.').then(m => m.delete({ timeout: 5000 }));
                const nameResponse = nameResponses.first();
                if (nameResponse.deletable && !nameResponse.deleted) await nameResponse.delete();
                await msg.edit(`Creating role \`${rolename}\`...`);
                rolename = nameResponse.content.length > 50 ? nameResponse.content.slice(0, 50) : nameResponse.content;
            }
            await msg.edit(`which color the role should have?\n*Please provide a **hex-color**. You can pick one from there: <https://www.colorcodehex.com/html-color-picker.html>*`);
            const colResponses = await msg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 30000 });
            if (!colResponses || colResponses.size < 1) return msg.edit('request timed out.').then(m => m.delete({ timeout: 5000 }));
            const colResponse = colResponses.first();
            if (colResponse.deletable && !colResponse.deleted) colResponse.delete();
            let rolecolor: string;
            if (!validator.isHexColor(colResponse.content)) {
                rolecolor = '';
                message.util!.reply('invalid color. Must be a **hex-color**.\n*(https://www.colorcodehex.com/html-color-picker.html)*').then(m => m.delete({ timeout: 5000 }));
            } else {
                rolecolor = colResponse.content;
            }

            try {
                let newRole = await message.guild.roles.create({
                    data: {
                        name: rolename
                    },
                    reason: `${option}-Role | Created by ${message.author.tag}`
                })
                if (rolecolor !== '') {
                    await newRole.setColor(rolecolor);
                }
                return msg.edit(`${message.author}, role \`${newRole.name}\` successfully created!`)
                    .then(m => m.delete({ timeout: 5000 }));
            } catch (e) {
                if (e) {
                    console.log(e.stack);
                    return msg.edit(`Something went wrong...\n${e.stack}`)
                        .then(m => m.delete({ timeout: 5000 }));
                }
            }

        } else if (method === 'delete') {
            let fetchedRole = await message.guild!.roles.fetch(role.id);
            if (!fetchedRole) return message.util!.reply(`something went wrong...`).then(m => m.delete({ timeout: 5000 }));
            if (bindOptions.includes(option)) {
                //@ts-ignore
                await this.client.guildsettings.delete(message.guild!, `config.${option}-role`);
                return message.util!.reply(`${message.author}, role \`${role.name}\` successfully removed as ${option}-role!`).then(m => m.delete({ timeout: 5000 }));
            }
            if (option === 'administrators') {
                try {
                    let newAdmins: string[] = [];
                    administrators.forEach(m => {
                        if (m !== role.id) newAdmins.push(m);
                    });
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.administrators', newAdmins);
                    return message.util!.reply(`role \`${role.name}\` successfully removed as ${option}-role!`).then(m => m.delete({ timeout: 5000 }));
                } catch (e) {
                    return message.util!.reply('something went wrong.\n' + e.stack).then(m => m.delete({ timeout: 5000 }));
                }
            } else if (option === 'moderators') {
                try {
                    let newMods: string[] = [];
                    moderators.forEach(m => {
                        if (m !== role.id) newMods.push(m);
                    });
                    //@ts-ignore
                    await this.client.guildsettings.set(message.guild!, 'config.moderators', newMods);
                    return message.util!.reply(`role \`${role.name}\` successfully removed as ${option}-role!`).then(m => m.delete({ timeout: 5000 }));
                } catch (e) {
                    return message.util!.reply('something went wrong.\n' + e.stack).then(m => m.delete({ timeout: 5000 }));
                }
            };

            await role.delete(`Deleted by ${message.author.tag}`);
            //@ts-ignore
            await this.client.guildsettings.delete(message.guild!, `config.${option}-log`);
            let newMods: string[] = [];
            moderators.forEach((m) => {
                if (m !== role.id) {
                    newMods.push(m);
                }
            })
            let newAdmins: string[] = [];
            administrators.forEach((a) => {
                if (a !== role.id) {
                    newAdmins.push(a);
                }
            })
            if (option === 'moderators') {
                //@ts-ignore
                await this.client.guildsettings.set(message.guild!, `config.moderators`, newMods);
            }
            if (option === 'administrators') {
                //@ts-ignore
                await this.client.guildsettings.set(message.guild!, `config.administrators`, newAdmins);
            }

            return message.util!.reply(`successfully deleted role \`${role.name}\`.`).then(m => m.delete({ timeout: 5000 }));
        } else {
            if (option === 'moderators') {
                moderators.push(role.id);
                //@ts-ignore
                await this.client.guildsettings.set(message.guild!, `config.${option}`, moderators);
            } else if (option === 'administrators') {
                administrators.push(role.id);
                //@ts-ignore
                await this.client.guildsettings.set(message.guild!, `config.${option}`, administrators);
            } else {
                //@ts-ignore
                await this.client.guildsettings.set(message.guild!, `config.${option}-role`, role.id);
            }
            return message.util!.reply(`role \`${role.name}\` successfully added as ${option}-role!`).then(m => m.delete({ timeout: 5000 }));
        }
    }
}

