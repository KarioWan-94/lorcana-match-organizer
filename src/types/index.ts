export interface Player {
    id: string;
    name: string;
    score: number;
}

export interface Match {
    id: string;
    players: Player[];
    winner?: Player;
    status: 'ongoing' | 'completed';
    history?: string[]; // 新增
}

export interface Score {
    playerId: string;
    points: number;
}

export interface Division {
    id: string;
    name: string;
    players: Player[];
    matches: Match[];
    round: number;
    started: boolean;
    ended: boolean;
    records: any[];
    byePlayers: Player[];
    allResults: { [matchId: string]: { winnerId: string; loserId: string; isTwoZero: boolean; score?: string } };
}