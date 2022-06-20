const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move tracks through the queue using their old and new index.')
        .addIntegerOption(option => option.setName('oldIndex').setDescription('The index of the track to move.').setRequired(true))
        .addIntegerOption(option => option.setName('newIndex').setDescription('Where to put the track.').setRequired(true)),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC', 'QUEUE'],
    async execute (client, interaction, lava, dispatcher) {
        const oldIndex = interaction.options.getInteger('oldIndex');
        const trackToMove = dispatcher.queue[oldIndex - 1];
        const newIndex = interaction.options.getInteger('newIndex');
        const newQueue = array_move(dispatcher.queue, oldIndex - 1, newIndex - 1);
        dispatcher.queue = newQueue;
        const embed = new MessageEmbed()
            .setDescription(`Moved **${trackToMove.info.title}** by **${trackToMove.info.author}** to position **${newIndex}** in the queue.`)
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });

        function array_move(arr, old_index, new_index) {
            while (old_index < 0) {
                old_index += arr.length;
            }
            while (new_index < 0) {
                new_index += arr.length;
            }
            if (new_index >= arr.length) {
                var k = new_index - arr.length + 1;
                while (k--) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr;
        }
    }
};