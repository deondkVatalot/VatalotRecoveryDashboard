import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const { isAuthenticated, user } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user?.theme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(user.theme);
    }
  }, [user?.theme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex pt-16">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed left-[3.5rem] top-20 z-20 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700"
          style={{ left: isSidebarCollapsed ? '3.5rem' : '15.5rem' }}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <main 
          className="flex-1 p-8 transition-all duration-300"
          style={{ 
            marginLeft: isSidebarCollapsed ? '64px' : '256px'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}