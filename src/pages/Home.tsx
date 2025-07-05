import React, { useState } from 'react';
import PlayerForm from '../components/PlayerForm';
import Scoreboard from '../components/Scoreboard';
import MatchList from '../components/MatchList';
import { swissPairing, updateScores } from '../utils/scoring';
import { Player, Match } from '../types';

const Home: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [round, setRound] = useState(1);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [allResults, setAllResults] = useState<{ [matchId: string]: { winnerId: string; loserId: string; isTwoZero: boolean; score?: string } }>({});
  const [records, setRecords] = useState<any[]>([]);
  const [byePlayers, setByePlayers] = useState<Player[]>([]);

  const handleAddPlayer = (name: string) => {
    setPlayers([...players, { id: Date.now().toString(), name, score: 0 }]);
  };

  // 新增：開始比賽（第一輪隨機配對）
  const handleStart = () => {
    const { matches, byePlayers } = swissPairing(players, true);
    setMatches(matches);
    setByePlayers(byePlayers);
    setStarted(true);
  };

  const handleSubmitResult = (matchId: string, winnerId: string, loserId: string, isTwoZero: boolean) => {
    setMatchResults(prev => [...prev, { matchId, winnerId, loserId, isTwoZero }]);
    setMatches(ms => ms.map(m => m.id === matchId ? { ...m, status: 'completed' } : m));
  };

  const handleNextRound = () => {
    const resultsArr = Object.entries(allResults)
      .filter(([_, v]) => v)
      .map(([matchId, v]) => ({
        matchId,
        winnerId: v.winnerId,
        loserId: v.loserId,
        isTwoZero: v.isTwoZero,
        score: v.score, // Add score property here
        players: matches.find(m => m.id === matchId)?.players || []
      }));

    const updatedPlayers = players.map(p => ({ ...p }));
    resultsArr.forEach(res => {
      if (!res.winnerId && res.players.length === 2) {
        // 平手
        if (res.score === '1-1') {
          // 1-1 雙方各加3分
          const p0 = updatedPlayers.find(p => p.id === res.players[0].id);
          const p1 = updatedPlayers.find(p => p.id === res.players[1].id);
          if (p0) p0.score += 3;
          if (p1) p1.score += 3;
        }
        // 0-0 甚麼都唔做
      } else {
        const winner = updatedPlayers.find(p => p.id === res.winnerId);
        if (winner) winner.score += res.isTwoZero ? 7 : 3;
      }
    });

    // 處理輪空玩家得分
    byePlayers.forEach(bp => {
      const p = updatedPlayers.find(p => p.id === bp.id);
      if (p) p.score += 6;
    });

    setPlayers(updatedPlayers);
    setRecords(prev => [...prev, { round, matches: matches.map(m => ({ ...m })), results: allResults }]);
    const { matches: newMatches, byePlayers: newByePlayers } = swissPairing(updatedPlayers);
    setMatches(newMatches);
    setByePlayers(newByePlayers);
    setAllResults({});
    setRound(r => r + 1);
  };

  const scores = players.map(p => ({ name: p.name, score: p.score }));

  return (
    <div>
      <h1>Disney Lorcana Match Organizer</h1>
      <PlayerForm onAddPlayer={handleAddPlayer} />
      <Scoreboard scores={scores} />
      {!started && players.length > 1 && (
        <button onClick={handleStart}>開始比賽</button>
      )}
      {started && !ended && (
        <>
          <MatchList matches={matches} onAllResultsChange={setAllResults} />
                  {byePlayers.length > 0 && (
                      <div style={{ color: 'orange' }}>
                          輪空：{byePlayers.map(p => p.name).join(', ')}
                      </div>
                  )}
          <button onClick={handleNextRound}>下一輪比賽</button>
        </>
      )}
      {/* 顯示紀錄 */}
      <div>
        <h2>歷史紀錄</h2>
        {records.map((rec, idx) => (
          <div key={idx}>
            <b>第{rec.round}輪</b>
            {rec.matches.map((m: Match, i: number) => {
              const result = rec.results[m.id];
              // 判斷比分字串
              let scoreStr = '';
              if (result) {
                if (result.score === '1-1') scoreStr = '(1-1)';
                else if (result.score === '0-0') scoreStr = '(0-0)';
                else if (result.isTwoZero) scoreStr = '(2-0)';
                else scoreStr = '(1-0)';
              }
              return (
                <div key={m.id}>
                  桌{i + 1}：{m.players[0].name} vs {m.players[1].name}：
                  {result?.winnerId
                    ? m.players.find(p => p.id === result.winnerId)?.name + ' 勝'
                    : '平手'}
                  {scoreStr}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p>本輪：第{round}輪</p>
      {!ended && (
        <button onClick={() => setEnded(true)}>比賽結束</button>
      )}
      {ended && (
        <div>
          <h2>最終排名</h2>
          <ol>
            {players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map(p => (
                <li key={p.id}>
                  {p.name}：{p.score}分
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default Home;