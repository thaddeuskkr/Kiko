const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
module.exports = async (client, message) => {
    if (!client.config.owners.includes(message.author.id)) return;
    if (message.content !== 'ethereal deploy' && message.content !== 'ethereal deploy guild' && message.content !== 'ethereal deploy global') return;
    
    const commands = [];

    for (const command of client.commands) {
        commands.push(command[1].data.toJSON());
    }
    
    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

    if (message.content === 'ethereal deploy guild') {
        rest.put(Routes.applicationGuildCommands(client.user.id, message.guild.id), { body: commands })
            .then(() => client.logger.info(`Successfully registered application commands for server ${message.guild.name} (${message.guild.id})!`))
            .catch(err => client.logger.error('Failed to register application commands: ' + err.message));
        message.reply('Success!');
    } else if (message.content === 'ethereal deploy' || message.content === 'ethereal deploy global') {
        rest.put(Routes.applicationCommands(client.user.id), { body: commands })
            .then(() => client.logger.info('Successfully registered application commands globally!'))
            .catch(err => client.logger.error('Failed to register application commands: ' + err.message));
        message.reply('Success!');
    }
};