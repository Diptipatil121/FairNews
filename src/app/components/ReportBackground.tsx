/**
 * FUTURE: full-page video background (`src/image/Customised report.mp4`).
 *
 * To enable:
 * 1. Uncomment the block below and delete the stub `ReportBackground` at the bottom.
 * 2. In `vite-env.d.ts`, uncomment `declare module '*.mp4'`.
 * 3. In `App.tsx`, uncomment the `ReportBackground` import; on the root div add `relative`,
 *    remove `style={{ backgroundImage: ... }}`, insert `<ReportBackground />`, and wrap
 *    `Header` + `main` in `<div className="relative z-10">...</div>` (see comment in App.tsx).
 */

/*
import { motion } from 'motion/react';
import customisedReportVideo from '../../image/Customised report.mp4';

export function ReportBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.video
        className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-[0.2] dark:opacity-[0.16]"
        src={customisedReportVideo}
        autoPlay
        muted
        loop
        playsInline
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 bg-background/78 dark:bg-background/85"
        style={{
          backgroundImage:
            'linear-gradient(130deg, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 42%, color-mix(in srgb, var(--secondary) 12%, transparent) 100%)',
        }}
      />
    </div>
  );
}
*/

/** No-op while video background is disabled (keeps module valid for future uncomment). */
export function ReportBackground() {
  return null;
}
