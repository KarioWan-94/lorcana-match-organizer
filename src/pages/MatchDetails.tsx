import React from 'react';
import { useParams } from 'react-router-dom';
import { Player, Match } from '../types';
import { getMatchDetails } from '../utils/scoring';

const MatchDetails: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const [match, setMatch] = React.useState<Match | null>(null);

    React.useEffect(() => {
        const fetchMatchDetails = async () => {
            const matchDetails = await getMatchDetails(matchId);
            // Ensure status is of the correct type
            setMatch({
                ...matchDetails,
                status: matchDetails.status === "completed" ? "completed" : "ongoing"
            });
        };

        fetchMatchDetails();
    }, [matchId]);

    if (!match) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Match Details</h1>
            <h2>Players</h2>
            <ul>
                {match.players.map((player: Player) => (
                    <li key={player.id}>
                        {player.name}: {player.score}
                    </li>
                ))}
            </ul>
            <h2>Match History</h2>
            <ul>
                {(match.history ?? []).map((entry, index) => (
                    <li key={index}>{entry}</li>
                ))}
            </ul>
        </div>
    );
};

export default MatchDetails;