// this is the server
const io = require('../servers').io;
const checkForOrbCollisions = require('./checkCollisions').checkForOrbCollisions;
const checkForPlayerCollisions = require('./checkCollisions').checkForPlayerCollisions;

const Player = require('./classes/Player');
const PlayerData = require('./classes/PlayerData');
const PlayerConfig = require('./classes/PlayerConfig');
const Orb = require('./classes/Orb');
const Team = require('./classes/Team');
let orbs = [];
let players = [];
let teams = [];
let settings = {
    defaultOrbs: 50,
    defaultSpeed: 6,
    defaultSize: 6,
    defaultZoom: 1.5,
    worldWidth: 1000,
    worldHeight: 1000
};

initGame();

setInterval(()=>{
    if(players.length > 0){
        io.to('game').emit('tock',{
            players,
            teams
        });
    }
},33);

io.sockets.on('connect',(socket)=>{
    let player = {};
    socket.on('init',(data)=>{
        // add the player to the game namespace
        socket.join('game');
        let playerConfig = new PlayerConfig(settings);
        let playerData = new PlayerData(data.playerName,settings, data.teamName);
        player = new Player(socket.id, playerConfig, playerData);

        // issue a message to THIS client with it's loc 30/sec
        setInterval(()=>{
            socket.emit('tickTock',{
                playerX: player.playerData.locX,
                playerY: player.playerData.locY,
            });
        },33);

        socket.emit('initReturn',{
            orbs
        });
        players.push(playerData);
        if(data.teamName != "")
        {
            var team = teams.filter(e => e.teamName == data.teamName)
            if (team.length > 0) {
                //team exists
                // increment
                team.numberOfPlayers++;
            }
            else {
                // add new team 
                var newTeam = new Team(data.teamName);
                teams.push(newTeam);
            }
        }
    })
    
    socket.on('tick',(data)=>{
        speed = player.playerConfig.speed
        // update with new direction
        xV = player.playerConfig.xVector = data.xVector;
        yV = player.playerConfig.yVector = data.yVector;
    
        if((player.playerData.locX < 5 && player.playerData.xVector < 0) || 
            (player.playerData.locX > settings.worldWidth) && 
            (xV > 0))
        {
            player.playerData.locY -= speed * yV;
        }
        else if((player.playerData.locY < 5 && yV > 0) || 
            (player.playerData.locY > settings.worldHeight) && 
            (yV < 0))
        {
            player.playerData.locX += speed * xV;
        }
        else{
            player.playerData.locX += speed * xV;
            player.playerData.locY -= speed * yV;
        }

        
        let capturedOrb = checkForOrbCollisions(
            player.playerData,
            player.playerConfig,
            orbs,
            settings,
            teams
        );
        capturedOrb.then((data)=>{
            const orbData = {
                orbIndex: data,
                newOrb: orbs[data]
            }
            
            io.sockets.emit('updateLeaderBoard',getLeaderBoard());
            if(player.playerData.teamName != ""){
                io.sockets.emit('updateTeamLeaderBoard',getTeamLeaderBoard());
            }
            io.sockets.emit('orbSwitch',orbData);
        }).catch(()=>{})

        let playerDeath = checkForPlayerCollisions(
            player.playerData,
            player.playerConfig,
            players,
            player.socketId,
            teams
        );

        playerDeath.then((data)=>{
            io.sockets.emit('updateLeaderBoard',getLeaderBoard());
            io.sockets.emit('playerDeath',data);
            if(player.playerData.teamName != ""){
                io.sockets.emit('updateTeamLeaderBoard',getTeamLeaderBoard());
            }
            
        }).catch(()=>{})
    });

    socket.on('disconnect',(data)=>{
        if(player.playerData){
            players.forEach((currPlayer,i)=>{
                if(currPlayer.uid == player.playerData.uid){
                    players.splice(i,1);
                    io.sockets.emit('updateLeaderBoard',getLeaderBoard());
                }
            });
            if(player.playerData.teamName != "")
            {
                var teamIndex = teams.map(function(e) { return e.teamName; }).indexOf(player.playerData.teamName);
                teams[teamIndex].numberOfPlayers--;
                if(teams[teamIndex].numberOfPlayers < 1)
                {
                    teams.splice(killedTeamIndex, 1);
                    io.sockets.emit('updateLeaderBoard',getLeaderBoard());
                }
            }
        }
    })
})

function getLeaderBoard(){
    players.sort((a,b)=>{
        return b.score - a.score;
    });

    let leaderBoard = players.map((curPlayer)=>{
        return{
            name: curPlayer.name,
            score: curPlayer.score
        };
    })
    return leaderBoard;
}

function getTeamLeaderBoard(){
    teams.sort((a,b)=>{
        return b.score - a.score;
    });

    let leaderBoard = teams.map((curTeam)=>{
        return{
            teamName: curTeam.teamName,
            score: curTeam.score
        };
    })
    return leaderBoard;
}

function initGame(){
    for(let i = 0; i < settings.defaultOrbs; i++){
        orbs.push(new Orb(settings));
    }
}

module.exports = io