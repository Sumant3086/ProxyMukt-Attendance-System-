export default function GradientText({ children, className = '' }) {
  return (
    <span
      className={`
        bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
        bg-clip-text text-transparent
        animate-gradient
        ${className}
      `}
    >
      {children}
    </span>
  );
}
