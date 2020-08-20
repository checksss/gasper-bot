//    Gasper - One bot to rule 'em all!
//    Copyright (C) 2020 Florian Meyer
//
//    Contact:
//    datflow@gasper.fun
//    https://gasper.fun
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Affero General Public License as published
//    by the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Affero General Public License for more details.
//
//    You should have received a copy of the GNU Affero General Public License
//    along with this program.  If not, see <https://www.gnu.org/licenses/>.



// YOU'LL HAVE TO REMOVE "template_" from Filename !! 

interface Secrets {
    clientId: string,
    clientSecret: string,
    botToken: string
}

class BotSecrets {

    //	get the following informations by creating your application at https://discord.com/developers/applications/

    private static clientId: string = "CLIENT_ID_HERE";

    private static clientSecret: string = "CLIENT_SECRET_HERE";

    private static botToken: string = "BOT_TOKEN_HERE";

    public static getSecrets(): Secrets {

        const s: Secrets = {
            clientId: BotSecrets.clientId,
            clientSecret: BotSecrets.clientSecret,
            botToken: BotSecrets.botToken
        }

        return s;
    }
}

var secrets = BotSecrets.getSecrets();
export let token: string = secrets.botToken;

interface DBSecrets {
    dbName: string,
    dbHost: string,
    dbPort: number,
    dbUser: string,
    dbPass: string
}

class DBConfig {

    //	these informations are necessary, if you're using MariaDB / MySQL

    private static dbName: string = "database_name";
    private static dbHost: string = "127.0.0.1";
    private static dbPort: number = 3306;
    private static dbUser: string = "db_user_name";
    private static dbPass: string = "P@$$w0rd";

    public static getConfig(): DBSecrets {
        const dbS: DBSecrets = {
            dbName: DBConfig.dbName,
            dbHost: DBConfig.dbHost,
            dbPort: DBConfig.dbPort,
            dbUser: DBConfig.dbUser,
            dbPass: DBConfig.dbPass
        }
        return dbS
    }
}

export let dbSecrets: DBSecrets = DBConfig.getConfig();
export let owners: string[] = [
    // you can add multiple user IDs as Bot Owner !! careful !! each of them will be able to use dev-only commands 
    'YOUR_USER_ID'
];
export const defaultPrefix: string = 'g!';
export let databaseName: string = dbSecrets.dbName;