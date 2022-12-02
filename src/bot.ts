import { Client, Message, VoiceChannel, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch'
import schedule from 'node-schedule'

type Player = {
    name: string,
    tag: string,
    region: string
    lastMatchID: string
}

export class DiscordBot {
    private static instance: DiscordBot;
    private PREFIX = "val";
    private invite = "https://discord.com/api/oauth2/authorize?client_id=1000901867821346946&permissions=0&scope=bot";
    private cronMap: Player[] = []

    private client: Client = new Client({ partials: ["MESSAGE", "REACTION"] });

    private constructor() {
        this.initializeCient();
    }

    static getInstance(): DiscordBot {
        if (!DiscordBot.instance) {
            DiscordBot.instance = new DiscordBot();
        }
        return DiscordBot.instance;
    }

    connect(): void {
        this.client
            .login(process.env.D_TOKEN)
            .then(_ => console.log('Connected to Discord'))
            .catch(error => console.error(`Could not connect. Error: ${error.message}`)
            );
    }

    private initializeCient(): void {
        if (!this.client) return;

        this.setReadyHandler();
        this.setMessageHandler();
    }

    private setReadyHandler(): void {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user?.tag}!`);
            this.client.user?.setActivity(`Valorant | valhelp`, { type: "PLAYING" })
                .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
                .catch(err => console.error(err));

        });
    };

    private async helpEmbed(message: Message) { // embed message
        let embed = new MessageEmbed()
        embed.setColor(13378082)
        embed.setDescription("**Bot Prefix** : val\n\nThe following are the commands without the prefix")
        embed.addField("stats <username#tag>", "Shows the last match stats of that player")
        embed.addField("help", "This command will show this message")
        embed.addField("invite", "Provides an invite url for the bot")
        embed.addField("cron", "Set schedule to show stats after every game")

        await message.channel.send(embed)
    }

    private async statsEmbed(message: Message, stats: any, player: any) {

        let gameWon = stats["teams"][player["team"].toLowerCase()]["has_won"] ? "Won" : "Lost"

        let embed = new MessageEmbed()
        embed.setColor(13378082)
        embed.addField("Map", stats["metadata"]["map"])
        embed.addField("Mode", stats["metadata"]["mode"])
        embed.addField("Stats", `${player["stats"]["kills"]} kills\n💀 ${player["stats"]["deaths"]} deaths\n${player["stats"]["assists"]} assists`, true)
        embed.addField("Aim", `🎯 ${player["stats"]["headshots"]} Headshots\n${player["stats"]["bodyshots"]} Bodyshots\n 🦵🏼${player["stats"]["legshots"]} Legshots`, true)
        embed.addField("Behavior", `${player['behavior']['friendly_fire']['incoming']} Incoming friendly fire\n${player['behavior']['friendly_fire']['outgoing']} Outgoing friendly fire`, true)
        embed.addField("AFK Time", `${player["behavior"]["afk_rounds"]} Rounds`, true)
        embed.setDescription(`Game ${gameWon}`)
        embed.setFooter(`${player["name"]}#${player["tag"]}`)
        embed.setImage(player['assets']['card']['wide'])
        embed.setAuthor(`Agent: ${player['character']}`, player['assets']['agent']['small'])

        await message.channel.send(embed)
    }

    private async makeRequestToAPI(name: string, tag: string, region: string): Promise<any> {
        let ENDPOINT = "https://api.henrikdev.xyz/valorant/v3"
        let headers = { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0" }

        let url = `${ENDPOINT}/matches/${region}/${name}/${tag}`
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "GET",
                headers: headers
            }).then((res: any) => res.json())
                .then((json: any) => resolve(json))
                .catch((err: any) => reject(err))
        })
    }

    private async getCurrentPlayerStats(response: any, name: string, tag: string): Promise<any> {
        let players = response["all_players"]
        for (let i = 0; i < players.length; i++) {
            if (players[i]["name"] === name && players[i]["tag"] === tag) {
                return players[i]
            }
        }
    }

    private async commandHandler(message: Message) { // handles all commands for the bot
        let command: any, args: any;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/)

        if (command === "help") this.helpEmbed(message) // helper command
        if (command === "invite") { // invite command
            await message.channel.send(new MessageEmbed()
                .setColor("#30afe3")
                .setTitle("Use this link to invite this bot to your server!")
                .setDescription(this.invite)
            )
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
                let temp = args.join(" ")
                //split temp into name and tag
                let region = temp.slice(-2);

                if (region === "ap" || region === "na" || region === "eu" || region === "kr" || region === "sa" || region === "jp") {
                    temp = temp.slice(0, -3)
                    let [name, tag] = temp.split("#")

                    // make request to api
                    let stats = await this.makeRequestToAPI(name, tag, region)
                    if (stats["status"] === 404) {
                        await message.reply("Player not found or has made their profile private or is not in the region")
                        return
                    }
                    let player = await this.getCurrentPlayerStats(stats["data"][0]["players"], name, tag)
                    this.statsEmbed(message, stats["data"][0], player)
                    return;
                } else {
                    await message.reply("Invalid region\nValid regions are ap, na, eu, kr, sa, jp")
                    return
                }

            } else {
                await message.reply("Username & region required\nExample: valstats name#tag ap")
            }
        }
        return
    }

    private setMessageHandler(): void {
        this.client.on('message', async (message: Message) => {
            //* filters out requests from bots
            if (message.author.bot) return;
            if (message.content.startsWith(this.PREFIX)) {
                console.log(message.content);
                this.commandHandler(message)
            }
        });
    }
}