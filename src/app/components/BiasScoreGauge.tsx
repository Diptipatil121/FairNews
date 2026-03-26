import React from 'react';
import { motion } from 'motion/react';

interface BiasScoreGaugeProps {
  score: number; // -10..10
  label?: string | null;
}

export function BiasScoreGauge({ score, label }: BiasScoreGaugeProps) {
  const safeScore = Number.isFinite(score) ? Math.min(10, Math.max(-10, score)) : 0;

  const positiveWidth = safeScore > 0 ? (safeScore / 10) * 50 : 0; // 0..50
  const negativeWidth = safeScore < 0 ? (Math.abs(safeScore) / 10) * 50 : 0; // 0..50

  const signStyle =
    safeScore > 0
      ? { color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-500' }
      : safeScore < 0
        ? { color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-500' }
        : { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-500' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bias Score
          </h3>
          <p className={`text-sm font-medium ${signStyle.color}`}>
            {label ?? '—'}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-right"
        >
          <div className={`text-4xl font-bold ${signStyle.color}`}>
            {safeScore.toFixed(2)}
          </div>
        </motion.div>
      </div>

      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Center marker (0) */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-400/70 dark:bg-gray-500/70" />
        {negativeWidth > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${negativeWidth}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ right: '50%' }}
            className={`absolute top-0 h-full ${signStyle.bgColor} rounded-full`}
          />
        )}
        {positiveWidth > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${positiveWidth}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ left: '50%' }}
            className={`absolute top-0 h-full ${signStyle.bgColor} rounded-full`}
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>-10</span>
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}

