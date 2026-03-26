import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { motion } from 'motion/react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { LoadingState } from './components/LoadingState';
import { ResultsPanel } from './components/ResultsPanel.tsx';
import { DashboardPanel } from './components/DashboardPanel';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Download, GitBranch, Zap, BarChart3 } from 'lucide-react';
import {
  runAsyncPipelineGateway,
  fetchDashboard,
  type AnalysisInput,
  type PipelineStep,
  type DashboardPayload,
} from '../pipeline';

interface AnalysisResult {
  content: string;
  job_id: string;
  aggregate_score: number | null;
  aggregate_label: string | null;
  pipeline_status: PipelineStep[];
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card dark:bg-card rounded-2xl shadow-lg border border-destructive p-6">
          <p className="text-sm text-destructive-foreground">
            Failed to render dashboard: {this.state.errorMessage ?? 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPipelineSteps, setCurrentPipelineSteps] = useState<PipelineStep[]>([]);

  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleSubmit = async (input: AnalysisInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentPipelineSteps([]);
    setDashboardData(null);
    setDashboardError(null);
    setDashboardLoading(false);

    let pipelineSucceeded = false;
    try {
      const data = await runAsyncPipelineGateway(input, {
        onStep: (step) => setCurrentPipelineSteps((prev) => (prev.includes(step) ? prev : [...prev, step])),
      });
      
      setResult({
        content: data.content || '',
        job_id: data.job_id,
        aggregate_score: data.aggregate_score ?? null,
        aggregate_label: data.aggregate_label ?? null,
        pipeline_status: data.pipeline_status || [],
      });
      pipelineSucceeded = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze article. Please try again.');
    }

    // Show the pipeline output first (including animated score/label),
    // then load the dashboard so it appears after the result.
    setIsLoading(false);

    if (pipelineSucceeded) {
      void loadDashboard();
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentPipelineSteps([]);
    setDashboardData(null);
    setDashboardError(null);
    setDashboardLoading(false);
  };

  const howItWorksSteps = [
    { label: 'Scrapes and extracts article content', icon: Download },
    { label: 'Resolves coreferences for better context', icon: GitBranch },
    { label: 'Preprocesses text using NLP techniques', icon: Zap },
    { label: 'Calculates bias score using AI models', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-background dark:text-foreground transition-colors" style={{ backgroundImage: 'linear-gradient(130deg, var(--primary) 0%, var(--background) 45%, var(--secondary) 100%)' }}>
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <InputForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onReset={handleReset}
              hasResults={!!result || !!error}
            />
            
            <motion.div
              className="mt-6 relative bg-gradient-to-br from-card/95 to-card/80 dark:from-card/90 dark:to-card/70 border border-border rounded-xl p-6 backdrop-blur-sm overflow-hidden"
              style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-semibold text-primary mb-6 text-base relative z-10">How it works</h3>
              <div className="space-y-4 relative z-10">
                {howItWorksSteps.map((step, idx) => {
                  const IconComponent = step.icon;
                  return (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.12, ease: 'easeOut' }}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                    >
                      <motion.div
                        className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 dark:bg-primary/20 p-2.5 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors duration-300"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          duration: 0.6, 
                          delay: idx * 0.12 + 0.1,
                          type: 'spring',
                          stiffness: 100,
                          damping: 12 
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <IconComponent className="w-5 h-5 text-primary" />
                      </motion.div>
                      <motion.div
                        className="flex-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.12 + 0.05 }}
                      >
                        <p className="text-sm text-foreground group-hover:text-primary transition-colors duration-300">
                          {step.label}
                        </p>
                      </motion.div>
                      <motion.div
                        className="flex-shrink-0 w-1 h-8 bg-gradient-to-b from-primary to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ scaleY: 0 }}
                        whileHover={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Decorative animated background element */}
              <motion.div
                className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl pointer-events-none"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          <div>
            {isLoading && <LoadingState pipelineSteps={currentPipelineSteps} />}
            {error && <ErrorDisplay message={error} />}
            {result && !isLoading && (
              <ResultsPanel
                aggregateScore={result.aggregate_score}
                aggregateLabel={result.aggregate_label}
                pipelineStatus={result.pipeline_status}
                jobId={result.job_id}
              />
            )}
            {!isLoading && !error && !result && (
              <div className="bg-card dark:bg-card rounded-2xl shadow-lg border border-border p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paste a news URL to get started
                </p>
              </div>
            )}
          </div>

          {result && (dashboardLoading || dashboardData || dashboardError) && (
          <section aria-label="Dashboard">
            {dashboardLoading && (
              <div className="bg-card dark:bg-card rounded-2xl shadow-lg border border-border p-6">
                <p className="text-sm text-muted-foreground">Loading dashboard...</p>
              </div>
            )}
            {dashboardError && (
              <div className="bg-card dark:bg-card rounded-2xl shadow-lg border border-destructive p-6">
                <p className="text-sm text-destructive-foreground">{dashboardError}</p>
              </div>
            )}
            {dashboardData && !dashboardLoading && (
              <>
                <ErrorBoundary>
                  <DashboardPanel data={dashboardData} />
                </ErrorBoundary>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={dashboardLoading}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm disabled:opacity-50"
                  >
                    Refresh dashboard
                  </button>
                </div>
              </>
            )}
          </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}
