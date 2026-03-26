import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface PipelineStatusProps {
  steps: string[];
  jobId?: string;
}

const stepLabels: Record<string, string> = {
  scraped: 'Article Scraped',
  preprocessed: 'Content Preprocessed',
  coref_resolved: 'Coreferences Resolved',
  bias_scored: 'Bias Score Calculated',
};

const fixedPipelineStatuses = [
  'Articles Scrapped',
  'Articles Preprocessed',
  'Articles Coreferenced',
  'Calculated Bias Score',
];

export function PipelineStatus({ steps, jobId }: PipelineStatusProps) {
  const dynamicStatuses = steps.map((step) => stepLabels[step] || step);
  const extraStatuses = dynamicStatuses.filter((label) => !fixedPipelineStatuses.includes(label));
  const allStatuses = [...fixedPipelineStatuses, ...extraStatuses];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Pipeline Status
      </h3>

      {jobId && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
            Job_id : " {jobId} " created successfully.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allStatuses.map((status, index) => (
          <motion.div
            key={`${status}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-900 dark:text-green-300">
              {status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

