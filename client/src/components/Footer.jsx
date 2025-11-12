import { motion } from 'framer-motion';
import { Mail, Phone, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 py-3 px-6 z-50"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600 dark:text-slate-400 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium">
            Developed by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Sumant Yadav</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          <a
            href="mailto:sumantyadav3086@gmail.com"
            className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Mail size={14} />
            <span>sumantyadav3086@gmail.com</span>
          </a>
          
          <a
            href="tel:+919599617479"
            className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Phone size={14} />
            <span>+91 9599617479</span>
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
