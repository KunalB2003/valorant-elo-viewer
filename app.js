const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

const PORT = 3001;

app.use(express.json())
   .use(express.urlencoded({ extended: true }))
   .use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"]
   }))



app.listen(PORT, async () => {
    console.log("\x1b[33m==============================================");
    console.log(`Running on http://localhost:${PORT}`);
    console.log("Running track loop every 15 minutes");
    console.log("==============================================\x1b[0m");
    while (true) {
        // update tracked users
        //  TODO: make new function to check to see if stuff has changed before trying to change it
        let trackedUsers = await getTrackList();  
        updateTrackedPlayers(trackedUsers).then(() => consoleWrite('UPDATE', "Updated tracked players"));
        await delay(1000 * 60 * 15);   
    }
});

// get requests

app.get('/', (req, res) => {
    console.log("!");
    res.send('yeah');
});

app.get('/tracked', (req, res) => {
    consoleWrite('DATA', "Recieved request for user list")
    getTrackList().then(trackedUsers => res.json(trackedUsers));
})

app.get('/data/:region/:username/:id', (req, res) => {
    let { region, username, id } = req.params;
    if (!region || !username || !id) {
        res.status(400).send("Missing region, username, or id");
        return;
    }

    consoleWrite('DATA', `Requested [${region}] ${username}#${id}`);


    username = username.toLowerCase();
    id = id.toLowerCase();
    region = region.toLowerCase();
    fetch(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${id}`)
        .then(res => res.json())
        .then(data => {
            fetch(`https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${username}/${id}`)
                .then(res => res.json())
                .then(matches => {
                    data.matches = matches;
                    res.status(data.status).send(data);
                });
        });
})

// post requests


// could also check to see if the player exists first
// also maybe could store players by their puuid instead of username in case it changes
app.post('/trackPlayer', (req, res) => {
    consoleWrite('UPDATE', "Received request to track player");
    let { username, tag, region } = req.body;
    if (!username || !tag || !region) {
        consoleWrite('ERROR', "Missing username, tag, or region");
        res.status(400).send("Missing username, tag, or region");
        return;
    }
    username = username.toLowerCase();
    tag = tag.toLowerCase();

    // check to see if player exists
    fetch(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`)
        .then(res => res.json())
        .then(data => {
            if (data.status !== 200) {
                consoleWrite('ERROR', data.message);
                res.status(data.status).send(data.message);
                return;
            }
            // check if the player is already being tracked
            getTrackList().then(trackList => {
                for (const player of trackList) {
                    if (player.puuid === data.data.puuid) {
                        consoleWrite('ERROR', "Player is already being tracked");
                        res.status(400).send("Player is already being tracked");
                        return;
                    }
                }
                let player = {username, tag, region, puuid: data.data.puuid, card: data.data.card, account_level: data.data.account_level }
                trackList.push(player);
                fs.writeFile("data/track_list.json", JSON.stringify(trackList), (err) => {if (err) consoleWrite('ERROR', err)});
                consoleWrite('UPDATE', `Added ${username}#${tag} to track list`);
                updateTrackedPlayers([player])
                res.status(200).send("Added player to track list");
            })

        })
})


/*
- player info is stored as json in 2 files, 1 for ranked and 1 for everything
*/
async function updateTrackedPlayers(playerList) {
    createFolder("data/players");
    if (Object.keys(playerList).length == 0) return;
    for (const player of playerList) {
        consoleWrite('UPDATE', `Starting update for ${player.username}#${player.tag}`);
        const { username, tag, region } = player;
        createFolder(`data/players/${username}-${tag}`)
        createFile(`data/players/${username}-${tag}/all.json`, '{}');
        createFile(`data/players/${username}-${tag}/ranked.json`, '{}');

        let historyAll = {};
        let historyRanked = {};

        // all history
        await delay(1000);
        await fetchAllHistory(username, tag, region, historyAll, historyRanked);

        // ranked history
        await delay(1000);
        await fetchRankedHistory(username, tag, region, historyAll, historyRanked);

        consoleWrite('UPDATE', `Found ${Object.keys(historyAll).length} matche(s) for ${username}#${tag} (${Object.keys(historyRanked).length} ranked))`);

        
        const all = JSON.parse(fs.readFileSync(`data/players/${username}-${tag}/all.json`).toString());
        const ranked = JSON.parse(fs.readFileSync(`data/players/${username}-${tag}/ranked.json`).toString());
        let [newAll, newRanked] = [0, 0];
        // loop over historyAll because it has all matches (if we find any extra ranked matches they are added to historyAll)
        for (const [dateraw, match] of Object.entries(historyAll)) {
            if (!all[dateraw]) {
                all[dateraw] = match;
                newAll++;
            }
            if (historyRanked[dateraw] && !ranked[dateraw]) {
                // since we are looping over historyAll we have to ensure that the match we are looking at is a ranked match
                //  before trying to add it to the ranked history
                ranked[dateraw] = historyRanked[dateraw];
                newRanked++;
            }

        }
        if (newAll) {
            fs.writeFile(`data/players/${username}-${tag}/all.json`, JSON.stringify(all), (err) => {if (err) consoleWrite('ERROR', err)});
        }
        if (newRanked) {
            fs.writeFile(`data/players/${username}-${tag}/ranked.json`, JSON.stringify(ranked), (err) => {if (err) consoleWrite('ERROR', err)});
        }
        consoleWrite('UPDATE', `Added ${newAll} new matche(s) for ${username}#${tag} (${newRanked} ranked))`);
    }
    return;

}

