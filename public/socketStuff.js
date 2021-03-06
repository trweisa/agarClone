// THIS IS CLIENT

// let socket = io.connect('http://localhost:8080')
let socket = io.connect();

function init(){
    draw();
    socket.emit('init',{
        playerName: player.name
    });
}

socket.on('initReturn',(data)=>{
    orbs = data.orbs;
    setInterval(()=>{
        if(player.xVector) {    
            socket.emit('tick',{
                xVector: player.xVector,
                yVector: player.yVector
            });
        }
    },33);
});

socket.on('tock',(data)=>{
    players = data.players;
});

socket.on('orbSwitch',(data)=>{
    orbs.splice(data.orbData.orbIndex, 1, data.orbData.newOrb);
    document.querySelector('.player-score').innerHTML = "";
    document.querySelector(".player-score").innerHTML = data.playerScore;
});

socket.on('tickTock',(data)=>{
    player.locX = data.playerX;
    player.locY = data.playerY;
});

socket.on('updateLeaderBoard',(data)=>{
    // console.log(data);
    document.querySelector('.leader-board').innerHTML = "";
    data.forEach((curPlayer)=>{
        document.querySelector('.leader-board').innerHTML += `
            <li class="leaderboard-player">${curPlayer.name} - ${curPlayer.score}</li>
        `;
    });
});

socket.on('playerDeath',(data)=>{
    document.querySelector('#game-message').innerHTML = `${data.died.name} absorbed by ${data.killedBy.name}`;
    $("#game-message").css({
        "background-color": "#00e6e6",
        "opacity": 1
    });
    $("#game-message").show();
    $("#game-message").fadeOut(5000);

    if(player.uid == data.died.uid)
    {
        player.isAlive = false;
        $('#spawnModal').modal('show');
        document.querySelector('.stats-wrapper').innerHTML = `Total Orb count: ${data.died.orbsAbsorbed}`;
    }
});
