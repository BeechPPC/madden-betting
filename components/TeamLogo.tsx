import React from 'react';
import { getTeamLogoUrl, getTeamAbbreviation } from '../utils/teamLogos';

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ teamName, size = 'md', className = '' }) => {
  const logoUrl = getTeamLogoUrl(teamName);
  const abbreviation = getTeamAbbreviation(teamName) || teamName.charAt(0);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={(e) => {
          // Fallback to abbreviation if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
    );
  }

  // Fallback to abbreviation if no logo URL
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold ${textSizes[size]} shadow-soft ${className}`}
      title={teamName}
    >
      {abbreviation}
    </div>
  );
};

export default TeamLogo; 