import { Command } from 'discord-akairo';
import * as Discord from 'discord.js';
import * as util from 'util';
import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';


const NL = '!!NL!!';
const NL_PATTERN = new RegExp(NL, 'g');

export default class EvalCommand extends Command {
    public hrStart: [number, number] | undefined;

    public lastResult: any = null;

    private readonly _sensitivePattern!: any;

    public constructor() {
        super('eval', {
            aliases: ['eval', 'jseval', 'js'],
            description: {
                content: 'Evaluates JavaScript.',
                examples: ['message.author.reply("Hi.")'],
                usage: '<code>',
                ownerOnly: true
            },
            category: 'Dev',
            ownerOnly: true,
            ratelimit: 2,
            args: [
                {
                    id: 'code',
                    match: 'rest',
                    type: 'sring',
                    prompt: {
                        start: (message: Discord.Message): string => `${message.author}, what would you like to evaluate?`
                    }
                },
                {
                    id: 'noreturn',
                    type: 'boolean',
                    match: 'flag',
                    flag: ['--noreturn', '-nr'],
                },
            ],
        });
    }

    public async exec(message: Discord.Message, { code, noreturn }: { code: string, noreturn: boolean }): Promise<Discord.Message | Discord.Message[] | Promise<Discord.Message | Discord.Message[]>[]> {

        // this.client.channels.fetch('716123896327438418')
        //     .then(channel => {
        //         (channel as Discord.TextChannel).messages.fetch('743003490799976529')
        //             .then(message => {
        //                 message.pin().catch(e => {
        //                     if (e) {
        //                         console.log(e.stack);
        //                         return e;
        //                     }
        //                 })
        //             }).catch(e => {
        //                 if (e) {
        //                     console.log(e.stack);
        //                     return e;
        //                 }
        //             })
        //     }).catch(e => {
        //         if (e) {
        //             console.log(e.stack);
        //             return e;
        //         }
        //     })

        await message.delete().catch(e => {
            if (e) console.log(e.stack);
        });
        let hrDiff;
        try {
            const hrStart = process.hrtime();
            this.lastResult = eval(code);
            hrDiff = process.hrtime(hrStart);
        } catch (error) {
            return message.author.send(`Error while evaluating: \`${error}\``);
        }

        this.hrStart = process.hrtime();
        const result = this._result(this.lastResult, hrDiff, code);

        message.channel.messages.fetch({ limit: 20 })
            .then((msgs) => {
                let messages: Message[] = msgs.filter(m => m.author.id === this.client.user.id && m.mentions.users.first() === message.author).array();
                (message.channel as Discord.TextChannel | Discord.NewsChannel).bulkDelete(messages)
            });

        if (noreturn) return message.author.send(`*Executed in **${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.***`);
        if (Array.isArray(result)) return result.map(async (res): Promise<Discord.Message | Discord.Message[]> => message.author.send(res));
        return message.author.send(result);

    }

    private _result(result: any, hrDiff: [number, number], input: string | null = null): string | string[] {
        const inspected = util.inspect(result, { depth: 0 })
            .replace(NL_PATTERN, '\n')
            .replace(this.sensitivePattern, '--snip--');
        const split = inspected.split('\n');
        const last = inspected.length - 1;
        const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== '\'' ? split[0] : inspected[0];
        const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== '\'' ? split[split.length - 1] : inspected[last];
        const prepend = `\`\`\`javascript\n${prependPart}\n`;
        const append = `\n${appendPart}\n\`\`\``;
        if (input) {
            return Discord.Util.splitMessage(stripIndents`
				*Executed in **${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.***
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
        }

        return Discord.Util.splitMessage(stripIndents`
            *Callback executed after **${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.***
            \`\`\`javascript
            ${inspected}
            \`\`\`
        `, { maxLength: 1900, prepend, append });
    }

    private get sensitivePattern(): any {
        if (!this._sensitivePattern) {
            const token = this.client.token!.split('').join('[^]{0,2}');
            const revToken = this.client.token!.split('').reverse().join('[^]{0,2}');
            Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(`${token}|${revToken}`, 'g') });
        }

        return this._sensitivePattern;
    }
}