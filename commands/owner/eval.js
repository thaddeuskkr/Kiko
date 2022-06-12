const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evaluates a line of code and replies with the result.')
        .addStringOption(option => option.setName('code').setDescription('The code to evaluate.').setRequired(true)),
    permissions: ['OWNER'],
    async execute (client, interaction) {

    }
};