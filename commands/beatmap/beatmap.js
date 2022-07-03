const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const prettyms = require('pretty-ms');
const _ = require('lodash');
const { exec, spawn }= require('child_process');
const { URL } = require('url');
const fs = require('fs');
const AsciiTable = require('ascii-table');

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
                .setDescription('Whether to show failed plays.'))
            .addIntegerOption(option => option
                .setName('limit')
                .setDescription('The number of plays to show. (Defaults to 50)')))

        .addSubcommand(subcommand => subcommand
            .setName('top')
            .setDescription('Show top plays for a specified game mode for a user.')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user name / ID.'))
            .addStringOption(option => option
                .setName('gamemode')
                .setDescription('The game mode to show top plays for.')
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
            .addIntegerOption(option => option
                .setName('limit')
                .setDescription('The number of plays to show. (Defaults to 50)')))
        
        .addSubcommand(subcommand => subcommand
            .setName('profile')
            .setDescription('Shows the profile for a specified game mode for a user.')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user name / ID.'))
            .addStringOption(option => option
                .setName('gamemode')
                .setDescription('The game mode to show the profile for.')
                .addChoices(
                    { name: 'osu!', value: '0' },
                    { name: 'osu!taiko', value: '1' },
                    { name: 'osu!catch', value: '2' },
                    { name: 'osu!mania', value: '3' },
                    { name: 'osu! (Relax)', value: '4' },
                    { name: 'osu!taiko (Relax)', value: '5' },
                    { name: 'osu!catch (Relax)', value: '6' },
                    { name: 'osu! (Autopilot)', value: '8' }
                )))
                
        .addSubcommand(subcommand => subcommand
            .setName('calculate')
            .setDescription('Calculate performance points using accuracy and given mods.')
            .addStringOption(option => option
                .setName('beatmap')
                .setDescription('What beatmap would you like to calculate the PP for? (Link)')
                .setRequired(true))
            .addStringOption(option => option
                .setName('args')
                .setDescription('Arguments to pass to the calculator (e.g. mods - e.g. +HRDT, combo - e.g. 100x, acc - e.g. 100%)')))
                
        .addSubcommand(subcommand => subcommand
            .setName('calculatemania')
            .setDescription('Calculate performance points for osu!mania.')
            .addStringOption(option => option
                .setName('beatmap')
                .setDescription('What beatmap would you like to calculate the PP for? (Link)')
                .setRequired(true))
            .addStringOption(option => option
                .setName('score')
                .setDescription('Score to calculate PP for.')
                .setRequired(true))
            .addIntegerOption(option => option
                .setName('mods')
                .setDescription('Mods bits (Do not use unless you know what you\'re doing).')))
                
        .addSubcommand(subcommand => subcommand
            .setName('compare')
            .setDescription('Compare to the recent score returned by the bot or the score ID you provide')
            .addIntegerOption(option => option
                .setName('id')
                .setDescription('The ID of the score, if you want to provide one.'))
            .addStringOption(option => option
                .setName('user')
                .setDescription('The user ID or username of the user to compare to (defaults to yourself)'))),
    permissions: [],
    checks: [],
    async execute (client, interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (interaction.guildId !== '992062136866066503') return interaction.reply('This set of commands can only be used in the `beatmap.tk` Discord server.');
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
                if (st.playtime == 0 || st.rank == 0) continue;

                const embed = new MessageEmbed()
                    .setAuthor({ name: `${player.name}`, iconURL: `https://countryflagsapi.com/png/${player.country}` })
                    .setThumbnail(`https://a.beatmap.tk/${player.id}`)
                    .setTitle(`User statistics - ${stats[i].gamemode}`)
                    .setURL(`https://beatmap.tk/u/${player.id}`)
                    .setColor(client.config.color)
                    .setImage('https://i.imgur.com/OYxjnMX.gif')
                    .setDescription(
                        `**Rank:** \`#${st.rank}\`\n` + 
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
            if (gamemode == 8) tgamemode = 'osu! (Autopilot)';
            let recent = await request('/get_player_scores', `id=${u.info.id}&scope=recent&mode=${gamemode}&limit=${interaction.options.getInteger('limit') || '50'}`);
            if (recent.status && recent.status !== 'success') return interaction.reply(`Failed to get recent scores for **${u.info.name} (${u.info.id})**.`);
            if (interaction.options.getBoolean('showfailed') == false) {
                recent = recent.scores.filter((score) => score.grade !== 'F' );
            } else {
                recent = recent.scores;
            }
            if (interaction.options.getInteger('limit') == 1) interaction.channel.recentScore = recent[0];
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
                    text.push(`**[${score.beatmap.title} - ${score.beatmap.artist} [${score.beatmap.version}] (mapped by ${score.beatmap.creator})](https://osu.ppy.sh/beatmapsets/${score.beatmap.set_id})** [\`${score.beatmap.diff.toFixed(2)}☆\`]`);
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
        } else if (subcommand === 'top') {
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
            if (gamemode == 8) tgamemode = 'osu! (Autopilot)';
            let top = await request('/get_player_scores', `id=${u.info.id}&scope=best&mode=${gamemode}&limit=${interaction.options.getInteger('limit') || '50'}`);
            if (top.status && top.status !== 'success') return interaction.reply(`Failed to get top scores for **${u.info.name} (${u.info.id})**.`);
            top = top.scores;
            if (top.length < 1) return interaction.reply('No top plays to show.');
            if (interaction.options.getInteger('limit') == 1) interaction.channel.recentScore = top[0];
            /* Only applies for recent plays.
            if (interaction.options.getBoolean('showfailed') == false) {
                recent = recent.scores.filter((score) => score.grade !== 'F' );
            } else {
                recent = recent.scores;
            }
            */
            let chunked = _.chunk(top, 5);
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
                    text.push(`**[${score.beatmap.title} - ${score.beatmap.artist} [${score.beatmap.version}] (mapped by ${score.beatmap.creator})](https://osu.ppy.sh/beatmapsets/${score.beatmap.set_id})** [\`${score.beatmap.diff.toFixed(2)}☆\`]`);
                    text.push(`\`${score.grade}\` | \`${score.pp}PP\` | **Score:** \`${score.score}\` | **Accuracy:** \`${score.acc.toFixed(2)}%\``);
                    text.push(`**Max combo:** \`${score.max_combo}\` | **Mods (bits):** \`${score.mods}\``);
                    text.push(`**300:** \`${score.n300 + score.ngeki + score.nkatu}\` | **100:** \`${score.n100}\` | **50:** \`${score.n50}\` | **Misses:** \`${score.nmiss}\``);
                    text.push(`**Date:** \`${playTime}\`\n**Time elapsed:** \`${prettyms(score.time_elapsed, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 })}\` | **ID:** \`${score.id}\``);
                    text.push('--------------');
                }
                
                const embed = new MessageEmbed()
                    .setAuthor({ name: `${u.info.name}`, iconURL: `https://countryflagsapi.com/png/${u.info.country}` })
                    .setThumbnail(`https://a.beatmap.tk/${u.info.id}`)
                    .setTitle(`Top plays - ${tgamemode}`)
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
        } else if (subcommand === 'profile') {
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
            if (gamemode == 8) tgamemode = 'osu! (Autopilot)';
            let pInfo = await request('/get_player_info', `id=${u.info.id}&scope=stats`);
            if (pInfo.status && pInfo.status !== 'success') return interaction.reply(`Failed to get profile for **${u.info.name} (${u.info.id})**. (stats)`);
            pInfo = pInfo.player.stats[gamemode];
            let top = await request('/get_player_scores', `id=${u.info.id}&scope=best&mode=${gamemode}&limit=5`);
            if (top.status && top.status !== 'success') return interaction.reply(`Failed to get profile for **${u.info.name} (${u.info.id})**. (scores)`);
            top = top.scores;
            let recent = await request('/get_player_scores', `id=${u.info.id}&scope=recent&mode=${gamemode}&limit=5`);
            if (recent.status && recent.status !== 'success') return interaction.reply(`Failed to get profile for **${u.info.name} (${u.info.id})**. (scores)`);
            recent = recent.scores;
            let status = await request('/get_player_status', `id=${u.info.id}`);
            if (status.status && status.status !== 'success') return interaction.reply(`Failed to get profile for **${u.info.name} (${u.info.id})**. (status)`);
            status = status.player_status;
            let statusText = '';
            if (status.online == false) statusText = '<:offline:992644133275574373> Offline';
            else if (status.online == true && status.status.action == 0) statusText = '<:online:992643863728627792> Idle';
            else if (status.online == true && status.status.action == 1) statusText = '<:idle:992643711626395729> AFK';
            else if (status.online == true && status.status.action == 2) statusText = `<:dnd:992644105219879003> Playing **${status.status.info_text}**`;
            else if (status.online == true && status.status.action == 3) statusText = `<:dnd:992644105219879003> Editing **${status.status_info_text}**`;
            else if (status.online == true && status.status.action == 4) statusText = `<:dnd:992644105219879003> Modding **${status.status_info_text}**`;
            else if (status.online == true && status.status.action == 5) statusText = '<:online:992643863728627792> Selecting a song in a multiplayer lobby';
            else if (status.online == true && status.status.action == 6) statusText = `<:online:992643863728627792> Watching **${status.status_info_text}**`;
            // 7 isn't used - skip
            else if (status.online == true && status.status.action == 8) statusText = `<:online:992643863728627792> Testing **${status.status_info_text}**`;
            else if (status.online == true && status.status.action == 9) statusText = `<:online:992643863728627792> Submitting **${status.status_info_text}**`;
            // 10: paused | unused - skip
            else if (status.online == true && status.status.action == 11) statusText = '<:online:992643863728627792> In a multiplayer lobby';
            else if (status.online == true && status.status.action == 12) statusText = `<:dnd:992644105219879003> Playing **${status.status_info_text}** (Multiplayer)`;
            else if (status.online == true && status.status.action == 13) statusText = '<:online:992643863728627792> Searching for beatmaps in osu!direct';
            else if (status.online == true && (status.status.action > 13 || status.status.action < 0 || status.status.action == 7 || status.status.action == 10)) statusText = '<:dnd:992644105219879003> Unknown status';

            let topPlays = [];
            let recentPlays = [];
            for (let i = 0; i < 5; i++) {
                if (!top[i]?.beatmap?.title) continue;
                topPlays.push(`**[${top[i].beatmap.title} - ${top[i].beatmap.artist} [${top[i].beatmap.version}] (mapped by ${top[i].beatmap.creator})](https://osu.ppy.sh/beatmapsets/${top[i].beatmap.set_id})** \`[${top[i].beatmap.diff.toFixed(2)}☆]\`\n\`${top[i].grade} | ${top[i].pp}PP | ${top[i].score}pts | ${top[i].acc.toFixed(2)}%\`\n`);
            }
            for (let i = 0; i < 5; i++) {
                if (!recent[i]?.beatmap?.title) continue;
                recentPlays.push(`**[${recent[i].beatmap.title} - ${recent[i].beatmap.artist} [${top[i].beatmap.version}] (mapped by ${recent[i].beatmap.creator})](https://osu.ppy.sh/beatmapsets/${recent[i].beatmap.set_id})** \`[${recent[i].beatmap.diff.toFixed(2)}☆]\`\n\`${recent[i].grade} | ${recent[i].pp}PP | ${recent[i].score}pts | ${recent[i].acc.toFixed(2)}%\`\n`);
            }
            topPlays = top.length > 0 ? topPlays.join('') : 'No top plays.\n';
            recentPlays = recent.length > 0 ? recentPlays.join('') : 'No recent plays.\n';
                
            let embed = new MessageEmbed()
                .setAuthor({ name: `${u.info.name}`, iconURL: `https://countryflagsapi.com/png/${u.info.country}` })
                .setThumbnail(`https://a.beatmap.tk/${u.info.id}`)
                .setTitle(`Profile - ${tgamemode}`)
                .setURL(`https://beatmap.tk/u/${u.info.id}`)
                .setColor(client.config.color)
                .setImage('https://i.imgur.com/OYxjnMX.gif')
                .setFooter({ text: 'beatmap.tk | ' + `Requested by ${interaction.user.tag}` })
                .setDescription(
                    `${statusText}\n` +
                    `\`#${pInfo.rank} (${pInfo.pp}PP\`) | \`${pInfo.acc.toFixed(2)}%\` | \`${pInfo.plays} plays (${prettyms(pInfo.playtime * 1000, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 })})\`\n` +
                    '\n**__Top plays:__**\n' +
                    topPlays + 
                    '\n**__Recent plays:__**\n' + 
                    recentPlays
                );
            return interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'calculatemania') {
            const arch = process.arch;
            if (arch.includes('arm')) {
                return interaction.reply('The system that the bot is running on does not support the Peace performance calculator. Calculations for osu!mania are therefore not supported.');
            }
            const url = interaction.options.getString('beatmap');
            const check = (url) => {
                const urlArr = url.split('/');
                const beatmapID = urlArr.at(-1);
                if (isNaN(beatmapID) || !checkURL(url)) return false;
                else return beatmapID;
            };
            if (check(url) == false) return interaction.reply('Invalid beatmap URL. An example of a valid beatmap URL is <https://osu.ppy.sh/beatmapsets/320118#osu/712376>.');
            const beatmapID = check(url);
            let beatmap = await request('/get_map_info', `id=${beatmapID}`);
            if (!beatmap?.status || beatmap.status !== 'success') return interaction.reply('Invalid beatmap.');
            beatmap = beatmap.map;
            await interaction.reply(`Downloading **${beatmap.title} - ${beatmap.artist} [${beatmap.version}] (mapped by ${beatmap.creator})**...`);
            const file_url = `https://osu.ppy.sh/osu/${beatmap.id}`;
            const fileName = `${beatmap.id}.osu`;
            const score = Number(interaction.options.getString('score'));
            const mods = interaction.options.getInteger('mods') || 0;
            const DOWNLOAD_DIR = './beatmaps/';
            // extract the file name
            let file_name = new URL(file_url);
            file_name = file_name.pathname.split('/').pop();
            // create an instance of writable stream
            var file = fs.createWriteStream(DOWNLOAD_DIR + file_name + '.osu');
            // execute curl using child_process’ spawn function
            var curl = spawn('curl', [file_url]);
            // add a ‘data’ event listener for the spawn instance
            curl.stdout.on('data', function(data) { file.write(data); });
            // add an ‘end’ event listener to close the writeable stream
            curl.stdout.on('end', function() {
                file.end();
                client.logger.debug(file_name + ' downloaded to ' + DOWNLOAD_DIR);
                exec(`python python/calculate.py beatmaps/${fileName} ${score} ${mods}`, (error, stdout, stderr) => {
                    if (stdout) {
                        const data = stdout.split(',');
                        for (let i = 0; i < data.length; i++) {
                            data[i] = data[i].trim();
                        }
                        console.log(data);
                        const pp = Number(data.find(d => d.includes('pp:')).replace('pp: ', ''));
                        const stars = Number(data.find(d => d.includes('stars:')).replace('stars: ', '')).toFixed(2);
                        return interaction.editReply(`**Estimated performance points:** ${pp.toFixed(2)} [\`${stars}☆ | ${score}pts\`]`);
                    } 
                    if (error) {
                        client.logger.error(`Error while calculating PP for ${beatmap.id}: ${error.message}`);
                        return interaction.editReply(`**Error while calculating PP for ${beatmap.id}:** ${error.message}`);
                    }
                    if (stderr) {
                        client.logger.error(`Error while calculating PP for ${beatmap.id}: ${stderr}`);
                        return interaction.editReply(`**Error while calculating PP for ${beatmap.id}:** ${stderr}`);
                    }
                });
            });
            // when the spawn child process exits, check if there were any errors and close the writeable stream
            curl.on('exit', function(code) {
                if (code != 0) {
                    client.logger.error('Failed' + code);
                }
            });
        } else if (subcommand === 'calculate') {
            const url = interaction.options.getString('beatmap');
            const args = interaction.options.getString('args');
            const check = (url) => {
                const urlArr = url.split('/');
                const beatmapID = urlArr.at(-1);
                if (isNaN(beatmapID) || !checkURL(url)) return false;
                else return beatmapID;
            };
            if (check(url) == false) return interaction.reply('Invalid beatmap URL. An example of a valid beatmap URL is <https://osu.ppy.sh/beatmapsets/320118#osu/712376>.');
            const beatmapID = check(url);
            let beatmap = await request('/get_map_info', `id=${beatmapID}`);
            if (!beatmap?.status || beatmap.status !== 'success') return interaction.reply('Invalid beatmap.');
            beatmap = beatmap.map;
            await interaction.reply(`Calculating PP for **${beatmap.title} - ${beatmap.artist} [${beatmap.version}] (mapped by ${beatmap.creator})**... \`${args || 'No arguments'}\``);
            exec(`curl https://osu.ppy.sh/osu/${beatmap.id} | node ./util/pp.js ${args}`, (error, stdout, stderr) => {
                if (stdout) {
                    const data = stdout.split('\n');
                    data.splice(0, 2);
                    data.pop();
                    let mods = false;
                    if (data.length > 8) mods = true; // only if + mods will be 1 longer
                    const x = {
                        line1: {},
                        line2: {},
                        line3: {},
                        line4: {},
                        line5: {},
                        line6: {},
                        line7: {},
                        mods: ''
                    };

                    x.line1.ar = Number(data[0].split(' ')[0].replace('AR', ''));
                    x.line1.od = Number(data[0].split(' ')[1].replace('OD', ''));
                    x.line1.cs = Number(data[0].split(' ')[2].replace('CS', ''));
                    x.line1.hp = Number(data[0].split(' ')[3].replace('HP', ''));

                    x.line2.circles = Number(data[1].split(' ')[0]);
                    x.line2.sliders = Number(data[1].split(' ')[2]);
                    x.line2.spinners = Number(data[1].split(' ')[4]);
                    
                    x.line3.maxCombo = Number(data[2].split(' ')[0]);

                    if (mods == true) {
                        x.mods = data.splice(4, 1);
                    }
                    x.line4.stars = Number(data[4].split(' ')[0]);
                    x.line4.aimStars = Number(data[4].replace(`${x.line4.stars} stars (`, '').replace(')', '').split(', ')[0].replace(' aim', ''));
                    x.line4.speedStars = Number(data[4].replace(`${x.line4.stars} stars (`, '').replace(')', '').split(', ')[1].replace(' speed', ''));

                    x.line5.accuracy = Number(data[5].split(' ')[0].replace('%', ''));
                    x.line5.x100 = Number(data[5].split(' ')[1].replace('x100', ''));
                    x.line5.x50 = Number(data[5].split(' ')[2].replace('x50', ''));
                    x.line5.xMiss = Number(data[5].split(' ')[3].replace('xmiss', ''));

                    x.line6.combo = Number(data[6].split('/')[0]);
                    x.line6.maxCombo = Number(data[6].split('/')[1].replace('x', ''));

                    x.line7.pp = Number(data[7].split(' ')[0]);
                    x.line7.aimPP = Number(data[7].replace(`${x.line7.pp} pp (`, '').replace(')', '').split(', ')[0].replace(' aim', ''));
                    x.line7.speedPP = Number(data[7].replace(`${x.line7.pp} pp (`, '').replace(')', '').split(', ')[1].replace(' speed', ''));
                    x.line7.accPP = Number(data[7].replace(`${x.line7.pp} pp (`, '').replace(')', '').split(', ')[2].replace(' acc', ''));

                    const table1 = new AsciiTable('Map information');
                    table1
                        .setHeading('AR', 'OD', 'CS', 'HP', 'Max Combo')
                        .addRow(x.line1.ar, x.line1.od, x.line1.cs, x.line1.hp, x.line3.maxCombo);

                    const table2 = new AsciiTable('Circle types');
                    table2
                        .setHeading('Circles', 'Sliders', 'Spinners')
                        .addRow(x.line2.circles, x.line2.sliders, x.line2.spinners);
                    
                    const table3 = new AsciiTable('Difficulty calculation');
                    table3
                        .setHeading('Total stars', 'Aim', 'Speed')
                        .addRow(x.line4.stars, x.line4.aimStars, x.line4.speedStars);
                    
                    const table4 = new AsciiTable('Simulated');
                    table4
                        .setHeading('Accuracy', '100', '50', 'Misses', 'Combo')
                        .addRow(`${x.line5.accuracy}%`, x.line5.x100, x.line5.x50, x.line5.xMiss, x.line6.combo);
                    
                    const table5 = new AsciiTable('Performance');
                    table5
                        .setHeading('Total PP', 'Aim', 'Speed', 'Accuracy')
                        .addRow(x.line7.pp, x.line7.aimPP, x.line7.speedPP, x.line7.accPP);

                    const m = `\`\`\`\n${table1}\n${table2}\n${table3}\n${table4}\n${table5}\`\`\``;

                    const gamemode = beatmap.mode;
                    let tgamemode;
                    if (gamemode == 0) tgamemode = 'osu';
                    if (gamemode == 1) tgamemode = 'taiko';
                    if (gamemode == 2) tgamemode = 'fruits';
                    if (gamemode == 3) tgamemode = 'mania';
                    if (gamemode == 4) tgamemode = 'osu';
                    if (gamemode == 5) tgamemode = 'taiko';
                    if (gamemode == 6) tgamemode = 'fruits';
                    if (gamemode == 8) tgamemode = 'osu';
                    return interaction.editReply({ content: `**${beatmap.title} - ${beatmap.artist} [${beatmap.version}] (mapped by ${beatmap.creator})** • <https://osu.ppy.sh/beatmapsets/${beatmap.set_id}#${tgamemode}/${beatmap.id}> • \`${x.mods || 'No mods'}\`\n${m}` });
                }
                if (error) {
                    client.logger.error(`Error while calculating PP for ${beatmap.id}: ${error.message}`);
                    if (error.message.includes('NotImplementedError')) return interaction.editReply('This gamemode is not supported.');
                    return interaction.editReply(`**Error while calculating PP for ${beatmap.id}:** ${error.message}`);
                }
                if (stderr) {
                    client.logger.error(`Error while calculating PP for ${beatmap.id}: ${stderr}`);
                    if (stderr.includes('NotImplementedError')) return interaction.editReply('This gamemode is not supported.');
                    return interaction.editReply(`**Error while calculating PP for ${beatmap.id}:** ${stderr}`);
                }
            });
        } else if (subcommand === 'compare') {
            let compareId = interaction.options.getInteger('id');
            let compareId2 = interaction.options.getInteger('id2');
            let compare;
            let compare2;
            const u = await searchUser(interaction);
            if (!compareId) compare = interaction.channel.recentScore;
            if (compareId && compareId > 0) {
                let score = await request('/get_score_info', `id=${compareId}`);
                if (!score.status || score.status !== 'success') return interaction.reply('Could not find the score for the ID you provided (1).');
                else compare = score.score;
            }
            if (!compare) return interaction.reply('You must provide a score ID to compare with, or run a command that returns ONE score (set limit to 1).');
            if (compareId2 && compareId2 > 0) {
                let score = await request('/get_score_info', `id=${compareId2}`);
                if (!score.status || score.status !== 'success') return interaction.reply('Could not find the score for the ID you provided (2).');
                else compare2 = score.score;
            }
            if (!compare2) {
                let scores = await request('/get_player_scores', `id=${u.info.id}&scope=recent&limit=100`);
                if (!scores.status || scores.status !== 'success') return interaction.reply('Could not find any scores for the user you provided.');
                scores = scores.scores;
                scores = scores.sort((a, b) => b.pp - a.pp);
                const score = scores.find(s => s.beatmap_id === compare.beatmap_id);
                if (!score) return interaction.reply('You did not play this map.');
                compare2 = score;
            }
            await interaction.reply(`Comparing score **${compareId}** with score **${compare2.id}**...`);
            const date = new Date(compare.play_time);
            const playTime1 = date.toLocaleString('en-US', {
                hour12: false,
                timeZone: 'Asia/Singapore',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const date2 = new Date(compare2.play_time);
            const playTime2 = date2.toLocaleString('en-US', {
                hour12: false,
                timeZone: 'Asia/Singapore',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            if (!compareId) compareId = compare.id;
            const table = new AsciiTable('Score comparison');
            table
                .setHeading(compareId, 'Comparison', compare2.id)
                .addRow(compare.grade, 'Grade', compare2.grade)
                .addRow(compare.pp + 'pp', 'PP', compare2.pp + 'pp')
                .addRow(compare.score, 'Score', compare2.score)
                .addRow(compare.acc + '%', 'Accuracy', compare2.acc + '%')
                .addRow(compare.max_combo, 'Max combo', compare2.max_combo)
                .addRow(compare.mods, 'Mods - bits', compare2.mods)
                .addRow(compare.n300 + 'x', '300', compare2.n300 + 'x')
                .addRow(compare.n100 + 'x', '100', compare2.n100 + 'x')
                .addRow(compare.n50 + 'x', '50', compare2.n50 + 'x')
                .addRow(compare.nmiss + 'x', 'Misses', compare2.nmiss + 'x')
                .addRow(playTime1, 'Date played', playTime2)
                .addRow(prettyms(compare.time_elapsed, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 }), 'Time elapsed', prettyms(compare2.time_elapsed, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 }))
                .setAlign(0, AsciiTable.RIGHT)
                .setAlign(1, AsciiTable.CENTER)
                .setAlign(2, AsciiTable.LEFT);
            return interaction.editReply(`\`\`\`\n${table}\`\`\``);
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
        function checkURL(string) {
            try {
                new URL(string);
                return true;
            } catch (error) {
                return false;
            }
        }
    }
};