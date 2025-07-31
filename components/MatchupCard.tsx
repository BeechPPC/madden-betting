import React from 'react';
import TeamLogo from './TeamLogo';

interface Matchup {
  id: string;
  week: number;
  team1: string;
  team1_record: string;
  team2: string;
  team2_record: string;
}

interface MatchupCardProps {
  matchup: Matchup;
  selectedTeam: string | undefined;
  onTeamSelect: (team: string) => void;
}

const MatchupCard: React.FC<MatchupCardProps> = ({ matchup, selectedTeam, onTeamSelect }) => {
  return (
    <div className="card-sport p-6 hover:shadow-large transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">🏆</span>
          Week {matchup.week}
        </h3>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Pick your winner
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Team 1 */}
        <label className={`team-card p-4 ${selectedTeam === matchup.team1 ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`matchup-${matchup.id}`}
            value={matchup.team1}
            checked={selectedTeam === matchup.team1}
            onChange={() => onTeamSelect(matchup.team1)}
            className="sr-only"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TeamLogo teamName={matchup.team1} size="md" />
              <div>
                <span className="font-bold text-gray-900 text-lg">{matchup.team1}</span>
                <p className="text-sm text-gray-500">Record: {matchup.team1_record}</p>
              </div>
            </div>
            {selectedTeam === matchup.team1 && (
              <div className="pick-indicator">
                ✓
              </div>
            )}
          </div>
        </label>

        {/* VS Divider */}
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        {/* Team 2 */}
        <label className={`team-card p-4 ${selectedTeam === matchup.team2 ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`matchup-${matchup.id}`}
            value={matchup.team2}
            checked={selectedTeam === matchup.team2}
            onChange={() => onTeamSelect(matchup.team2)}
            className="sr-only"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TeamLogo teamName={matchup.team2} size="md" />
              <div>
                <span className="font-bold text-gray-900 text-lg">{matchup.team2}</span>
                <p className="text-sm text-gray-500">Record: {matchup.team2_record}</p>
              </div>
            </div>
            {selectedTeam === matchup.team2 && (
              <div className="pick-indicator">
                ✓
              </div>
            )}
          </div>
        </label>
      </div>

      {selectedTeam && (
        <div className="mt-6 p-4 bg-gradient-to-r from-success-50 to-success-100/80 border border-success-200 rounded-xl">
          <div className="flex items-center">
            <div className="flex items-center mr-3">
              <TeamLogo teamName={selectedTeam} size="sm" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-success-500 to-success-600 flex items-center justify-center text-white font-bold text-xs ml-2">
                ✓
              </div>
            </div>
            <div>
              <p className="font-semibold text-success-800">
                Your pick: <span className="text-success-900">{selectedTeam}</span>
              </p>
              <p className="text-sm text-success-700">Good luck!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchupCard; 