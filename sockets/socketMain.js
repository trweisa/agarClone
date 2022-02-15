// this is the server
const io = require('../servers').io;
const checkForOrbCollisions = require('./checkCollisions').checkForOrbCollisions;
const checkForPlayerCollisions = require('./checkCollisions').checkForPlayerCollisions;

const Player = require('./classes/Player');
const PlayerData = require('./classes/PlayerData');
const PlayerConfig = require('./classes/PlayerConfig');
const Orb = require('./classes/Orb');
let orbs = [];
let players = [];
let settings = {
    defaultOrbs: 1000,
    defaultSpeed: 8,
    defaultSize: 6,
    defaultZoom: 1.75,
    worldWidth: 1000,
    worldHeight: 1000
};

initGame();

setInterval(()=>{
    if(players.length > 0){
        io.to('game').emit('tock',{
            players,
        });
    }
},33);

io.sockets.on('connect',(socket)=>{
    let player = {};
    socket.on('init',(data)=>{
        // add the player to the game namespace
        socket.join('game');
        let playerConfig = new PlayerConfig(settings);
        let playerData = new PlayerData(data.playerName,settings);
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

        let capturedOrb = checkForOrbCollisions(player.playerData,player.playerConfig,orbs,settings);
        capturedOrb.then((data)=>{
            const orbData = {
                orbIndex: data,
                newOrb: orbs[data]
            }
            
            io.sockets.emit('updateLeaderBoard',getLeaderBoard());
            io.sockets.emit('orbSwitch',{
                orbData,
                playerScore: player.playerData.score
            });
        }).catch(()=>{})

        let playerDeath = checkForPlayerCollisions(player.playerData,player.playerConfig,players,player.socketId)
        playerDeath.then((data)=>{
            io.sockets.emit('updateLeaderBoard',getLeaderBoard());
            io.sockets.emit('playerDeath',data);
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

function initGame(){
    for(let i = 0; i < settings.defaultOrbs; i++){
        orbs.push(new Orb(settings));
    }
}

module.exports = io
