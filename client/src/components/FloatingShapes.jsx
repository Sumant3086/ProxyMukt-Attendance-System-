import { motion } from 'framer-motion';

export default function FloatingShapes() {
  const shapes = [
    { size: 60, color: 'bg-blue-500/20', delay: 0, duration: 20 },
    { size: 80, color: 'bg-purple-500/20', delay: 2, duration: 25 },
    { size: 40, color: 'bg-pink-500/20', delay: 4, duration: 18 },
    { size: 100, color: 'bg-indigo-500/20', delay: 1, duration: 30 },
    { size: 50, color: 'bg-cyan-500/20', delay: 3, duration: 22 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full ${shape.color} blur-3xl`}
          style={{
            width: shape.size,
            height: shape.size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 400 - 200, 0],
            y: [0, Math.random() * 400 - 200, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
