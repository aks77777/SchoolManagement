import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { GraduationCap, Globe, User, Mail, Lock, Shield } from 'lucide-react';
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';

interface SignupProps {
    onNavigateLogin: () => void;
}

export function Signup({ onNavigateLogin }: SignupProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
    const { language, setLanguage } = useLanguage();
    const vantaRef = useRef<HTMLDivElement | null>(null);
    const vantaEffect = useRef<{ destroy: () => void } | null>(null);
    const [showLangMenu, setShowLangMenu] = useState(false);

    useEffect(() => {
        if (!vantaRef.current || vantaEffect.current) return;
        vantaEffect.current = BIRDS({
            el: vantaRef.current, THREE,
            mouseControls: true, touchControls: true, gyroControls: false,
            minHeight: 200, minWidth: 200, scale: 1, scaleMobile: 1,
            backgroundColor: 0x1a1a2e, color1: 0x4a90e2, color2: 0x67b8e3,
            colorMode: 'lerp', birdSize: 1.5, wingSpan: 25, speedLimit: 5,
            separation: 50, alignment: 50, cohesion: 50, quantity: 3,
        });
        return () => { vantaEffect.current?.destroy(); vantaEffect.current = null; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signUp(email, password, fullName, role);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
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
            {/* Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
                <div className="bg-white rounded-full p-3 shadow-lg"><GraduationCap className="w-8 h-8 text-blue-600" /></div>
                <div className="text-white">
                    <h2 className="text-xl font-bold tracking-wide">AK Group of Industries</h2>
                    <p className="text-xs opacity-80">Excellence in Education</p>
                </div>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-10">
                <button type="button" onClick={() => setShowLangMenu(p => !p)}
                    className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">{languages.find(l => l.code === language)?.name}</span>
                </button>
                {showLangMenu && (
                    <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                        {languages.map(lang => (
                            <button key={lang.code} type="button"
                                onClick={() => { setLanguage(lang.code as 'en' | 'te' | 'hi'); setShowLangMenu(false); }}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 ${language === lang.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
                                <span className="text-xl">{lang.flag}</span>
                                <span className="font-medium">{lang.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md z-10 my-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-gray-600 text-sm">Join our educational community</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="John Doe" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="your@email.com" />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="••••••••" />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <select value={role} onChange={e => setRole(e.target.value as 'student' | 'teacher')}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white">
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                    <button type="submit" disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg">
                        {loading ? 'Creating Account…' : 'Sign Up'}
                    </button>

                    <p className="text-center text-gray-600 text-sm">
                        Already have an account?{' '}
                        <button type="button" onClick={onNavigateLogin}
                            className="text-blue-600 font-semibold hover:underline">Sign In</button>
                    </p>
                </form>
            </div>
        </div>
    );
}
