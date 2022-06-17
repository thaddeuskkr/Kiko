const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the queue.'),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        const queueLength = dispatcher.queue.length;
        dispatcher.queue.length = 0;
        const embed = new MessageEmbed()
            .setDescription(`Cleared the queue of ${queueLength} tracks.`)
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });
    }
};