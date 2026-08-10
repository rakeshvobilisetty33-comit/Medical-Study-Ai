import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading study contents...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Circular spinner */}
      <div className={`animate-spin rounded-full border-t-medical-500 border-r-transparent border-b-medical-500 border-l-transparent ${sizeClasses[size]} mb-4`} />
      {message && (
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 font-sans animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
