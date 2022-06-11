const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s ping.'),
    async execute (interaction) {
        return interaction.reply(`**Pong!** \`${interaction.client.ws.ping}ms\``);
    }
};