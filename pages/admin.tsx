import { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import AdminPanel from '../components/AdminPanel';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Simple admin check - you can enhance this with proper admin roles
  const checkAdminStatus = () => {
    // For now, let's allow any authenticated user to access admin
    // In production, you'd want to check against a list of admin emails or roles
    return user && (user.email?.includes('admin') || user.email?.includes('chris'));
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Check if user is admin
  if (!isAdmin && !checkAdminStatus()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <button
            onClick={() => setIsAdmin(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Override (for testing)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin Panel - Madden CFM Betting</title>
        <meta name="description" content="Admin panel for managing Madden CFM betting results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-lg text-gray-600">
            Manage matchups, mark winners, and update leaderboard
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              Logged in as: {user.displayName || user.email}
            </span>
          </div>
        </div>

        {/* Admin Panel */}
        <AdminPanel />
      </main>
    </div>
  );
} 