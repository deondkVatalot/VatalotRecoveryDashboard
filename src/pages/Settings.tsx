import React, { useState, useEffect } from 'react';
import { Save, Sun, Moon, Layout, Type, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';

const FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px'
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'zu', name: 'Zulu' },
  { code: 'xh', name: 'Xhosa' }
];

const LAYOUTS = {
  comfortable: { spacing: 'loose', padding: 'large' },
  compact: { spacing: 'tight', padding: 'small' },
  default: { spacing: 'normal', padding: 'medium' }
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.theme || 'light');
  const [fontSize, setFontSize] = useState(user?.settings?.fontSize || 'medium');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.settings?.language || 'en');
  const [layout, setLayout] = useState(user?.settings?.layout || 'default');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.settings) {
          setFontSize(data.settings.fontSize || 'medium');
          setSelectedLanguage(data.settings.language || 'en');
          setLayout(data.settings.layout || 'default');
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        toast.error(t('common.error'));
      } finally {
        setInitialLoad(false);
      }
    };

    loadUserSettings();
  }, [user?.id, t]);

  useEffect(() => {
    if (initialLoad) return;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    document.documentElement.style.fontSize = FONT_SIZES[fontSize as keyof typeof FONT_SIZES];

    const layoutSettings = LAYOUTS[layout as keyof typeof LAYOUTS];
    document.documentElement.style.setProperty('--spacing', layoutSettings.spacing);
    document.documentElement.style.setProperty('--padding', layoutSettings.padding);

  }, [theme, fontSize, layout, initialLoad]);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          email,
          company,
          theme,
          settings: {
            fontSize,
            language: selectedLanguage,
            layout
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      updateUser(user.id, {
        firstName,
        lastName,
        email,
        company,
        theme,
        settings: {
          fontSize,
          language: selectedLanguage,
          layout
        }
      });

      // Change language only after successful save
      await i18n.changeLanguage(selectedLanguage);
      
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Error saving settings:', error);
      // Revert language selection on error
      setSelectedLanguage(i18n.language);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
        >
          <Save className="w-4 h-4" />
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('settings.profile.firstName')}
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('settings.profile.lastName')}
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('settings.profile.company')}
            </label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.appearance')}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('settings.theme')}
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'light'
                    ? 'bg-[#214866] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                {t('settings.light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#214866] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                {t('settings.dark')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('settings.fontSize')}
            </label>
            <div className="flex gap-4">
              {Object.keys(FONT_SIZES).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    fontSize === size
                      ? 'bg-[#214866] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  {t(`settings.${size}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('settings.layout')}
            </label>
            <div className="flex gap-4">
              {Object.keys(LAYOUTS).map((layoutOption) => (
                <button
                  key={layoutOption}
                  onClick={() => setLayout(layoutOption)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    layout === layoutOption
                      ? 'bg-[#214866] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  {t(`settings.${layoutOption}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('settings.language')}
            </label>
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}