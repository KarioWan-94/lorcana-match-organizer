import { Player, Match } from '../types';

// 瑞士制細分排名計算
export interface PlayerTiebreakers {
  playerId: string;
  playerName: string;
  score: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  opponentMatchWinPercentage: number; // OMW%
  gameWinPercentage: number; // GW%
  opponentGameWinPercentage: number; // OGW%
}

// 計算所有玩家的細分數據
export function calculateTiebreakers(players: Player[], records: any[]): PlayerTiebreakers[] {
  const playerStats = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    score: player.score,
    matchWins: 0,
    matchLosses: 0,
    gameWins: 0,
    gameLosses: 0,
    opponents: [] as string[], // 記錄對手ID
    opponentMatchWins: 0,
    opponentMatchLosses: 0,
    opponentGameWins: 0,
    opponentGameLosses: 0
  }));

  // 遍歷所有歷史紀錄統計數據
  records.forEach(record => {
    Object.entries(record.results || {}).forEach(([matchId, result]: [string, any]) => {
      if (!result) return;

      const match = record.matches.find((m: any) => m.id === matchId);
      if (!match || match.players.length !== 2) return;

      const player1 = playerStats.find(p => p.playerId === match.players[0].id);
      const player2 = playerStats.find(p => p.playerId === match.players[1].id);
      
      if (!player1 || !player2) return;

      // 記錄對手
      if (!player1.opponents.includes(player2.playerId)) {
        player1.opponents.push(player2.playerId);
      }
      if (!player2.opponents.includes(player1.playerId)) {
        player2.opponents.push(player1.playerId);
      }

      // 解析比賽結果
      const [games1, games2] = result.score.split('-').map(Number);
      
      // 更新遊戲勝負數
      player1.gameWins += games1;
      player1.gameLosses += games2;
      player2.gameWins += games2;
      player2.gameLosses += games1;

      // 更新對戰勝負數
      if (result.winnerId === player1.playerId) {
        player1.matchWins++;
        player2.matchLosses++;
      } else if (result.winnerId === player2.playerId) {
        player2.matchWins++;
        player1.matchLosses++;
      } else {
        // 平手情況 (1-1)
        // 在瑞士制中，平手通常不算勝負
      }
    });
  });

  // 計算細分數據
  return playerStats.map(player => {
    // 計算自己的遊戲勝率 (GW%)
    const totalGames = player.gameWins + player.gameLosses;
    const gameWinPercentage = totalGames > 0 ? Math.max(0.33, player.gameWins / totalGames) : 0.33;

    // 計算對手的比賽勝率 (OMW%)
    let opponentMatchWins = 0;
    let opponentMatchLosses = 0;
    let opponentGameWins = 0;
    let opponentGameLosses = 0;

    player.opponents.forEach(opponentId => {
      const opponent = playerStats.find(p => p.playerId === opponentId);
      if (opponent) {
        opponentMatchWins += opponent.matchWins;
        opponentMatchLosses += opponent.matchLosses;
        opponentGameWins += opponent.gameWins;
        opponentGameLosses += opponent.gameLosses;
      }
    });

    const opponentTotalMatches = opponentMatchWins + opponentMatchLosses;
    const opponentMatchWinPercentage = opponentTotalMatches > 0 
      ? Math.max(0.33, opponentMatchWins / opponentTotalMatches) 
      : 0.33;

    // 計算對手的遊戲勝率 (OGW%)
    const opponentTotalGames = opponentGameWins + opponentGameLosses;
    const opponentGameWinPercentage = opponentTotalGames > 0 
      ? Math.max(0.33, opponentGameWins / opponentTotalGames) 
      : 0.33;

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      score: player.score,
      matchWins: player.matchWins,
      matchLosses: player.matchLosses,
      gameWins: player.gameWins,
      gameLosses: player.gameLosses,
      opponentMatchWinPercentage,
      gameWinPercentage,
      opponentGameWinPercentage
    };
  });
}

// 瑞士制排名（包含細分）
export function sortPlayersBySwissRanking(tiebreakers: PlayerTiebreakers[]): PlayerTiebreakers[] {
  return tiebreakers.sort((a, b) => {
    // 1. 首先按積分排序
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    
    // 2. 同分時按對手勝率 (OMW%) 排序
    if (Math.abs(a.opponentMatchWinPercentage - b.opponentMatchWinPercentage) > 0.001) {
      return b.opponentMatchWinPercentage - a.opponentMatchWinPercentage;
    }
    
    // 3. 再按自己遊戲勝率 (GW%) 排序
    if (Math.abs(a.gameWinPercentage - b.gameWinPercentage) > 0.001) {
      return b.gameWinPercentage - a.gameWinPercentage;
    }
    
    // 4. 最後按對手遊戲勝率 (OGW%) 排序
    return b.opponentGameWinPercentage - a.opponentGameWinPercentage;
  });
}

// 支援第一輪隨機配對
export function swissPairing(players: Player[], randomFirstRound = false): { matches: Match[], byePlayers: Player[] } {
  let sorted = [...players];
  if (randomFirstRound) {
    // 隨機排序
    sorted.sort(() => Math.random() - 0.5);
  } else {
    // 按分數高到低排，分數相同隨機
    sorted.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  }
  const matches: Match[] = [];
  let byePlayers: Player[] = [];
  for (let i = 0; i < sorted.length - 1; i += 2) {
    matches.push({
      id: `${Date.now()}-${i}`,
      players: [sorted[i], sorted[i + 1]],
      status: 'ongoing',
      history: []
    });
  }
  if (sorted.length % 2 === 1) {
    byePlayers = [sorted[sorted.length - 1]];
  }
  return { matches, byePlayers };
}

export function updateScores(
  players: Player[],
  matchResults: { winnerId: string; loserId: string; isTwoZero: boolean }[]
) {
  const updated = players.map(p => ({ ...p }));
  matchResults.forEach(({ winnerId, loserId, isTwoZero }) => {
    if (!winnerId && !loserId) {
      // 平手，雙方各加3分
      // 你需要知道邊兩個人打，假設 matchResults 有 matchId，可以根據 matchId 搵返對戰雙方
      // 但現有結構下，可以考慮 match 結構加 players
      // 這裡假設 matchResults 有 players 屬性
      // 或者你可以在 Home.tsx 處理
    } else {
      const winner = updated.find(p => p.id === winnerId);
      if (winner) winner.score += isTwoZero ? 7 : 3;
      // loser唔加分
    }
  });
  return updated;
}

export function getMatchDetails(matchId: string) {
  return {
    id: matchId,
    players: [
      { id: '1', name: 'Alice', score: 3 },
      { id: '2', name: 'Bob', score: 2 }
    ],
    status: "completed", // 直接寫 string literal
    result: { winnerId: '1', loserId: '2', isTwoZero: false },
    history: ["Alice scored 3", "Bob scored 2"]
  };
}