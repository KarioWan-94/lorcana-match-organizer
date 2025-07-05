import React, { useState } from 'react';
import { PlayerTiebreakers } from '../utils/scoring';

interface PlayerScore {
    name: string;
    score: number;
    id?: string;
}

interface ScoreboardProps {
    scores: PlayerScore[];
    onScoreUpdate?: (playerId: string, newScore: number) => void;
    editable?: boolean;
    tiebreakers?: PlayerTiebreakers[];
    showTiebreakers?: boolean;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ 
    scores, 
    onScoreUpdate, 
    editable = false, 
    tiebreakers = [],
    showTiebreakers = false 
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    // 如果有細分數據，使用細分排序；否則只按分數排序
    const sortedScores = showTiebreakers && tiebreakers.length > 0
        ? tiebreakers.map(tb => ({
            name: tb.playerName,
            score: tb.score,
            id: tb.playerId,
            tiebreaker: tb
          }))
        : [...scores].sort((a, b) => b.score - a.score);

    const handleEditStart = (player: PlayerScore) => {
        setEditingId(player.id || player.name);
        setEditValue(player.score.toString());
    };

    const handleEditSave = (playerId: string) => {
        const newScore = parseInt(editValue);
        if (!isNaN(newScore) && onScoreUpdate) {
            onScoreUpdate(playerId, newScore);
        }
        setEditingId(null);
        setEditValue('');
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    return (
        <div>
            <h2>積分榜</h2>
            {showTiebreakers && (
                <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#e7f3ff', 
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#004085'
                }}>
                    💡 排名根據瑞士制規則：分數 → 對手勝率(OMW%) → 遊戲勝率(GW%) → 對手遊戲勝率(OGW%)
                </div>
            )}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'left', 
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                排名
                            </th>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'left', 
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                玩家
                            </th>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                分數
                            </th>
                            {showTiebreakers && (
                                <>
                                    <th style={{ 
                                        padding: '8px', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #dee2e6',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}>
                                        對戰<br/>勝負
                                    </th>
                                    <th style={{ 
                                        padding: '8px', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #dee2e6',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}>
                                        OMW%
                                    </th>
                                    <th style={{ 
                                        padding: '8px', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #dee2e6',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}>
                                        GW%
                                    </th>
                                    <th style={{ 
                                        padding: '8px', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #dee2e6',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}>
                                        OGW%
                                    </th>
                                </>
                            )}
                            {editable && (
                                <th style={{ 
                                    padding: '12px', 
                                    textAlign: 'center', 
                                    borderBottom: '2px solid #dee2e6',
                                    fontWeight: 'bold'
                                }}>
                                    操作
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedScores.map((player, index) => {
                            const playerId = player.id || player.name;
                            const isEditing = editingId === playerId;
                            const tb = ('tiebreaker' in player) ? player.tiebreaker as PlayerTiebreakers : null;
                            
                            return (
                                <tr key={playerId} style={{ 
                                    borderBottom: index < sortedScores.length - 1 ? '1px solid #dee2e6' : 'none'
                                }}>
                                    <td style={{ 
                                        padding: '12px',
                                        fontWeight: index < 3 ? 'bold' : 'normal',
                                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'inherit'
                                    }}>
                                        {index + 1}
                                        {index === 0 && ' 🥇'}
                                        {index === 1 && ' 🥈'}
                                        {index === 2 && ' 🥉'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {player.name}
                                    </td>
                                    <td style={{ 
                                        padding: '12px', 
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '18px'
                                    }}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                style={{
                                                    width: '60px',
                                                    padding: '4px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    textAlign: 'center'
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') handleEditSave(playerId);
                                                    if (e.key === 'Escape') handleEditCancel();
                                                }}
                                                autoFocus
                                            />
                                        ) : (
                                            player.score
                                        )}
                                    </td>
                                    {showTiebreakers && tb && (
                                        <>
                                            <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {tb.matchWins}-{tb.matchLosses}
                                            </td>
                                            <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {(tb.opponentMatchWinPercentage * 100).toFixed(1)}%
                                            </td>
                                            <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {(tb.gameWinPercentage * 100).toFixed(1)}%
                                            </td>
                                            <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {(tb.opponentGameWinPercentage * 100).toFixed(1)}%
                                            </td>
                                        </>
                                    )}
                                    {showTiebreakers && !tb && (
                                        <>
                                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>-</td>
                                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>-</td>
                                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>-</td>
                                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>-</td>
                                        </>
                                    )}
                                    {editable && (
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditSave(playerId)}
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
                                                        onClick={handleEditCancel}
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
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditStart(player)}
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
                                                    修改
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Scoreboard;