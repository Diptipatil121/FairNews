import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  pipelineSteps?: string[];
}

const stepLabels: Record<string, string> = {
  scraped: 'Scraping article',
  preprocessed: 'Preprocessing content',
  coref_resolved: 'Resolving coreferences',
  bias_scored: 'Calculating bias score',
};

export function LoadingState({ pipelineSteps }: LoadingStateProps) {
  const allSteps = ['scraped', 'coref_resolved', 'preprocessed', 'bias_scored'];
  const steps = pipelineSteps ?? [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing Article
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This may take a few moments...Please wait...
          </p>
        </div>

        {steps.length > 0 && (
          <div className="mx-auto w-fit max-w-full space-y-3 px-2">
            {allSteps.map((step, index) => {
              const isCompleted = steps.includes(step);
              const isActive = index === steps.length && !isCompleted;
              
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isActive 
                      ? 'bg-blue-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {isCompleted && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </div>
                  
                  <span className={`text-sm ${
                    isCompleted || isActive
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {stepLabels[step] || step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
