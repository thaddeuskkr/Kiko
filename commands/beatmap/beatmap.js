const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const prettyms = require('pretty-ms');

const baseURL = 'https://api.beatmap.tk';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beatmap')
        .setDescription('Commands related to the beatmap.tk server.')
        .addSubcommand(subcommand => subcommand
            .setName('userinfo')
            .setDescription('Gets information about a user in the beatmap server.')
            .addStringOption(option => option.setName('user').setDescription('The user name / ID.'))),
    permissions: [],
    checks: [],
    async execute (client, interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'userinfo') {
            const scope = 'all';
            const linkedId = await client.db.get(`beatmap-linked-${interaction.user.id}`);
            if (!linkedId && !interaction.options?.getString('user')) {
                return interaction.reply('You did not specify a player, and there are no linked accounts to your Discord account.');
            }
            let u = await request('/get_player_info', `id=${interaction.options.getString('user')}&scope=${scope}`);
            if (!u.status) u = await request('/get_player_info', `name=${interaction.options.getString('user')}&scope=${scope}`);
            if (u.status !== 'success') {
                return interaction.reply('**Player not found.** Please check that you spelled the name correctly or entered a valid ID.');
            }
            const player = u.player.info;
            let stats = u.player.stats;
            const embedArr = [];
            const embed1 = new MessageEmbed()
                .setAuthor({ name: `${player.name}`, iconURL: `https://countryflagsapi.com/png/${player.country}` })
                .setDescription('*Paginate to view stats for individual game modes.*')
                .setThumbnail(`https://a.beatmap.tk/${player.id}`)
                .setTitle('User information')
                .setURL(`https://beatmap.tk/u/${player.id}`)
                .setColor(client.config.color)
                .setImage('https://i.imgur.com/OYxjnMX.gif')
                .addFields([
                    { name: 'ID:', value: player.id.toString(), inline: true },
                    { name: 'Privileges bits:', value: `\`${player.priv.toString()}\``, inline: true },
                    { name: 'Country:', value: player.country.toUpperCase(), inline: true },
                    { name: 'Donor status:', value: player.donor_end > 0 ? `Ends <t:${player.donor_end}:R>` : 'No donor status', inline: true },
                    { name: 'Silence status:', value: player.silence_end > 0 ? `Ends <t:${player.silence_end}:R>` : 'Not silenced', inline: true }
                ]);
            embedArr.push(embed1);
            stats = Object.values(stats);
            for (let i = 0; i < stats.length; i++) {
                if (i == 0) stats[i].gamemode = 'osu!';
                if (i == 1) stats[i].gamemode = 'osu!taiko';
                if (i == 2) stats[i].gamemode = 'osu!catch';
                if (i == 3) stats[i].gamemode = 'osu!mania';
                if (i == 4) stats[i].gamemode = 'osu! (Relax)';
                if (i == 5) stats[i].gamemode = 'osu!taiko (Relax)';
                if (i == 6) stats[i].gamemode = 'osu!catch (Relax)';
                if (i == 7) stats[i].gamemode = 'osu! (Autopilot)';
                const st = stats[i];
                if (st.playtime == 0) continue;

                const embed = new MessageEmbed()
                    .setAuthor({ name: `${player.name}`, iconURL: `https://countryflagsapi.com/png/${player.country}` })
                    .setThumbnail(`https://a.beatmap.tk/${player.id}`)
                    .setTitle(`User statistics - ${stats[i].gamemode}`)
                    .setURL(`https://beatmap.tk/u/${player.id}`)
                    .setColor(client.config.color)
                    .setImage('https://i.imgur.com/OYxjnMX.gif')
                    .setDescription(
                        `**Country rank:** \`#${st.country_rank}\`\n` + 
                        `**Ranked score:** \`${st.rscore}/${st.tscore}\`\n` +
                        `**Performance:** \`${st.pp}pp\`\n` +
                        `**Plays:** \`${st.plays} (${prettyms(st.playtime * 1000, { secondsDecimalDigits: 0, millisecondsDecimalDigits: 0 })})\`\n` +
                        `**Accuracy:** \`${st.acc.toFixed(2)}%\`\n` +
                        `**Max. combo:** \`${st.max_combo}\`\n` +
                        `**SS count:** \`${st.x_count + st.xh_count}\`\n` +
                        `**S count:** \`${st.sh_count + st.s_count}\`\n` +
                        `**A count:** \`${st.a_count}\`\n`
                    );
                    /* Way too many fields.
                    .addFields(i == 3 ? 
                        [
                            { name: 'Country rank:', value: st.country_rank.toString(), inline: true },
                            { name: 'Total score:', value: st.tscore.toString(), inline: true },
                            { name: 'Ranked score:', value: st.rscore.toString(), inline: true },
                            { name: 'PP:', value: st.pp.toString(), inline: true },
                            { name: 'Play count:', value: st.plays.toString(), inline: true },
                            { name: 'Play time:', value: prettyms(st.playtime * 1000, { verbose: true, secondsDecimalDigits: 0, millisecondsDecimalDigits: 0 }), inline: true },
                            { name: 'Accuracy (%):', value: `${st.acc.toFixed(2)}%`, inline: true },
                            { name: 'Maximum combo:', value: st.max_combo.toString(), inline: true },
                            { name: 'SS count:', value: st.x_count.toString(), inline: true },
                            { name: 'S count:', value: st.s_count.toString(), inline: true },
                            { name: 'A count:', value: st.a_count.toString(), inline: true } 
                        ] : [
                            { name: 'Country rank:', value: st.country_rank.toString(), inline: true },
                            { name: 'Total score:', value: st.tscore.toString(), inline: true },
                            { name: 'Ranked score:', value: st.rscore.toString(), inline: true },
                            { name: 'PP:', value: st.pp.toString(), inline: true },
                            { name: 'Play count:', value: st.plays.toString(), inline: true },
                            { name: 'Play time:', value: prettyms(st.playtime * 1000, { verbose: true, secondsDecimalDigits: 0, millisecondsDecimalDigits: 0 }), inline: true },
                            { name: 'Accuracy (%):', value: `${st.acc.toFixed(2)}%`, inline: true },
                            { name: 'Maximum combo:', value: st.max_combo.toString(), inline: true },
                            { name: 'SS (H) count:', value: st.xh_count.toString(), inline: true },
                            { name: 'SS count:', value: st.x_count.toString(), inline: true },
                            { name: 'S (H) count:', value: st.sh_count.toString(), inline: true },
                            { name: 'S count:', value: st.s_count.toString(), inline: true },
                            { name: 'A count:', value: st.a_count.toString(), inline: true }
                        ]);
                    */
                embedArr.push(embed);
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
            client.util.pagination(interaction, embedArr, buttons);
        } else if (subcommand === 'recent') {
            // Code goes here
        }
        async function request(endpoint, args) {
            const response = await fetch(`${baseURL}${endpoint}?${args}`);
            return await response.json();
        }
    }
};