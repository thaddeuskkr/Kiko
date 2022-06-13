const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s ping.'),
    permissions: [],
    async execute (client, interaction) {
        return interaction.reply(`**Pong!** \`${client.ws.ping}ms\``);
    }
};