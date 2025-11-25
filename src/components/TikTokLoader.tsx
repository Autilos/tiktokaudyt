import { useState, useEffect } from 'react';

interface TikTokLoaderProps {
  message?: string;
}

export function TikTokLoader({ message = 'Audyt danych TikTok...' }: TikTokLoaderProps) {
  const [tikTokIndex, setTikTokIndex] = useState(0);
  const [floatingWords, setFloatingWords] = useState<{ id: number; word: string; x: number; delay: number }[]>([]);

  const tikTokWords = ['TIK', 'TOK', 'TIK', 'TOK'];

  // Animate TIK-TOK text
  useEffect(() => {
    const interval = setInterval(() => {
      setTikTokIndex((prev) => (prev + 1) % tikTokWords.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Generate floating words
  useEffect(() => {
    const words = ['TIK', 'TOK', 'TIK', 'TOK', 'TIK', 'TOK'];
    let wordId = 0;

    const interval = setInterval(() => {
      const word = words[wordId % words.length];
      const x = Math.random() * 60 + 20; // 20-80% of container width
      const uniqueId = Date.now() + wordId; // Ensure unique ID

      setFloatingWords((prev) => [
        ...prev.slice(-8), // Keep only last 8 words
        { id: uniqueId, word, x, delay: Math.random() * 0.3 }
      ]);

      wordId++;
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 border border-gray-800 rounded-lg p-12 text-center relative overflow-hidden">
      {/* Floating TIK TOK words */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingWords.map((item) => (
          <span
            key={item.id}
            className="absolute text-lg font-bold animate-float-up opacity-0"
            style={{
              left: `${item.x}%`,
              bottom: '20%',
              animationDelay: `${item.delay}s`,
              color: item.word === 'TIK' ? '#ec4899' : '#06b6d4',
              textShadow: item.word === 'TIK'
                ? '0 0 10px rgba(236, 72, 153, 0.5)'
                : '0 0 10px rgba(6, 182, 212, 0.5)',
            }}
          >
            {item.word}
          </span>
        ))}
      </div>

      {/* Clock Container */}
      <div className="relative inline-block mb-6">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 blur-lg opacity-30 animate-pulse-slow"></div>

        {/* Clock face */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-2xl flex items-center justify-center">
          {/* Clock marks */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-3 bg-gray-600 rounded-full"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-52px)`,
                transformOrigin: 'center center',
              }}
            />
          ))}

          {/* Hour hand */}
          <div
            className="absolute w-1.5 h-8 bg-pink-500 rounded-full origin-bottom shadow-lg"
            style={{
              transform: 'translateY(-16px) rotate(0deg)',
              animation: 'rotate-hour 6s linear infinite',
            }}
          />

          {/* Minute hand */}
          <div
            className="absolute w-1 h-12 bg-cyan-400 rounded-full origin-bottom shadow-lg"
            style={{
              transform: 'translateY(-24px)',
              animation: 'rotate-minute 1s steps(2) infinite',
            }}
          />

          {/* Center dot */}
          <div className="absolute w-4 h-4 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full shadow-lg z-10"></div>

          {/* TIK TOK text in center */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <span
              className="text-xs font-bold transition-all duration-200"
              style={{
                color: tikTokIndex % 2 === 0 ? '#ec4899' : '#06b6d4',
                textShadow: tikTokIndex % 2 === 0
                  ? '0 0 8px rgba(236, 72, 153, 0.8)'
                  : '0 0 8px rgba(6, 182, 212, 0.8)',
              }}
            >
              {tikTokWords[tikTokIndex]}
            </span>
          </div>
        </div>

        {/* Pendulum effect - swinging bottom */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div
            className="w-2 h-8 bg-gradient-to-b from-gray-700 to-transparent rounded-full"
            style={{ animation: 'pendulum 1s ease-in-out infinite' }}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full shadow-lg"></div>
          </div>
        </div>
      </div>

      {/* Loading text with TIK-TOK animation */}
      <div className="relative">
        <p className="text-gray-300 text-lg font-medium mb-2">{message}</p>
        <div className="flex items-center justify-center gap-1">
          <span
            className="text-2xl font-black transition-all duration-300"
            style={{
              color: '#ec4899',
              opacity: tikTokIndex % 2 === 0 ? 1 : 0.3,
              transform: tikTokIndex % 2 === 0 ? 'scale(1.1)' : 'scale(1)',
              textShadow: tikTokIndex % 2 === 0 ? '0 0 15px rgba(236, 72, 153, 0.8)' : 'none',
            }}
          >
            TIK
          </span>
          <span
            className="text-2xl font-black transition-all duration-300"
            style={{
              color: '#06b6d4',
              opacity: tikTokIndex % 2 === 1 ? 1 : 0.3,
              transform: tikTokIndex % 2 === 1 ? 'scale(1.1)' : 'scale(1)',
              textShadow: tikTokIndex % 2 === 1 ? '0 0 15px rgba(6, 182, 212, 0.8)' : 'none',
            }}
          >
            TOK
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: i % 2 === 0 ? '#ec4899' : '#06b6d4',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes rotate-minute {
          0% { transform: translateY(-24px) rotate(0deg); }
          50% { transform: translateY(-24px) rotate(180deg); }
          100% { transform: translateY(-24px) rotate(360deg); }
        }

        @keyframes rotate-hour {
          0% { transform: translateY(-16px) rotate(0deg); }
          100% { transform: translateY(-16px) rotate(360deg); }
        }

        @keyframes pendulum {
          0%, 100% { transform: translateX(-50%) rotate(-15deg); }
          50% { transform: translateX(-50%) rotate(15deg); }
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 0.8;
            transform: translateY(-20px) scale(1);
          }
          80% {
            opacity: 0.6;
            transform: translateY(-100px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-150px) scale(0.5);
          }
        }

        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
