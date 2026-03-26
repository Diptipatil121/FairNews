import { Moon, Sun, Newspaper } from 'lucide-react';
import { useTheme } from 'next-themes';
import logoSrc from '../../image/FairNews logo with tricolour symbol.png';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <img src={logoSrc} alt="FairNews logo" className="w-20 h-20 object-contain" />
                FairNews
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze bias in any news article using FairNews
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
