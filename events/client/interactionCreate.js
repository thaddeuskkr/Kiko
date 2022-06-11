const { MessageEmbed } = require('discord.js');

module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        client.logger.error(`Error executing command ${commandName}: ${err.message}`);
        const embed = new MessageEmbed()
            .setAuthor({ name: 'Error', iconURL: client.user.avatarURL({ size: 4096 }) })
            .setColor(client.config.color)
            .setDescription(`**Error while executing command ${commandName}:**\n\`\`\`${err.message}\`\`\``)
            .setFooter({ text: `ethereal.tkkr.tk | Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL({ size: 4096 }) });
        await interaction.reply({ embeds: [ embed ], ephemeral: true });
    }
};