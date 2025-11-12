import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

export default function CountUpAnimation({ value, duration = 2, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return (
    <motion.span>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
