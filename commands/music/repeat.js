const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('Sets the repeat mode of the player.')
        .addStringOption(option => option.setName('mode')
            .setRequired(true)
            .setDescription('The new repeat mode of the player.')
            .addChoices(
                { name: 'Currently playing track', value: 'one' },
                { name: 'Whole queue', value: 'all' },
                { name: 'Disabled', value: 'off' }
            )),
    permissions: [],
    checks: ['PLAYING', 'IN_VC', 'SAME_VC'],
    async execute (client, interaction, lava, dispatcher) {
        dispatcher.repeat = interaction.options.getString('mode');
        let txt;
        if (dispatcher.repeat === 'one') {
            txt = 'Now looping the currently playing track.';
        } else if (dispatcher.repeat === 'all') {
            txt = 'Now looping the whole queue.';
        } else if (dispatcher.repeat === 'off') {
            txt = 'Disabled loop.';
        }
        const embed = new MessageEmbed()
            .setDescription(`The repeat mode was set to **${dispatcher.repeat}**.`)
            .setFooter({ text: txt })
            .setColor(client.config.color);
        interaction.reply({ embeds: [embed] });
    }
};