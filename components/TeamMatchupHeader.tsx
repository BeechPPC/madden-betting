import React from 'react';
import TeamLogo from './TeamLogo';
import * as LucideIcons from "lucide-react";

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
  if (!matchups || matchups.length === 0) {
    return null;
  }

  return (
    <div className={`w-full bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl shadow-black/20 sticky top-0 z-20 ${className}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-4">
        {/* Single Row Layout - Desktop and Mobile */}
        <div className="flex items-center justify-start md:justify-center space-x-6 md:space-x-8 lg:space-x-10 xl:space-x-12 overflow-x-auto scrollbar-hide">
          {matchups.map((matchup, index) => (
            <div key={matchup.id} className="flex items-center space-x-4 md:space-x-5 lg:space-x-6 flex-shrink-0 group">
              {/* Team 1 */}
              <div className="flex flex-col items-center space-y-2 group/team">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-600/50 flex items-center justify-center shadow-xl group-hover/team:shadow-2xl group-hover/team:shadow-emerald-500/30 transition-all duration-500 group-hover/team:scale-110 group-hover/team:border-emerald-500/50">
                    <TeamLogo teamName={matchup.team1} size="md" className="shadow-lg" />
                  </div>
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-lg group-hover/team:blur-xl transition-all duration-500 opacity-0 group-hover/team:opacity-100"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-md opacity-0 group-hover/team:opacity-100 transition-all duration-500"></div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm md:text-base lg:text-lg font-bold text-white group-hover/team:text-emerald-300 transition-all duration-300 max-w-20 md:max-w-24 lg:max-w-28 truncate">
                    {matchup.team1}
                  </h3>
                  {matchup.team1Record && (
                    <div className="flex items-center justify-center space-x-1.5">
                      <div className="p-1 bg-emerald-500/20 rounded-full">
                        <LucideIcons.Trophy className="h-3 w-3 md:h-4 md:w-4 text-emerald-400" />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded-full">
                        {matchup.team1Record}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Separator */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 text-white font-bold text-sm md:text-base lg:text-lg px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 rounded-full shadow-xl shadow-emerald-500/25 border border-emerald-500/30 group-hover:scale-105 transition-all duration-300">
                    VS
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-blue-400/30 to-emerald-400/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </div>
                <div className="text-xs text-slate-400 font-medium bg-slate-800/30 px-2 py-1 rounded-full">
                  Game {index + 1}
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center space-y-2 group/team">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-600/50 flex items-center justify-center shadow-xl group-hover/team:shadow-2xl group-hover/team:shadow-blue-500/30 transition-all duration-500 group-hover/team:scale-110 group-hover/team:border-blue-500/50">
                    <TeamLogo teamName={matchup.team2} size="md" className="shadow-lg" />
                  </div>
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg group-hover/team:blur-xl transition-all duration-500 opacity-0 group-hover/team:opacity-100"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-full blur-md opacity-0 group-hover/team:opacity-100 transition-all duration-500"></div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm md:text-base lg:text-lg font-bold text-white group-hover/team:text-blue-300 transition-all duration-300 max-w-20 md:max-w-24 lg:max-w-28 truncate">
                    {matchup.team2}
                  </h3>
                  {matchup.team2Record && (
                    <div className="flex items-center justify-center space-x-1.5">
                      <div className="p-1 bg-blue-500/20 rounded-full">
                        <LucideIcons.Trophy className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded-full">
                        {matchup.team2Record}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Separator between matchups (except for the last one) */}
              {index < matchups.length - 1 && (
                <div className="relative">
                  <div className="w-px h-16 md:h-20 lg:h-24 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent mx-2 md:mx-3 lg:mx-4"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-600/50 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Mobile scroll indicator */}
        <div className="md:hidden flex justify-center mt-3">
          <div className="flex space-x-1.5">
            {matchups.map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-slate-600/50 animate-pulse"
                style={{ animationDelay: `${index * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMatchupHeader; 