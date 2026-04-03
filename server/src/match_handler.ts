export const matchInit = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: { [key: string]: string },
) {
  const mode = params.mode || "classic";
  const state = {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0], //0 for empty state , 1for X and 2 for O
    presences: [] as nkruntime.Presence[],
    playing: false,
    turn: 1,
    mode:mode,
    timeLimit:30,
    deadline:30,
  };

  return { state, tickRate: 1, label: "tic-tac-toe" };
};

export const matchJoinAttempt = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presence: nkruntime.Presence,
  metadata: { [key: string]: any },
) {
  const accept = state.presences.length < 2;
  return { state, accept };
};

export const matchJoin = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presences: nkruntime.Presence[],
) {
  state.presences.push(...presences);
  if (state.presences.length === 2) {
    state.playing = true;
    state.deadline = state.timeLimit;
    dispatcher.broadcastMessage(
      2,
      JSON.stringify({
        board: state.board,
        turn: state.turn,
        p1: state.presences[0].userId,
        p2: state.presences[1].userId,
        mode:state.mode,
        timeLeft:state.mode==="timed" ? state.deadline : null,
      }),
    );
  }

  return { state };
};

export const matchLeave = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presences: nkruntime.Presence[],
) {
  state.playing = false;
  dispatcher.broadcastMessage(
    4,
    JSON.stringify({ message: "Opponent left the match" }),
  );
  return { state };
};

export const matchLoop = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  messages: nkruntime.MatchMessage[],
) {
  if (!state.playing) return { state };

  if(state.mode==="timed"){
    state.deadline--;
  }

  for (const message of messages) {
    if (message.opCode === 1) {
      //Player makes move
      const data = JSON.parse(nk.binaryToString(message.data));
      const senderId = message.sender.userId;

      const isP1 = senderId === state.presences[0].userId;
      const isP2 = senderId === state.presences[1].userId;

      // Verify turn
      if ((state.turn === 1 && isP1) || (state.turn === 2 && isP2)) {
        if (state.board[data.position] === 0) {
          state.board[data.position] = state.turn;
        }

        const wins = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];
        let winner = 0;
        for (const w of wins) {
          if (
            state.board[w[0]] &&
            state.board[w[0]] === state.board[w[1]] &&
            state.board[w[1]] === state.board[w[2]]
          ) {
            winner = state.turn;
          }
        }

        let isDraw = !state.board.includes(0);

        if (winner != 0 || isDraw) {
          dispatcher.broadcastMessage(
            3,
            JSON.stringify({ board: state.board, winner, isDraw,reason:"game_over"}),
          );
          return null;
        }

        state.turn = state.turn === 1 ? 2 : 1;
        state.deadline = state.timeLimit
        dispatcher.broadcastMessage(
          2,
          JSON.stringify({
            board: state.board,
            turn: state.turn,
            p1: state.presences[0].userId,
            p2: state.presences[1].userId,
            timeLeft:state.mode==="timed" ? state.deadline : null,
          }),
        );
      }
    }
  }

  if(state.mode==="timed" && state.deadline<=0){
    const winner = state.turn ===1?2:1;
    dispatcher.broadcastMessage(3,JSON.stringify({board:state.board,winner,isDraw:false,reason:"timeout"}));
    return null;
  }

  return { state };
};

export const matchTerminate = () => ({ state: null });
export const matchSignal = () => ({ state: null, data: "" });
