import { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import RoleSelection from '../components/RoleSelection';
import AdminPanel from '../components/AdminPanel';
import * as LucideIcons from "lucide-react";

export default function AdminPage() {
  const { user, userRole, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show role selection if user is authenticated but doesn't have a role
  if (user && !userRole) {
    return <RoleSelection />;
  }

  // Check if user is admin
  if (userRole?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md mx-4">
            <LucideIcons.ShieldX className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-300 mb-4">You don&apos;t have permission to access the admin panel.</p>
            <p className="text-sm text-slate-400">Only league admins can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Admin Panel - Madden CFM Betting</title>
        <meta name="description" content="Admin panel for managing Madden CFM betting results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LucideIcons.Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
            <span className="text-lg sm:text-xl font-bold text-white">ClutchPicks</span>
            <span className="text-sm text-emerald-400 font-medium">Admin</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium text-slate-300 hidden sm:block">
                {user.displayName || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <LucideIcons.Settings className="h-8 w-8 text-emerald-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Admin Panel
              </h1>
            </div>
            <p className="text-lg text-slate-300 max-w-2xl">
              Manage matchups, mark winners, and update leaderboard for your CFM league
            </p>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <LucideIcons.Shield className="h-4 w-4" />
              <span>League Admin Access</span>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        <AdminPanel />
      </main>
    </div>
  );
} 