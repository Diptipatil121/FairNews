import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

// Keep the payload typing local to avoid parser/HMR issues with type-only imports.
type DashboardPayload = {
  summary: Record<string, unknown>;
  top_sources: Array<Record<string, unknown>>;
  source_label_bias: Array<Record<string, unknown>>;
};

interface DashboardPanelProps {
  data: DashboardPayload;
}

function formatValue(value: unknown) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '—';
    return entries
      .map(([k, v]) => `${titleCase(String(k))}: ${formatValue(v)}`)
      .join(' • ');
  }
  return String(value);
}

function titleCase(raw: string) {
  return raw
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function DashboardPanel({ data }: DashboardPanelProps) {
  const summaryRaw = data.summary ?? {};
  const labelDistKeyCandidates = ['label_distribution', 'labelDistribution', 'distribution', 'bias_distribution'];
  const labelDistKey = labelDistKeyCandidates.find((k) => typeof summaryRaw[k] === 'object' && summaryRaw[k] !== null);
  const labelDistribution = labelDistKey ? (summaryRaw[labelDistKey] as Record<string, unknown>) : null;
  const summaryEntries = Object.entries(summaryRaw).filter(([key]) => {
    if (key === labelDistKey) return false;

    // Avoid duplicate cards for values already rendered in custom summary UI.
    const normalized = key.replaceAll('-', '_').toLowerCase();
    if (
      normalized === 'total_articles' ||
      normalized === 'totalarticles' ||
      normalized === 'articles_total' ||
      normalized === 'avg_bias_score' ||
      normalized === 'average_bias_score' ||
      normalized === 'avgbiasscore' ||
      normalized === 'mean_bias_score' ||
      normalized === 'top_sources' ||
      normalized === 'topsources'
    ) {
      return false;
    }
    return true;
  });
  const getFirstDefined = (
    record: Record<string, unknown>,
    keys: string[],
  ): unknown | undefined => {
    for (const k of keys) {
      const v = record[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const findFirstByPredicate = (
    value: unknown,
    predicate: (v: unknown) => unknown | null,
    depth: number,
  ): unknown | null => {
    if (depth < 0) return null;
    const direct = predicate(value);
    if (direct != null) return direct;

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      for (const [, v] of entries) {
        const found = findFirstByPredicate(v, predicate, depth - 1);
        if (found != null) return found;
      }
    }
    return null;
  };

  const pickCountLike = (record: unknown): unknown | undefined => {
    if (!record || typeof record !== 'object') return undefined;
    const recordObj = record as Record<string, unknown>;

    const direct = getFirstDefined(recordObj, [
      'count',
      'total',
      'frequency',
      'freq',
      'num_articles',
      'articles',
      'num',
      'value',
      'score',
      'aggregate_score',
    ]);
    const n = toFiniteNumber(direct);
    if (n != null) return n;

    const nested = findFirstByPredicate(
      recordObj,
      (v) => {
        const nn = toFiniteNumber(v);
        return nn != null ? nn : null;
      },
      3,
    );
    if (nested != null) return nested;
    return undefined;
  };

  const pickStringLike = (record: unknown, excludeKeys: string[] = []): unknown | undefined => {
    if (!record || typeof record !== 'object') return undefined;
    const recordObj = record as Record<string, unknown>;
    const exclude = new Set(excludeKeys);

    const labelPrefer = [
      'label',
      'aggregate_label',
      'bias_label',
      'source_label',
      'category',
      'type',
      'name',
      'value_label',
    ];
    const preferredKeys = labelPrefer.filter((k) => !exclude.has(k));
    const preferred = getFirstDefined(recordObj, preferredKeys);
    if (typeof preferred === 'string' && preferred.trim()) return preferred;

    for (const [k, v] of Object.entries(recordObj)) {
      if (exclude.has(k)) continue;
      if (typeof v === 'string' && v.trim()) return v;
    }

    const nested = findFirstByPredicate(
      recordObj,
      (v) => {
        if (typeof v !== 'string') return null;
        const s = v.trim();
        return s ? s : null;
      },
      3,
    );
    if (nested != null) return nested;
    return undefined;
  };

  const pickLabelLike = (record: unknown): unknown | undefined => {
    if (!record || typeof record !== 'object') return undefined;
    const recordObj = record as Record<string, unknown>;

    // For bias labels, prioritize bias-specific label fields
    const labelPrefer = [
      'bias_label',
      'label',
      'aggregate_label',
      'source_label',
      'category',
      'classification',
      'bias_class',
      'sentiment',
      'predicted_label',
      'predicted_bias',
      'bias_classification',
    ];
    const preferred = getFirstDefined(recordObj, labelPrefer);
    if (typeof preferred === 'string' && preferred.trim()) return preferred;

    // Fallback: search ALL fields and return first non-empty string
    // excluding numeric, source, count, and score fields
    const exclude = new Set([
      'source', 'name', 'publisher', 'outlet', 'site', 'website',
      'count', 'total', 'frequency', 'freq', 'num', 'num_articles', 'articles',
      'value', 'score', 'avg_bias_score', 'aggregate_score', 'median_score',
      'id', 'job_id', 'timestamp', 'date', 'created_at', 'updated_at',
    ]);
    
    for (const [k, v] of Object.entries(recordObj)) {
      if (exclude.has(k)) continue;
      if (typeof v === 'string' && v.trim() && !k.toLowerCase().includes('id') && !k.toLowerCase().includes('score')) {
        return v;
      }
    }

    // Final fallback: check if any field contains label-like content
    for (const [k, v] of Object.entries(recordObj)) {
      const keyLower = k.toLowerCase();
      if ((keyLower.includes('label') || keyLower.includes('bias') || keyLower.includes('class')) && typeof v === 'string' && v.trim()) {
        return v;
      }
    }

    return undefined;
  };

  const pickSourceLike = (record: unknown): unknown | undefined => {
    if (!record || typeof record !== 'object') return undefined;
    const recordObj = record as Record<string, unknown>;
    const src = getFirstDefined(recordObj, ['source', 'name', 'publisher', 'outlet', 'site', 'website']);
    if (typeof src === 'string' && src.trim()) return src;
    return pickStringLike(recordObj, ['source', 'name', 'publisher', 'outlet', 'site', 'website']);
  };

  const getCount = (record: unknown) => {
    if (record && typeof record === 'object') {
      const n = toFiniteNumber(pickCountLike(record));
      return n ?? 0;
    }
    const n = toFiniteNumber(record);
    return n ?? 0;
  };

  const topSources = Array.isArray(data.top_sources) ? data.top_sources : [];
  const sourceLabelBias = Array.isArray(data.source_label_bias) ? data.source_label_bias : [];

  const topSourcesSorted = [...topSources]
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => getCount(b) - getCount(a));

  const sourceLabelBiasSorted = [...sourceLabelBias]
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => getCount(b) - getCount(a));

  const getSummaryNumber = (keys: string[]): number | null => {
    for (const key of keys) {
      const raw = summaryRaw[key];
      const num = toFiniteNumber(raw);
      if (num != null) return num;
    }
    return null;
  };

  const totalArticles =
    getSummaryNumber(['total_articles', 'totalArticles', 'articles_total']) ??
    topSourcesSorted.reduce((sum, item) => sum + getCount(item), 0);
  const avgBiasScore = getSummaryNumber([
    'avg_bias_score',
    'average_bias_score',
    'avgBiasScore',
    'mean_bias_score',
  ]);

  // Determine up to 3 label dimensions to show consistently for each source.
  const allBiasLabels = Array.from(
    new Set(
      sourceLabelBiasSorted.flatMap((item) =>
        Object.keys(item as Record<string, unknown>).filter((k) => k !== 'source'),
      ),
    ),
  );

  const labelImportance = allBiasLabels
    .map((label) => ({
      label,
      total: sourceLabelBiasSorted.reduce((sum, entry) => {
        const val = (entry as Record<string, unknown>)[label];
        const n = toFiniteNumber(val);
        return sum + (n != null ? Math.abs(n) : 0);
      }, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((entry) => entry.label);

  const standardizedBiasRows = sourceLabelBiasSorted.map((item) => {
    const record = item as Record<string, unknown>;
    const source = formatValue(pickSourceLike(record));

    const row: Record<string, string> = { source };
    labelImportance.forEach((label, index) => {
      const value = record[label];
      row[`label_${index + 1}`] = label;
      row[`value_${index + 1}`] = value == null ? 'Null' : formatValue(value);
    });

    // If there are fewer than 3 overall labels (data issue), fill placeholders
    for (let i = labelImportance.length + 1; i <= 3; i += 1) {
      row[`label_${i}`] = 'N/A';
      row[`value_${i}`] = 'Null';
    }

    return row;
  });

  const renderLabelDistribution = (distribution: Record<string, unknown>) => {
    const prepared = Object.entries(distribution)
      .map(([label, count]) => ({
        label: String(label),
        count: toFiniteNumber(count) ?? 0,
        percentage: 0, // Will be calculated after filtering
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (prepared.length === 0) {
      return <span className="text-gray-500 dark:text-gray-400">No distribution data</span>;
    }

    const total = prepared.reduce((sum, item) => sum + item.count, 0);
    
    // Add percentage to each item
    const dataWithPercentage = prepared.map(item => ({
      ...item,
      percentage: ((item.count / total) * 100).toFixed(1)
    }));

    const defaultColors = ['#10b981', '#0ea5e9', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const getColorForLabel = (label: string, index: number) => {
      const normalized = label.trim().toLowerCase();
      const compact = normalized.replace(/[\s_\-().]/g, '');
      if (normalized.includes('congress')) return '#2563eb'; // blue
      if (
        normalized.includes('bjp') ||
        normalized.includes('bharatiya janata') ||
        compact.includes('bjp') ||
        compact.includes('bharatiyajanata')
      ) {
        return '#f97316'; // orange
      }
      return defaultColors[index % defaultColors.length];
    };

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{data.label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Count: {data.count} ({data.percentage}%)
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percentage }) => `${label}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                stroke="#ffffff"
                strokeWidth={3}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForLabel(String(entry.label), index)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {dataWithPercentage.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getColorForLabel(String(item.label), index) }}
              />
              <span><strong>{item.label}</strong>: {item.count} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
              <div className="flex flex-wrap gap-2">
                {topSourcesSorted.slice(0, 12).map((entry, idx) => {
                  const source = formatValue(pickSourceLike(entry));
                  return (
                    <span
                      key={`${source}-${idx}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-sm text-orange-900 dark:text-orange-300"
                    >
                      {source}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs lg:shrink-0">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                <p className="text-gray-600 dark:text-gray-400">Total Articles</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatValue(totalArticles)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                <p className="text-gray-600 dark:text-gray-400">Avg Bias Score</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {avgBiasScore == null ? '—' : avgBiasScore.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaryEntries.length > 0 ? (
              summaryEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400">{titleCase(key)}</p>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                    {formatValue(value)}
                  </div>
                </div>
              ))
            ) : null}
          </div>
          {labelDistribution || topSourcesSorted.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {labelDistribution ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Label Distribution</p>
                  {renderLabelDistribution(labelDistribution)}
                </div>
              ) : null}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Sources</h4>
                {topSourcesSorted.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSourcesSorted.slice(0, 10).map((entry) => {
                          const record = entry as Record<string, unknown>;
                          return {
                            source: formatValue(pickSourceLike(record)) || 'Unknown',
                            count: getCount(record),
                          };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="source"
                          stroke="#6b7280"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgb(31 41 55)',
                            border: '1px solid rgb(75 85 99)',
                            borderRadius: '8px',
                            color: 'white',
                          }}
                          formatter={(value) => [value, 'Articles']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No source data available.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

    <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Source Label Bias</h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Source</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Label 1</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Value 1</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Label 2</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Value 2</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Label 3</th>
                  <th className="text-left px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Value 3</th>
                </tr>
              </thead>
              <tbody>
                {standardizedBiasRows.length > 0 ? (
                  standardizedBiasRows.map((row, idx) => (
                    <tr key={`${row.source}-${idx}`} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.source}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.label_1}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.value_1}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.label_2}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.value_2}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.label_3}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.value_3}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                      No source-label bias data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
