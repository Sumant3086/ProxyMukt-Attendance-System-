export default function GlassCard({ children, className = '', hover = true, glow = false }) {
  return (
    <div
      className={`
        backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 
        border border-white/30 dark:border-gray-700/50
        rounded-2xl shadow-2xl
        relative overflow-hidden
        ${hover ? 'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300' : ''}
        ${glow ? 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]' : ''}
        ${className}
      `}
    >
      {/* Shimmer Effect on Hover */}
      {hover && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full opacity-50 pointer-events-none" />
    </div>
  );
}
