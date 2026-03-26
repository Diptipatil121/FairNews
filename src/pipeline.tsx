export type AnalysisInput = { type: 'url'; value: string };

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | string;

export type PipelineStep = 'scraped' | 'coref_resolved' | 'preprocessed' | 'bias_scored';

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

export interface InferenceResult {
  aggregate_score?: number | null;
  aggregate_label?: string | null;
  median_score?: number | null;
  mode_value?: string | null;
  scored_list?: Array<{ sent?: string | null; label?: string | null; score?: number | null }> | null;
  [key: string]: unknown;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  step?: string | null;
  result?: InferenceResult | null;
  error?: string | null;
}

export interface PipelineRunResult {
  content: string;
  job_id: string;
  aggregate_score: number | null;
  aggregate_label: string | null;
  pipeline_status: PipelineStep[];
}

export type DashboardPayload = {
  summary: Record<string, unknown>;
  top_sources: Array<Record<string, unknown>>;
  source_label_bias: Array<Record<string, unknown>>;
};

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function fetchJson(url: string, init: RequestInit, signal?: AbortSignal) {
  const res = await fetch(url, { ...init, signal });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
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
  if (s.includes('bias') || s.includes('infer') || s.includes('score')) return 'bias_scored';
  return null;
}

export async function createPipelineJob(url: string, signal?: AbortSignal): Promise<CreateJobResponse> {
  const base: string | undefined = (import.meta as any).env?.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  const data = await fetchJson(
    joinUrl(base, '/api/pipeline'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    },
    signal,
  );
  return data as CreateJobResponse;
}

export async function getPipelineJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  const base: string | undefined = (import.meta as any).env?.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  const data = await fetchJson(joinUrl(base, `/api/pipeline/${encodeURIComponent(jobId)}`), { method: 'GET' }, signal);
  return data as JobStatusResponse;
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

    const mapped = stepFromGateway(status.step);
    if (mapped && !steps.includes(mapped)) {
      steps.push(mapped);
      onStep?.(mapped);
    }

    if (status.status === 'completed') {
      const scoredList: Array<{ sent?: string | null; score?: number | null }> =
        (status.result as any)?.scored_list ?? [];

      const aggregate_score_raw = (status.result as any)?.aggregate_score;
      const aggregate_label_raw = (status.result as any)?.aggregate_label;
      const aggregate_score =
        typeof aggregate_score_raw === 'number'
          ? aggregate_score_raw
          : aggregate_score_raw == null
            ? null
            : Number(aggregate_score_raw);
      const aggregate_label =
        typeof aggregate_label_raw === 'string'
          ? aggregate_label_raw
          : aggregate_label_raw == null
            ? null
            : String(aggregate_label_raw);

      const bestEntry = scoredList.reduce<null | { sent: string; score: number }>((best, entry) => {
        const score = typeof entry?.score === 'number' ? entry.score : Number(entry?.score);
        if (!Number.isFinite(score)) return best;
        if (!best || Math.abs(score) > Math.abs(best.score)) {
          return { sent: entry.sent ?? '', score };
        }
        return best;
      }, null);

      // Only surface the relevant sentence; do not show bias scores in the UI.
      const content = bestEntry ? bestEntry.sent ?? '' : '';

      return {
        content,
        job_id: jobId,
        aggregate_score: Number.isFinite(aggregate_score as number) ? (aggregate_score as number) : null,
        aggregate_label: aggregate_label,
        pipeline_status: steps,
      };
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Job failed');
    }

    await sleep(intervalMs, signal);
  }
}

function getDashboardBaseUrl(): string {
  const base: string | undefined = (import.meta as any).env?.VITE_PIPELINE_GATEWAY_URL;
  if (!base) throw new Error('VITE_PIPELINE_GATEWAY_URL is not configured.');
  return base;
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardPayload> {
  const base = getDashboardBaseUrl();

  const [summary, topSources, sourceLabelBias] = await Promise.all([
    fetchJson(joinUrl(base, '/api/summary'), { method: 'GET' }, signal),
    fetchJson(joinUrl(base, '/api/top-sources'), { method: 'GET' }, signal),
    fetchJson(joinUrl(base, '/api/source-label-bias'), { method: 'GET' }, signal),
  ]);

  return {
    summary: (summary && typeof summary === 'object' ? summary : {}) as Record<string, unknown>,
    top_sources: (Array.isArray(topSources) ? topSources : []) as Array<Record<string, unknown>>,
    source_label_bias: (Array.isArray(sourceLabelBias) ? sourceLabelBias : []) as Array<Record<string, unknown>>,
  };
}