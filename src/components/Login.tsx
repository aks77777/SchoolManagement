import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { GraduationCap, Globe } from 'lucide-react';
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        BIRDS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x1a1a2e,
          color1: 0x4a90e2,
          color2: 0x67b8e3,
          colorMode: 'lerp',
          birdSize: 1.5,
          wingSpan: 25.0,
          speedLimit: 5.0,
          separation: 50.0,
          alignment: 50.0,
          cohesion: 50.0,
          quantity: 3.0,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="bg-white rounded-full p-3 shadow-lg">
          <GraduationCap className="w-8 h-8 text-blue-600" />
        </div>
        <div className="text-white">
          <h2 className="text-xl font-bold tracking-wide">EduManage</h2>
          <p className="text-xs opacity-80">Excellence in Education</p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-medium">
              {languages.find(l => l.code === language)?.name}
            </span>
          </button>

          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl overflow-hidden min-w-[160px]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                    language === lang.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('login.title')}</h1>
          <p className="text-gray-600 text-sm">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? t('common.loading') : t('login.button')}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">{t('login.student')}</div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">👨‍🎓</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">{t('login.teacher')}</div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">👨‍🏫</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">{t('login.admin')}</div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">👨‍💼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
