'use strict';

var matchInit = function (ctx, logger, nk, params) {
    var mode = params.mode || "classic";
    var state = {
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0], //0 for empty state , 1for X and 2 for O
        presences: [],
        playing: false,
        turn: 1,
        mode: mode,
        timeLimit: 30,
        deadline: 30,
    };
    return { state: state, tickRate: 1, label: "tic-tac-toe" };
};
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    var accept = state.presences.length < 2;
    return { state: state, accept: accept };
};
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    var _a;
    (_a = state.presences).push.apply(_a, presences);
    if (state.presences.length === 2) {
        state.playing = true;
        state.deadline = state.timeLimit;
        dispatcher.broadcastMessage(2, JSON.stringify({
            board: state.board,
            turn: state.turn,
            p1: state.presences[0].userId,
            p2: state.presences[1].userId,
            mode: state.mode,
            timeLeft: state.mode === "timed" ? state.deadline : null,
        }));
    }
    return { state: state };
};
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    state.playing = false;
    dispatcher.broadcastMessage(4, JSON.stringify({ message: "Opponent left the match" }));
    return { state: state };
};
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    if (!state.playing)
        return { state: state };
    if (state.mode === "timed") {
        state.deadline--;
    }
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        if (message.opCode === 1) {
            //Player makes move
            var data = JSON.parse(nk.binaryToString(message.data));
            var senderId = message.sender.userId;
            var isP1 = senderId === state.presences[0].userId;
            var isP2 = senderId === state.presences[1].userId;
            // Verify turn
            if ((state.turn === 1 && isP1) || (state.turn === 2 && isP2)) {
                if (state.board[data.position] === 0) {
                    state.board[data.position] = state.turn;
                }
                var wins = [
                    [0, 1, 2],
                    [3, 4, 5],
                    [6, 7, 8],
                    [0, 3, 6],
                    [1, 4, 7],
                    [2, 5, 8],
                    [0, 4, 8],
                    [2, 4, 6],
                ];
                var winner = 0;
                for (var _a = 0, wins_1 = wins; _a < wins_1.length; _a++) {
                    var w = wins_1[_a];
                    if (state.board[w[0]] &&
                        state.board[w[0]] === state.board[w[1]] &&
                        state.board[w[1]] === state.board[w[2]]) {
                        winner = state.turn;
                    }
                }
                var isDraw = !state.board.includes(0);
                if (winner != 0 || isDraw) {
                    dispatcher.broadcastMessage(3, JSON.stringify({ board: state.board, winner: winner, isDraw: isDraw, reason: "game_over" }));
                    return null;
                }
                state.turn = state.turn === 1 ? 2 : 1;
                state.deadline = state.timeLimit;
                dispatcher.broadcastMessage(2, JSON.stringify({
                    board: state.board,
                    turn: state.turn,
                    p1: state.presences[0].userId,
                    p2: state.presences[1].userId,
                    timeLeft: state.mode === "timed" ? state.deadline : null,
                }));
            }
        }
    }
    if (state.mode === "timed" && state.deadline <= 0) {
        var winner = state.turn === 1 ? 2 : 1;
        dispatcher.broadcastMessage(3, JSON.stringify({ board: state.board, winner: winner, isDraw: false, reason: "timeout" }));
        return null;
    }
    return { state: state };
};
var matchTerminate = function () { return ({ state: null }); };
var matchSignal = function () { return ({ state: null, data: "" }); };

var InitModule = function (ctx, logger, nk, initializer) {
    logger.info("InitModule is loaded-------->/n");
    initializer.registerMatch("tic-tac-toe", {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    initializer.registerMatchmakerMatched(matchMakerMatched);
    logger.info("Match loading/n");
};
var matchMakerMatched = function (ctx, logger, nk, matches) {
    logger.info("Players matched, making a game room...../n");
    var gameMode = "classic";
    if (matches.length > 0 && matches[0].properties && matches[0].properties["mode"]) {
        gameMode = matches[0].properties["mode"];
    }
    var matchId = nk.matchCreate("tic-tac-toe", { mode: gameMode });
    return matchId;
};
!InitModule && InitModule.bind(null);
