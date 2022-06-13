const { MessageEmbed } = require('discord.js');
const prettyms = require('pretty-ms');

class Dispatcher {
    constructor({ client, guild, channel, player }) {
        this.client = client;
        this.guild = guild;
        this.channel = channel;
        this.player = player;
        this.queue = [];
        this.repeat = 'off';
        this.current = null;
        this.stopped = false;

        let _notifiedOnce = false;
        let _errorHandler = data => {
            if (data instanceof Error || data instanceof Object) this.client.logger.error(data);
            this.queue.length = 0;
            this.destroy();
        };

        this.player
            .on('start', () => {
                if (this.repeat === 'one') {
                    if (_notifiedOnce) return;
                    else _notifiedOnce = true; 
                }
                else if (this.repeat === 'all' || this.repeat === 'off') {
                    _notifiedOnce = false;
                }
                const embed = new MessageEmbed()
                    .setColor(this.client.config.color)
                    .setAuthor({ name: 'Now playing', iconURL: client.user.avatarURL({ size: 4096 }), url: this.current.info.uri })
                    .setDescription(`**${this.current.info.title}** - **${this.current.info.author}** [${Dispatcher.humanizeTime(this.current.info.length)}]`)
                    .setFooter({ text: `Requested by ${this.current.info.requester.tag}`, iconURL: this.current.info.requester.avatarURL({ size: 4096 }) });
                this.channel
                    .send({ embeds: [ embed ] })
                    .catch(() => null);
            })
            .on('end', () => {
                if (this.repeat === 'one') this.queue.unshift(this.current);
                if (this.repeat === 'all') this.queue.push(this.current);
                this.play();
            })
            .on('stuck', () => {
                if (this.repeat === 'one') this.queue.unshift(this.current);
                if (this.repeat === 'all') this.queue.push(this.current);
                this.play();
            })
            .on('closed', _errorHandler)
            .on('error', _errorHandler);
    }

    static humanizeTime(ms) {
        return prettyms(ms, { colonNotation: true, millisecondsDecimalDigits: 0 });
    }

    get exists() {
        return this.client.queue.has(this.guild.id);
    }

    play() {
        if (!this.exists || !this.queue.length) return this.destroy();
        this.current = this.queue.shift();
        this.player
            .setVolume(this.client.config.defaultVolume / 100)
            .playTrack({ track: this.current.track });
    }
    
    destroy(reason) {
        this.queue.length = 0;
        this.player.connection.disconnect();
        this.client.queue.delete(this.guild.id);
        this.client.logger.debug(this.player.constructor.name, `Destroyed the player & connection @ guild "${this.guild.id}"\nReason: ${reason || 'No Reason Provided'}`);
        if (this.stopped) return;
        // this.channel.send('No more tracks in queue.').catch(() => null);
    }
}
module.exports = Dispatcher;