import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { GraduationCap, Globe, Mail, Lock, KeyRound, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';

interface LoginProps {
  onNavigateSignup: () => void;
}

// ── Shared: 6-box OTP input ───────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const update = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = digit;
    onChange(arr.join('').trimEnd());
    if (digit && i < 5) boxes.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) boxes.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    boxes.current[Math.min(digits.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={onPaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={el => { boxes.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''} disabled={disabled}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" />
      ))}
    </div>
  );
}

// ── Forgot Password Modal (3 steps) ───────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  // step: 'email' → enter email and send code
  //       'code'  → verify 6-digit OTP from email
  //       'pass'  → set new password
  //       'done'  → success screen
  const [step, setStep] = useState<'email' | 'code' | 'pass' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  // ── Step 1: Send OTP to email ─────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep('code');
      setResend(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Signups not allowed for otp')) {
        setError('No account found with this email address.');
      } else {
        setError(msg || 'Failed to send reset code. Please check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP code ───────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      // Verified — move to password reset step
      setStep('pass');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend > 0) return;
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setCode('');
      setResend(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    }
  };

  // ── Step 3: Set new password ──────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      // Sign back out — user should login fresh with new password
      await supabase.auth.signOut();
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative">

        {/* Close */}
        <button onClick={onClose} disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* ── Step 1: Enter email ── */}
        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send a 6‑digit reset code.</p>
            </div>
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="your@email.com" />
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg">
                {loading ? 'Sending Code…' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Enter OTP code ── */}
        {step === 'code' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Enter Reset Code</h2>
              <p className="text-gray-500 text-sm mt-1">
                We sent a 6‑digit code to<br />
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <OtpInput value={code} onChange={setCode} disabled={loading} />
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm text-center">{error}</div>}
              <button type="submit" disabled={loading || code.length < 6}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg">
                {loading ? 'Verifying…' : 'Verify Code'}
              </button>
              <p className="text-center text-sm">
                <span className="text-gray-500">Didn't receive it? </span>
                <button type="button" onClick={handleResend} disabled={resend > 0 || loading}
                  className="text-blue-600 font-semibold hover:underline disabled:opacity-50">
                  {resend > 0 ? `Resend in ${resend}s` : 'Resend Code'}
                </button>
              </p>
            </form>
          </>
        )}

        {/* ── Step 3: Set new password ── */}
        {step === 'pass' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Set New Password</h2>
              <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account.</p>
            </div>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6}
                    value={newPass} onChange={e => setNewPass(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6}
                    value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••" />
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 4: Done ── */}
        {step === 'done' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Password Updated!</h2>
            <p className="text-gray-500 text-sm mb-6">Your password has been changed successfully. Please sign in with your new password.</p>
            <button onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sign-in OTP Modal ─────────────────────────────────────────────────────────
function OtpModal({ email, onVerified, onClose }: {
  email: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(60);
  const { verifyOtp } = useAuth();

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      onVerified();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend > 0) return;
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setOtp('');
      setResend(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative">
        <button onClick={onClose} disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Check your email</h2>
          <p className="text-gray-500 text-sm mt-1">
            We sent a 6‑digit code to<br />
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm text-center">{error}</div>}
          <button type="submit" disabled={loading || otp.length < 6}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg">
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
          <p className="text-center text-sm">
            <span className="text-gray-500">Didn't receive it? </span>
            <button type="button" onClick={handleResend} disabled={resend > 0 || loading}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50">
              {resend > 0 ? `Resend in ${resend}s` : 'Resend Code'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Main Login page ───────────────────────────────────────────────────────────
export function Login({ onNavigateSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { signIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Step 1: Validate credentials
      await signIn(email, password);

      // Step 2: Check role — admins skip OTP
      const { data: { user } } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles').select('role').eq('id', user!.id).single();

      if (profile?.role === 'admin') {
        return; // admin → onAuthStateChange routes to dashboard
      }

      // Step 3: Non-admin → sign out, send email OTP
      await supabase.auth.signOut();
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email, options: { shouldCreateUser: false },
      });

      if (otpErr) {
        // Handle specific "user not found" error for OTP
        if (otpErr.message.includes('Signups not allowed for otp')) {
          // This implies the user turned out not to exist, which shouldn't happen 
          // if we just validated credentials, unless the account was deleted in between.
          // Or if the initial signIn didn't actually persist the user correctly.
          console.error('OTP failed - user not found (unexpected)');
        }

        // SMTP not configured or other error — fall back to direct login
        console.warn('OTP email unavailable, falling back:', otpErr.message);

        // Add a small delay to avoid potential race conditions or rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          await signIn(email, password);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (fallbackError: any) {
          console.error('Fallback login failed:', fallbackError);
          // If fallback fails (e.g. rate limit), restore the original error to notify user
          throw new Error('OTP service unavailable and fallback login failed. Please try again later.');
        }
        return;
      }

      setShowOtp(true);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Check your inbox and click the confirmation link first.');
      } else if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid email or password')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(msg || t('login.error'));
      }
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

      {/* Modals */}
      {showOtp && <OtpModal email={email} onVerified={() => setShowOtp(false)} onClose={() => setShowOtp(false)} />}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="bg-white rounded-full p-3 shadow-lg"><GraduationCap className="w-8 h-8 text-blue-600" /></div>
        <div className="text-white">
          <h2 className="text-xl font-bold tracking-wide">AK Group of Industries</h2>
          <p className="text-xs opacity-80">Excellence in Education</p>
        </div>
      </div>

      {/* Language switcher */}
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
                onClick={() => { setLanguage(lang.code as Extract<typeof language, string>); setShowLangMenu(false); }}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 ${language === lang.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Login card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('login.title')}</h1>
          <p className="text-gray-600 text-sm">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-xs text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg">
            {loading ? 'Please wait…' : t('login.button')}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onNavigateSignup}
            className="text-blue-600 font-semibold hover:underline">Sign Up</button>
        </p>
      </div>
    </div>
  );
}
