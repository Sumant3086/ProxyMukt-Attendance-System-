import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time to readable string
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate attendance percentage
 */
export function calculatePercentage(attended, total) {
  if (total === 0) return 0;
  return ((attended / total) * 100).toFixed(2);
}

/**
 * Get status color based on percentage
 */
export function getStatusColor(percentage) {
  if (percentage >= 75) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
