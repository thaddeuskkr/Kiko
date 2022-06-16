const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const util = require('util');
const Discord = require('discord.js');
const tags = require('common-tags');
const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

module.exports = async (client, message) => {
    if (!client.config.owners.includes(message.author.id)) return;

    if (message.content === 'ethereal deploy guild' || message.content === 'ethereal deploy' || message.content === 'ethereal deploy global' || message.content === 'ethereal undeploy global' || message.content === 'ethereal undeploy' || message.content === 'ethereal undeploy guild') {
        const commands = [];

        for (const command of client.commands) {
            commands.push(command[1].data.toJSON());
        }
    
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

        if (message.content === 'ethereal deploy guild') {
            rest.put(Routes.applicationGuildCommands(client.user.id, message.guild.id), { body: commands })
                .then(() => client.logger.info(`Successfully registered application commands for server ${message.guild.name} (${message.guild.id})!`))
                .catch(err => client.logger.error('Failed to register application commands: ' + err.message));
            return message.reply('Success!');
        } else if (message.content === 'ethereal deploy' || message.content === 'ethereal deploy global') {
            rest.put(Routes.applicationCommands(client.user.id), { body: commands })
                .then(() => client.logger.info('Successfully registered application commands globally!'))
                .catch(err => client.logger.error('Failed to register application commands: ' + err.message));
            return message.reply('Success!');
        } else if (message.content === 'ethereal undeploy guild') {
            rest.get(Routes.applicationGuildCommands(client.user.id, message.guild.id))
                .then(data => {
                    const promises = [];
                    for (const command of data) {
                        const deleteUrl = `${Routes.applicationGuildCommands(client.user.id, message.guild.id)}/${command.id}`;
                        promises.push(rest.delete(deleteUrl));
                    }
                    return Promise.all(promises).then(() => client.logger.info(`Successfully unregistered application commands for server ${message.guild.name} (${message.guild.id})!`));
                });
            return message.reply('Success!');
        } else if (message.content === 'ethereal undeploy' || message.content === 'ethereal undeploy global') {
            rest.get(Routes.applicationCommands(client.user.id))
                .then(data => {
                    const promises = [];
                    for (const command of data) {
                        const deleteUrl = `${Routes.applicationCommands(client.user.id)}/${command.id}`;
                        promises.push(rest.delete(deleteUrl));
                    }
                    return Promise.all(promises).then(() => client.logger.info('Successfully unregistered application commands globally!'));
                });
            return message.reply('Success!');
        }
    }

    if (message.channel.id === client.config.evalChannel && !message.content.startsWith('#')) {
        /* eslint-disable no-unused-vars */
        // Add some helpers
        const lava = client.shoukaku.getNode();
        const dispatcher = client.queue.get(message.guild.id);
        const lastResult = this.lastResult;
        const doReply = val => {
            if(val instanceof Error) {
                message.reply(`Callback error: \`${val}\``);
            } else {
                const result = makeResultMessages(val, process.hrtime(this.hrStart));
                if(Array.isArray(result)) {
                    for(const item of result) message.channel.send(item);
                } else {
                    message.reply(result);
                }
            }
        };
        /* eslint-enable no-unused-vars */
        let code = message.content;
        if (code.startsWith('```') && code.endsWith('```')) {
            code = code.replace(/(^.*?\s)|(\n.*$)/g, '');
        }
        let hrDiff;
        try {
            const hrStart = process.hrtime();
            this.lastResult = eval(code);
            hrDiff = process.hrtime(hrStart);
        } catch(err) {
            return message.reply({ content: `Error while evaluating: \`${err}\`` });
        }
        this.hrStart = process.hrtime();
        const result = makeResultMessages(this.lastResult, hrDiff, code);
        if(Array.isArray(result)) {
            return result.map(item => message.channel.send(item));
        } else {
            return message.reply(result);
        }
    }
    function makeResultMessages(result, hrDiff, input = null) {
        const inspected = util.inspect(result, { depth: 0 }).replace(nlPattern, '\n');
        const split = inspected.split('\n');
        const last = inspected.length - 1;
        const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== '\'' ? split[0] : inspected[0];
        const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== '\'' ? split[split.length - 1] : inspected[last];
        const prepend = `\`\`\`javascript\n${prependPart}\n`;
        const append = `\n${appendPart}\n\`\`\``;
        if (input) {
            return splitMessage(tags.stripIndents`
                \`\`\`javascript
                ${inspected}
                \`\`\`
            `, { maxLength: 1900, prepend, append });
        } else {
            return splitMessage(tags.stripIndents`
                *Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
                \`\`\`javascript
                ${inspected}
                \`\`\`
            `, { maxLength: 1900, prepend, append });
        }
    }
    function splitMessage(text, { maxLength = 2_000, char = '\n', prepend = '', append = '' } = {}) {
        text = Discord.Util.verifyString(text);
        if (text.length <= maxLength) return [text];
        let splitText = [text];
        if (Array.isArray(char)) {
            while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
                const currentChar = char.shift();
                if (currentChar instanceof RegExp) {
                    splitText = splitText.flatMap(chunk => chunk.match(currentChar));
                } else {
                    splitText = splitText.flatMap(chunk => chunk.split(currentChar));
                }
            }
        } else {
            splitText = text.split(char);
        }
        if (splitText.some(elem => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter(m => m);
    }
};