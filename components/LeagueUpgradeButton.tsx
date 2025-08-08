import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createPaymentIntent } from '../utils/api';
import { Button } from './ui/button';
import * as LucideIcons from 'lucide-react';

interface LeagueUpgradeButtonProps {
  leagueId: string;
  leagueName: string;
  className?: string;
}

const LeagueUpgradeButton: React.FC<LeagueUpgradeButtonProps> = ({ 
  leagueId, 
  leagueName, 
  className = '' 
}) => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user || !isAdmin) {
      setError('Only league admins can upgrade leagues');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent(leagueId);
      
      // For now, we'll just show a success message
      // In a real implementation, you'd integrate with Stripe Elements
      console.log('Payment intent created:', { clientSecret, paymentIntentId });
      
      // Show success message
      alert(`Payment intent created for ${leagueName}. Payment ID: ${paymentIntentId}`);
      
      // Refresh the page to show updated status
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Only show to admins
  }

  return (
    <div className={className}>
      <Button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <LucideIcons.Crown className="h-4 w-4 mr-2" />
            Upgrade League - $4.99
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
      
      <p className="text-slate-400 text-xs mt-2">
        Unlock AI matchup descriptions and premium features
      </p>
    </div>
  );
};

export default LeagueUpgradeButton; 