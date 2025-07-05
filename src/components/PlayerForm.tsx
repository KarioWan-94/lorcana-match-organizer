import React, { useState } from 'react';

const PlayerForm: React.FC<{ onAddPlayer: (name: string) => void }> = ({ onAddPlayer }) => {
    const [playerName, setPlayerName] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (playerName.trim()) {
            onAddPlayer(playerName.trim());
            setPlayerName('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
                required
            />
            <button type="submit">Add Player</button>
        </form>
    );
};

export default PlayerForm;