import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

interface LeagueSwitcherProps {
  className?: string;
}

const LeagueSwitcher: React.FC<LeagueSwitcherProps> = ({ className = "" }) => {
  const { userLeagues, currentLeague, currentMembership, switchLeague } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    const hasMultipleLeagues = userLeagues.length > 1;
    console.log('LeagueSwitcher Debug:', {
      userLeagues: userLeagues,
      currentLeague: currentLeague,
      hasMultipleLeagues: hasMultipleLeagues,
      userLeaguesLength: userLeagues.length,
      shouldRender: currentLeague && userLeagues.length > 0
    });
  }, [userLeagues, currentLeague]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if user has no leagues
  if (!currentLeague || userLeagues.length === 0) {
    console.log('LeagueSwitcher not rendering because:', {
      noCurrentLeague: !currentLeague,
      noLeagues: userLeagues.length === 0,
      userLeaguesLength: userLeagues.length
    });
    return null;
  }

  const hasMultipleLeagues = userLeagues.length > 1;

  const handleLeagueSwitch = async (leagueId: string) => {
    try {
      await switchLeague(leagueId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching league:', error);
      // You could add a toast notification here
    }
  };

  const getRoleIcon = (role: 'admin' | 'user') => {
    return role === 'admin' ? '👑' : '👤';
  };

  const getRoleBadgeVariant = (role: 'admin' | 'user') => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center space-x-2 px-3 py-2 h-auto bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{currentLeague.name}</span>
          <Badge variant={getRoleBadgeVariant(currentMembership?.role || 'user')} className="text-xs">
            {getRoleIcon(currentMembership?.role || 'user')} {currentMembership?.role || 'user'}
          </Badge>
        </div>
        <LucideIcons.ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
          <div className="p-2">
            <div className="text-xs text-slate-400 px-2 py-1 mb-1">
              {hasMultipleLeagues ? 'Your Leagues' : 'Current League'}
            </div>
            {userLeagues.map((membership) => (
              <button
                key={membership.leagueId}
                onClick={() => handleLeagueSwitch(membership.leagueId)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 flex items-center justify-between transition-colors ${
                  membership.leagueId === currentLeague.id ? 'bg-slate-700' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{membership.leagueName}</span>
                  <Badge variant={getRoleBadgeVariant(membership.role)} className="text-xs">
                    {getRoleIcon(membership.role)} {membership.role}
                  </Badge>
                </div>
                {membership.leagueId === currentLeague.id && (
                  <LucideIcons.Check className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-slate-700">
            <button 
              className="w-full text-left px-3 py-2 hover:bg-slate-700 text-emerald-400 text-sm flex items-center space-x-2"
              onClick={() => {
                setIsOpen(false);
                // Navigate to join league page or open join modal
                window.location.href = '/';
              }}
            >
              <LucideIcons.Plus className="w-4 h-4" />
              <span>Join New League</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueSwitcher; 