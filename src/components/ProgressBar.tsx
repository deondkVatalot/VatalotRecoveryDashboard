import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{progress}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}