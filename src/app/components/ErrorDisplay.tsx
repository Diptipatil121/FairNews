import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-red-200 dark:border-red-800 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">
            Analysis Failed
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            {message}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Please check the URL and try again. Make sure your backend API is running.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
