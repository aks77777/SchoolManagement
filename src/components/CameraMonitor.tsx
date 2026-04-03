import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { getStoredDescriptor, hasEnrolledFace } from './FaceAuthModal';
import { useAuth } from '../hooks/useAuth';

const CDN = '/weights';
const MATCH_THRESHOLD = 0.5;
const CHECK_INTERVAL_MS = 2500;
const TRESPASSER_STRIKES = 5; // ~12.5 s of unknown face → auto-logout

/** Toast shown before forced logout */
function showLogoutToast() {
    const existing = document.getElementById('__face_logout_toast__');
    if (existing) return;
    const el = document.createElement('div');
    el.id = '__face_logout_toast__';
    el.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:#ef4444;color:#fff;padding:14px 28px;border-radius:12px;
        font-family:sans-serif;font-size:15px;font-weight:600;
        box-shadow:0 8px 32px rgba(0,0,0,.35);z-index:999999;
        display:flex;align-items:center;gap:10px;
    `;
    el.innerHTML = `<span style="font-size:20px">⚠️</span> Unrecognised face detected — logging out for security.`;
    document.body.appendChild(el);
}

/** Picks the first real built-in webcam, skipping phone/virtual cameras. */
async function getBuiltinCamera(): Promise<MediaStream> {
    const probe = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
    probe?.getTracks().forEach(t => t.stop());
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const VIRTUAL = /droidcam|ivcam|epoccam|camo|obs|xsplit|manycam|phone|android|iphone|virtual|usb video/i;
    const builtin = videoDevices.find(d => d.label && !VIRTUAL.test(d.label));
    const deviceId = builtin?.deviceId;
    return navigator.mediaDevices.getUserMedia({
        video: deviceId
            ? { deviceId: { exact: deviceId }, width: 320, height: 240 }
            : { width: 320, height: 240, facingMode: 'user' },
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CameraMonitor(_props: { onEnrollClick?: () => void }) {
    const { signOut } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const strikesRef = useRef(0);

    useEffect(() => {
        // Skip if no face enrolled — nothing to compare against
        if (!hasEnrolledFace()) return;

        let cancelled = false;

        (async () => {
            // ── Load models ──────────────────────────────────────────────────
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(CDN),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN),
                    faceapi.nets.faceRecognitionNet.loadFromUri(CDN),
                ]);
            } catch {
                return; // silently abort if models can't load
            }
            if (cancelled) return;

            // ── Open camera (hidden) ─────────────────────────────────────────
            try {
                const stream = await getBuiltinCamera();
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch {
                return; // camera denied — silently skip
            }

            // ── Detection loop ───────────────────────────────────────────────
            intervalRef.current = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;

                const stored = getStoredDescriptor();
                if (!stored) return; // descriptor removed mid-session

                let det: { descriptor: Float32Array } | null = null;
                try {
                    det = await faceapi
                        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor() as unknown as { descriptor: Float32Array };
                } catch {
                    det = null;
                }

                if (!det) {
                    // No face visible — don't increment strikes (user may have looked away)
                    strikesRef.current = Math.max(0, strikesRef.current - 1);
                    return;
                }

                // Euclidean distance
                const dist = Math.sqrt(
                    stored.reduce((sum, v, i) => sum + (v - det!.descriptor[i]) ** 2, 0)
                );

                if (dist > MATCH_THRESHOLD) {
                    strikesRef.current += 1;
                    if (strikesRef.current >= TRESPASSER_STRIKES) {
                        // Clear interval first to stop further checks
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        showLogoutToast();
                        await new Promise(r => setTimeout(r, 2000)); // 2 s for user to read toast
                        await signOut();
                    }
                } else {
                    strikesRef.current = 0; // reset on good match
                }
            }, CHECK_INTERVAL_MS);
        })();

        return () => {
            cancelled = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            document.getElementById('__face_logout_toast__')?.remove();
        };
    }, [signOut]);

    // Completely invisible — a zero-size, off-screen video element only
    return (
        <video
            ref={videoRef}
            muted
            playsInline
            style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: -9999, left: -9999 }}
            aria-hidden="true"
        />
    );
}
