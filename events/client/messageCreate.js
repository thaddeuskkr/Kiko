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
    } else if (message.content === 'ethereal undeploy guild') {
        rest.get(Routes.applicationGuildCommands(client.user.id, message.guild.id))
            .then(data => {
                const promises = [];
                for (const command of data) {
                    const deleteUrl = `${Routes.applicationGuildCommands(client.user.id, message.guild.id)}/${command.id}`;
                    promises.push(rest.delete(deleteUrl));
                }
                return Promise.all(promises);
            });
    } else if (message.content === 'ethereal undeploy' || message.content === 'ethereal undeploy global') {
        rest.get(Routes.applicationCommands(client.user.id))
            .then(data => {
                const promises = [];
                for (const command of data) {
                    const deleteUrl = `${Routes.applicationCommands(client.user.id)}/${command.id}`;
                    promises.push(rest.delete(deleteUrl));
                }
                return Promise.all(promises);
            });
    }
};