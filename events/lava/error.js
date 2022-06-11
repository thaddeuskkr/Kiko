module.exports = (client, _, error) => {
    client.logger.error(error.message);
    console.error(error);
};