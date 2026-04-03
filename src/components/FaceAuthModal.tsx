import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { X, Camera, ShieldCheck, ShieldAlert, UserCheck, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'admin_face_descriptor';
const CDN = '/weights';
const MATCH_THRESHOLD = 0.5;

/** Picks the first real built-in webcam, skipping phone/virtual cameras. */
async function getBuiltinCamera(): Promise<MediaStream> {
    // First get permission so labels are populated
    const probe = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
    probe?.getTracks().forEach(t => t.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    // Prefer a device whose label suggests it's built-in (avoid DroidCam, iVCam, etc.)
    const VIRTUAL_KEYWORDS = /droidcam|ivcam|epoccam|camo|obs|xsplit|manycam|phone|android|iphone|virtual|usb video/i;
    const builtin = videoDevices.find(d => d.label && !VIRTUAL_KEYWORDS.test(d.label));
    const deviceId = builtin?.deviceId;

    return navigator.mediaDevices.getUserMedia({
        video: deviceId
            ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
            : { width: 640, height: 480, facingMode: 'user' },
    });
}

export type FaceAuthMode = 'verify' | 'enroll';

interface Props {
    mode: FaceAuthMode;
    onSuccess: () => void;
    onCancel: () => void;
}

type Stage =
    | 'loading_models'
    | 'starting_camera'
    | 'camera_error'
    | 'scanning'
    | 'detecting'
    | 'no_face'
    | 'verifying'
    | 'success'
    | 'fail'
    | 'enrolling'
    | 'enrolled'
    | 'password_input'
    | 'password_loading';

// ── Helpers ───────────────────────────────────────────────────────────────────
function storeDescriptor(desc: Float32Array) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(desc)));
}
// eslint-disable-next-line react-refresh/only-export-components
export function getStoredDescriptor(): Float32Array | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return new Float32Array(JSON.parse(raw));
}
// eslint-disable-next-line react-refresh/only-export-components
export function hasEnrolledFace(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
}

// ── Animated scan rings ───────────────────────────────────────────────────────
function ScanRings({ stage }: { stage: Stage }) {
    const color =
        stage === 'success' || stage === 'enrolled'
            ? '#22c55e'
            : stage === 'fail'
                ? '#ef4444'
                : '#3b82f6';

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="absolute rounded-full border-2 opacity-60"
                    style={{
                        width: `${140 + i * 40}px`,
                        height: `${140 + i * 40}px`,
                        borderColor: color,
                        animation: `faceRingPulse 2s ease-in-out ${i * 0.4}s infinite`,
                    }}
                />
            ))}
            {/* Sweep scan line */}
            {(stage === 'scanning' || stage === 'detecting' || stage === 'verifying' || stage === 'enrolling') && (
                <div
                    className="absolute w-32 h-0.5 opacity-80 rounded"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                        animation: 'faceSweep 1.5s linear infinite',
                        transformOrigin: 'center',
                    }}
                />
            )}
        </div>
    );
}

// ── Corner bracket decorations ────────────────────────────────────────────────
function Brackets({ color }: { color: string }) {
    const size = 20;
    const thick = 3;
    const style = (top: boolean, left: boolean) => ({
        position: 'absolute' as const,
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
        width: size,
        height: size,
        borderColor: color,
        borderTopWidth: top ? thick : 0,
        borderBottomWidth: top ? 0 : thick,
        borderLeftWidth: left ? thick : 0,
        borderRightWidth: left ? 0 : thick,
        borderStyle: 'solid',
        borderRadius: top && left ? '4px 0 0 0' : top ? '0 4px 0 0' : left ? '0 0 0 4px' : '0 0 4px 0',
    });
    return (
        <>
            <div style={style(true, true)} />
            <div style={style(true, false)} />
            <div style={style(false, true)} />
            <div style={style(false, false)} />
        </>
    );
}

