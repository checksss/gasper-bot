import { describe, Type } from '@mrboolean/envconfig';

type DBConfig = {
    databaseName: string,
    databaseHostname: string,
    databasePort: number,
    databaseUser: string,
    databasePassword: string
}

const dbConfig = <DBConfig>describe({
    databaseName: {
        name: "DB_NAME",
        type: Type.STRING,
        isRequired: true
    },
    databaseHostname: {
        name: "DB_HOST",
        type: Type.STRING,
        isRequired: true
    },
    databasePort: {
        name: "DB_PORT",
        type: Type.NUMBER,
        isRequired: false
    },
    databaseUser: {
        name: "DB_USER",
        type: Type.STRING,
        isRequired: true
    },
    databasePassword: {
        name: "DB_PASS",
        type: Type.STRING,
        isRequired: true
    }
});

export default dbConfig;