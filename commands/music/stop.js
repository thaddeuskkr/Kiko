const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const Wait = require('util').promisify(setTimeout);
module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Clear the queue and stop the player.'),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        await interaction.deferReply();
        dispatcher.queue.length = 0;
        dispatcher.repeat = 'off';
        dispatcher.stopped = true;
        dispatcher.player.stopTrack();
        Wait(500);
        const embed = new MessageEmbed()
            .setDescription('Stopped the player and cleared the queue.')
            .setColor(client.config.color);
        interaction.editReply({ embeds: [embed] });
    }
};