import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PlayerForm from '../components/PlayerForm';
import Scoreboard from '../components/Scoreboard';
import MatchList from '../components/MatchList';
import { swissPairing, calculateTiebreakers, sortPlayersBySwissRanking } from '../utils/scoring';
import { Player, Match, Division } from '../types';

const DivisionTournament: React.FC = () => {
  const { divisionId } = useParams<{ divisionId: string }>();
  const [division, setDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'matches' | 'history'>('scoreboard');
  const [editingHistoryMatch, setEditingHistoryMatch] = useState<{roundIndex: number, matchId: string} | null>(null);
  const [editingHistoryValue, setEditingHistoryValue] = useState<string>('');
  const [showManualPairing, setShowManualPairing] = useState(false);
  const [editingMatchPlayers, setEditingMatchPlayers] = useState<{roundIndex?: number, matchId: string, players: Player[]} | null>(null);
  const [showTiebreakers, setShowTiebreakers] = useState(false);

  // 載入分區數據
  useEffect(() => {
    const savedDivisions = localStorage.getItem('divisions');
    if (savedDivisions) {
      const divisions: Division[] = JSON.parse(savedDivisions);
      const foundDivision = divisions.find(d => d.id === divisionId);
      setDivision(foundDivision || null);
    }
    setLoading(false);
  }, [divisionId]);

  // 保存分區數據
  const saveDivision = (updatedDivision: Division) => {
    const savedDivisions = localStorage.getItem('divisions');
    if (savedDivisions) {
      const divisions: Division[] = JSON.parse(savedDivisions);
      const updatedDivisions = divisions.map(d => 
        d.id === updatedDivision.id ? updatedDivision : d
      );
      localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
      setDivision(updatedDivision);
    }
  };

  const handleAddPlayer = (name: string) => {
    if (!division) return;
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      score: 0
    };
    
    const updatedDivision = {
      ...division,
      players: [...division.players, newPlayer]
    };
    
    saveDivision(updatedDivision);
  };

  const handleStart = () => {
    if (!division) return;
    
    const { matches, byePlayers } = swissPairing(division.players, true);
    const updatedDivision = {
      ...division,
      matches,
      byePlayers,
      started: true
    };
    
    saveDivision(updatedDivision);
  };

  const handleNextRound = () => {
    if (!division) return;

    try {
      // 使用最新的 division 狀態
      const currentResults = division.allResults || {};
      const currentMatches = division.matches || [];
      
      const resultsArr = Object.entries(currentResults)
        .filter(([_, v]) => v)
        .map(([matchId, v]) => ({
          matchId,
          winnerId: v.winnerId,
          loserId: v.loserId,
          isTwoZero: v.isTwoZero,
          score: v.score,
          players: currentMatches.find(m => m.id === matchId)?.players || []
        }));

      // 檢查是否所有比賽都有結果
      const totalMatches = currentMatches.length;
      const completedMatches = resultsArr.length;
      
      if (completedMatches === 0) {
        alert('請先輸入並確定比賽結果才能進入下一輪！');
        return;
      }

      if (completedMatches < totalMatches) {
        const confirmed = window.confirm(`還有 ${totalMatches - completedMatches} 場比賽未確定結果，確定要進入下一輪嗎？`);
        if (!confirmed) return;
      }

      const updatedPlayers = division.players.map(p => ({ ...p }));
      console.log('updatedPlayers before scoring:', updatedPlayers);
      
      resultsArr.forEach(res => {
        console.log('Processing result:', res);
        if (!res.winnerId && res.players.length === 2) {
          // 平手
          if (res.score === '1-1') {
            // 1-1 雙方各加3分
            const p0 = updatedPlayers.find(p => p.id === res.players[0].id);
            const p1 = updatedPlayers.find(p => p.id === res.players[1].id);
            if (p0) p0.score += 3;
            if (p1) p1.score += 3;
            console.log('Added 3 points each for 1-1 tie');
          }
          // 0-0 甚麼都唔做
        } else {
          const winner = updatedPlayers.find(p => p.id === res.winnerId);
          if (winner) {
            const points = res.isTwoZero ? 7 : 3;
            winner.score += points;
            console.log(`Added ${points} points to winner:`, winner.name);
          }
        }
      });

      // 處理輪空玩家得分
      if (division.byePlayers && division.byePlayers.length > 0) {
        division.byePlayers.forEach(bp => {
          const p = updatedPlayers.find(p => p.id === bp.id);
          if (p) {
            p.score += 6;
            console.log('Added 6 points to bye player:', p.name);
          }
        });
      }

      console.log('updatedPlayers after scoring:', updatedPlayers);

      const newRecord = {
        round: division.round,
        matches: division.matches.map(m => ({ ...m })),
        results: division.allResults
      };

      console.log('Calling swissPairing with:', updatedPlayers);
      const pairingResult = swissPairing(updatedPlayers);
      console.log('swissPairing result:', pairingResult);
      
      const { matches: newMatches, byePlayers: newByePlayers } = pairingResult;
      
      const updatedDivision = {
        ...division,
        players: updatedPlayers,
        records: [...(division.records || []), newRecord],
        matches: newMatches,
        byePlayers: newByePlayers,
        allResults: {},
        round: division.round + 1
      };

      console.log('About to save division:', updatedDivision);
      saveDivision(updatedDivision);
      console.log('Division saved successfully');
      
    } catch (error) {
      console.error('Error in handleNextRound:', error);
      alert('處理下一輪時發生錯誤：' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleAllResultsChange = useCallback((results: any) => {
    if (!division) return;
    
    // 只更新 state，不保存到 localStorage
    setDivision(prevDivision => {
      if (!prevDivision) return prevDivision;
      return {
        ...prevDivision,
        allResults: results
      };
    });
  }, [division]);

  const handleScoreUpdate = (playerId: string, newScore: number) => {
    if (!division) return;
    
    const updatedPlayers = division.players.map(player => 
      player.id === playerId || player.name === playerId
        ? { ...player, score: newScore }
        : player
    );
    
    const updatedDivision = {
      ...division,
      players: updatedPlayers
    };
    
    saveDivision(updatedDivision);
  };

  // 重新計算所有分數基於歷史紀錄
  const recalculateAllScores = (records: any[]) => {
    if (!division) return [];
    
    // 重置所有玩家分數為0
    const resetPlayers = division.players.map(p => ({ ...p, score: 0 }));
    
    // 遍歷所有歷史紀錄重新計分
    records.forEach(record => {
      const resultsArr = Object.entries(record.results || {})
        .filter(([_, v]) => v)
        .map(([matchId, v]) => {
          const result = v as { winnerId: string; loserId: string; isTwoZero: boolean; score: string };
          return {
            matchId,
            winnerId: result.winnerId,
            loserId: result.loserId,
            isTwoZero: result.isTwoZero,
            score: result.score,
            players: record.matches.find((m: any) => m.id === matchId)?.players || []
          };
        });

      resultsArr.forEach(res => {
        if (!res.winnerId && res.players.length === 2) {
          // 平手
          if (res.score === '1-1') {
            const p0 = resetPlayers.find(p => p.id === res.players[0].id);
            const p1 = resetPlayers.find(p => p.id === res.players[1].id);
            if (p0) p0.score += 3;
            if (p1) p1.score += 3;
          }
        } else {
          const winner = resetPlayers.find(p => p.id === res.winnerId);
          if (winner) {
            const points = res.isTwoZero ? 7 : 3;
            winner.score += points;
          }
        }
      });

      // 處理該輪的輪空玩家（需要從當時的byePlayers獲取）
      // 注意：這需要在records中保存byePlayers信息
    });

    return resetPlayers;
  };

  const handleHistoryResultUpdate = (roundIndex: number, matchId: string, newScore: string) => {
    if (!division) return;

    // 解析新分數
    const match = division.records[roundIndex].matches.find((m: any) => m.id === matchId);
    if (!match) return;

    const parseScore = (score: string, players: any[]) => {
      if (!score) return null;
      const [a, b] = score.split('-').map(Number);
      if (isNaN(a) || isNaN(b)) return null;
      if (a === b) return { winnerId: '', loserId: '', isTwoZero: false };
      const winnerId = a > b ? players[0].id : players[1].id;
      const loserId = a > b ? players[1].id : players[0].id;
      const isTwoZero = a === 2 || b === 2;
      return { winnerId, loserId, isTwoZero };
    };

    const newResult = parseScore(newScore, match.players);
    if (!newResult) return;

    // 更新該輪的結果
    const updatedRecords = [...division.records];
    updatedRecords[roundIndex] = {
      ...updatedRecords[roundIndex],
      results: {
        ...updatedRecords[roundIndex].results,
        [matchId]: {
          ...newResult,
          score: newScore
        }
      }
    };

    // 重新計算所有玩家分數
    const recalculatedPlayers = recalculateAllScores(updatedRecords);

    const updatedDivision = {
      ...division,
      records: updatedRecords,
      players: recalculatedPlayers
    };

    saveDivision(updatedDivision);
  };

  const handleManualPairing = () => {
    if (!division) return;
    
    // 使用 Swiss pairing 規則重新配對
    const { matches: newMatches, byePlayers: newByePlayers } = swissPairing(division.players);
    
    const updatedDivision = {
      ...division,
      matches: newMatches,
      byePlayers: newByePlayers,
      allResults: {}
    };
    
    saveDivision(updatedDivision);
    setShowManualPairing(false);
  };

  const handleEditMatchPlayers = (matchId: string, newPlayers: Player[], roundIndex?: number) => {
    if (!division) return;

    if (roundIndex !== undefined) {
      // 編輯歷史記錄中的對手
      const updatedRecords = [...division.records];
      const matchIndex = updatedRecords[roundIndex].matches.findIndex((m: any) => m.id === matchId);
      
      if (matchIndex >= 0) {
        updatedRecords[roundIndex].matches[matchIndex] = {
          ...updatedRecords[roundIndex].matches[matchIndex],
          players: newPlayers
        };

        // 清除該比賽的結果，因為對手已經改變
        const newResults = { ...updatedRecords[roundIndex].results };
        delete newResults[matchId];
        updatedRecords[roundIndex].results = newResults;

        // 重新計算所有玩家分數
        const recalculatedPlayers = recalculateAllScores(updatedRecords);

        const updatedDivision = {
          ...division,
          records: updatedRecords,
          players: recalculatedPlayers
        };

        saveDivision(updatedDivision);
      }
    } else {
      // 編輯當前輪次的對手
      const updatedMatches = division.matches.map(match => 
        match.id === matchId 
          ? { ...match, players: newPlayers }
          : match
      );

      // 清除該比賽的結果
      const newAllResults = { ...division.allResults };
      delete newAllResults[matchId];

      const updatedDivision = {
        ...division,
        matches: updatedMatches,
        allResults: newAllResults
      };

      saveDivision(updatedDivision);
    }

    setEditingMatchPlayers(null);
  };

  const handleEndTournament = () => {
    if (!division) return;
    
    const updatedDivision = {
      ...division,
      ended: true
    };
    
    saveDivision(updatedDivision);
  };

  if (loading) {
    return <div>載入中...</div>;
  }

  if (!division) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>找不到分區</h2>
        <p>指定的分區不存在或已被刪除。</p>
        <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
          返回分區管理
        </Link>
      </div>
    );
  }

  const scores = division.players.map(p => ({ name: p.name, score: p.score, id: p.id }));

  // 計算瑞士制細分排名
  const tiebreakers = division && division.records && division.records.length > 0
    ? sortPlayersBySwissRanking(calculateTiebreakers(division.players, division.records))
    : [];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 頂部導航 */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#007bff', textDecoration: 'none', fontSize: '16px' }}>
          ← 返回分區管理
        </Link>
        <div style={{ color: '#6c757d' }}>
          第{division.round}輪 | 
          {division.ended ? ' 已結束' : division.started ? ' 進行中' : ' 未開始'}
        </div>
      </div>

      <h1>{division.name} - Disney Lorcana 比賽</h1>

      {/* 玩家管理 */}
      {!division.started && (
        <div style={{ marginBottom: '30px' }}>
          <PlayerForm onAddPlayer={handleAddPlayer} />
        </div>
      )}

      {/* Tab 導航 */}
      {division.started && (
        <div style={{ marginBottom: '20px', borderBottom: '2px solid #e9ecef' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab('matches')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'matches' ? '#007bff' : 'transparent',
                color: activeTab === 'matches' ? 'white' : '#007bff',
                borderBottom: activeTab === 'matches' ? '2px solid #007bff' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'matches' ? 'bold' : 'normal'
              }}
            >
              本輪對戰
            </button>
            <button
              onClick={() => setActiveTab('scoreboard')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'scoreboard' ? '#007bff' : 'transparent',
                color: activeTab === 'scoreboard' ? 'white' : '#007bff',
                borderBottom: activeTab === 'scoreboard' ? '2px solid #007bff' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'scoreboard' ? 'bold' : 'normal'
              }}
            >
              計分榜
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'history' ? '#007bff' : 'transparent',
                color: activeTab === 'history' ? 'white' : '#007bff',
                borderBottom: activeTab === 'history' ? '2px solid #007bff' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'history' ? 'bold' : 'normal'
              }}
            >
              歷史紀錄
            </button>
          </div>
        </div>
      )}

      {/* 積分榜 */}
      {(!division.started || activeTab === 'scoreboard') && (
        <div style={{ marginBottom: '30px' }}>
          {division.started && division.records && division.records.length > 0 && (
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showTiebreakers}
                  onChange={(e) => setShowTiebreakers(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                顯示瑞士制細分排名
              </label>
              {showTiebreakers && (
                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                  (OMW%=對手勝率, GW%=遊戲勝率, OGW%=對手遊戲勝率)
                </span>
              )}
            </div>
          )}
          <Scoreboard 
            scores={scores} 
            onScoreUpdate={handleScoreUpdate}
            editable={true}
            tiebreakers={tiebreakers}
            showTiebreakers={showTiebreakers && tiebreakers.length > 0}
          />
        </div>
      )}

      {/* 開始比賽按鈕 */}
      {!division.started && division.players.length > 1 && (
        <button
          onClick={handleStart}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '30px'
          }}
        >
          開始比賽
        </button>
      )}

      {/* 比賽進行中 - 本輪對戰分頁 */}
      {division.started && !division.ended && activeTab === 'matches' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>本輪對戰</h2>
            <button
              onClick={() => setShowManualPairing(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重新編排對手
            </button>

          </div>

          <MatchList matches={division.matches} onAllResultsChange={handleAllResultsChange} />
          
          {division.byePlayers.length > 0 && (
            <div style={{ color: 'orange', marginTop: '10px', fontSize: '16px' }}>
              輪空：{division.byePlayers.map(p => p.name).join(', ')}
            </div>
          )}

          {/* 為每場比賽添加編輯對手按鈕 */}
          <div style={{ marginTop: '15px' }}>
            <h4>編輯對戰配對</h4>
            {division.matches.map((match, idx) => (
              <div key={match.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px',
                marginBottom: '5px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span>桌{idx + 1}：{match.players[0]?.name} vs {match.players[1]?.name}</span>
                <button
                  onClick={() => setEditingMatchPlayers({ matchId: match.id, players: match.players })}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  編輯對手
                </button>
              </div>
            ))}
          </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleNextRound}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              下一輪比賽
            </button>
            <button
              onClick={handleEndTournament}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              結束比賽
            </button>
          </div>
        </div>
      )}

      {/* 歷史紀錄分頁 */}
      {division.records.length > 0 && activeTab === 'history' && (
        <div style={{ marginBottom: '30px' }}>
          <h2>歷史紀錄</h2>
          {division.records.map((rec, roundIndex) => (
            <div key={roundIndex} style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>第{rec.round}輪</h4>
              {rec.matches.map((m: Match, i: number) => {
                const result = rec.results[m.id];
                const isEditing = editingHistoryMatch?.roundIndex === roundIndex && editingHistoryMatch?.matchId === m.id;
                
                let scoreStr = '';
                if (result) {
                  if (result.score === '1-1') scoreStr = '(1-1)';
                  else if (result.score === '0-0') scoreStr = '(0-0)';
                  else if (result.isTwoZero) scoreStr = '(2-0)';
                  else scoreStr = '(1-0)';
                }
                
                return (
                  <div key={m.id} style={{ 
                    marginBottom: '8px', 
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      桌{i + 1}：{m.players[0].name} vs {m.players[1].name} - 
                      {result?.winnerId
                        ? ` ${m.players.find(p => p.id === result.winnerId)?.name} 勝`
                        : ' 平手'}
                      {scoreStr}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editingHistoryValue}
                            onChange={(e) => setEditingHistoryValue(e.target.value)}
                            placeholder="如 2-0, 1-1"
                            style={{
                              width: '70px',
                              padding: '4px 6px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleHistoryResultUpdate(roundIndex, m.id, editingHistoryValue);
                                setEditingHistoryMatch(null);
                                setEditingHistoryValue('');
                              }
                              if (e.key === 'Escape') {
                                setEditingHistoryMatch(null);
                                setEditingHistoryValue('');
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              handleHistoryResultUpdate(roundIndex, m.id, editingHistoryValue);
                              setEditingHistoryMatch(null);
                              setEditingHistoryValue('');
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingHistoryMatch(null);
                              setEditingHistoryValue('');
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✗
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingHistoryMatch({ roundIndex, matchId: m.id });
                              setEditingHistoryValue(result?.score || '');
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            改分數
                          </button>
                          <button
                            onClick={() => setEditingMatchPlayers({ 
                              roundIndex, 
                              matchId: m.id, 
                              players: m.players 
                            })}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            改對手
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#856404'
          }}>
            💡 提示：修改歷史紀錄會自動重新計算所有玩家的當前積分
          </div>
        </div>
      )}

      {/* 最終排名 */}
      {division.ended && (
        <div>
          <h2>最終排名</h2>
          <ol>
            {division.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map(p => (
                <li key={p.id} style={{ marginBottom: '5px', fontSize: '16px' }}>
                  {p.name}：{p.score}分
                </li>
              ))}
          </ol>
        </div>
      )}

      {/* 手動配對 Modal */}
      {showManualPairing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>確定重新配對？</h3>
            <p>這會清除當前所有比賽結果，重新自動配對所有玩家。</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowManualPairing(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleManualPairing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                確定重新配對
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯對手 Modal */}
      {editingMatchPlayers && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%'
          }}>
            <h3>編輯對戰配對</h3>
            <p>當前配對：{editingMatchPlayers.players[0]?.name} vs {editingMatchPlayers.players[1]?.name}</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>玩家 1:</label>
              <select 
                value={editingMatchPlayers.players[0]?.id || ''}
                onChange={(e) => {
                  const selectedPlayer = division.players.find(p => p.id === e.target.value);
                  if (selectedPlayer) {
                    setEditingMatchPlayers({
                      ...editingMatchPlayers,
                      players: [selectedPlayer, editingMatchPlayers.players[1]]
                    });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">選擇玩家</option>
                {division.players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>玩家 2:</label>
              <select 
                value={editingMatchPlayers.players[1]?.id || ''}
                onChange={(e) => {
                  const selectedPlayer = division.players.find(p => p.id === e.target.value);
                  if (selectedPlayer) {
                    setEditingMatchPlayers({
                      ...editingMatchPlayers,
                      players: [editingMatchPlayers.players[0], selectedPlayer]
                    });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">選擇玩家</option>
                {division.players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingMatchPlayers(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (editingMatchPlayers.players[0] && editingMatchPlayers.players[1]) {
                    handleEditMatchPlayers(
                      editingMatchPlayers.matchId,
                      editingMatchPlayers.players,
                      editingMatchPlayers.roundIndex
                    );
                  }
                }}
                disabled={!editingMatchPlayers.players[0] || !editingMatchPlayers.players[1] || editingMatchPlayers.players[0].id === editingMatchPlayers.players[1].id}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (!editingMatchPlayers.players[0] || !editingMatchPlayers.players[1] || editingMatchPlayers.players[0].id === editingMatchPlayers.players[1].id) ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!editingMatchPlayers.players[0] || !editingMatchPlayers.players[1] || editingMatchPlayers.players[0].id === editingMatchPlayers.players[1].id) ? 'not-allowed' : 'pointer'
                }}
              >
                確定修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DivisionTournament;
