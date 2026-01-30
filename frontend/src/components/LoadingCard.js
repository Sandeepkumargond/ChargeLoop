'use client';

export default function LoadingCard({
  variant = 'card',
  title = 'Please wait',
  description = 'Loading data...'
}) {
  if (variant === 'card') {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-col items-center justify-center space-y-4">
          {}
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 h-12 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
