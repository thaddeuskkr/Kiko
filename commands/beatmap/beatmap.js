const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const prettyms = require('pretty-ms');
const _ = require('lodash');

const baseURL = 'https://api.beatmap.tk';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beatmap')
        .setDescription('Commands related to the beatmap.tk server.')
        .addSubcommand(subcommand => subcommand
            .setName('userinfo')
            .setDescription('Gets information about a user in the beatmap server.')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user name / ID.')))
            
        .addSubcommand(subcommand => subcommand
            .setName('link')
            .setDescription('Links your Discord account to an account on the beatmap server.')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user name / ID.')
                .setRequired(true)))
                
        .addSubcommand(subcommand => subcommand
            .setName('recent')
            .setDescription('Shows recent plays for a specified game mode for a user.')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user name / ID.'))
            .addStringOption(option => option
                .setName('gamemode')
                .setDescription('The game mode to show recent plays for.')
                .addChoices(
                    { name: 'osu!', value: '0' },
                    { name: 'osu!taiko', value: '1' },
                    { name: 'osu!catch', value: '2' },
                    { name: 'osu!mania', value: '3' },
                    { name: 'osu! (Relax)', value: '4' },
                    { name: 'osu!taiko (Relax)', value: '5' },
                    { name: 'osu!catch (Relax)', value: '6' },
                    { name: 'osu! (Autopilot)', value: '8' }
                ))
            .addBooleanOption(option => option
                .setName('showfailed')
                .setDescription('Whether to show failed plays.'))),
    permissions: [],
    checks: [],
    async execute (client, interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'userinfo') {
            const u = await searchUser(interaction, 'all');
            const player = u.info;
            let stats = u.stats;
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
        } else if (subcommand === 'link') {
            const user = interaction.options.getString('user');
            const linkedId = await client.db.get(`beatmap-linked-${interaction.user.id}`);
            if (linkedId) {
                if (!interaction.channel[`warned-${interaction.user.id}`] || interaction.channel[`warned-${interaction.user.id}`] == false) {
                    const linkedUser = await request('/get_player_info', `id=${linkedId}&scope=info`);
                    interaction.channel[`warned-${interaction.user.id}`] = true;
                    return interaction.reply(`**You are already linked to ${linkedUser.player.info.name} (${linkedUser.player.info.id}).** To ignore this warning and proceed, run this command again. *(Tip: use Ctrl+Z to save some time)*`);
                }
            }
            let u = await request('/get_player_info', `id=${user}&scope=info`);
            if (!u.status) u = await request('/get_player_info', `name=${user}&scope=info`);
            if (u.status !== 'success') {
                return interaction.reply('**Player not found.** Please check that you spelled the name correctly or entered a valid ID.');
            }
            await client.db.set(`beatmap-linked-${interaction.user.id}`, u.player.info.id);
            interaction.member.roles.add('992398172347453510');
            return interaction.reply(`**Successfully linked beatmap.tk account!** You may now use commands without specifying a \`user\` argument.\n\`${interaction.user.tag} ↔ ${u.player.info.name}\``);
        } else if (subcommand === 'recent') {
            const u = await searchUser(interaction);
            const gamemode = interaction.options.getString('gamemode') || 3;
            let tgamemode;
            if (gamemode == 0) tgamemode = 'osu!';
            if (gamemode == 1) tgamemode = 'osu!taiko';
            if (gamemode == 2) tgamemode = 'osu!catch';
            if (gamemode == 3) tgamemode = 'osu!mania';
            if (gamemode == 4) tgamemode = 'osu! (Relax)';
            if (gamemode == 5) tgamemode = 'osu!taiko (Relax)';
            if (gamemode == 6) tgamemode = 'osu!catch (Relax)';
            if (gamemode == 7) tgamemode = 'osu! (Autopilot)';
            let recent = await request('/get_player_scores', `id=${u.info.id}&scope=recent&mode=${gamemode}&limit=${interaction.options.getInteger('limit') || '45'}`);
            if (recent.status && recent.status !== 'success') return interaction.reply(`Failed to get recent scores for **${u.info.name} (${u.info.id})**.`);
            if (interaction.options.getBoolean('showfailed') == false) {
                recent = recent.scores.filter((score) => score.grade !== 'F' );
            } else {
                recent = recent.scores;
            }
            let chunked = _.chunk(recent, 5);
            let embedArr = [];
            for (let i = 0; i < chunked.length; i++) {
                let text = [];
                for (let e = 0; e < chunked[i].length; e++) {
                    let score = chunked[i][e];
                    const date = new Date(score.play_time);
                    const playTime = date.toLocaleString('en-US', {
                        hour12: false,
                        timeZone: 'Asia/Singapore',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    text.push(`**[${score.beatmap.title} - ${score.beatmap.artist} (mapped by ${score.beatmap.creator})](https://osu.ppy.sh/beatmapsets/${score.beatmap.set_id})** [\`${score.beatmap.diff.toFixed(2)}☆\`]`);
                    text.push(`\`${score.grade}\` | \`${score.pp}PP\` | **Score:** \`${score.score}\` | **Accuracy:** \`${score.acc.toFixed(2)}%\``);
                    text.push(`**Max combo:** \`${score.max_combo}\` | **Mods (bits):** \`${score.mods}\``);
                    text.push(`**300:** \`${score.n300 + score.ngeki + score.nkatu}\` | **100:** \`${score.n100}\` | **50:** \`${score.n50}\` | **Misses:** \`${score.nmiss}\``);
                    text.push(`**Date:** \`${playTime}\`\n**Time elapsed:** \`${prettyms(score.time_elapsed, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 })}\` | **ID:** \`${score.id}\``);
                    text.push('--------------');
                }
                
                const embed = new MessageEmbed()
                    .setAuthor({ name: `${u.info.name}`, iconURL: `https://countryflagsapi.com/png/${u.info.country}` })
                    .setThumbnail(`https://a.beatmap.tk/${u.info.id}`)
                    .setTitle(`Recent plays - ${tgamemode}`)
                    .setURL(`https://beatmap.tk/u/${u.info.id}`)
                    .setColor(client.config.color)
                    .setImage('https://i.imgur.com/OYxjnMX.gif')
                    .setDescription(text.join('\n'));
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
        }
        async function searchUser(interaction, scope) {
            if (!scope) scope = 'all';
            const linkedId = await client.db.get(`beatmap-linked-${interaction.user.id}`);
            if (!linkedId && !interaction.options?.getString('user')) {
                return interaction.reply('You did not specify a player, and there are no linked accounts to your Discord account.');
            }
            let user;
            if (linkedId && !interaction.options.getString('user')) user = linkedId;
            else user = interaction.options.getString('user');
            let u = await request('/get_player_info', `id=${user}&scope=${scope}`);
            if (!u.status) u = await request('/get_player_info', `name=${user}&scope=${scope}`);
            if (u.status !== 'success') {
                return interaction.reply('**Player not found.** Please check that you spelled the name correctly or entered a valid ID.');
            }
            return u.player;
        }
        async function request(endpoint, args) {
            const response = await fetch(`${baseURL}${endpoint}?${args}`);
            return await response.json();
        }
    }
};