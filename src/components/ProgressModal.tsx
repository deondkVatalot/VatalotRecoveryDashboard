import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressModalProps {
  progress: number;
  message: string;
}

export default function ProgressModal({ progress, message }: ProgressModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-center text-gray-700 dark:text-gray-200">{message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {progress}% Complete
          </p>
        </div>
      </div>
    </div>
  );
}