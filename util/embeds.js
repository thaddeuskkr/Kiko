const { MessageEmbed } = require('discord.js');
module.exports = {
    insufficientPermissions: (user) => { 
        return new MessageEmbed()
            .setColor('RED')
            .setAuthor({ name: 'Insufficient permissions', iconURL: user.avatarURL({ size: 4096 }) })
            .setDescription('You do not have sufficient permissions to execute this command.');
    }
};