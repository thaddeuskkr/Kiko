const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Change the volume of the player.')
        .addIntegerOption(option => option.setName('volume').setRequired(false).setDescription('The new volume of the player.')),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        if (!lava) return interaction.reply('No nodes connected.');
        const oldVolume = dispatcher.player.filters.volume * 100;
        const newVolume = interaction.options.getInteger('volume');
        if (!inRange(newVolume, 0, 200)) return interaction.reply('Volume must be between 0 and 200.');
        dispatcher.player.setVolume(newVolume / 100);
        const embed = new MessageEmbed()
            .setDescription(`Changed the player volume from **${oldVolume}%** to **${newVolume}%**.`)
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });
        function inRange(x, min, max) {
            return (x - min) * ( x - max) <= 0;
        }
    }
};