const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const readLastLines = require('read-last-lines');
const getRoutes = require('./routes/get.cjs');
const postRoutes = require('./routes/post.cjs');

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

var app = express();
var PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(getRoutes);
app.use(postRoutes);

app.listen(PORT, async () => {
    console.log("==============================================");
    console.log(`Running on localhost:${PORT}`);
    console.log("Running track loop every 15 minutes");
    console.log("==============================================");
    let trackLoop = true;
    while (trackLoop) {
        let trackedUsers = fs.readFileSync('./user_data/track_list.txt').toString().split("\n");
        updateTrackedPlayers(trackedUsers);
        let delayres = await delay(1000 * 60 * 15);
    }
});

async function updateTrackedPlayers(playerList) {
    consoleWrite('UPDATE', 'Track update called');
    let playerUpdated = false;
    for (player in playerList) {
        let playerSplit = playerList[player].split("#");

        axios.get(`https://api.henrikdev.xyz/valorant/v1/mmr-history/na/${[playerSplit[0]]}/${playerSplit[1]}`).then(response => {
            updatePlayerCSV(playerSplit, response.data) ? true : false;
        }).catch(err => {
            consoleWrite('ERROR', `Unable to call ${playerSplit[0]}#${playerSplit[1]} at this time`);
        });
        let delayres = await delay(3000);
    }
}

async function updatePlayerCSV(player, data) {
    let filename = `./user_data/${player[0]}-${player[1]}.csv`;
    createFile(filename);
    let delayres = await delay(1000);

    readLastLines.read(filename, 1).then((line) => {
        let lastTime = line.split(",")[0];
        let i = data.data.length - 1;
        if (i >= 0) {
            lastRecorded = data.data[i].date_raw;
        } else {
            lastRecorded = 0;
        }

        if (lastTime != "timeraw") {
            while (lastRecorded != lastTime) {
                lastRecorded = data.data[i--].date_raw;
                if (i == -1) {
                    break;
                }
            }
        }

        if (i != -1) {
            consoleWrite('UPDATE', `${player[0]}#${player[1]} - ${i + 1} Games Added`);
        }

        for (i; i >= 0; i--) {
            let line = data.data[i];
            axios.get(`https://api.henrikdev.xyz/valorant/v2/match/${line.match_id}`).then(res => { 
                let game_length = res.data.data.metadata.game_length;
                fs.writeFile(filename, `\n${line.date_raw},"${line.date}",${line.mmr_change_to_last_game},${line.elo},"${line.currenttierpatched}","${line.match_id}",${game_length}`, { 'flag': 'a' }, function (err) {
                    if (err) {
                        return console.error(err);
                        consoleWrite('ERROR', `Unable to append to ${player[0]}#${player[1]}.csv`);
                    }
                });
                fs.writeFile("./user_data/master.csv", `\n${line.date_raw},"${line.date}","${player[0]}#${player[1]}",${line.mmr_change_to_last_game},${line.elo},"${line.currenttierpatched}","${line.match_id}",${game_length}`, { 'flag': 'a' }, function (err) {
                    if (err) {
                        consoleWrite('ERROR', 'Unable to append to master.csv');
                    }
                });
            }).catch(err => { consoleWrite('ERROR', `Unable to call match ${line.match_id} at this time`) });

        }

    });
}

function createFile(filename) {
    fs.open(filename, 'r', function (err, fd) {
        if (err) {
            fs.writeFile(filename, 'timeraw,date,change,elo,rank,matchid,length', function (err) {
                if (err) {
                    console.error(err);
                }
                consoleWrite('UPDATE', `${filename} created`);
            });
        }
    });
}

function consoleWrite(code, message) {
    console.log(`[${code}] ${message}`)
}

module.exports.updateTrackedPlayers = (playerList) => {
    updateTrackedPlayers(playerList);
}

module.exports.consoleWrite = (code, message) => {
    consoleWrite(code, message);
}