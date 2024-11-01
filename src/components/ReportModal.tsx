import React from 'react';
import { X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReportOption {
  id: string;
  title: string;
  description: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reportType: string) => void;
  title: string;
  options: ReportOption[];
  generating: boolean;
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  title, 
  options,
  generating 
}: ReportModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button 
            onClick={onClose}
            disabled={generating}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={generating}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}