const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const prettyms = require('pretty-ms');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Search for a song and play it.')
        .addStringOption(option => option.setName('query').setDescription('What would you like to listen to?').setRequired(true))
        .addStringOption(option => option.setName('source').setDescription('Where would you like to search? (yt, ytm, sc)').setRequired(false)),
    permissions: [],
    async execute (client, interaction, lava) {
        if (!lava) return interaction.reply('No nodes connected.');
        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || 'ytm';
        if (this.checkURL()) {
            const result = await lava.rest.resolve(query);
            if (!result?.tracks.length) return interaction.reply(`No results found for your query \`${interaction.options.getString('query')}\`.`);
            const track = result.tracks.shift();
            const playlist = result.loadType === 'PLAYLIST_LOADED';
            const dispatcher = await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, track);
            if (dispatcher === 'Busy') return interaction.reply('Dispatcher is currently busy and connecting to a voice channel.');
            if (playlist) {
                for (const track of result.tracks) await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, track);
            }
            await interaction
                .reply(playlist ? `Queued the playlist **${result.playlistInfo.name}**.` : `Queued **${track.info.title}** by **${track.info.author}** [${prettyms(track.info.length, { colonNotation: true, millisecondsDecimalDigits: 0})}]`)
                .catch(() => null);
            dispatcher?.play();
            return;
        }
        if (source && source != 'yt' && source != 'ytm' && source != 'sc') return interaction.reply('Invalid source.');
        const result = await lava.rest.resolve(`${source}search:${interaction.options.getString('query')}`);
        if (!result?.tracks.length) return interaction.reply(`No results found for your query \`${interaction.options.getString('query')}\`.`);
        const track = result.tracks.shift();
        const dispatcher = await client.queue.handle(interaction.guild, interaction.member, interaction.channel, lava, track);
        if (dispatcher === 'Busy') return interaction.reply('Dispatcher is currently busy and connecting to a voice channel.');
        const embed = new MessageEmbed()
            .setDescription(`Queued **${track.info.title}** by **${track.info.author}** [${prettyms(track.info.length, { colonNotation: true, millisecondsDecimalDigits: 0})}]`)
            .setColor(client.config.color);
        await interaction.reply({ embeds: [embed] });
        dispatcher?.play();
    },
    checkURL(string) {
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
    }
};