import { useState } from 'react';
import { Hash, User, Search, Video, Play } from 'lucide-react';

interface ScraperFormProps {
  onScrape: (formData: any) => void;
  loading: boolean;
  onModeChange?: (mode: string) => void;
}

export function ScraperForm({ onScrape, loading, onModeChange }: ScraperFormProps) {
  const [mode, setMode] = useState<'hashtag' | 'profile' | 'search' | 'video'>('hashtag');
  const [inputText, setInputText] = useState('');
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [excludePinnedPosts, setExcludePinnedPosts] = useState(false);
  const [proxyCountry, setProxyCountry] = useState('none');

  const handleModeChange = (newMode: 'hashtag' | 'profile' | 'search' | 'video') => {
    console.log('Mode changing from', mode, 'to', newMode);
    setMode(newMode);
    if (onModeChange) {
      console.log('Calling onModeChange with:', newMode);
      onModeChange(newMode);
    } else {
      console.log('onModeChange is not defined');
    }
  };

  // Helper function to detect if input looks like a TikTok video URL
  const isTikTokVideoUrl = (input: string): boolean => {
    const videoUrlPattern = /tiktok\.com\/.*\/video\//i;
    return videoUrlPattern.test(input);
  };

  // Helper function to detect if input looks like a URL
  const isUrl = (input: string): boolean => {
    return input.startsWith('http://') || input.startsWith('https://') || input.includes('tiktok.com');
  };

  // Helper function to detect if input looks like a hashtag or plain text
  const isHashtagOrText = (input: string): boolean => {
    return !isUrl(input) && input.length > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (inputs.length === 0) {
      alert('Wprowadź przynajmniej jedną wartość');
      return;
    }

    // Validation: Check if video URL is entered in non-video mode
    if (mode !== 'video') {
      const videoUrlFound = inputs.find(input => isTikTokVideoUrl(input));
      if (videoUrlFound) {
        alert('Wpisałeś adres filmu TikTok!\n\nAby analizować komentarze pod filmem, wybierz tryb "Wideo" w konfiguratorze wyszukiwania.');
        return;
      }
    }

    // Validation: Check if non-URL input is entered in video mode
    if (mode === 'video') {
      const nonUrlInput = inputs.find(input => isHashtagOrText(input));
      if (nonUrlInput) {
        alert('Błędny format adresu filmu!\n\nW trybie "Wideo" musisz wpisać pełny URL filmu TikTok, np.:\nhttps://www.tiktok.com/@username/video/123456789\n\nJeśli chcesz szukać hashtagów lub fraz - wybierz odpowiedni tryb w konfiguratorze.');
        return;
      }

      // Additional validation: Check if URL looks like a valid TikTok video URL
      const invalidVideoUrl = inputs.find(input => !isTikTokVideoUrl(input) && isUrl(input));
      if (invalidVideoUrl) {
        alert('Nieprawidłowy URL filmu TikTok!\n\nPoprawny format to:\nhttps://www.tiktok.com/@username/video/123456789\n\nSprawdź czy:\n• URL zawiera "/video/" w ścieżce\n• Nie wklejasz URL profilu zamiast filmu');
        return;
      }
    }

    // Validation: For profile mode, check if URL was entered instead of username
    if (mode === 'profile') {
      const urlInput = inputs.find(input => isUrl(input));
      if (urlInput) {
        alert('W trybie "Profil" wpisz tylko nazwę użytkownika!\n\nPrawidłowy format: @username\n\nNie wklejaj całego URL. Jeśli chcesz analizować konkretny film - wybierz tryb "Wideo".');
        return;
      }
    }

    onScrape({
      mode,
      inputs,
      resultsPerPage,
      profileSorting: 'latest', // domyślnie najnowsze
      excludePinnedPosts,
      proxyCountry,
    });
  };

  const getModeIcon = (modeType: string) => {
    switch (modeType) {
      case 'hashtag':
        return <Hash className="w-4 h-4" />;
      case 'profile':
        return <User className="w-4 h-4" />;
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getModeLabel = (modeType: string) => {
    switch (modeType) {
      case 'hashtag':
        return 'Hashtag';
      case 'profile':
        return 'Profil';
      case 'search':
        return 'Szukaj';
      case 'video':
        return 'Wideo';
      default:
        return modeType;
    }
  };

  const getPlaceholder = () => {
    switch (mode) {
      case 'hashtag':
        return 'fyp\nforyou\ntrending';
      case 'profile':
        return '@username1\n@username2';
      case 'search':
        return 'poradnik taneczny\nprzepisy kulinarne';
      case 'video':
        return 'https://www.tiktok.com/@user/video/123456\nhttps://www.tiktok.com/@user/video/789012';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Konfiguracja Wyszukiwania</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tryb Wyszukiwania
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(['hashtag', 'profile', 'search', 'video'] as const).map((modeType) => (
              <button
                key={modeType}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked:', modeType);
                  handleModeChange(modeType);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  mode === modeType
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-transparent text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {getModeIcon(modeType)}
                <span className="text-sm font-medium">{getModeLabel(modeType)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {mode === 'hashtag' && 'Hashtagi'}
            {mode === 'profile' && 'Nazwy Profili'}
            {mode === 'search' && 'Zapytania Wyszukiwania'}
            {mode === 'video' && 'URL Wideo'}
            <span className="text-gray-500 text-xs ml-2">(jeden w linii)</span>
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={getPlaceholder()}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        {/* Results Per Page / Comments Count */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {mode === 'video' ? 'Liczba komentarzy do pobrania' : 'Wyników na stronę'}
          </label>
          <input
            type="number"
            min="1"
            max={mode === 'video' ? 500 : 100}
            value={resultsPerPage}
            onChange={(e) => setResultsPerPage(parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          {mode === 'video' && (
            <p className="mt-1 text-xs text-gray-500">
              Maksymalnie 500 komentarzy. Więcej komentarzy = dłuższy czas pobierania.
            </p>
          )}
        </div>

        {/* Exclude Pinned Posts */}
        {mode === 'profile' && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="excludePinned"
              checked={excludePinnedPosts}
              onChange={(e) => setExcludePinnedPosts(e.target.checked)}
              className="w-4 h-4 bg-gray-800 border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
            />
            <label htmlFor="excludePinned" className="text-sm text-gray-300">
              Wyklucz przypięte posty
            </label>
          </div>
        )}

        {/* Proxy Country */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kraj proxy
          </label>
          <select
            value={proxyCountry}
            onChange={(e) => setProxyCountry(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="none">Bez proxy</option>
            <option value="US">Stany Zjednoczone</option>
            <option value="GB">Wielka Brytania</option>
            <option value="PL">Polska</option>
            <option value="DE">Niemcy</option>
            <option value="FR">Francja</option>
            <option value="CA">Kanada</option>
            <option value="AU">Australia</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-900/50'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-gray-300"></div>
              Audyt...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Rozpocznij Audyt
            </>
          )}
        </button>
      </form>
    </div>
  );
}
