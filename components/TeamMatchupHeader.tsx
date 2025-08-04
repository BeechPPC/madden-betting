import React, { useRef } from 'react';
import TeamLogo from './TeamLogo';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Matchup {
  id: string;
  team1: string;
  team2: string;
  team1Record?: string; // e.g., "12-5"
  team2Record?: string; // e.g., "8-9"
}

interface TeamMatchupHeaderProps {
  matchups: Matchup[];
  className?: string;
}

const TeamMatchupHeader: React.FC<TeamMatchupHeaderProps> = ({ 
  matchups, 
  className = '' 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!matchups || matchups.length === 0) {
    return null;
  }

  return (
    <div className={`hidden lg:block w-full bg-green-800 border-b border-green-700 shadow-lg ${className}`}>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="container mx-auto px-6 py-3 relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-start space-x-8 overflow-x-auto px-8 hide-scrollbar"
        >
          {matchups.map((matchup, index) => (
            <div key={matchup.id} className="flex items-center space-x-4 flex-shrink-0">
              {/* Team 1 */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamLogo teamName={matchup.team1} size="sm" className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm">
                    {matchup.team1}
                  </span>
                  {matchup.team1Record && (
                    <span className="text-gray-300 text-xs bg-white/10 px-2 py-1 rounded">
                      {matchup.team1Record}
                    </span>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="text-white font-bold text-sm px-2">
                vs
              </div>

              {/* Team 2 */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamLogo teamName={matchup.team2} size="sm" className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm">
                    {matchup.team2}
                  </span>
                  {matchup.team2Record && (
                    <span className="text-gray-300 text-xs bg-white/10 px-2 py-1 rounded">
                      {matchup.team2Record}
                    </span>
                  )}
                </div>
              </div>

              {/* Separator between matchups (except for the last one) */}
              {index < matchups.length - 1 && (
                <div className="w-px h-8 bg-white/20 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamMatchupHeader; 