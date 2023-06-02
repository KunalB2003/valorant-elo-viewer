const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');


const PORT = 3000;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



app.listen(`${PORT}`, async () => {
    console.log("\x1b[33m==============================================");
    console.log(`Running on http://localhost:${PORT}`);
    console.log("Running track loop every 15 minutes");
    console.log("==============================================\x1b[0m");
    while (true) {
        let trackedUsers = getTrackList();
        updateTrackedPlayers(trackedUsers);
        await delay(1000 * 60 * 15);
    }
});

app.get('/', (req, res) => {
    res.send('yeah');
});


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
            let trackList = getTrackList();
            for (const player of trackList) {
                if (JSON.stringify(player) === JSON.stringify({username, tag, region})) {
                    consoleWrite('ERROR', "Player is already being tracked");
                    res.status(400).send("Player is already being tracked");
                    return;
                }
            }
            
            trackList.push({username, tag, region});
            fs.writeFile("data/track_list.json", JSON.stringify(trackList), (err) => {if (err) consoleWrite('ERROR', err)});
            consoleWrite('UPDATE', `Added ${username}#${tag} to track list`);
            res.status(200).send("Added player to track list");
        })
})


/*
notes: 
- i did async/await here instead of promise chaining because i want matches from everything first and then updating everything before looking at ranked matches
   this way, i am more likely to have data for ranked matches and wont have to do extra api calls if i did all matches and ranked matches in parallel.
- player info is stored as json in 2 files, 1 for ranked and 1 for everything
*/
async function updateTrackedPlayers(playerList) {
    createFolder("data/players");
    for (const player of playerList) {
        consoleWrite('UPDATE', `Starting update for ${player.username}#${player.tag}`);
        const { username, tag, region } = player;
        createFolder(`data/players/${username}-${tag}`)
        createFile(`data/players/${username}-${tag}/all.json`, '{}');
        createFile(`data/players/${username}-${tag}/ranked.json`, '{}');

        let historyAll = {};
        let historyRanked = {};

        // all history
        let res = await fetch(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${username}/${tag}`)
        if (res.status != 200) {
            consoleWrite('ERROR', res.statusText);
            return;
        }

        let data = await res.json();


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

        // ranked history
        res = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${username}/${tag}`)
        if (res.status != 200) {
            consoleWrite('ERROR', res.statusText);
            return;
        }
        data = await res.json();

        for (const match of data.data) {
            const date = parseInt(match.date_raw);
            const elo = parseInt(match.elo);
            const change = parseInt(match.mmr_change_to_last_game);
            if (historyRanked[date]) {
                historyRanked[date] = {
                    ...historyRanked[date],
                    elo,
                    change
                }
            } else {
                // look up the matchid to fill in the missing information
                let tempRes = await fetch(`https://api.henrikdev.xyz/valorant/v2/match/${match.match_id}`);
                if (res.status != 200) {
                    consoleWrite('ERROR', res.statusText);
                    return;
                }
                let tempData = await tempRes.json();

                const matchid = tempData.data.metadata.matchid;
                const length = parseInt(tempData.data.metadata.game_length);
                const mode = tempData.data.metadata.mode;
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
            }

        }
        consoleWrite('UPDATE', `Found ${Object.keys(historyAll).length} matche(s) for ${username}#${tag} (${Object.keys(historyRanked).length} ranked))`);

        
        const all = JSON.parse(fs.readFileSync(`data/players/${username}-${tag}/all.json`).toString());
        const ranked = JSON.parse(fs.readFileSync(`data/players/${username}-${tag}/ranked.json`).toString());
        let [newAll, newRanked] = [0, 0];
        for (const [dateraw, match] of Object.entries(historyAll)) {
            if (!all[dateraw]) {
                all[dateraw] = match;
                newAll++;
            }
            if (historyRanked[dateraw] && !ranked[dateraw]) {
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

}

function getTrackList() {
    createFolder("data");
    createFile("data/track_list.json", "");
    let trackList = JSON.parse(fs.readFileSync("data/track_list.json").toString());
    return trackList;
}

function createFile(filename, data="") {
    fs.open(filename, 'r', function (err, fd) {
        if (err) {
            fs.writeFile(filename, data, function (err) {
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

const delay = (delayInms) => {
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
    console.log(`\x1b[37m${new Date().toLocaleString('en-US', {timeZone: "EST"})} | ${color}[${code}] ${message}`)
}