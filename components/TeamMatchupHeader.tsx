import React from 'react';
import TeamLogo from './TeamLogo';

interface Matchup {
  id: string;
  team1: string;
  team2: string;
}

interface TeamMatchupHeaderProps {
  matchups: Matchup[];
  className?: string;
}

const TeamMatchupHeader: React.FC<TeamMatchupHeaderProps> = ({ 
  matchups, 
  className = '' 
}) => {
  if (!matchups || matchups.length === 0) {
    return null;
  }

  return (
    <div className={`w-full bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-soft sticky top-0 z-20 ${className}`}>
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8">
          {matchups.map((matchup, index) => (
            <div key={matchup.id} className="flex items-center space-x-2 md:space-x-3">
              {/* Team 1 Logo */}
              <div className="flex flex-col items-center space-y-1">
                <TeamLogo teamName={matchup.team1} size="sm" className="shadow-medium" />
                <span className="text-xs font-semibold text-gray-900 text-center max-w-16 truncate">
                  {matchup.team1}
                </span>
              </div>

              {/* VS Separator */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-xs md:text-sm px-2 md:px-3 py-1 rounded-full shadow-soft">
                  VS
                </div>
              </div>

              {/* Team 2 Logo */}
              <div className="flex flex-col items-center space-y-1">
                <TeamLogo teamName={matchup.team2} size="sm" className="shadow-medium" />
                <span className="text-xs font-semibold text-gray-900 text-center max-w-16 truncate">
                  {matchup.team2}
                </span>
              </div>

              {/* Separator between matchups (except for the last one) */}
              {index < matchups.length - 1 && (
                <div className="hidden md:block w-px h-12 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamMatchupHeader; 