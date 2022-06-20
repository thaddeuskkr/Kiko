const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a selected track index from the queue.')
        .addIntegerOption(option => option.setName('index').setDescription('The index of the track to remove.').setRequired(true)),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC', 'QUEUE'],
    async execute (client, interaction, lava, dispatcher) {
        const index = interaction.options.getInteger('index') - 1;
        const removedTrack = dispatcher.queue.splice(index, 1)[0];
        const embed = new MessageEmbed()
            .setDescription(`Removed **${removedTrack.info.title}** by **${removedTrack.info.author}** from the queue.`)
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });
    }
};