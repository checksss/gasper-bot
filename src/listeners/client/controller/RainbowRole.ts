import * as Discord from 'discord.js';
import { AkairoClient } from 'discord-akairo';

export default class RainbowModule {
    public static async Rainbow(client: AkairoClient) {


        try {
            console.log(`Rainbow-Module for ${client.user.tag} started!`);

            // GET GUILDS
            const guild_1: string = '685194608724279335'; // BLOODRAGE
            const guild_2: string = '606069531592491048'; // DEV-Server
            const guild_3: string = '634114787671932939'; // Paradise
            const guilds: string[] = [/*guild_1*/, guild_2, /*guild_3*/];

            var init_ID: string;
            var color1_ID: string;
            var color2_ID: string;
            var color3_ID: string;
            var color4_ID: string;
            var color5_ID: string;
            var color6_ID: string;
            var color7_ID: string;

            var guildBool: Boolean = false;
            guilds.forEach(async guildId => {

                var g: Discord.Guild = client.guilds.cache.get(guildId);
                if (!g) return;
                //var clientMember = g.members.get(botConfig.clientId);

                switch (guildId) {
                    case guild_1:
                        guildBool = true;
                        init_ID = '707817363961020417';
                        color1_ID = '699488594485575680';
                        color2_ID = '699491402463313970';
                        color3_ID = '699491414509355008';
                        color4_ID = '699491406712012800';
                        color5_ID = '699491410692407297';
                        color6_ID = '699491420750348308';
                        color7_ID = '699488598612770886';
                        break;
                    case guild_2:
                        guildBool = true;
                        init_ID = '707819267554279494';
                        color1_ID = '674122963250970625';
                        color2_ID = '674123065223020565';
                        color3_ID = '674123121523163139';
                        color4_ID = '674123191538417671';
                        color5_ID = '707818814691082270';
                        color6_ID = '707818853123751978';
                        color7_ID = '707818886938099723';
                        break;
                    case guild_3:
                        guildBool = true;
                        init_ID = '652345848184832010';
                        color1_ID = '645487409890328576';
                        color2_ID = '645486548732608519';
                        color3_ID = '645487735334895646';
                        color4_ID = '645486163313950730';
                        color5_ID = '645455993156665354';
                        color6_ID = '645455558715113513';
                        color7_ID = '645455403127144449';
                        break;
                }


                // if (g === guild_1) {
                //     guildBool = true;
                //     init_ID = '707817363961020417';
                //     color1_ID = '699488594485575680';
                //     color2_ID = '699491402463313970';
                //     color3_ID = '699491414509355008';
                //     color4_ID = '699491406712012800';
                //     color5_ID = '699491410692407297';
                //     color6_ID = '699491420750348308';
                //     color7_ID = '699488598612770886';
                // } else if (g === guild_2) {
                //     guildBool = true;
                //     init_ID = '707819267554279494';
                //     color1_ID = '674122963250970625';
                //     color2_ID = '674123065223020565';
                //     color3_ID = '674123121523163139';
                //     color4_ID = '674123191538417671';
                //     color5_ID = '707818814691082270';
                //     color6_ID = '707818853123751978';
                //     color7_ID = '707818886938099723';
                // } else if (g === guild_3) {
                //     guildBool = true;
                //     init_ID = '652345848184832010';
                //     color1_ID = '645487409890328576';
                //     color2_ID = '645486548732608519';
                //     color3_ID = '645487735334895646';
                //     color4_ID = '645486163313950730';
                //     color5_ID = '645455993156665354';
                //     color6_ID = '645455558715113513';
                //     color7_ID = '645455403127144449';
                // }

                if (guildBool === true) {
                    //  CHECK PERMISSIONS

                    // var infoBool: Boolean = false;
                    // while (infoBool === false) {
                    //     if (!clientMember.hasPermission('MANAGE_ROLES')) {
                    //         await g.owner.send("I don't have the permission to change users Roles. Please set the permission to **MANAGE ROLES**.");
                    //         infoBool = true;
                    //         return;
                    //     }
                    // }

                    const initrole: Discord.Role = g.roles.cache.get(init_ID);
                    const color1: Discord.Role = g.roles.cache.get(color1_ID);
                    const color2: Discord.Role = g.roles.cache.get(color2_ID);
                    const color3: Discord.Role = g.roles.cache.get(color3_ID);
                    const color4: Discord.Role = g.roles.cache.get(color4_ID);
                    const color5: Discord.Role = g.roles.cache.get(color5_ID);
                    const color6: Discord.Role = g.roles.cache.get(color6_ID);
                    const color7: Discord.Role = g.roles.cache.get(color7_ID);

                    // Check for users with initrole
                    g.members.cache.forEach(async (m: Discord.GuildMember) => {

                        // Paradise-Only => exclude all Members that are not MirlindXD | JustPYUR
                        if (g === client.guilds.cache.get(guilds[2]) && m.user.id != "368731058692292608") return;

                        // ROLE-INTERVAL
                        setInterval(async function () {
                            if (m.roles.cache.has(initrole.id)) {

                                // DECLARE COLOR-ROLES
                                var oldColor: Discord.Role = m.roles.color;
                                var newColor: Discord.Role;

                                // OLD-COLOR BOOLEAN
                                var rmOld: Boolean = false;

                                // COLOR-SWITCH
                                switch (oldColor) {
                                    case color1:
                                        rmOld = true;
                                        newColor = color2;
                                        break;
                                    case color2:
                                        rmOld = true;
                                        newColor = color3;
                                        break;
                                    case color3:
                                        rmOld = true;
                                        newColor = color4;
                                        break;
                                    case color4:
                                        rmOld = true;
                                        newColor = color5;
                                        break;
                                    case color5:
                                        rmOld = true;
                                        newColor = color6;
                                        break;
                                    case color6:
                                        rmOld = true;
                                        newColor = color7;
                                        break;
                                    case color7:
                                        rmOld = true;
                                        newColor = color1;
                                        break;
                                    default:
                                        newColor = color1;
                                        break;
                                }

                                // add switched color
                                try {
                                    await m.roles.add(newColor)
                                } catch (e) {
                                    if (e) console.log(`_________________________________________\n
                                _________________________________________\n
                                _________________________________________\n
                                ${e.stack}\n
                                _________________________________________\n
                                _________________________________________\n
                                _________________________________________\n`);
                                }
                                if (rmOld === true) {
                                    try {
                                        await m.roles.remove(oldColor);
                                    } catch (e) {
                                        if (e) console.log(`_________________________________________\n
                                    _________________________________________\n
                                    _________________________________________\n
                                    ${e.stack}\n
                                    _________________________________________\n
                                    _________________________________________\n
                                    _________________________________________\n`);
                                    }
                                }
                            }
                        }, 25000)
                    })
                } else
                    return;
            });
        } catch (e) {
            if (e) console.log(`_________________________________________\n
        _________________________________________\n
        _________________________________________\n
        ${e.stack}\n
        _________________________________________\n
        _________________________________________\n
        _________________________________________\n`);
        }
    };
}