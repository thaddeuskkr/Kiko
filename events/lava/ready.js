module.exports = (client, name, reconnected) => {
    client.logger.info(`${reconnected ? 'Reconnected' : 'Connected'} to Lavalink! (${name})`);
};