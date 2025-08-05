import React, { useState, useEffect, useCallback } from 'react';
import TeamLogo from './TeamLogo';
import { generateMatchupDescription } from '../utils/api';

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
  isPremium?: boolean;
}

const MatchupCard: React.FC<MatchupCardProps> = ({ matchup, selectedTeam, onTeamSelect, isPremium = false }) => {
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);

  const generateDescription = useCallback(async () => {
    if (!isPremium) return;
    
    setIsLoadingDescription(true);
    try {
      const description = await generateMatchupDescription(
        matchup.team1,
        matchup.team1_record,
        matchup.team2,
        matchup.team2_record
      );
      setAiDescription(description);
    } catch (error) {
      console.error('Error generating AI description:', error);
      setAiDescription('Exciting matchup ahead!');
    } finally {
      setIsLoadingDescription(false);
    }
  }, [isPremium, matchup.team1, matchup.team1_record, matchup.team2, matchup.team2_record]);

  useEffect(() => {
    if (isPremium) {
      generateDescription();
    }
  }, [isPremium, generateDescription]);

  return (
    <div className="relative group">
      {/* Enhanced card container with better gradients and effects */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/40 backdrop-blur-sm rounded-3xl shadow-soft border border-white/40 hover:shadow-large transition-all duration-500 hover:scale-[1.02] hover:border-primary-200/50">
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Header section with improved styling */}
        <div className="relative p-6 pb-4">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200/50 rounded-2xl shadow-soft">
              <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                🏈 Pick Your Winner
              </span>
            </div>
          </div>
          
          {/* AI Description for Premium Users */}
          {isPremium && (
            <div className="mt-4 text-center">
              {isLoadingDescription ? (
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 rounded-xl">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500 mr-2"></div>
                  <span className="text-xs font-medium text-purple-700">AI analyzing matchup...</span>
                </div>
              ) : aiDescription ? (
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 rounded-xl shadow-soft">
                  <span className="text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    🤖 {aiDescription}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Teams section with enhanced layout */}
        <div className="relative px-6 pb-6 space-y-4">
          
          {/* Team 1 - Enhanced styling */}
          <label className={`relative block group/team cursor-pointer transition-all duration-300 ${
            selectedTeam === matchup.team1 
              ? 'transform scale-[1.02]' 
              : 'hover:scale-[1.01]'
          }`}>
            <input
              type="radio"
              name={`matchup-${matchup.id}`}
              value={matchup.team1}
              checked={selectedTeam === matchup.team1}
              onChange={() => onTeamSelect(matchup.team1)}
              className="sr-only"
            />
            
            <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              selectedTeam === matchup.team1
                ? 'bg-gradient-to-r from-primary-50 via-primary-100/80 to-accent-50 border-primary-300 shadow-medium'
                : 'bg-gradient-to-r from-white to-gray-50/80 border-gray-200/60 hover:border-primary-200 hover:shadow-medium'
            }`}>
              
              {/* Selection indicator overlay */}
              {selectedTeam === matchup.team1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 animate-pulse"></div>
              )}
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Enhanced team logo container */}
                    <div className={`relative ${selectedTeam === matchup.team1 ? 'animate-bounce-in' : ''}`}>
                      <TeamLogo teamName={matchup.team1} size="lg" />
                      {selectedTeam === matchup.team1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-success-500 to-success-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-soft animate-glow">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced team info */}
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg transition-colors duration-300 ${
                        selectedTeam === matchup.team1 
                          ? 'text-primary-900' 
                          : 'text-gray-900'
                      }`}>
                        {matchup.team1}
                      </h3>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        selectedTeam === matchup.team1 
                          ? 'text-primary-700' 
                          : 'text-gray-600'
                      }`}>
                        {matchup.team1_record}
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced selection indicator */}
                  {selectedTeam === matchup.team1 && (
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-full shadow-soft animate-bounce-in">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </label>

          {/* Enhanced VS divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
            <div className="relative bg-gradient-to-r from-primary-50 to-accent-50 px-6 py-2 rounded-2xl border border-primary-200/50 shadow-soft">
              <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                VS
              </span>
            </div>
          </div>

          {/* Team 2 - Enhanced styling */}
          <label className={`relative block group/team cursor-pointer transition-all duration-300 ${
            selectedTeam === matchup.team2 
              ? 'transform scale-[1.02]' 
              : 'hover:scale-[1.01]'
          }`}>
            <input
              type="radio"
              name={`matchup-${matchup.id}`}
              value={matchup.team2}
              checked={selectedTeam === matchup.team2}
              onChange={() => onTeamSelect(matchup.team2)}
              className="sr-only"
            />
            
            <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              selectedTeam === matchup.team2
                ? 'bg-gradient-to-r from-primary-50 via-primary-100/80 to-accent-50 border-primary-300 shadow-medium'
                : 'bg-gradient-to-r from-white to-gray-50/80 border-gray-200/60 hover:border-primary-200 hover:shadow-medium'
            }`}>
              
              {/* Selection indicator overlay */}
              {selectedTeam === matchup.team2 && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 animate-pulse"></div>
              )}
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Enhanced team logo container */}
                    <div className={`relative ${selectedTeam === matchup.team2 ? 'animate-bounce-in' : ''}`}>
                      <TeamLogo teamName={matchup.team2} size="lg" />
                      {selectedTeam === matchup.team2 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-success-500 to-success-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-soft animate-glow">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced team info */}
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg transition-colors duration-300 ${
                        selectedTeam === matchup.team2 
                          ? 'text-primary-900' 
                          : 'text-gray-900'
                      }`}>
                        {matchup.team2}
                      </h3>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        selectedTeam === matchup.team2 
                          ? 'text-primary-700' 
                          : 'text-gray-600'
                      }`}>
                        {matchup.team2_record}
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced selection indicator */}
                  {selectedTeam === matchup.team2 && (
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-full shadow-soft animate-bounce-in">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Enhanced selection confirmation */}
        {selectedTeam && (
          <div className="relative mx-6 mb-6">
            <div className="relative overflow-hidden bg-gradient-to-r from-success-50 via-success-100/80 to-emerald-50 border border-success-200/80 rounded-2xl shadow-soft">
              
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-success-500/5 to-emerald-500/5 animate-pulse"></div>
              
              <div className="relative p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <TeamLogo teamName={selectedTeam} size="md" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-success-500 to-success-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-soft animate-glow">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-success-900 text-sm">
                      <span className="bg-gradient-to-r from-success-700 to-emerald-700 bg-clip-text text-transparent">
                        {selectedTeam}
                      </span>
                    </p>
                    <p className="text-xs text-success-700 font-medium">Your pick - Good luck! 🍀</p>
                  </div>
                  <div className="text-2xl">🏈</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchupCard; 