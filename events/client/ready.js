module.exports = async client => {
    client.logger.info(`Logged in as ${client.user.tag}!`);
    client.user.setStatus('dnd');
    client.user.setActivity({ name: 'you', type: 'WATCHING'});
};