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
        this.cronMap = [];
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
        embed.addField("cron", "Set schedule to show stats after every game");
        await message.channel.send(embed);
    }
    async statsEmbed(message, stats, player) {
        let gameWon = stats["teams"][player["team"].toLowerCase()]["has_won"] ? "Won" : "Lost";
        let embed = new discord_js_1.MessageEmbed();
        embed.setColor(13378082);
        embed.addField("Map", stats["metadata"]["map"]);
        embed.addField("Mode", stats["metadata"]["mode"]);
        embed.addField("Stats", `${player["stats"]["kills"]} kills\n💀 ${player["stats"]["deaths"]} deaths\n${player["stats"]["assists"]} assists`, true);
        embed.addField("Aim", `🎯 ${player["stats"]["headshots"]} Headshots\n${player["stats"]["bodyshots"]} Bodyshots\n 🦵🏼${player["stats"]["legshots"]} Legshots`, true);
        embed.addField("Behavior", `${player['behavior']['friendly_fire']['incoming']} Incoming friendly fire\n${player['behavior']['friendly_fire']['outgoing']} Outgoing friendly fire`, true);
        embed.addField("AFK Time", `${player["behavior"]["afk_rounds"]} Rounds`, true);
        embed.setDescription(`Game ${gameWon}`);
        embed.setFooter(`${player["name"]}#${player["tag"]}`);
        embed.setImage(player['assets']['card']['wide']);
        embed.setAuthor(`Agent: ${player['character']}`, player['assets']['agent']['small']);
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
            }).then((res) => res.json())
                .then((json) => resolve(json))
                .catch((err) => reject(err));
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
        // if (command === "cron") { // stats command
        //     if (args.length >= 1) {
        //         // join args into a string
        //         let temp = args.join(" ")
        //         //split temp into name and tag
        //         let region = temp.slice(-2);
        //         if (region === "ap" || region === "na" || region === "eu" || region === "kr" || region === "sa" || region === "jp") {
        //             temp = temp.slice(0, -3)
        //             let [name, tag] = temp.split("#")
        //             // check if name and tag already exist in the cron map
        //             if (this.cronMap.find((obj: any) => obj.name === name && obj.tag === tag)) {
        //                 console.log("Cron job already exists");
        //                 console.log(this.cronMap);
        //                 let stats = await this.makeRequestToAPI(name, tag, region)
        //                 // check if the match id is the same
        //                 if (stats["data"][0]["metadata"]["matchid"] === this.cronMap.find((obj: any) => obj.name === name && obj.tag === tag).lastMatchID) {
        //                     await message.channel.send(`${name}#${tag} has not played a game yet`)
        //                     return
        //                 } else {
        //                     let player = await this.getCurrentPlayerStats(stats, name, tag)
        //                     this.statsEmbed(message, stats["data"][0], player)
        //                     this.cronMap.find((obj: any) => obj.name === name && obj.tag === tag).lastMatchID = stats["data"][0]["metadata"]["matchid"]
        //                 }
        //                 return
        //             }
        //             // make request to api
        //             let stats = await this.makeRequestToAPI(name, tag, region)
        //             if (stats["status"] === 404) {
        //                 await message.reply("Player not found or has made their profile private or is not in the region")
        //                 return
        //             }
        //             let player = await this.getCurrentPlayerStats(stats["data"][0]["players"], name, tag)
        //             console.log("Cron job added");
        //             this.cronMap.push({ name: name, tag: tag, region: region, lastMatchID: stats["data"][0]["metadata"]["matchid"] })
        //             // this.statsEmbed(message, stats["data"][0], player)
        //             this.scheduleJob(message, this.cronMap)
        //             return;
        //         } else {
        //             await message.reply("Invalid region\nValid regions are ap, na, eu, kr, sa, jp")
        //             return
        //         }
        //     } else {
        //         await message.reply("Username & region required\nExample: valstats name#tag ap")
        //     }
        // }
        if (command === "stats") { // show stats
            if (args.length >= 1) {
                // join args into a string
                let temp = args.join(" ");
                //split temp into name and tag
                let region = temp.slice(-2);
                if (region === "ap" || region === "na" || region === "eu" || region === "kr" || region === "sa" || region === "jp") {
                    temp = temp.slice(0, -3);
                    let [name, tag] = temp.split("#");
                    // make request to api
                    let stats = await this.makeRequestToAPI(name, tag, region);
                    if (stats["status"] === 404) {
                        await message.reply("Player not found or has made their profile private or is not in the region");
                        return;
                    }
                    let player = await this.getCurrentPlayerStats(stats["data"][0]["players"], name, tag);
                    this.statsEmbed(message, stats["data"][0], player);
                    return;
                }
                else {
                    await message.reply("Invalid region\nValid regions are ap, na, eu, kr, sa, jp");
                    return;
                }
            }
            else {
                await message.reply("Username & region required\nExample: valstats name#tag ap");
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
