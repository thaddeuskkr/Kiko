const Dispatcher = require('./dispatcher.js');

class Queue extends Map {
    constructor(client, iterable) {
        super(iterable);
        this.client = client;
    }

    async handle (guild, member, channel, node, track) {
        const existing = this.get(guild.id);
        track.info.requester = member.user;
        if (!existing) {
            if (this.client.shoukaku.players.has(guild.id)) 
                return 'Busy';
            const player = await node.joinChannel({
                guildId: guild.id,
                shardId: guild.shardId,
                channelId: member.voice.channelId
            });
            this.client.logger.debug(`[Player] New connection @ guild "${guild.id}"`);
            const dispatcher = new Dispatcher({
                client: this.client,
                guild,
                channel,
                player
            });
            dispatcher.queue.push(track);
            this.set(guild.id, dispatcher);
            this.client.logger.debug(`[Dispatcher] New player dispatcher @ guild "${guild.id}"`);
            return dispatcher;
        }
        existing.queue.push(track);
        if (!existing.current) existing.play();
        return null;
    }
}
module.exports = Queue;