import { stripIndents } from 'common-tags';
import { Command, Argument, AkairoClient } from 'discord-akairo';
import {
    MessageReaction,
    MessageEmbed,
    User,
    Message,
    Channel,
    TextChannel,
    MessageEmbedImage,
    NewsChannel,
    MessageEmbedThumbnail,
    MessageEmbedFooter,
    EmbedField
} from 'discord.js';
import validator from 'validator';
import Staff from '../../structures/Staffmembers';
import wh from '../../structures/webHook';

const numberEmojis: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
const checkEmojis: string[] = ['✅', '❎']

export default class SnipbuildCommand extends Command {
    public constructor() {
        super('snipbuild', {
            aliases: ['snipbuild', 'customembed', 'snippet', 'snip', 'embed'],
            description: {
                content: stripIndents`
                Design custom embeds for server staff members
                
                Use \`create\` method to create new snippet
                Use \`edit\` method to edit existing snippet
                Use \`delete\` do delete existing snippet
                Use \`send\` to send it to the channel, specified by \`c=#channel\` or \`-c #channel\`
                Use \`list\` to list all available snipbuilds for this server`,
                usage: ['<method> <name> [c=<channel>]'],
                examples: ['create welcome', 'send greet c=#general']
            },
            category: 'Staff',
            channel: 'guild',
            clientPermissions: ['MANAGE_WEBHOOKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'method',
                    match: 'phrase',
                    type: Argument.union('string', async (_, phrase) => {
                        let method: string = '';

                        let validMethods: string[] = ['create', 'edit', 'delete', 'send'/*, 'list'*/];
                        if (validMethods.includes(method !== '' ? method : phrase)) return method;
                        return null;
                    }),
                    prompt: {
                        start: (msg: Message) => `${msg.author}, do you wish to \`create\`, \`edit\`, \`delete\` or just \`send\` a snippet or just \`send\` a snippet or just want a \`list\` of them?`,
                        retry: (msg: Message) => `${msg.author}, please provide a __valid__ method.\n*Do you wish to \`create\`, \`edit\`, \`delete\` or just \`send\` a snippet or just want a \`list\` of them?*`
                    }
                },
                {
                    id: 'name',
                    match: 'phrase',
                    type: 'lowercase',
                    prompt: {
                        start: (msg: Message) => `${msg.author}, please provide at least the name of your snippet.`
                    }
                },
                {
                    id: 'channel',
                    match: 'option',
                    type: Argument.union('channel', async (msg, phrase) => {

                        // This is needed to avoid asking for a channel, when none is necessary.

                        let channel: Channel =
                            msg.guild.channels.cache
                                .filter((ch) =>
                                    ch.name === phrase ||
                                    ch.id === phrase ||
                                    phrase === `<#${ch.id}>` ||
                                    phrase === `#${ch.name}`
                                ).first();
                        if (phrase === '' || !phrase) return msg.channel;
                        return channel;
                    }),
                    flag: ['-c ', 'c='],
                    prompt: {
                        retry: (msg: Message) => `${msg.author}, please provide a __valid__ channel.`,
                        start: (msg: Message) => `${msg.author}, please provide a channel.`
                    }
                }/*,
                {
                    id: 'status',
                    match: 'option',
                    type: 'string',
                    flag: ['-s ', 's='],
                    default: 'public'
                }*/
            ]
        });
    }

    public async exec(message: Message, { method, name, channel/*, status*/ }: { method: string, name: string, channel: Channel/*, status: string*/ }): Promise<Message | Message[]> {

        if (message.deletable && !message.deleted) await message.delete();

        const owners: string[] = this.client.ownerID as string[]

        if (!owners.includes(message.author.id) && !message.guild.channels.cache.has(channel.id)) return message.reply('I don\'t think that other servers will like this.\n' + (channel as TextChannel).name)

        let isStaff: boolean = await Staff.check(this.client, message.guild, message.member);
        if (!isStaff) return message.util!.reply('only staff members can use this command.');

        const authorMember = await message.guild!.members.fetch(message.author!.id);

        name = await wh.sensitivePatterns(name, this.client, message);

        //@ts-ignore
        let titleRaw: string = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.title`, '');
        if (titleRaw == '' && method == 'send') {
            return message.util!.reply(`No such snippet \`${name}\`.`)
                .then(async m => {
                    return await m.delete({ timeout: 5000 })
                });
        } else if (titleRaw !== '' && method == 'create') {
            let confirmationMsg: Message = await message.util!.reply(`there already exists a snipbuild with the name \`${name}\` for this server.\nDo you want to edit it? Y/N`);
            let responses = await confirmationMsg.channel.awaitMessages((r: Message) => r.author!.id === authorMember!.id, { max: 1, time: 10000 });
            if (!responses || responses.size < 1) return message.util!.reply('request timed out.')
                .then(async m => {
                    return await m.delete({ timeout: 5000 })
                });
            const response = responses.first();
            if (response.deletable && !response.deleted) response.delete();
            if (/^y(?:e(?:a|s)?)?$/i.test(response!.content)) {
                confirmationMsg.edit(`changed method to \`edit\`.`).then(m => m.delete({ timeout: 5000 }));
                method = 'edit';
            } else {
                return confirmationMsg.edit(`cancelled.`).then(m => m.delete({ timeout: 5000 }));
            }
        } else if (titleRaw !== '' && method == 'send') {
            let title = await wh.sensitivePatterns(titleRaw, this.client, message);
            //@ts-ignore
            let col: string = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.color`, '');
            //@ts-ignore
            let descrRaw: string = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.description`, '');
            let descr: string = await wh.sensitivePatterns(descrRaw, this.client, message);

            //@ts-ignore
            let fields: EmbedField[] = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.fields`, []);
            if (fields !== []) fields.forEach(async (f, k) => {
                let restoredField: EmbedField = {
                    name: await wh.sensitivePatterns(f.name, this.client, message),
                    value: await wh.sensitivePatterns(f.value, this.client, message),
                    inline: f.inline ? true : false
                }
                fields[k] = restoredField;
            })
            //@ts-ignore
            let footer: MessageEmbedFooter = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.footer`, {});
            let restoredFooter: MessageEmbedFooter = {
                text: await wh.sensitivePatterns(footer.text, this.client, message)
            }
            if (footer.iconURL && footer.iconURL !== '') restoredFooter.iconURL = await wh.sensitivePatterns(footer.iconURL, this.client, message)
            footer = restoredFooter;
            //@ts-ignore
            let image: MessageEmbedImage = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.image`, { url: '' });
            let restoredImage: string = await wh.sensitivePatterns(image.url, this.client, message);
            image.url = restoredImage;
            //@ts-ignore
            let thumbnail: MessageEmbedThumbnail = await this.client.guildsettings.get(message.guild!, `snipbuilds.${name}.thumbnail`, { url: '' });
            let restoredThumbnail: string = await wh.sensitivePatterns(thumbnail.url, this.client, message);
            thumbnail.url = restoredThumbnail;

            let embed = new MessageEmbed({
                title: title
            });
            if (col !== '') embed.setColor(col);
            if (descr !== '') embed.setDescription(descr);
            if (fields) embed.fields = fields;
            if (footer) embed.footer = footer;
            if (image.url !== '') embed.image = image;
            if (thumbnail.url !== '') embed.thumbnail = thumbnail;
            return (await wh.get('snipbuilds', this.client.user, channel as TextChannel)).send(embed);
        } else if (titleRaw === '' && method === 'edit') {
            message.util!.reply('There\'s no embed with name ' + name + '.')
                .then(m => m.delete({ timeout: 5000 }));
            method = 'create';
        }
        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as TextChannel | NewsChannel).bulkDelete(messages)
            });
        let msg: Message = await message.channel.send('Loading snipbuild generator...');
        return await MainMenu(msg, message.author, this.client, method, name);
    }
}

async function AwaitEmoji(msg: Message, user: User, method: string, name: string, client: AkairoClient) {
    return await msg
        .awaitReactions(
            (r: MessageReaction) => r.users.cache
                .last().id === user.id,
            {
                max: 1,
                time: 15000
            })
        .then(async re => {
            if (!re || re.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (re.size > 0) {
                let emoji: string = re.filter((r) => r.emoji.name === re.last().emoji.name).first().emoji.name;
                await msg.reactions.removeAll();
                return await EmbedSwitcher(emoji, msg, method, name, user, client)
            }
        })
}

async function EmbedSwitcher(emoji: string, msg: Message, method: string, name: string, user: User, client: AkairoClient) {
    switch (emoji) {
        case numberEmojis[0]:
            msg = await TitleManager(msg, method, name, user);
            var responses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 10000 });
            if (!responses || responses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (responses.size > 0) {
                let response: Message = responses.first();
                let rawTitle: string = response.content
                let title: string = await wh.sensitivePatterns(rawTitle, client, msg, 'hide');
                //@ts-ignore
                client.guildsettings.set(msg.guild!, `snipbuilds.${name}.title`, title);

                if (response.deletable && !response.deleted) await response.delete();

                return await MainMenu(msg, user, client, method, name);
            }
        case numberEmojis[1]:
            msg = await ColorManager(msg, method, name, user);
            var colResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 45000 });
            if (!colResponses || colResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (colResponses.size > 0) {
                let embedColor: string;
                const colResponse = colResponses.first();
                if (!validator.isHexColor(colResponse.content)) {
                    embedColor = '';
                    msg.edit('invalid color. Must be a **hex-color**.\n*(https://www.colorcodehex.com/html-color-picker.html)*').then(m => m.delete({ timeout: 5000 }));
                } else {
                    embedColor = colResponse.content;
                }
                //@ts-ignore
                client.guildsettings.set(msg.guild!, `snipbuilds.${name}.color`, embedColor);

                if (colResponse.deletable && !colResponse.deleted) await colResponse.delete();

                return await MainMenu(msg, user, client, method, name);
            }
        case numberEmojis[2]:
            msg = await DescriptionManager(msg, method, name, user);
            var descrResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 2400000 });
            if (!descrResponses || descrResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (descrResponses.size > 0) {
                let response: Message = descrResponses.first();
                let rawDescr: string = response.content;
                let description: string = await wh.sensitivePatterns(rawDescr, client, msg, 'hide');
                //@ts-ignore
                client.guildsettings.set(msg.guild!, `snipbuilds.${name}.description`, description);

                if (response.deletable && !response.deleted) await response.delete();

                return await MainMenu(msg, user, client, method, name);
            }

        case numberEmojis[3]:
            msg = await FieldsManager(msg, method, name, user);
            var fieldResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 360000 });
            if (!fieldResponses || fieldResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (fieldResponses.size > 0) {
                let response: Message = fieldResponses.first();
                let rawFields: string = response.content;
                let fieldString: string = await wh.sensitivePatterns(rawFields, client, msg, 'hide');
                let fieldsArray: string[] = fieldString.split('; ');
                let embedFields: EmbedField[] = [];
                fieldsArray.forEach(async (fA, k) => {
                    let f = fA.split(', ');
                    var embedField: EmbedField = {
                        name: f[0],
                        value: f[1],
                        inline: f[2] == 'inline' ? true : false
                    }
                    embedFields.push(embedField);
                })
                //@ts-ignore
                client.guildsettings.set(msg.guild!, `snipbuilds.${name}.fields`, embedFields);

                if (response.deletable && !response.deleted) await response.delete();

                return await MainMenu(msg, user, client, method, name);
            }
        case numberEmojis[4]:
            msg = await FooterManager(msg, method, name, user);
            var footerResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 240000 });
            if (!footerResponses || footerResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (footerResponses.size > 0) {
                let response: Message = footerResponses.first();
                let rawFooter: string = response.content;
                let footerString: string = await wh.sensitivePatterns(rawFooter, client, msg, 'hide');
                let embedFooter: MessageEmbedFooter = {};
                let f = footerString.split(', ');
                function isValidURL(url: string): boolean {
                    let isURL: boolean = validator.isURL(url);
                    if (isURL && url.match(/\w+\.(jpg|jpeg|gif|png|tiff|bmp|webp)$/gi) != null) return true
                    return false;
                }
                embedFooter = {
                    text: f[0]
                }
                if (f[1] && f[1] != '') embedFooter.iconURL = isValidURL(f[1]) ? f[1] : msg.guild.iconURL({ format: 'png', dynamic: true })

                //@ts-ignore
                client.guildsettings.set(msg.guild!, `snipbuilds.${name}.footer`, embedFooter);

                if (response.deletable && !response.deleted) await response.delete();

                return await MainMenu(msg, user, client, method, name);
            }
        case numberEmojis[5]:
            msg = await ImageManager(msg, method, name, user);
            var imageResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 240000 });
            if (!imageResponses || imageResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });
            if (imageResponses.size > 0) {
                let response: Message = imageResponses.first();
                let rawImage: string = response.content;
                let imageString: string = await wh.sensitivePatterns(rawImage, client, msg, 'hide');
                let arr = imageString.split(', ');
                let embedImage: MessageEmbedImage = { url: '' };
                let embedThumbnail: MessageEmbedThumbnail = { url: '' };
                arr.forEach(async (i) => {
                    function isValidURL(url: string): boolean {
                        let isURL: boolean = validator.isURL(url);
                        if (isURL && url.match(/\w+\.(jpg|jpeg|gif|png|tiff|bmp|webp)$/gi) != null) return true
                        return false;
                    }

                    if (isValidURL(i.replace(new RegExp('image: ', 'gi'), '')) || isValidURL(i.replace(new RegExp('thumbnail: ', 'gi'), ''))) {
                        if (i.toLowerCase().startsWith('image: ')) {
                            console.log('Image URL found')
                            embedImage.url = i.replace(new RegExp("image: ", "gi"), '');
                            //@ts-ignore
                            client.guildsettings.set(msg.guild!, `snipbuilds.${name}.image`, embedImage);
                        } else if (i.toLowerCase().startsWith('thumbnail: ')) {
                            console.log('Thumbnail URL found')
                            embedThumbnail.url = i.replace(new RegExp("thumbnail: ", "gi"), '');
                            //@ts-ignore
                            client.guildsettings.set(msg.guild!, `snipbuilds.${name}.thumbnail`, embedThumbnail);
                        }
                    } else {
                        msg.channel.send('You provided an invalid URL. Please check again!')
                            .then(m => m.delete({ timeout: 5000 }))
                    }

                })

                if (response.deletable && !response.deleted) await response.delete();

                return await MainMenu(msg, user, client, method, name);
            }
        case numberEmojis[6]:
            //@ts-ignore
            let title: string = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.title`, '');
            //@ts-ignore
            let col: string = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.color`, '');
            //@ts-ignore
            let descr: string = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.description`, '');
            //@ts-ignore
            let fields: EmbedField[] = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.fields`, []);
            //@ts-ignore
            let footer: MessageEmbedFooter = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.footer`, {});
            //@ts-ignore
            let image: MessageEmbedImage = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.image`, { url: '' });
            //@ts-ignore
            let thumbnail: MessageEmbedThumbnail = await client.guildsettings.get(msg.guild!, `snipbuilds.${name}.thumbnail`, { url: '' });

            msg = await NameManager(msg, method, name, user);

            var nameResponses = await msg.channel.awaitMessages((m) => m.author.id === user.id, { max: 1, time: 30000 });
            if (!nameResponses || nameResponses.size < 1) return await msg.edit('request timed out.', { embed: null })
                .then(async m => {
                    await m.reactions.removeAll();
                    return await m.delete({ timeout: 5000 })
                });

            if (nameResponses.size > 0) {
                let response: Message = nameResponses.first();
                let rawName: string = response.content;
                let nameString: string = await wh.sensitivePatterns(rawName, client, msg, 'hide');

                //@ts-ignore
                if (title !== '') await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.title`, title);
                //@ts-ignore
                if (col !== '') await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.color`, col);
                //@ts-ignore
                if (descr !== '') await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.description`, descr);
                //@ts-ignore
                if (fields) await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.fields`, fields);
                //@ts-ignore
                if (footer) await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.footer`, footer);
                //@ts-ignore
                if (image.url !== '') await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.image`, image);
                //@ts-ignore
                if (thumbnail.url !== '') await client.guildsettings.set(msg.guild!, `snipbuilds.${nameString}.thumbnail`, thumbnail);

                //@ts-ignore
                await client.guildsettings.delete(msg.guild!, `snipbuilds.${name}`);

                var newName: string = await wh.sensitivePatterns(nameString, client, msg);

                return await MainMenu(msg, user, client, method, newName);
            }


        case checkEmojis[0]:
            await msg.reactions.removeAll();
            //@ts-ignore
            client.guildsettings.delete(msg.guild, `snipbuilds.${name}`);
            return msg.edit(`Successfully deleted \`${name}\`.`, { embed: null })
                .then(async m => {
                    return await m.delete({ timeout: 5000 })
                });

        case checkEmojis[1]:
            await msg.reactions.removeAll();
            return msg.edit('Cancelled...', { embed: null })
                .then(async m => {
                    return await m.delete({ timeout: 5000 })
                });

        default:
            await msg.reactions.cache
                .filter((r) =>
                    r.users.cache.last().id === user.id && !checkEmojis.includes(emoji) && !numberEmojis.includes(emoji))
                .last()
                .remove();
            return await MainMenu(msg, user, client, method, name);
    }
}

