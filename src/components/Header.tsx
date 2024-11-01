import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Bell, 
  Grid, 
  Settings,
  Moon,
  Sun,
  Maximize,
  User,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';
import SupportForm from './SupportForm';

export default function Header() {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showSupportForm, setShowSupportForm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = async () => {
    try {
      const newTheme = isDark ? 'light' : 'dark';
      
      // Update database
      const { error } = await supabase
        .from('users')
        .update({ 
          theme: newTheme,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update DOM
      document.documentElement.classList.remove(isDark ? 'dark' : 'light');
      document.documentElement.classList.add(newTheme);
      
      // Update local state
      setIsDark(!isDark);
      
      // Update auth store
      if (user) {
        updateUser(user.id, { ...user, theme: newTheme });
      }

    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme preference');
      
      // Revert changes on error
      document.documentElement.classList.remove(isDark ? 'light' : 'dark');
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="h-16 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://vatalot.com/wp-content/uploads/2024/09/Vatalot-transparent-2022-Dark.png"
              alt="Vatalot"
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user?.firstName?.[0]}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium">Welcome!</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings/account');
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSupportForm(true);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Support
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SupportForm 
        isOpen={showSupportForm} 
        onClose={() => setShowSupportForm(false)} 
      />
    </>
  );
}