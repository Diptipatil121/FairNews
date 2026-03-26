import React from 'react';
import { motion } from 'motion/react';
import { PipelineStatus } from './PipelineStatus';

interface ResultsPanelProps {
  aggregateScore: number | null;
  aggregateLabel: string | null;
  pipelineStatus: string[];
  jobId: string;
}
export function ResultsPanel({ aggregateScore, aggregateLabel, pipelineStatus, jobId }: ResultsPanelProps) {
  const scoreValue = typeof aggregateScore === 'number' && Number.isFinite(aggregateScore) ? aggregateScore : null;
  const normalizedLabel = (aggregateLabel ?? '').toLowerCase();
  const aggregateTheme =
    normalizedLabel.includes('bjp') || normalizedLabel.includes('bharatiya') || normalizedLabel.includes('janata')
      ? {
          text: 'text-orange-700 dark:text-orange-300',
          dot: 'bg-orange-500',
        }
      : normalizedLabel.includes('congress')
        ? {
            text: 'text-blue-700 dark:text-blue-300',
            dot: 'bg-blue-500',
          }
        : normalizedLabel.includes('neutral')
          ? {
              text: 'text-green-700 dark:text-green-300',
              dot: 'bg-green-500',
            }
          : {
              text: 'text-gray-900 dark:text-white',
              dot: 'bg-gray-300 dark:bg-gray-700',
            };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aggregate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Score and label returned by the backend.
            </p>
          </div>

          <motion.div
            aria-label="Aggregate polarity indicator"
            className={[
              'w-4 h-4 rounded-full mt-1 flex-shrink-0',
              aggregateTheme.dot,
            ].join(' ')}
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">aggregate_score</p>
            <motion.p
              key={scoreValue == null ? 'na' : `score-${scoreValue}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-sm font-semibold mt-1 ${aggregateTheme.text}`}
            >
              {scoreValue == null ? '—' : String(scoreValue)}
            </motion.p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">aggregate_label</p>
            <motion.p
              key={(aggregateLabel ?? 'na') + '-' + (scoreValue == null ? 'na' : scoreValue)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-sm font-semibold mt-1 break-words ${aggregateTheme.text}`}
            >
              {aggregateLabel ?? '—'}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <PipelineStatus steps={pipelineStatus} jobId={jobId} />
      </div>
    </motion.div>
  );
}

