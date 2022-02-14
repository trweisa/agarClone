let wHeight = $(window).height();
let wWidth = $(window).width();
let player = {};
let orbs = [];
let players = [];

let canvas = document.querySelector('#the-canvas');
let context = canvas.getContext('2d');
canvas.width = wWidth;
canvas.height = wHeight;

$(window).load(()=>{
    $('#loginModal').modal('show');
});

$('.name-form').submit((event)=>{
    event.preventDefault();
    player.name = document.querySelector('#name-input').value;
    $('#loginModal').modal('hide');
    $('#spawnModal').modal('show');
    document.querySelector('.player-name').innerHTML = player.name;
});

$('.start-game').click((event)=>{
    $('.modal').modal('hide');
    $('.hiddenOnStart').removeAttr('hidden');
    init();
});

$('.start-team-game').click((event)=>{
    player.teamName = document.querySelector('#team-name-input').value;
    if(player.teamName == "")
    {
        document.querySelector('.team-name-warning').innerHTML = `
            Please enter a team name.
        `;
    }
    else {
        $('.modal').modal('hide');
        $('.hiddenOnStart').removeAttr('hidden');
        $('.team-score-board').removeAttr('hidden');

        init();
    }

    //WILL WANT A TEAM SCORE DIV
});