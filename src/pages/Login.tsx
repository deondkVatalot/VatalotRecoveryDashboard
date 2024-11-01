import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <img
            src="https://vatalot.com/wp-content/uploads/2024/09/Vatalot-transparent-2022-Dark.png"
            alt="Vatalot"
            className="mx-auto h-12"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t('auth.signIn')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors duration-200"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? t('auth.signingIn') : t('auth.signInButton')}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t('auth.demoCredentials')}:</p>
          <p>Admin: admin@vatalot.com / Vatalot2024</p>
          <p>User: user@vatalot.com / VatalotUser2024</p>
        </div>
      </div>
    </div>
  );
}