# Kiko

Kiko (previously Ethereal) - A reliable, user-friendly, free to use bot. Modern, has many features, and regularly maintained.

### Features

- Reliable music system
- Integration with the [osu! server that I set up](https://beatmap.tk) - various commands
- More features planned and coming soon!

### Contact

- **Discord:** tkkr#0001
- **Mail:** contact@tkkr.tk
- **Socials:** @thaddeuskkr

### Setting up the bot

You have two options - you can either [invite the bot](https://discord.com/api/oauth2/authorize?client_id=985101100237615124&permissions=8&scope=bot%20applications.commands) (recommended) or host your own instance. Below are instructions to host your own instance. Before doing this, make sure you have [node.js](https://nodejs.org) installed with [npm](https://npmjs.com). 
1. Create a new application on the [Discord Developer Portal](https://discord.com/developers/applications) 
2. Go to the **Bot** section and click **Add Bot** 
3. Click **Reset Token** to get a new token for your bot and copy that somewhere for now 
4. Under **Privileged Gateway Intents**, enable all the intents 
5. Go to the **OAuth2** section and under **URL Generator**, tick **`bot`**, **`applications.commands`** and **`Administrator`** 
6. Copy the generated URL and open it in your browser, then add the bot to your server 
7. Clone the repository to your computer and navigate to it (`git clone https://github.com/thaddeuskkr/Kiko.git && cd Kiko`) 
8. Rename / copy **`.env.example`** to **`.env`** (`cp .env.example .env`) 
9. Edit and fill the **`.env`** file (`nano .env` / Open with > Notepad) 
10. Paste the token you got from step 3 into the `TOKEN` field 
11. Paste a MongoDB database URL into the `KEYV` field (This is not required for now if you do not plan to use the beatmap commands) 
12. Rename / copy **`config-example.json`** to **`config.json`** (`cp config-example.json config.json`) 
13. Edit and fill the **`config.json`** file (`nano config.json` / Open with > Notepad) 
14. Replace `your-owner-id` with your Discord user ID (Enable Developer Mode in Discord's Advanced settings > Right click on yourself > Copy ID) 
15. If you have your own Lavalink server, replace the default credentials with your own 
16. Install the required dependencies for the bot to run (`npm install`) 
17. Run the bot (`node .`) 
18. In any channel in your server, send this message: **`kiko deploy global`** 
19. Wait a while, then type **`/`** and see the commands magically pop up 
20. Kiko is fully set up! 
**Need more help?** Create an issue in this repository with your question!