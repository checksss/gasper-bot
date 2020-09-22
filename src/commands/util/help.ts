import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import botConfig from '../../config/botConfig';
import { chmod } from 'fs';
import moment from 'moment';

export default class HelpCommand extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', 'commands', 'cmdlist'],
            description: {
                content: 'Displays a list of available command, or detailed information for a specific command.',
                usage: '[command]'
            },
            category: 'Util',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'command',
                    type: 'commandAlias'
                }
            ]
        });
    }

    public async exec(message: Message, { command }: { command: Command }): Promise<Message | Message[]> {
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        const authorMember = await message.guild!.members.fetch(message.author!.id);
        const owners: string[] = botConfig.botOwner;
        if (message.deletable && !message.deleted) message.delete();

        // ------------------------------------
        // ---------- ADMINS ------------------
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
        var isAdmin: boolean = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id)).size !== 0 || administrators.includes(authorMember.id);
        // ------------------------------------
        // ---------- MODS --------------------
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
        var isMod: boolean = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id)).size !== 0 || moderators.includes(authorMember.id);
        // ------------------------------------
        // ---------- STAFF -------------------
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
        var isStaff: boolean = authorMember.roles.cache.filter((r): boolean => staff.includes(r.id)).size !== 0 || staff.includes(authorMember.id);
        // ------------------------------------
        // ---------- DEVS --------------------
        var isDev: boolean = botConfig.botOwner.includes(message.author.id);
        // ------------------------------------
        // ---------- GUILDOWNER --------------
        var isOwner: boolean = guildOwner.id === message.author.id;



        const prefix = await (this.handler.prefix as PrefixSupplier)(message);
        var rnd = Math.floor(Math.random() * prefix.length);
        if (rnd === prefix.length) rnd = rnd - 1;
        if (!command) {
            const embed = new MessageEmbed()
                //@ts-ignore
                .setColor(message.member.displayColor)
                .setTitle('Commands')
                .setDescription(stripIndents`A list of available commands.
                For additional info on a command, type \`${prefix[rnd]}help <command>\`
            `);

            var cmdSize: number = 0;

            for (const category of this.handler.categories.values()) {
                var categoryName: string = category.id.replace(/(\b\w)/gi, (lc): string => lc.toUpperCase());

                var ownerCats: string[] = ['Server Owner', 'Administrator', 'Moderation', 'Info', 'Util'];
                var adminCats: string[] = ['Administrator', 'Moderation', 'Info', 'Util'];
                var modCats: string[] = ['Moderation', 'Info', 'Util'];
                var staffCats: string[] = ['Staff', 'Info', 'Util']
                var pubCats: string[] = ['Info', 'Util'];

                var catSize: number;

                if (isDev && categoryName !== 'Default') {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                    cmdSize += catSize;
                } else if (isOwner && !isDev && ownerCats.includes(categoryName)) {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                    cmdSize += catSize;
                } else if (isAdmin && !isOwner && !isDev && adminCats.includes(categoryName)) {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                    cmdSize += catSize;
                } else if (isMod && !isAdmin && !isOwner && !isDev && modCats.includes(categoryName)) {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                } else if (isStaff && !isMod && !isAdmin && !isOwner && !isDev && staffCats.includes(categoryName)) {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                    cmdSize += catSize;
                } else if (!isDev && !isOwner && !isAdmin && !isMod && !isStaff && pubCats.includes(categoryName)) {
                    catSize = category.filter((cmd): boolean => cmd.aliases.length > 0).size
                    embed.addField(
                        `⇒ ${categoryName} (${catSize} commands)`,
                        `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`
                    );
                    cmdSize += catSize;
                }
            }

            let now: moment.Moment = moment.utc(Date.now());
            let nowDay: string = now.format('DD');

            embed.setFooter(
                `${cmdSize} total commands | requested by ${message.author.tag} | ${now.format(`${parseInt(nowDay) === 1 ? `${nowDay}[st]` : `${parseInt(nowDay) === 2 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 3 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 21 ? `${nowDay}[st]` : `${parseInt(nowDay) === 22 ? `${nowDay}[nd]` : `${parseInt(nowDay) === 23 ? `${nowDay}[rd]` : `${parseInt(nowDay) === 31 ? `${nowDay}[st]` : `${nowDay}[th]`}`}`}`}`}`}`} MMMM YYYY [|] HH:mm:ss [UTC]`)}`,
                `${message.author.displayAvatarURL({ format: 'png', dynamic: true })}`
            )

            return message.util!.send(embed);
        }

        const embed = new MessageEmbed()
            .setColor([155, 200, 200])
            .setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
            .addField('⇒ Description', `${command.description.content ? command.description.content : ''} ${command.description.ownerOnly ? '\n**[Bot-Owner Only]**' : ''}`);

        if (command.aliases.length > 1) embed.addField('⇒ Aliases', `\`${command.aliases.join('` `')}\``, true);
        if (command.description.examples && command.description.examples.length) embed.addField('⇒ Examples', `\`${command.aliases[0]} ${command.description.examples.join(`\`\n\`${command.aliases[0]} `)}\``, true);

        return message.util!.send(embed);
    }
}