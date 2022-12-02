from regex import P
import requests

ENDPOINT = "https://api.henrikdev.xyz/valorant/v3"


def make_request(name, tag, region="ap"):
    name = name.replace(" ", "%20").strip()
    url = f"{ENDPOINT}/matches/{region}/{name}/{tag}"
    print(url)

    # make request
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0"
    }
    response = requests.get(url, headers=headers).json()

    # response
    if response["status"] == 200:
        return response["data"]
    else:
        return response


name, tag = "CMOS milk", "shina"
resp = make_request(name, tag)


def get_metadata(resp):
    return {
        "map": resp["map"],
        "mode": resp["mode"],
        "server": resp["cluster"],
        "matchid": resp["matchid"],
    }


def get_current_player(resp):
    global name, tag
    for player in resp["all_players"]:
        if player["name"] == name and player["tag"] == tag:
            return {
                "name": player["name"],
                "tag": player["tag"],
                "stats": player["stats"],
                "behavior": player["behavior"],
                "character": {
                    "agent": player["character"],
                    "img": player["assets"]["agent"]["small"],
                },
                "team": player["team"],
            }


def get_players(resp):
    return resp["players"]


# metadata
print(get_metadata(resp[0]["metadata"]))
# current player
current_player = get_current_player(resp[0]["players"])

# match won
print(current_player)
print("Won" if resp[0]["teams"][current_player["team"].lower()]["has_won"] else "Lost")
