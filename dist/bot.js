"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const node_fetch_1 = __importDefault(require("node-fetch"));
class DiscordBot {
    constructor() {
        this.PREFIX = "val";
        this.invite = "https://discord.com/api/oauth2/authorize?client_id=1000901867821346946&permissions=0&scope=bot";
        this.occupiedInstances = new Map();
        this.client = new discord_js_1.Client({ partials: ["MESSAGE", "REACTION"] });
        this.initializeCient();
    }
    static getInstance() {
        if (!DiscordBot.instance) {
            DiscordBot.instance = new DiscordBot();
        }
        return DiscordBot.instance;
    }
    connect() {
        this.client
            .login(process.env.D_TOKEN)
            .then(_ => console.log('Connected to Discord'))
            .catch(error => console.error(`Could not connect. Error: ${error.message}`));
    }
    initializeCient() {
        if (!this.client)
            return;
        this.setReadyHandler();
        this.setMessageHandler();
    }
    setReadyHandler() {
        this.client.on('ready', () => {
            var _a, _b;
            console.log(`Logged in as ${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
            (_b = this.client.user) === null || _b === void 0 ? void 0 : _b.setActivity(`Valorant | valhelp`, { type: "PLAYING" }).then(presence => console.log(`Activity set to ${presence.activities[0].name}`)).catch(err => console.error(err));
        });
    }
    ;
    async helpEmbed(message) {
        let embed = new discord_js_1.MessageEmbed();
        embed.setColor(13378082);
        embed.setDescription("**Bot Prefix** : val\n\nThe following are the commands without the prefix");
        embed.addField("stats <username#tag>", "Shows the last match stats of that player");
        embed.addField("help", "This command will show this message");
        embed.addField("invite", "Provides an invite url for the bot");
        await message.channel.send(embed);
    }
    async makeRequestToAPI(name, tag, region) {
        let ENDPOINT = "https://api.henrikdev.xyz/valorant/v3";
        let headers = { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0" };
        let url = `${ENDPOINT}/matches/${region}/${name}/${tag}`;
        return new Promise((resolve, reject) => {
            node_fetch_1.default(url, {
                method: "GET",
                headers: headers
            }).then(res => res.json())
                .then(json => resolve(json))
                .catch(err => reject(err));
        });
    }
    async getCurrentPlayerStats(response, name, tag) {
        let players = response["all_players"];
        for (let i = 0; i < players.length; i++) {
            if (players[i]["name"] === name && players[i]["tag"] === tag) {
                return players[i];
            }
        }
    }
    async commandHandler(message) {
        let command, args;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/);
        if (command === "help")
            this.helpEmbed(message); // helper command
        if (command === "invite") { // invite command
            await message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("#30afe3")
                .setTitle("Use this link to invite this bot to your server!")
                .setDescription(this.invite));
        }
        // // the following commands are run after the instance is created
        // // therefore this statement will act as a clause
        // let instance = this.occupiedInstances.get(message.author.id)
        // if (instance == null) return
        if (command === "stats") { // show stats
            if (args.length >= 1) {
                // join args into a string
                let temp = args.join(" ");
                //split temp into name and tag
                let [name, tag] = temp.split("#");
                // make request to api
                let stats = await this.makeRequestToAPI(name, tag, "ap");
                if (stats["status"] === 404) {
                    await message.reply("Player not found or has made their profile private");
                    return;
                }
                let player = await this.getCurrentPlayerStats(stats["data"][0]["players"], name, tag);
                // process stats
                let embed = new discord_js_1.MessageEmbed()
                    .setColor("#30afe3")
                    .setTitle(`${name}#${tag}`);
                if (stats["status"] === 200) {
                    embed.setDescription(`${player["stats"]["kills"]} kills\n${player["stats"]["deaths"]} deaths\n${player["stats"]["assists"]} assists`);
                }
                else {
                    embed.setDescription("Player not found");
                }
                await message.channel.send(embed);
                // send the message
                // await message.reply("Username: " + stats["metadata"]["map"])
            }
            else {
                await message.reply("Username required");
            }
        }
        return;
    }
    setMessageHandler() {
        this.client.on('message', async (message) => {
            //* filters out requests from bots
            if (message.author.bot)
                return;
            if (message.content.startsWith(this.PREFIX)) {
                console.log(message.content);
                this.commandHandler(message);
            }
        });
    }
}
exports.DiscordBot = DiscordBot;
