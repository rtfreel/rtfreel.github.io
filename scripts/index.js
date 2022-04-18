let game;
let players;
let curPlayer = 0;
let tic = true;

// entry point
$(document).ready(function(){
    setSymbols();

    // create game
    game = new Game("#game-field", "#size-label > span");
    game.generate(MIN_SIZE);

    // create players
    preparePlayers();

    // recreate players on change
    $(".player").change(function() {
        preparePlayers();
    });
    
    // set symbols
    $(".mark-edit").keydown(function() { $(this).val(""); });
    $(".mark-edit").focusout(function() { 
        if($(this).val() == "" || 
            $(this).val() == " ") { 
            $(this).val("_");
            preparePlayers();
        }
    });

    // set up restart button
    $("#size-label").click(function() {
        game.generate(game.size);
        players.forEach(player => player.updateStatus(""));
        curPlayer = 0;
        aiTurnCheck();
    });

    // set up symbol buttons
    $("#first-player .dropdown-item").click(function() {
        $("#first-player .mark-edit").val($(this).html());
        preparePlayers();
    });
    $("#second-player .dropdown-item").click(function() {
        $("#second-player .mark-edit").val($(this).html());
        preparePlayers();
    });
});

function setSymbols() {
    for(let si = 0; si < SPECIAL_SYMBOLS.length; si++) {
        let btn = $("<button></button>");
        btn.addClass("dropdown-item");
        btn.html(SPECIAL_SYMBOLS[si]);
        $(".dropdown-menu").append(btn);
    }
}

function turn(row, col){
    // skip turn if game is finishrd for any reason
    if(!game.running){
        if(game.started) return;
        game.start();
    }

    // if cell is occupied
    if(game.cells[row][col].playerId != -1) return;
    
    game.cells[row][col].occupie(curPlayer, players[curPlayer]);
    players[curPlayer].endTurn();

    // check winner
    let winner = game.checkWinner(curPlayer);
    switch (winner){
        case undefined: break;  // game goes on
        case -1:                // tie
            players.forEach(player => player.updateStatus(TIE_MSG));
            return;
        default:                // winner
            players[curPlayer].updateStatus(WIN_MSG);
            return;
    }

    // next player
    curPlayer++;
    curPlayer %= players.length;

    // AI move
    aiTurnCheck();
}

function aiTurnCheck() {
    let move = players[curPlayer].makeMove();
    if(move != undefined) 
        turn(move[0], move[1]);
}

function resize(add) {
    if(add) {   // make table larger by one
        if(game.size == MAX_SIZE)
            return;
        game.generate(game.size + 1);
    } else {    // shrink table by one
        if(game.size == MIN_SIZE)
            return;
        game.generate(game.size - 1);
    }
    players.forEach(player => player.updateStatus(""));
    curPlayer = 0;
    aiTurnCheck();
}

function preparePlayers() {
    let types = [
            $("#first-player .player-type").val(), 
            $("#second-player .player-type").val()
        ],
        syms = [
            $("#first-player .mark-edit").val(),
            $("#second-player .mark-edit").val()
        ],
        stats = [
            $("#first-player .player-status"),
            $("#second-player .player-status")
        ];

    players = [];
    for(let i = 0; i < 2; i++) {
        if(types[i] == 0)
            players.push(new Player(game, i, syms[i]));
        else
            players.push(new AI(AI_DIFFICULTY[types[i]-1], game, i, syms[i]));
        players[i].setStatusOut(stats[i]);
        players[i].updateStatus("");
    }
    game.generate(game.size);

    // check for ai's first move
    curPlayer = 0;
    aiTurnCheck();
}