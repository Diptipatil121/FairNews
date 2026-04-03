export type AnalysisInput = { type: 'url'; value: string };

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | string;

export type PipelineStep =
  | 'scraped'
  | 'coref_resolved'
  | 'preprocessed'
  | 'bias_scored'
  | 'explanation_generated';

export interface RunPipelineOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onStatusChange?: (data: JobStatusResponse) => void;
  onStep?: (step: PipelineStep) => void;
  signal?: AbortSignal;
}

export interface CreateJobResponse {
  job_id: string;
  status: JobStatus;
}

export type BiasLabel = 'pro' | 'anti' | 'neutral';

export interface BiasScoredListItem {
  sent: string;
  target: string;
  label: BiasLabel;
  score: number;
}

export interface BiasResult {
  bjp_axis: number;
  congress_axis: number;
  scored_list: BiasScoredListItem[];
  median_score: number;
  mode_value: BiasLabel;
}

export interface ExplainabilityAxisAnalysis {
  bjp: string;
  congress: string;
}

export interface ExplainabilityResult {
  bias_explanation: string;
  overall_interpretation: string;
  axis_analysis: ExplainabilityAxisAnalysis;
  evidence: string[];
  confidence_note: string;
}

export interface PipelineApiResult {
  bias: BiasResult;
  explainability: ExplainabilityResult;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  step?: string | null;
  result?: PipelineApiResult | null;
  error?: string | null;
}

export interface PipelineRunResult {
  content: string;
  job_id: string;
  pipeline_status: PipelineStep[];
  bias: BiasResult;
  explainability: ExplainabilityResult;
}

export type DashboardPayload = {
  summary: Record<string, unknown>;
  top_sources: Array<Record<string, unknown>>;
  source_label_bias: Array<Record<string, unknown>>;
};

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function fetchJson<T>(url: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { ...init, signal });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }
  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return text as unknown as T;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

// NOTE: bias score is intentionally not surfaced in the UI.

function stepFromGateway(step: unknown): PipelineStep | null {
  if (!step || typeof step !== 'string') return null;
  const s = step.toLowerCase();
  if (s.includes('scrap')) return 'scraped';
  if (s.includes('coref')) return 'coref_resolved';
  if (s.includes('pre')) return 'preprocessed';
  if (s.includes('explain') || s.includes('reason') || s.includes('rationale') || s.includes('interpret'))
    return 'explanation_generated';
  if (s.includes('bias') || s.includes('infer') || s.includes('score')) return 'bias_scored';
  return null;
}

export async function createPipelineJob(url: string, signal?: AbortSignal): Promise<CreateJobResponse> {
  const base: string | undefined = import.meta.env.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  const data = await fetchJson<CreateJobResponse>(
    joinUrl(base, '/api/pipeline'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    },
    signal,
  );
  return data;
}

export async function getPipelineJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  const base: string | undefined = import.meta.env.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  const data = await fetchJson<JobStatusResponse>(
    joinUrl(base, `/api/pipeline/${encodeURIComponent(jobId)}`),
    { method: 'GET' },
    signal,
  );
  return data;
}

export async function runAsyncPipelineGateway(input: AnalysisInput, opts: RunPipelineOptions = {}): Promise<PipelineRunResult> {
  const {
    intervalMs = 1000,
    timeoutMs = 300000,
    onStatusChange,
    onStep,
    signal,
  } = opts;

  // Runtime safety: backend accepts URL input only.
  if (input.type !== 'url') throw new Error('This backend accepts URL input only.');

  const steps: PipelineStep[] = [];
  const job = await createPipelineJob(input.value, signal);
  const jobId = job.job_id;
  onStatusChange?.({ job_id: job.job_id, status: job.status });

  const start = Date.now();

  while (true) {
    if (signal?.aborted) throw new DOMException('Polling aborted', 'AbortError');
    if (Date.now() - start > timeoutMs) throw new Error('Polling timed out');

    const status = await getPipelineJobStatus(job.job_id, signal);
    onStatusChange?.(status);

    if (status.error != null) {
      throw new Error(status.error || 'Job failed');
    }

    const mapped = stepFromGateway(status.step);
    if (mapped && !steps.includes(mapped)) {
      steps.push(mapped);
      onStep?.(mapped);
    }

    if (status.status === 'completed') {
      const completedResult = status.result;
      if (!completedResult?.bias || !completedResult.explainability) {
        throw new Error('Pipeline completed but result payload is missing.');
      }

      const scoredList = completedResult.bias.scored_list ?? [];
      const bestEntry = scoredList.reduce<null | { sent: string; score: number }>((best, entry) => {
        if (!Number.isFinite(entry.score)) return best;
        if (!best || Math.abs(entry.score) > Math.abs(best.score)) {
          return { sent: entry.sent, score: entry.score };
        }
        return best;
      }, null);

      return {
        content: bestEntry?.sent ?? '',
        job_id: jobId,
        pipeline_status: steps,
        bias: completedResult.bias,
        explainability: completedResult.explainability,
      };
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Job failed');
    }

    await sleep(intervalMs, signal);
  }
}

function getDashboardBaseUrl(): string {
  const base: string | undefined = import.meta.env.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  return base;
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardPayload> {
  const base = getDashboardBaseUrl();

  const [summary, topSources, sourceLabelBias] = await Promise.all([
    fetchJson<unknown>(joinUrl(base, '/api/summary'), { method: 'GET' }, signal),
    fetchJson<unknown>(joinUrl(base, '/api/top-sources'), { method: 'GET' }, signal),
    fetchJson<unknown>(joinUrl(base, '/api/source-label-bias'), { method: 'GET' }, signal),
  ]);

  return {
    summary: (summary && typeof summary === 'object' ? summary : {}) as Record<string, unknown>,
    top_sources: (Array.isArray(topSources) ? topSources : []) as Array<Record<string, unknown>>,
    source_label_bias: (Array.isArray(sourceLabelBias) ? sourceLabelBias : []) as Array<Record<string, unknown>>,
  };
}