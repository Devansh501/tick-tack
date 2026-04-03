import React, { useEffect, useState } from 'react';
import { Client } from '@heroiclabs/nakama-js';
import './App.css';

const serverKey = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";
const host = import.meta.env.VITE_NAKAMA_HOST || "127.0.0.1";
const port = import.meta.env.VITE_NAKAMA_PORT || "7350";
const useSsl = import.meta.env.VITE_NAKAMA_USE_SSL === "false";

const client = new Client(serverKey, host, port, useSsl);

function App() {
  const [session, setSession] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  
  const [match, setMatch] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  
  const [board, setBoard] = useState(Array(9).fill(0));
  const [turn, setTurn] = useState<number>(1);
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});
  const [winner, setWinner] = useState<number | null>(null);
  const [draw, setDraw] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!usernameInput.trim()) return;
    
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    
    try {
      const sess = await client.authenticateDevice(deviceId, true, usernameInput.trim());
      setSession(sess);

      const sock = client.createSocket(false, false);
      await sock.connect(sess, true);
      setSocket(sock);

      setIsNameEntered(true);
      
      sock.onmatchmakermatched = async (matched: any) => {
        setIsMatching(false);
        const m = await sock.joinMatch(matched.match_id || matched.token);
        setMatch(m);
      };

      sock.onmatchdata = (matchState: any) => {
        const data = JSON.parse(new TextDecoder().decode(matchState.data));

        if (matchState.op_code === 2) { 
          setBoard(data.board);
          setTurn(data.turn);
          setP1(data.p1);
          setP2(data.p2);
          if (data.mode) setActiveMode(data.mode);
          if (data.timeLeft !== null && data.timeLeft !== undefined) {
             setTimeLeft(data.timeLeft);
          } else {
             setTimeLeft(null);
          }
        } else if (matchState.op_code === 3) { 
          setBoard(data.board);
          setWinner(data.winner);
          setDraw(data.draw);
          if (data.reason) setEndReason(data.reason);
        } else if (matchState.op_code === 4) { 
          setErrorMessage(data.message);
        }
      };
    } catch (e) {
      console.error('Authentication Error:', e);
      setErrorMessage("Failed to login. Please try another name if it's taken.");
    }
  };

  useEffect(() => {
    async function fetchNames() {
      if (!session) return;
      const idsToFetch = [p1, p2].filter(Boolean) as string[];
      if (idsToFetch.length === 0) return;
      
      try {
        const users = await client.getUsers(session, idsToFetch);
        const map: Record<string, string> = {};
        users.users?.forEach((u: any) => {
          map[u.id] = u.username;
        });
        setPlayerMap(prev => ({...prev, ...map}));
      } catch (e) {
        console.error("Failed to fetch user names", e);
      }
    }
    fetchNames();
  }, [p1, p2, session]);

  useEffect(() => {
    let timerId: any;
    if (activeMode === 'timed' && winner === null && !draw && match) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [activeMode, winner, draw, match]);

  const findMatch = async () => {
    setIsMatching(true);
    await socket.addMatchmaker(`+properties.mode:${selectedMode}`, 2, 2, { mode: selectedMode }); 
  };

  const resetGameState = () => {
    setMatch(null);
    setBoard(Array(9).fill(0));
    setWinner(null);
    setDraw(false);
    setEndReason(null);
    setActiveMode(null);
    setTimeLeft(null);
    setErrorMessage('');
  };

  const makeMove = async (index: number) => {
    if (winner !== null || draw || board[index] !== 0) return;
    
    const isMyTurn = (turn === 1 && session.user_id === p1) || (turn === 2 && session.user_id === p2);
    if (!isMyTurn) return;

    const payload = JSON.stringify({ position: index });
    await socket.sendMatchState(match.match_id, 1, payload);
  };

  if (!isNameEntered) {
    return (
      <div className="app-container">
        <h1 className="title">TIC TAC TOE</h1>
        <div className="auth-card">
          <h2>ENTER YOUR NAME</h2>
          <input 
            className="name-input" 
            placeholder="Your Name" 
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
          <button className="hacker-btn" onClick={handleJoin} disabled={!usernameInput.trim()}>
            JOIN LOBBY
          </button>
          {errorMessage && <div className="error-banner">{errorMessage}</div>}
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="app-container">
        <h1 className="title">TIC TAC TOE</h1>
        <div className="matchmaker-card">
          {isMatching ? (
            <>
              <div className="loader-container">
                <div className="radar-spinner"></div>
              </div>
              <div className="loading-text">SEARCHING...</div>
            </>
          ) : (
            <>
              <h2>WELCOME, {session.username}</h2>
              <div className="mode-selection">
                <button 
                  className={`mode-btn ${selectedMode === 'classic' ? 'active' : ''}`}
                  onClick={() => setSelectedMode('classic')}
                >
                  Classic
                </button>
                <button 
                  className={`mode-btn ${selectedMode === 'timed' ? 'active' : ''}`}
                  onClick={() => setSelectedMode('timed')}
                >
                  Timed (30s)
                </button>
              </div>
              <button className="hacker-btn" onClick={findMatch}>
                FIND MATCH
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const mySymbol = session.user_id === p1 ? 'X' : session.user_id === p2 ? 'O' : '';
  const isMyTurn = (turn === 1 && session.user_id === p1) || (turn === 2 && session.user_id === p2);
  
  let winnerName = null;
  if (winner === 1 && p1) winnerName = playerMap[p1] || 'Player X';
  if (winner === 2 && p2) winnerName = playerMap[p2] || 'Player O';

  const opponentId = session.user_id === p1 ? p2 : p1;
  const opponentName = (opponentId && playerMap[opponentId]) ? playerMap[opponentId] : 'Opponent';

  return (
    <div className="app-container">
      <h1 className="title">TIC TAC TOE</h1>
      
      {(winner !== null || draw) && (
        <div className="result-modal-overlay">
          <div className="result-modal-content">
            <h2 className="result-title">
              {winnerName ? `${winnerName} WINS!` : "IT'S A DRAW"}
            </h2>
            {endReason === 'timeout' && <p className="reason-text">A player ran out of time.</p>}
            <button className="hacker-btn play-again-btn" onClick={resetGameState}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      <div className="game-info">
        <div className="player-tag">
          {session.username} ({mySymbol}) vs {opponentName}
        </div>
        
        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        
        {activeMode === 'timed' && winner === null && !draw && (
          <div className="timer-display">
            TIME LEFT: <span className={timeLeft !== null && timeLeft <= 10 ? 'time-low' : ''}>{timeLeft}s</span>
          </div>
        )}

        {winnerName ? (
           <div className="status-message status-win">
             {winnerName} WINS!
           </div>
        ) : draw ? (
           <div className="status-message status-win">
             IT'S A DRAW.
           </div>
        ) : (
           <div className={`status-message ${isMyTurn ? 'status-active' : 'status-waiting'}`}>
             {isMyTurn ? "> YOUR TURN" : `> WAITING FOR ${opponentName}...`}
           </div>
        )}
      </div>

      <div className="board-grid">
        {board.map((cell, idx) => (
          <button 
            key={idx} 
            className={`cell ${cell === 1 ? 'symbol-X' : cell === 2 ? 'symbol-O' : ''}`}
            onClick={() => makeMove(idx)} 
            disabled={cell !== 0 || !isMyTurn || winner !== null || draw}
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;