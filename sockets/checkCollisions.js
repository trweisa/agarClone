const Orb = require('./classes/Orb')
const io = require('../servers').io;

function checkForOrbCollisions(pData,pConfig, orbs, settings, teams){
    var index = teams.map(function(e) { return e.teamName; }).indexOf(pData.teamName);
    return new Promise((resolve, reject)=>{
        orbs.forEach((orb,i)=>{
        // AABB Test(square)  - Axis-aligned bounding boxes
            if(pData.locX + pData.radius + orb.radius > orb.locX 
                && pData.locX < orb.locX + pData.radius + orb.radius
                && pData.locY + pData.radius + orb.radius > orb.locY 
                && pData.locY < orb.locY + pData.radius + orb.radius){
            // Pythagoras test(circle)
                distance = Math.sqrt(
                    ((pData.locX - orb.locX) * (pData.locX - orb.locX)) + 
                    ((pData.locY - orb.locY) * (pData.locY - orb.locY))	
                    );
                if(distance < pData.radius + orb.radius){
                    //COLLISION!!!
                    pData.score += 1;
                    pData.orbsAbsorbed += 1;

                    if(pData.teamName != "")
                    {
                        teams[index].score += 1;
                    }

                    if(pConfig.zoom > 1){
                        pConfig.zoom -= .001;
                    }
                    pData.radius += 0.25;

                    if(pConfig.speed < -0.005){
                        pConfig.speed += 0.005;
                    }
                    else if(pConfig.speed > 0.005){
                        pConfig.speed -= 0.005;
                    }

                    orbs.splice(i, 1, new Orb(settings));
                    resolve(i);
                }
            }
        });
        reject();
    });
}
        
function checkForPlayerCollisions(pData, pConfig, players, playerId, teams){
    return new Promise((resolve, reject)=>{	
        players.forEach((curPlayer,i)=>{
            if(curPlayer.uid != playerId && (curPlayer.teamName != pData.teamName || pData.teamName == "")){
                let pLocx = curPlayer.locX
                let pLocy = curPlayer.locY
                let pR = curPlayer.radius

                // AABB Test - Axis-aligned bounding boxes
                if(pData.locX + pData.radius + pR > pLocx
                    && pData.locX < pLocx + pData.radius + pR
                    && pData.locY + pData.radius + pR > pLocy 
                    && pData.locY < pLocy + pData.radius + pR)
                {
                    // Pythagoras test
                    distance = Math.sqrt(
                        ((pData.locX - pLocx) * (pData.locX - pLocx)) + 
                        ((pData.locY - pLocy) * (pData.locY - pLocy))	
                    );      
                    if(distance < pData.radius + pR){
                        if(pData.radius > pR){
                            // Enemy death
                            let collisionData = updateScores(pData, curPlayer, teams);
                            if(pConfig.zoom > 1){
                                pConfig.zoom -= (pR * 0.25) * .001;
                            }
                            players.splice(i, 1);
                            resolve(collisionData);

                        }
                    }
                }
            }
        })
        reject();
    });
}

function updateScores(killer, killed, teams){
    killer.score += (killed.score + 10);
    killer.playersAbsorbed += 1;
    killed.alive = false;
    killer.radius += (killed.radius * 0.25)

    if(killer.teamName != "")
    {
        var killerTeamIndex = teams.map(function(e) { return e.teamName; }).indexOf(killer.teamName);
        teams[killerTeamIndex].score += killed.score + 10;
    }
    if(killed.teamName != "")
    {
        var killedTeamIndex = teams.map(function(e) { return e.teamName; }).indexOf(killed.teamName);

        teams[killedTeamIndex].score -= killed.score;
        teams[killedTeamIndex].numberOfMembers--;
        
        if(teams[killedTeamIndex].numberOfMembers < 1)
        {
            teams.splice(killedTeamIndex, 1);
        }
    }

    return{
        died: killed,
        killedBy: killer,
    }
}

module.exports = {checkForOrbCollisions, checkForPlayerCollisions};
