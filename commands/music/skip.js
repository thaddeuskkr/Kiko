const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the currently playing track.'),
    permissions: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        if (!lava) return interaction.reply('No nodes connected.');
        const now = dispatcher.current;
        const embed = new MessageEmbed()
            .setDescription(`Skipped **${now.info.title}** by **${now.info.author}**`)
            .setColor(client.config.color);
        await dispatcher.player.stopTrack();
        interaction.reply({ embeds: [embed] });
    }
};