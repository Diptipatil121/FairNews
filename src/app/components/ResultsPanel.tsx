import React from 'react';
import { motion } from 'motion/react';
import { PipelineStatus } from './PipelineStatus';

import type { BiasScoredListItem, ExplainabilityResult, BiasLabel } from '../../pipeline';

interface ResultsPanelProps {
  pipelineStatus: string[];
  jobId: string;
  bjpAxis: number;
  congressAxis: number;
  modeValue: BiasLabel;
  scoredList: BiasScoredListItem[];
  explainability: ExplainabilityResult;
}
export function ResultsPanel({
  pipelineStatus,
  jobId,
  bjpAxis,
  congressAxis,
  modeValue,
  scoredList,
  explainability,
}: ResultsPanelProps) {
  const normalizedMode = modeValue?.toLowerCase();

  const aggregateTheme =
    normalizedMode === 'pro'
      ? {
          text: 'text-orange-700 dark:text-orange-300',
          dot: 'bg-orange-500',
        }
      : normalizedMode === 'anti'
        ? {
            text: 'text-blue-700 dark:text-blue-300',
            dot: 'bg-blue-500',
          }
        : normalizedMode === 'neutral'
          ? {
              text: 'text-green-700 dark:text-green-300',
              dot: 'bg-green-500',
            }
          : {
              text: 'text-gray-900 dark:text-white',
              dot: 'bg-gray-300 dark:bg-gray-700',
            };

  const safeBjpAxis = bjpAxis ?? null;
  const safeCongressAxis = congressAxis ?? null;

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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">bjp_axis</p>
            <motion.p
              key={safeBjpAxis == null ? 'na' : `bjp-${safeBjpAxis}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-sm font-semibold mt-1 ${aggregateTheme.text}`}
            >
              {safeBjpAxis == null ? '—' : String(safeBjpAxis)}
            </motion.p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">overall_interpretation</p>
            <motion.p
              key={`${explainability?.overall_interpretation ?? 'na'}-${safeBjpAxis == null ? 'na' : safeBjpAxis}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-sm font-semibold mt-1 break-words ${aggregateTheme.text}`}
            >
              {explainability?.overall_interpretation ?? '—'}
            </motion.p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">congress_axis</p>
            <motion.p
              key={safeCongressAxis == null ? 'na' : `congress-${safeCongressAxis}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-sm font-semibold mt-1 ${aggregateTheme.text}`}
            >
              {safeCongressAxis == null ? '—' : String(safeCongressAxis)}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <PipelineStatus steps={pipelineStatus} jobId={jobId} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sentences</h3>
        <div className="mt-4 space-y-3">
          {(scoredList ?? [])
            .sort((a, b) => {
              const scoreA = typeof a.score === 'number' ? a.score : 0;
              const scoreB = typeof b.score === 'number' ? b.score : 0;
              return scoreB - scoreA; // Descending order (highest first)
            })
            .slice(0, 3)
            .map((item, idx) => (
            <div
              // index is stable enough for a completed single-run list
              key={`${item.sent}-${idx}`}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">{item.sent ?? '—'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                target: {item.target ?? '—'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                label: <span className="font-semibold">{item.label ?? '—'}</span> • score:{' '}
                <span className="font-semibold">{item.score ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Explainability</h3>

        <div className="space-y-4">
          {explainability?.overall_interpretation && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Overall Interpretation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {explainability.overall_interpretation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {explainability?.bias_explanation && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-200 dark:border-orange-800 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Bias Explanation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {explainability.bias_explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {explainability?.axis_analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"
            >
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">BJP Axis</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {explainability.axis_analysis.bjp ?? '—'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Congress Axis</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {explainability.axis_analysis.congress ?? '—'}
                </p>
              </div>
            </motion.div>
          )}

          {(explainability?.evidence ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Evidence</p>
              <div className="space-y-2">
                {explainability.evidence.map((ev, idx) => (
                  <motion.div
                    key={`${idx}-${ev}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-gray-400 dark:text-gray-600 font-semibold mt-0.5">•</span>
                    <span>{ev}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {explainability?.confidence_note && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 py-1"
            >
              {explainability.confidence_note}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

