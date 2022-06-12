const { SlashCommandBuilder } = require('@discordjs/builders');
const util = require('util');
const Discord = require('discord.js');
const tags = require('common-tags');
const escapeRegex = (str) => { return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); };
const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evaluates a line of code and replies with the result.')
        .addStringOption(option => option.setName('code').setDescription('The code to evaluate.').setRequired(true)),
    permissions: ['OWNER'],
    lastResult: null,
    _sensitivePattern: null,
    /* eslint-disable no-unused-vars */
    async execute (client, interaction, lava) {
        const lastResult = this.lastResult;
        /* eslint-enable no-unused-vars */
        const code = interaction.options.getString('code');
        let hrDiff;
        try {
            const hrStart = process.hrtime();
            this.lastResult = eval(code);
            hrDiff = process.hrtime(hrStart);
        } catch(err) {
            return interaction.reply({ content: `Error while evaluating: \`${err}\`` });
        }
        this.hrStart = process.hrtime();
        const result = this.makeResultMessages(this.lastResult, hrDiff, code);
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: 'Success', iconURL: interaction.user.avatarURL({ size: 4096 }) })
            .setColor(client.config.color)
            .setDescription(`*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*`)
            .setFooter({ text: `ethereal.tkkr.tk | Requested by ${interaction.user.tag}`, iconURL: client.user.avatarURL({ size: 4096 }) });
        await interaction.reply({ embeds: [embed] });
        if (Array.isArray(result)) {
            return result.map(item => interaction.channel.send({ content: item }));
        } else {
            return interaction.channel.send({ content: result });
        }
    },
    makeResultMessages(result, hrDiff, input = null) {
        const inspected = util.inspect(result, { depth: 0 }).replace(nlPattern, '\n').replace(this.sensitivePattern, '--snip--');
        const split = inspected.split('\n');
        const last = inspected.length - 1;
        const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== '\'' ? split[0] : inspected[0];
        const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== '\'' ? split[split.length - 1] : inspected[last];
        const prepend = `\`\`\`javascript\n${prependPart}\n`;
        const append = `\n${appendPart}\n\`\`\``;
        if (input) {
            return this.splitMessage(tags.stripIndents`
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
        } else {
            return this.splitMessage(tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
        }
    },
    get sensitivePattern() {
        if(!this._sensitivePattern) {
            let pattern = '';
            if(process.env.TOKEN) pattern += escapeRegex(process.env.TOKEN);
            Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(pattern, 'gi'), configurable: false });
        }
        return this._sensitivePattern;
    },
    splitMessage(text, { maxLength = 2_000, char = '\n', prepend = '', append = '' } = {}) {
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