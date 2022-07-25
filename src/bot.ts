import { Client, Message, VoiceChannel, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch'

type instances = {
    boundchannel: VoiceChannel,
    begin?: boolean,
    deadPlayers: string[]
}

export class DiscordBot {
    private static instance: DiscordBot;
    private PREFIX = "val";
    private invite = "https://discord.com/api/oauth2/authorize?client_id=1000901867821346946&permissions=0&scope=bot";
    private occupiedInstances: Map<string, instances> = new Map()


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

        // // the following commands are run after the instance is created
        // // therefore this statement will act as a clause
        // let instance = this.occupiedInstances.get(message.author.id)
        // if (instance == null) return

        if (command === "stats") { // show stats
            if (args.length >= 1) {
                // join args into a string
                let temp = args.join(" ")
                //split temp into name and tag
                let [name, tag] = temp.split("#")

                // make request to api
                let stats = await this.makeRequestToAPI(name, tag, "ap")
                if (stats["status"] === 404) {
                    await message.reply("Player not found or has made their profile private")
                    return
                }

                let player = await this.getCurrentPlayerStats(stats["data"][0]["players"], name, tag)
                // process stats
                let embed = new MessageEmbed()
                    .setColor("#30afe3")
                    .setTitle(`${name}#${tag}`)

                if (stats["status"] === 200) {
                    embed.setDescription(`${player["stats"]["kills"]} kills\n${player["stats"]["deaths"]} deaths\n${player["stats"]["assists"]} assists`)
                } else {
                    embed.setDescription("Player not found")
                }
                await message.channel.send(embed)

                // send the message
                // await message.reply("Username: " + stats["metadata"]["map"])
            } else {
                await message.reply("Username required")
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