import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { makeAuthenticatedRequest } from '../utils/api';
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";

const MigrationBanner: React.FC = () => {
  const { user, userProfile, userLeagues, fetchUserLeagues } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Don't show if user already has a profile or no user
  if (!user || userProfile || userLeagues.length > 0) {
    return null;
  }

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('idle');

    try {
      const response = await makeAuthenticatedRequest('/api/migrateUser', {
        method: 'POST',
      });

      if (response.ok) {
        setMigrationStatus('success');
        // Refresh user data
        await fetchUserLeagues();
        // Hide banner after a delay
        setTimeout(() => {
          setMigrationStatus('idle');
        }, 3000);
      } else {
        setMigrationStatus('error');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
    } finally {
      setIsMigrating(false);
    }
  };

  if (migrationStatus === 'success') {
    return (
      <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <LucideIcons.CheckCircle className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-medium text-emerald-400">Migration Complete!</h3>
            <p className="text-sm text-emerald-300">Your account has been successfully updated to support multiple leagues.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <LucideIcons.Info className="h-5 w-5 text-blue-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-400 mb-1">New Multi-League Feature Available!</h3>
          <p className="text-sm text-blue-300 mb-3">
            We&apos;ve added support for joining multiple leagues! Click below to migrate your account and unlock this new feature.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={handleMigration}
              disabled={isMigrating}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {isMigrating ? (
                <>
                  <LucideIcons.Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Migrating...
                </>
              ) : (
                <>
                  <LucideIcons.ArrowRight className="h-4 w-4 mr-2" />
                  Migrate Now
                </>
              )}
            </Button>
            {migrationStatus === 'error' && (
              <p className="text-sm text-red-400 flex items-center">
                <LucideIcons.AlertCircle className="h-4 w-4 mr-1" />
                Migration failed. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationBanner; 