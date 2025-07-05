import React from 'react';
import { Match } from '../types';

interface Props {
  matches: Match[];
  onAllResultsChange: (results: { [matchId: string]: { winnerId: string; loserId: string; isTwoZero: boolean; score: string } }) => void;
}

const parseScore = (score: string | undefined, players: { id: string }[]) => {
  if (!score) return null; // <--- 防呆
  const [a, b] = score.split('-').map(Number);
  if (isNaN(a) || isNaN(b)) return null;
  if (a === b) return { winnerId: '', loserId: '', isTwoZero: false }; // 平手
  const winnerId = a > b ? players[0].id : players[1].id;
  const loserId = a > b ? players[1].id : players[0].id;
  const isTwoZero = a === 2 || b === 2;
  return { winnerId, loserId, isTwoZero };
};

const MatchList: React.FC<Props> = ({ matches, onAllResultsChange }) => {
  const [inputs, setInputs] = React.useState<{ [key: string]: string }>({});
  const [confirmedResults, setConfirmedResults] = React.useState<{ [key: string]: boolean }>({});

  // 每次 inputs 或 confirmedResults 有變就通知 parent
  React.useEffect(() => {
    const allResults: {
      [matchId: string]: {
        winnerId: string;
        loserId: string;
        isTwoZero: boolean;
        score: string;
      }
    } = {};
    
    matches.forEach(match => {
      // 只有確定咗嘅結果先會包含在 allResults
      if (confirmedResults[match.id] && inputs[match.id]) {
        const res = parseScore(inputs[match.id], match.players);
        if (res) allResults[match.id] = { ...res, score: inputs[match.id] || '' };
      }
    });
    
    // 使用 setTimeout 確保狀態更新完成後再通知 parent
    const timeoutId = setTimeout(() => {
      onAllResultsChange(allResults);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [inputs, matches, onAllResultsChange, confirmedResults]);

  const handleConfirmResult = (matchId: string) => {
    if (inputs[matchId] && inputs[matchId].trim() !== '') {
      setConfirmedResults(prev => {
        const newState = { ...prev, [matchId]: true };
        // 確保狀態更新後立即通知 parent
        setTimeout(() => {
          const allResults: {
            [matchId: string]: {
              winnerId: string;
              loserId: string;
              isTwoZero: boolean;
              score: string;
            }
          } = {};
          
          matches.forEach(match => {
            if (newState[match.id] && inputs[match.id]) {
              const res = parseScore(inputs[match.id], match.players);
              if (res) allResults[match.id] = { ...res, score: inputs[match.id] || '' };
            }
          });
          
          onAllResultsChange(allResults);
        }, 10);
        
        return newState;
      });
    }
  };

  const handleEditResult = (matchId: string) => {
    setConfirmedResults(prev => ({ ...prev, [matchId]: false }));
  };

  const handleScoreChange = (matchId: string, value: string) => {
    if (!confirmedResults[matchId]) {
      setInputs({ ...inputs, [matchId]: value });
    }
  };

  return (
    <div>
      {matches.filter(match => match.players.length === 2).map((match, idx) => {
        const isConfirmed = confirmedResults[match.id];
        const hasResult = inputs[match.id] && inputs[match.id].trim() !== '';
        
        return (
          <div key={match.id} style={{ 
            marginBottom: 16, 
            border: '1px solid #ccc', 
            padding: 12,
            borderRadius: '8px',
            backgroundColor: isConfirmed ? '#f0f8f0' : 'white'
          }}>
            <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>
              桌{idx + 1}：{match.players[0].name} vs {match.players[1].name}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="如 2-0, 1-1"
                value={inputs[match.id] || ''}
                onChange={e => handleScoreChange(match.id, e.target.value)}
                disabled={isConfirmed}
                style={{ 
                  width: 80, 
                  padding: '6px 8px',
                  border: isConfirmed ? '1px solid #28a745' : '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isConfirmed ? '#e8f5e8' : 'white',
                  color: isConfirmed ? '#155724' : 'inherit'
                }}
              />
              
              {!isConfirmed ? (
                <button
                  onClick={() => handleConfirmResult(match.id)}
                  disabled={!hasResult}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: hasResult ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: hasResult ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  確定
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ 
                    color: '#28a745', 
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ✓ 已確定
                  </span>
                  <button
                    onClick={() => handleEditResult(match.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    修改
                  </button>
                </div>
              )}
            </div>
            
            {isConfirmed && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#6c757d',
                fontStyle: 'italic' 
              }}>
                結果已鎖定，防止意外更改
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MatchList;