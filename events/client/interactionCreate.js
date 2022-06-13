const { MessageEmbed } = require('discord.js');

module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    const command = client.commands.get(commandName);
    if (!command) return;

    const lava = client.shoukaku.getNode();
    const dispatcher = client.queue.get(interaction.guildId);

    if (command.permissions.length > 0) {
        if ((command.permissions.includes('OWNER') || command.category == 'owner') && !client.config.owners.includes(interaction.user.id)) {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'Insufficient permissions', iconURL: interaction.user.avatarURL({ size: 4096 }) })
                .setDescription('**You do not have the sufficient permissions to run this command.**\nOnly the bot owner can execute this command.')
                .setColor('RED')
                .setFooter({ text: `ethereal.tkkr.tk | Requested by ${interaction.user.tag}`, iconURL: client.user.avatarURL({ size: 4096 }) });
            return interaction.reply({ embeds: [embed] });
        }
        const index = command.permissions.indexOf('OWNER');
        if (index > -1) {
            command.permissions.splice(index, 1);
        }
        for (let i = 0; i < command.permissions.length; i++) {
            if (!interaction.member.permissions.has(command.permissions[i]) && !client.config.owners.includes(interaction.user.id)) {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'Insufficient permissions', iconURL: interaction.user.avatarURL({ size: 4096 }) })
                    .setDescription(`**You do not have the sufficient permissions to run this command.**\nYou need the \`${command.permissions[i]}\` permission.`)
                    .setColor('RED')
                    .setFooter({ text: `ethereal.tkkr.tk | Requested by ${interaction.user.tag}`, iconURL: client.user.avatarURL({ size: 4096 }) });
                return interaction.reply({ embeds: [embed] });
            }
        }
    }
    if (command.checks?.length > 0) {
        const embed = new MessageEmbed()
            .setAuthor({ name: 'Error', iconURL: interaction.user.avatarURL({ size: 4096 }) })
            .setColor('RED')
            .setFooter({ text: `ethereal.tkkr.tk | Requested by ${interaction.user.tag}`, iconURL: client.user.avatarURL({ size: 4096 }) });
        if (command.checks.includes('IN_VC') && interaction.member.voice.channelId == null) {
            embed.setDescription('You are not in a voice channel.');
            return interaction.reply({ embeds: [embed] });
        }
        if (command.checks.includes('SAME_VC') && interaction.guild.me.voice.channelId !== null && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) {
            embed.setDescription('You are not in the same voice channel as the bot.');
            return interaction.reply({ embeds: [embed] });
        }
        if (command.checks.includes('PLAYING') && !dispatcher) {
            embed.setDescription('There is nothing playing.');
            return interaction.reply({ embeds: [embed] });
        }
    }

    try {
        await command.execute(client, interaction, lava, dispatcher);
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