const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Util, MessageButton } = require('discord.js');
const _ = require('lodash');
const tracksPerPage = 10;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows you the current queue.'),
    permissions: [],
    checks: ['PLAYING', 'IN_VC'],
    async execute (client, interaction, lava, dispatcher) {
        await interaction.deferReply();
        let currentDuration = client.util.formatTime(dispatcher.current.info.length, dispatcher.current.info.isStream);
        const embeds = [];
        let chunked = _.chunk(dispatcher.queue, tracksPerPage);
        let totalDurationMs = 0;
        for (const track of dispatcher.queue) {
            totalDurationMs += track.info.length;
        }
        let totalDuration = client.util.formatTime(totalDurationMs);
        if (dispatcher.queue.find(x => x.info.isStream === true)) totalDuration = '∞';
        for (let i = 0; i < chunked.length; i++) {
            let msgArr = [];
            msgArr.push(`**Total duration:** \`${totalDuration}\``);
            msgArr.push(`**Now playing:** ${dispatcher.current.info.title} - ${dispatcher.current.info.author} [${currentDuration}] (${dispatcher.current.requester.tag})`);
            for (let e = 0; e < chunked[i].length; e++) {
                let track = chunked[i][e];
                let trackDuration = client.util.formatTime(track.info.length, track.info.isStream);
                msgArr.push(`**\`${e + 10 * i + 1}\`**: ${Util.escapeMarkdown(track.info.title)} [${trackDuration}] (${track.requester.tag})`);
            }
            msgArr.push(`\n**${dispatcher.queue.length}** tracks in queue.`);
            let text = msgArr.join('\n');
            embeds.push(text);
        }
        let finalEmbeds = [];
        for (const text of embeds) {
            const embed = new MessageEmbed()
                .setAuthor({ name: `Queue for ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ size: 4096 }) })
                .setDescription(text)
                .setColor(client.config.color);
            finalEmbeds.push(embed);
        }
        const buttons = [
            new MessageButton()
                .setCustomId('prev')
                .setLabel('Previous')
                .setStyle('PRIMARY'), 
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('PRIMARY')
        ];
        client.util.pagination(interaction, finalEmbeds, buttons);
    }
};