async function fetchMatch(matchid) {
    return fetch(`https://api.henrikdev.xyz/valorant/v2/match/${matchid}`)
        .then(res => {
            if (res.status != 200) {
                consoleWrite('ERROR', res.statusText);
                if (res.status == 429) {
                    consoleWrite('ERROR', 'Rate limited, waiting 1 minute (fetchmatch ' + matchid + ')' );
                    return delay(60000).then(() => fetchMatch(matchid));
                }
            }
            return res.json();
        })
}

async function fetchRankedHistory(username, tag, region, historyAll, historyRanked) {
    let currentRanked = JSON.parse(fs.readFileSync(`data/players/${username}-${tag}/ranked.json`).toString());
    return fetch(`https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${username}/${tag}`)
        .then(res => {
            if (res.status != 200) {
                consoleWrite('ERROR', res.statusText);
                if (res.status == 429) {
                    consoleWrite('ERROR', 'Rate limited, waiting 1 minute (ranked history for ' + username + '#' + tag + ')');
                    return delay(60000).then(() => fetchAllHistory(username, tag, region, historyAll, historyRanked));
                }
            }
            return res.json();
        })
        .then(async (data) => {
            if (data.status != 200) return;
            for (const match of data.data) {
                const date = parseInt(match.date_raw);
                const elo = parseInt(match.elo);
                const change = parseInt(match.mmr_change_to_last_game);
                if (currentRanked[date]) continue;
                if (historyRanked[date]) {
                    historyRanked[date] = {
                        ...historyRanked[date],
                        elo,
                        change
                    }
                } else {
                    // look up the matchid to fill in the missing information
                    await delay(1000);
                    await fetchMatch(match.match_id)
                        .then(data => {
                            if (data.status != 200) return;
                            const matchid = data.data.metadata.matchid;
                            const length = parseInt(data.data.metadata.game_length);
                            const mode = data.data.metadata.mode;
                            historyRanked[date] = {
                                date,
                                length,
                                mode,
                                matchid,
                                elo,
                                change
                            }
                            historyAll[date] = {
                                date,
                                length,
                                mode,
                                matchid
                            }
                        })
                }
            }
        })

}

async function fetchAllHistory(username, tag, region, historyAll, historyRanked) {
    return fetch(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${username}/${tag}`)
        .then(res => {
            if (res.status != 200) {
                consoleWrite('ERROR', res.statusText);
                if (res.status == 429) {
                    consoleWrite('ERROR', 'Rate limited, waiting 1 minute (fetch all history for ' + username + '#' + tag + ')');
                    return delay(60000).then(() => fetchAllHistory(username, tag, region, historyAll, historyRanked));
                }
                return res.json();
            }
            return res.json();
        })
        .then(data => {
            if (data.status != 200) {
                return;
            }
            for (const match of data.data) {
                const date = parseInt(match.metadata.game_start);
                const length = parseInt(match.metadata.game_length);
                const mode = match.metadata.mode;
                const matchid = match.metadata.matchid;
                historyAll[date] = {
                    date,
                    length,
                    mode,
                    matchid
                }
                if (mode === "Competitive") {
                    historyRanked[date] = {
                        date,
                        length,
                        mode,
                        matchid
                    }
                }
            }
        })
}

async function getTrackList() {
    createFolder("data");
    createFile("data/track_list.json", "[]");
    await delay(100);
    let trackList = JSON.parse(fs.readFileSync("data/track_list.json").toString());
    return trackList;
}

function createFile(filename, data="") {
    fs.open(filename, 'r', function (err, fd) {
        if (err) {
            fs.writeFileSync(filename, data, function (err) {
                if (err) {
                    console.error(err);
                }
                consoleWrite('UPDATE', `${filename} created`);
            });
        }
    });
}

function createFolder(foldername) {
    fs.mkdir(`./${foldername}`, (err) => {
        if (err) {
            if (err.code == 'EEXIST') return; // ignore the error if the folder already exists
            else throw err; // something else went wrong
        }
    });
}

// ========== misc functions ==========

function delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

function consoleWrite(code, message) {
    let color;
    switch (code) {
        case 'UPDATE':
            color = '\x1b[32m';
            break;
        case 'ERROR':
            color = '\x1b[31m';
            break;
        default:
            color = '\x1b[37m';
            break;
    }
    console.log(`\x1b[37m${new Date().toLocaleString('en-US', {timeZone: "EST"})} | ${color}[${code}] ${message}\x1b[37m`)
}

// }