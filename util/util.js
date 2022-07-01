const prettyms = require('pretty-ms');
const {  MessageActionRow } = require('discord.js');
module.exports = {
    formatTime: (ms, stream) => {
        if (stream && stream === true) return 'LIVE';
        return prettyms(ms, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 });
    },
    pagination: async (interaction, pages, buttonList, timeout = 120000) => {
        if (!pages || !buttonList || 
            buttonList[0].style === 'LINK' || buttonList[1].style === 'LINK' || 
            buttonList.length !== 2) return false;
        let page = 0;
        const row = new MessageActionRow().addComponents(buttonList);
        if (interaction.deferred == false) await interaction.deferReply();
        const currentPage = await interaction.editReply({
            embeds: [pages[page].setFooter({ text: `Page ${page + 1} of ${pages.length}` })],
            components: [row],
            fetchReply: true
        });
        const filter = (i) => i.customId === buttonList[0].customId || i.customId === buttonList[1].customId;
        const collector = await currentPage.createMessageComponentCollector({ filter, time: timeout });
        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Only the user who invocated the command can use the buttons.', ephemeral: true });
            switch (i.customId) {
            case buttonList[0].customId:
                page = page > 0 ? --page : pages.length - 1;
                break;
            case buttonList[1].customId:
                page = page + 1 < pages.length ? ++page : 0;
                break;
            default:
                break;
            }
            await i.deferUpdate();
            await i.editReply({
                embeds: [pages[page].setFooter({ text: `Page ${page + 1} of ${pages.length}` })],
                components: [row]
            });
            collector.resetTimer();
        });
        collector.on('end', (_, reason) => {
            if (reason !== 'messageDelete') {
                const disabledRow = new MessageActionRow().addComponents(
                    buttonList[0].setDisabled(true),
                    buttonList[1].setDisabled(true)
                );
                currentPage.edit({
                    embeds: [pages[page].setFooter({ text: `Page ${page + 1} of ${pages.length}` })],
                    components: [disabledRow]
                });
            }
        });
        return currentPage;
    },
    createProgressBar: (current, end, size) => {
        if (isNaN(current) || isNaN(end)) return 'Arguments current and end have to be integers.';
        const percentage = current / end;
        const progress = Math.round(size * percentage);
        const emptyProgress = size - progress;

        const progressText = '▇'.repeat(progress);
        const emptyProgressText = '—'.repeat(emptyProgress);

        return `\`[${progressText}${emptyProgressText}]\``;
    }
};