async function MainMenu(msg: Message, user: User, client: AkairoClient, method: string, name: string) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Create custom embed**

        :one: => Set Title
        :two: => Set Color
        :three: => Set Description
        :four: => Add Fields
        :five: => Set Footer
        :six: => Set Image / Thumbnail
        ❎ => Cancel\*

        *\*Changes that are already done, will keep saved until you edit it.*
        ` : `${method === 'edit' ? stripIndents`
        **Edit custom embed**

        :one: => Edit Title
        :two: => Edit Color
        :three: => Edit Description
        :four: => Edit Fields
        :five: => Edit Footer
        :six: => Edit Image / Thumbnail
        :seven: => Change Name
        ❎ => Cancel\*

        *\*Changes that are already done, will keep saved until you edit it again.*
        ` : `${method === 'delete' ? stripIndents`
        #Do you really want to delete ${name} ?

        ✅ => Confirm
        ❎ => Cancel
        ` : `Snippet sent.`}`}`}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })

    await msg.edit('', { embed: embed });
    if (method != 'delete' && method != 'send') {
        await msg.react('❎');
        await msg.react('1️⃣');
        await msg.react('2️⃣');
        await msg.react('3️⃣');
        await msg.react('4️⃣');
        await msg.react('5️⃣');
        await msg.react('6️⃣');
        if (method === 'edit') await msg.react('7️⃣');
    } else if (method === 'delete') {
        await msg.react('✅');
        await msg.react('❎');
    }
    msg = await AwaitEmoji(msg, user, method, name, client);
    return msg;
}

async function TitleManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Title**

        Provide a title now.
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Title**

        You can now change the title.
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ TITLE ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function ColorManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Color**

        Provide a color hexcode now.
        You can pick one from **__[here](<https://www.colorcodehex.com/html-color-picker.html> 'hex-color-picker')__**.
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Color**

        You can now change the color.
        Hexcode required.
        You can pick one from **__[here](<https://www.colorcodehex.com/html-color-picker.html> 'hex-color-picker')__**.
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ COLOR ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function DescriptionManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Description**

        Provide a description text now.
        You can format it with Markdown, if you want. 
        You could take a look __**[here](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-)**__ or __**[here](https://www.writebots.com/discord-text-formatting/)**__ to see, how to do that.
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Description**

        You can now change the description.
        You can format it with Markdown, if you want. 
        You could take a look __**[here](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-)**__ or __**[here](https://www.writebots.com/discord-text-formatting/)**__ to see, how to do that.
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ DESCRIPTION ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function FieldsManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Fields**

        Provide one or more field(s) now.

        Separate fields with \`; \` and field-name from field-value with \`, \`
        Add "inline" after the field-value, to set the field as an inline-field.
        *e.g. "field1, text; field2, text, inline"*

        You can format their values with Markdown, if you want. 
        You could take a look __**[here](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-)**__ or __**[here](https://www.writebots.com/discord-text-formatting/)**__ to see, how to do that.
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Fields**

        You can now edit your fields.
        
        Separate fields with \`; \` and field-name from field-value with \`, \`
        Add "inline" after the field-value, to set the field as an inline-field.
        *e.g. "field1, text; field2, text, inline"*

        You can format their values with Markdown, if you want.
        You could take a look __**[here](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-)**__ or __**[here](https://www.writebots.com/discord-text-formatting/)**__ to see, how to do that.
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ FIELDS ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function FooterManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Footer**

        Provide your footer now.

        Separate text from icon-url with \`, \`
        **Text first, icon-url second!**
        Leave the icon-url empty or provide an invalid url to set the icon to the server icon.
        *e.g. "footertext, https://domain.tld/image.png" or "footertext"*
        
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Footer**

        You can now edit your footer.

        Separate text from icon-url with \`, \`
        **Text first, icon-url second!**
        Leave the icon-url empty or provide an invalid url to set the icon to the server icon.
        *e.g. "footertext, https://domain.tld/image.png" or "footertext"*
        
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ FOOTER ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function ImageManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: `${method === 'create' ? stripIndents`
        **Set Image / Thumbnail**

        Provide an image, a thumbnail or both now.

        If both, separate them with \`, \` and identify them.
         - \`image: \` for an image (will be displayed at the bottom of the embed) 
         - \`thumbnail: \` for a thumbnail (will be displayed at the top-right of the embed)
        *e.g. "image: http://domain.tld/image.png, thumbnail: https://example.com/picture.jpg"*
        
        *After this, it will automatically return to the Main Menu.*
        ` : stripIndents`
        **Edit Image / Thumbnail**

        You can now edit your image, thumbnail or both.

        If both, separate them with \`, \` and identify them:
         - \`image: \` for an image (will be displayed at the bottom of the embed) 
         - \`thumbnail: \` for a thumbnail (will be displayed at the top-right of the embed)
        *e.g. "image: http://domain.tld/image.png, thumbnail: https://example.com/picture.jpg"*
        
        *After this, it will automatically return to the Main Menu.*
        `}`,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ IMAGE/THUMBNAIL ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}

async function NameManager(msg: Message, method: string, name: string, user: User) {
    let embed = new MessageEmbed({
        author: {
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL({ format: 'png', dynamic: true })}`
        },
        title: `Snipbuild ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`,
        description: stripIndents`
        **Change name**

        You can now change the name of \`${name}\`.
        *After this, it will automatically return to the Main Menu.*
        `,
        footer: {
            icon_url: msg.guild.iconURL({ format: 'png', dynamic: true }),
            text: `Snipbuild Generator ✧ NAME ✧ ${method.toUpperCase()} ✧ ${name.toUpperCase()}`
        }
    })
    return msg.edit(embed);
}