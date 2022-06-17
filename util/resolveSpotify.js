const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { getData } = require('spotify-url-info')(fetch);
const { MessageEmbed } = require('discord.js');
module.exports = async (url, lava, client, interaction, source) => {
    const data = await getData(url);
    if (data.type === 'track') {
        const artists = [];
        let search = '';
        for (const artist of data.artists) {
            artists.push(artist.name);
        }
        search = `${data.name} - ${artists.join(', ')}`;
        const res = await lava.rest.resolve(`${source}search:${search}`);
        const track = res.tracks.shift();
        const dispatcher = await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, track);
        if (dispatcher === 'Busy') return interaction.reply('Dispatcher is currently busy and connecting to a voice channel.');
        const embed = new MessageEmbed()
            .setDescription(`Queued **${track.info.title}** by **${track.info.author}** [${client.util.formatTime(track.info.length, track.info.isStream)}]`)
            .setColor(client.config.color);
        await interaction.reply({ embeds: [embed] });
        dispatcher?.play();
    } else if (data.type === 'playlist') {
        const processEmbed = new MessageEmbed()
            .setColor(client.config.color)
            .setDescription(`Processing playlist **${data.name}** by **${data.owner.display_name}**`)
            .setFooter({ text: 'Only the first 100 tracks will be loaded. This may take a while.' });
        await interaction.reply({ embeds: [processEmbed] });
        const failedTracks = [];
        /*
        const firstTrack = data.tracks.items.shift();
        const ftArtists = [];
        let ftSearch = '';
        for (const artist of firstTrack.track.artists) {
            ftArtists.push(artist.name);
        }
        ftSearch = `${firstTrack.track.name} - ${ftArtists.join(', ')}`;
        const ftRes = await lava.rest.resolve(`${source}search:${ftSearch}`);
        const ftTrack = ftRes.tracks.shift();
        const dispatcher = await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, ftTrack);
        if (dispatcher === 'Busy') return interaction.editReply('Dispatcher is currently busy and connecting to a voice channel.');
        */
        for (const track of data.tracks.items) {
            const artists = [];
            let search = '';
            for (const artist of track.track.artists) {
                artists.push(artist.name);
            }
            search = `${track.track.name} - ${artists.join(', ')}`;
            const result = await lava.rest.resolve(`${source}search:${search}`);
            if (!result?.tracks.length) failedTracks.push(search);
            else {
                const track = result.tracks.shift();
                await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, track);
            }
        }
        const embed = new MessageEmbed()
            .setDescription(`Queued playlist **${data.name}** by ${data.owner.display_name}`)
            .setFooter({ text: 'Only the first 100 tracks were processed.' })
            .setColor(client.config.color);
        await interaction.editReply({ embeds: [embed] });
    }
};