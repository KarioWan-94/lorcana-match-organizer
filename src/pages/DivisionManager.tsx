import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Division } from '../types';

const DivisionManager: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [newDivisionName, setNewDivisionName] = useState('');

  // 從 localStorage 載入分區數據
  useEffect(() => {
    const savedDivisions = localStorage.getItem('divisions');
    if (savedDivisions) {
      setDivisions(JSON.parse(savedDivisions));
    }
  }, []);

  // 保存分區數據到 localStorage
  useEffect(() => {
    localStorage.setItem('divisions', JSON.stringify(divisions));
  }, [divisions]);

  const handleCreateDivision = () => {
    if (newDivisionName.trim()) {
      const newDivision: Division = {
        id: Date.now().toString(),
        name: newDivisionName.trim(),
        players: [],
        matches: [],
        round: 1,
        started: false,
        ended: false,
        records: [],
        byePlayers: [],
        allResults: {}
      };
      setDivisions([...divisions, newDivision]);
      setNewDivisionName('');
    }
  };

  const handleDeleteDivision = (divisionId: string) => {
    if (window.confirm('確定要刪除這個分區嗎？這個操作無法撤銷。')) {
      setDivisions(divisions.filter(d => d.id !== divisionId));
    }
  };

  const getDivisionStatus = (division: Division) => {
    if (division.ended) return '已結束';
    if (division.started) return `進行中 (第${division.round}輪)`;
    return '未開始';
  };

  const getDivisionStatusColor = (division: Division) => {
    if (division.ended) return '#28a745';
    if (division.started) return '#007bff';
    return '#6c757d';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Disney Lorcana 比賽分區管理</h1>
      
      {/* 創建新分區 */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3>創建新分區</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            placeholder="輸入分區名稱 (例如: 比賽日子，A組, B組等)"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateDivision()}
          />
          <button
            onClick={handleCreateDivision}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            創建分區
          </button>
        </div>
      </div>

      {/* 分區列表 */}
      <div>
        <h3>現有分區</h3>
        {divisions.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
            還沒有創建任何分區。請先創建一個分區開始比賽。
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {divisions.map(division => (
              <div
                key={division.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
                      {division.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '20px', color: '#6c757d' }}>
                      <span>玩家數量: {division.players.length}</span>
                      <span 
                        style={{ 
                          color: getDivisionStatusColor(division),
                          fontWeight: 'bold'
                        }}
                      >
                        狀態: {getDivisionStatus(division)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link
                      to={`/division/${division.id}`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      進入比賽
                    </Link>
                    <button
                      onClick={() => handleDeleteDivision(division.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用說明 */}
      <div style={{ 
        background: '#e7f3ff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '30px',
        border: '1px solid #b3d7ff'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>使用說明：</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0056b3' }}>
          <li>每個分區都是獨立的比賽環境</li>
          <li>可以為不同級別或組別的玩家創建不同分區</li>
          <li>每個分區的比賽進度和記錄都會分別保存</li>
          <li>點擊「進入比賽」開始該分區的比賽管理</li>
        </ul>
      </div>
    </div>
  );
};

export default DivisionManager;
