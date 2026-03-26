import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface InputFormProps {
  onSubmit: (input: { type: 'url'; value: string }) => void;
  isLoading: boolean;
  onReset: () => void;
  hasResults: boolean;
}

export function InputForm({ onSubmit, isLoading, onReset, hasResults }: InputFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!value) return;
    onSubmit({ type: 'url', value });
  };

  const handleReset = () => {
    setUrl('');
    onReset();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Article URL
          </label>
          <div className="relative">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the news article URL..."
              className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Only URL input is supported. Paste a publicly accessible news article link.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
          
          {hasResults && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
