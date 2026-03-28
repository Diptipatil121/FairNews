import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';

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

/** Single display order; must stay in sync with `PipelineStep` in pipeline.tsx / LoadingState. */
const PIPELINE_ORDER = ['scraped', 'coref_resolved', 'preprocessed', 'bias_scored'] as const;

function pipelineRows(completedSteps: string[]) {
  const done = new Set(completedSteps);
  const seen = new Set<string>();
  const rows: { id: string; label: string; complete: boolean }[] = [];

  for (const key of PIPELINE_ORDER) {
    seen.add(key);
    rows.push({
      id: key,
      label: stepLabels[key] ?? key,
      complete: done.has(key),
    });
  }

  for (const step of completedSteps) {
    if (seen.has(step)) continue;
    seen.add(step);
    rows.push({
      id: step,
      label: stepLabels[step] ?? step,
      complete: true,
    });
  }

  return rows;
}

export function PipelineStatus({ steps, jobId }: PipelineStatusProps) {
  const rows = pipelineRows(steps);

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

      <div className="flex flex-col items-center gap-3">
        {rows.map(({ id, label, complete }, index) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className={[
              'flex w-full max-w-md items-center gap-2 rounded-lg border px-3 py-2',
              complete
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-blue-50 dark:bg-blue-800/50 border-blue-200 dark:border-gray-700',
            ].join(' ')}
          >
            {complete ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-500" />
            ) : (
              <Circle className="w-5 h-5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
            )}
            <span
              className={
                complete
                  ? 'text-sm text-green-900 dark:text-green-300'
                  : 'text-sm text-gray-500 dark:text-gray-400'
              }
            >
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

