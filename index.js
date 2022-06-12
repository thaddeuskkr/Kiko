/*
    Ethereal / A fully functional Discord bot with many features.
    Copyright (C) 2022 Thaddeus Kuah

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const { Shoukaku, Connectors } = require('shoukaku');

const allIntents = new Discord.Intents(32767);
const client = new Discord.Client({ intents: allIntents }); // yes, i know it's stupid of me to use all intents, but i was lazy.
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), config.llnodes, { 
    reconnectTries: 3, 
    resume: true, 
    resumeByLibrary: true, 
    resumeKey: 'faithful' 
});

client.logger = require('./util/logger.js');
client.shoukaku = shoukaku;
client.commands = new Discord.Collection();
client.config = config;

let commandCount = 0;
let eventCount = 0;

const clientEvents = fs.readdirSync('./events/client').filter(file => file.endsWith('.js'));
const lavaEvents = fs.readdirSync('./events/lava').filter(file => file.endsWith('.js'));

for (const file of clientEvents) {
    const event = require(`./events/client/${file}`);
    client.on(file.split('.')[0], event.bind(null, client));
    eventCount++;
}

for (const file of lavaEvents) {
    const event = require(`./events/lava/${file}`);
    shoukaku.on(file.split('.')[0], event.bind(null, client));
    eventCount++;
}

const categoriesDirents = fs.readdirSync('./commands', { withFileTypes: true });
const categories = categoriesDirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

for (const category of categories) {
    const commands = fs.readdirSync(`./commands/${category}`).filter(file => file.endsWith('.js'));
    for (const command of commands) {
        const cmd = require(`./commands/${category}/${command}`);
        if (!cmd.data?.name) {
            client.logger.warn(`Command ${command.replace('.js', '')} has insufficient data. Skipping...`);
            break;
        }
        cmd.category = category;
        client.commands.set(cmd.data.name, cmd);
        commandCount++;
    }
}

client.logger.info(`Loaded ${eventCount} events!`);
client.logger.info(`Loaded ${commandCount} commands in ${categories.length} categories!`);

client.login(process.env.TOKEN);