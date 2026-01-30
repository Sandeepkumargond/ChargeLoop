'use client';

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  message = 'Loading...',
  showMessage = true
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        {}
        <div className="absolute inset-0 rounded-full border-4 border-neutral-200 dark:border-neutral-700"></div>

        {}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 dark:border-t-blue-400 dark:border-r-blue-400 animate-spin"></div>
      </div>

      {showMessage && (
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
