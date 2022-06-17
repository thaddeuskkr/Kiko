const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the queue.'),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        dispatcher.queue = dispatcher.queue.sort(() => Math.random() - 0.5);
        const embed = new MessageEmbed()
            .setDescription(`Shuffled **${dispatcher.queue.length}** tracks.`)
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });
    }
};