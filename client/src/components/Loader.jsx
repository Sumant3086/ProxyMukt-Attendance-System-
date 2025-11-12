export default function Loader({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className="flex flex-col justify-center items-center space-y-3">
      <div className="relative">
        {/* Outer Ring */}
        <div
          className={`${sizeClasses[size]} border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-spin`}
          style={{ borderTopColor: 'transparent' }}
        />
        
        {/* Inner Ring */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-purple-600 rounded-full animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse" />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
