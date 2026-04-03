import { matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './match_handler';


let InitModule: nkruntime.InitModule = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer,
) {
  logger.info("InitModule is loaded-------->/n")

  initializer.registerMatch("tic-tac-toe", {
    matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal
  })

  initializer.registerMatchmakerMatched(matchMakerMatched);
  logger.info("Match loading/n");
};

let matchMakerMatched: nkruntime.MatchmakerMatchedFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]): string {
  logger.info("Players matched, making a game room...../n")

  let gameMode = "classic";
  if (matches.length > 0 && matches[0].properties && matches[0].properties["mode"]) {
    gameMode = matches[0].properties["mode"];
  }

  const matchId = nk.matchCreate("tic-tac-toe", { mode: gameMode });

  return matchId;
}

!InitModule && InitModule.bind(null);