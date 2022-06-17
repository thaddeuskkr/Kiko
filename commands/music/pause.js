const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing track.'),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        const now = dispatcher.current;
        const embed = new MessageEmbed()
            .setDescription(`Paused **${now.info.title}** by **${now.info.author}**`)
            .setColor(client.config.color);
        dispatcher.player.setPaused(true);
        interaction.reply({ embeds: [embed] });
    }
};