export function FaceAuthModal({ mode, onSuccess, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [stage, setStage] = useState<Stage>('loading_models');
    const [statusText, setStatusText] = useState('Loading AI models…');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // ── Cleanup ─────────────────────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // ── 1. Load models ───────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(CDN),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN),
                    faceapi.nets.faceRecognitionNet.loadFromUri(CDN),
                ]);
                setModelsLoaded(true);
                setStage('starting_camera');
                setStatusText('Starting camera…');
            } catch {
                setStage('camera_error');
                setStatusText('Failed to load face models. Check your connection.');
            }
        })();
    }, []);

    // ── 2. Start camera ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!modelsLoaded) return;
        (async () => {
            try {
                const stream = await getBuiltinCamera();
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setStage('scanning');
                setStatusText(
                    mode === 'enroll'
                        ? 'Position your face in the frame, then click Register'
                        : 'Looking for your face…'
                );
                if (mode === 'verify') startVerifyLoop();
            } catch {
                setStage('camera_error');
                setStatusText('Camera access denied or unavailable.');
            }
        })();
    }, [modelsLoaded]); // eslint-disable-line

    // ── Detect + compare ─────────────────────────────────────────────────────────
    const detectFace = useCallback(async (): Promise<Float32Array | null> => {
        if (!videoRef.current || videoRef.current.readyState < 2) return null;
        const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        return det?.descriptor ?? null;
    }, []);

    const startVerifyLoop = useCallback(() => {
        let tries = 0;
        intervalRef.current = setInterval(async () => {
            tries++;
            setStage('detecting');
            setStatusText('Detecting face…');
            const desc = await detectFace();
            if (!desc) {
                if (tries >= 6) {
                    clearInterval(intervalRef.current!);
                    setStage('no_face');
                    setStatusText('No face detected. Please look at the camera.');
                }
                return;
            }
            clearInterval(intervalRef.current!);
            setStage('verifying');
            setStatusText('Verifying identity…');

            const stored = getStoredDescriptor();
            if (!stored) {
                // No face enrolled yet — skip verification and succeed (first-run)
                setTimeout(() => {
                    setStage('success');
                    setStatusText('No Face ID enrolled — proceeding. Please enroll from the dashboard.');
                    stopCamera();
                    setTimeout(onSuccess, 1500);
                }, 600);
                return;
            }

            const dist = faceapi.euclideanDistance(desc, stored);
            if (dist <= MATCH_THRESHOLD) {
                setStage('success');
                setStatusText('Identity confirmed! ✓');
                stopCamera();
                setTimeout(onSuccess, 1200);
            } else {
                setStage('fail');
                setStatusText('Face not recognized. Access denied.');
            }
        }, 1200);
    }, [detectFace, stopCamera, onSuccess]);

    // ── Enroll ───────────────────────────────────────────────────────────────────
    const handleEnroll = useCallback(async () => {
        setStage('enrolling');
        setStatusText('Capturing face…');
        const desc = await detectFace();
        if (!desc) {
            setStage('scanning');
            setStatusText('No face detected. Please look directly at the camera and try again.');
            return;
        }
        storeDescriptor(desc);
        setStage('enrolled');
        setStatusText('Face enrolled successfully! ✓');
        stopCamera();
        setTimeout(onSuccess, 1400);
    }, [detectFace, stopCamera, onSuccess]);

    // ── Retry ────────────────────────────────────────────────────────────────────
    const handleRetry = () => {
        setStage('scanning');
        setStatusText('Looking for your face…');
        startVerifyLoop();
    };

    // ── Password Fallback ────────────────────────────────────────────────────────
    const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setStage('password_loading');
        setPasswordError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('No active user found');

            // Try to re-authenticate with the provided password
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password
            });

            if (error) throw error;

            setStage('success');
            setStatusText('Identity confirmed! ✓');
            setTimeout(onSuccess, 1200);
        } catch (err: unknown) {
            setStage('password_input');
            const errorMessage = err instanceof Error ? err.message : 'Verification failed.';
            setPasswordError(errorMessage === 'Invalid login credentials' ? 'Incorrect password. Please try again.' : errorMessage);
        }
    }, [password, onSuccess]);

    // ── UI colors ─────────────────────────────────────────────────────────────────
    const ringColor =
        stage === 'success' || stage === 'enrolled'
            ? '#22c55e'
            : stage === 'fail'
                ? '#ef4444'
                : '#3b82f6';

    const statusIcon =
        stage === 'success' || stage === 'enrolled' ? (
            <ShieldCheck className="w-5 h-5 text-green-400" />
        ) : stage === 'fail' ? (
            <ShieldAlert className="w-5 h-5 text-red-400" />
        ) : stage === 'camera_error' ? (
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
        ) : (
            <Camera className="w-5 h-5 text-blue-400" />
        );

    return (
        <>
            {/* CSS keyframes */}
            <style>{`
        @keyframes faceRingPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes faceSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes faceFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes faceGlow {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 28px 8px rgba(59,130,246,0.7); }
        }
        @keyframes faceSuccessGlow {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 28px 8px rgba(34,197,94,0.7); }
        }
        @keyframes faceFailGlow {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 28px 8px rgba(239,68,68,0.7); }
        }
      `}</style>

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            >
                {/* Card */}
                <div
                    className="relative flex flex-col items-center gap-6 rounded-3xl p-10 w-full max-w-md"
                    style={{
                        background: 'linear-gradient(145deg,#0f172a,#1e293b)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        animation: 'faceFadeIn 0.35s ease',
                    }}
                >
                    {/* Close */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Title */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <UserCheck className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-bold text-white">
                                {mode === 'enroll' ? 'Register Face ID' : 'Face Authentication'}
                            </h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            {mode === 'enroll'
                                ? 'Register your face to secure admin access'
                                : 'Admin identity verification required'}
                        </p>
                    </div>

                    {/* Camera frame (hidden during password input) */}
                    <div
                        className="relative flex items-center justify-center"
                        style={{
                            width: 220,
                            height: 220,
                            display: (stage === 'password_input' || stage === 'password_loading') ? 'none' : 'flex'
                        }}
                    >
                        {/* Rings */}
                        <ScanRings stage={stage} />

                        {/* Video circle */}
                        <div
                            className="relative overflow-hidden rounded-full z-10"
                            style={{
                                width: 160,
                                height: 160,
                                animation:
                                    stage === 'success' || stage === 'enrolled'
                                        ? 'faceSuccessGlow 1.5s ease-in-out infinite'
                                        : stage === 'fail'
                                            ? 'faceFailGlow 1s ease-in-out infinite'
                                            : 'faceGlow 2s ease-in-out infinite',
                            }}
                        >
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-x-[-1]"
                                style={{ display: stage === 'camera_error' ? 'none' : 'block' }}
                            />
                            {/* Overlay tint on result */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background:
                                        stage === 'success' || stage === 'enrolled'
                                            ? 'rgba(34,197,94,0.18)'
                                            : stage === 'fail'
                                                ? 'rgba(239,68,68,0.22)'
                                                : 'transparent',
                                    transition: 'background 0.4s',
                                }}
                            />
                            {/* Bracket corners */}
                            <Brackets color={ringColor} />
                        </div>

                        {/* Camera error placeholder */}
                        {stage === 'camera_error' && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="w-40 h-40 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-600">
                                    <Camera className="w-12 h-12 text-slate-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    {stage !== 'password_input' && stage !== 'password_loading' && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            {statusIcon}
                            <span className="text-sm text-slate-300 font-medium text-center">{statusText}</span>
                        </div>
                    )}

                    {/* Loading progress dots */}
                    {(stage === 'loading_models' || stage === 'starting_camera') && (
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-blue-500"
                                    style={{ animation: `faceRingPulse 1s ease-in-out ${i * 0.2}s infinite` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Enroll button */}
                    {mode === 'enroll' && (stage === 'scanning' || stage === 'no_face') && (
                        <button
                            onClick={handleEnroll}
                            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            📷 Register My Face
                        </button>
                    )}

                    {/* Retry button */}
                    {mode === 'verify' && (stage === 'fail' || stage === 'no_face') && (
                        <button
                            onClick={handleRetry}
                            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            🔄 Try Again
                        </button>
                    )}

                    {/* Password Verification Panel */}
                    {(stage === 'password_input' || stage === 'password_loading') && (
                        <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                                <Lock className="w-8 h-8 text-blue-400" />
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Admin Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setPasswordError('');
                                            }}
                                            disabled={stage === 'password_loading'}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                    {passwordError && (
                                        <p className="mt-2 text-sm text-red-400 font-medium bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">{passwordError}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={stage === 'password_loading' || !password}
                                    className="w-full mt-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 hover:scale-[1.02] shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                                >
                                    {stage === 'password_loading' ? 'Verifying Password…' : 'Verify Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPassword('');
                                        setPasswordError('');
                                        setStage('scanning');
                                        setStatusText('Looking for your face…');
                                        setModelsLoaded(false);
                                        setTimeout(() => setModelsLoaded(true), 50);
                                    }}
                                    disabled={stage === 'password_loading'}
                                    className="w-full py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
                                >
                                    Back to Face ID
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Skip / fallback */}
                    {mode === 'verify' && stage !== 'success' && stage !== 'password_input' && stage !== 'password_loading' && (
                        <button
                            onClick={() => {
                                stopCamera();
                                setStage('password_input');
                            }}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors underline underline-offset-4 mt-2"
                        >
                            Use Password Instead
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
