import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, Wrench } from 'lucide-react';

interface CameraCaptureProps {
  onCaptureImage: (blob: Blob, previewUrl: string, sampleTitle?: string) => void;
  disabled?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCaptureImage,
  disabled = false,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera unavailable or permission denied. Use upload or demo presets below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  // Capture a snapshot frame from the live video stream
  const handleSnapFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onCaptureImage(blob, previewUrl, 'Live Camera Inspection');
      }
    }, 'image/jpeg', 0.92);
  };

  // Flip camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onCaptureImage(file, previewUrl, file.name);
  };

  // Helper to load sample machinery preset
  const loadPreset = (presetName: string, title: string, color1: string, color2: string) => {
    // Generate a high-contrast industrial SVG canvas snapshot for immediate demoing
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw industrial machinery diagram
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 600);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Machinery Casing
    const grad = ctx.createLinearGradient(200, 150, 600, 450);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(220, 180, 360, 240, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Pump / Motor Hub
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(400, 300, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Caution Danger Zone marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(470, 240, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('!', 466, 248);

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(title.toUpperCase(), 160, 100);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '16px monospace';
    ctx.fillText('CRITICAL ANOMALY: LEAKAGE / HIGH THERMAL DEFECT', 160, 130);

    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onCaptureImage(blob, previewUrl, title);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
            mode === 'camera'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Field Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
            mode === 'upload'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image / File</span>
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-video sm:aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        {mode === 'camera' ? (
          <>
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center max-w-sm">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-80" />
                <p className="text-xs text-slate-400 mb-4">{cameraError || 'Activating camera...'}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Retry Camera Permissions
                </button>
              </div>
            )}

            {/* Viewfinder crosshairs */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-amber-400/40 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>
            )}

            {/* Camera Floating Controls */}
            {cameraActive && (
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-6 z-20">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Flip Camera"
                  className="p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white backdrop-blur shadow-lg transition active:scale-90"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleSnapFrame}
                  disabled={disabled}
                  className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center ring-4 ring-amber-400/30 shadow-2xl active:scale-95 transition disabled:opacity-50"
                  title="Snap Machinery Photo"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-950 flex items-center justify-center">
                    <Camera className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </button>

                <div className="w-11" /> {/* Spacer */}
              </div>
            )}
          </>
        ) : (
          /* File Upload Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed border-slate-700 hover:border-amber-400/60 transition group bg-slate-950/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-amber-400/10 border border-slate-700 group-hover:border-amber-400/40 flex items-center justify-center mb-3 transition">
              <Upload className="w-6 h-6 text-slate-300 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Click to select or drag & drop equipment photo
            </p>
            <p className="text-xs text-slate-500 font-mono">PNG, JPG, WEBP up to 15MB</p>
          </div>
        )}
      </div>

      {/* Instant Demo Presets for Quick Hackathon Judging */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo Presets (Instant Offline Test)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">One-click evaluation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              loadPreset(
                'pump',
                'Centrifugal Pump Seal Leak',
                '#334155',
                '#1e293b'
              )
            }
            className="flex items-center space-x-2 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition group active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
              P1
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">Pump Seal Leak</div>
              <div className="text-[10px] text-slate-400">Cavitation & Dripping</div>
            </div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              loadPreset(
                'motor',
                '3-Phase Induction Motor Overheat',
                '#475569',
                '#0f172a'
              )
            }
            className="flex items-center space-x-2 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition group active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
              M2
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">Motor Overheating</div>
              <div className="text-[10px] text-slate-400">Bearing Stator Issue</div>
            </div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              loadPreset(
                'compressor',
                'Air Compressor Pressure Drop',
                '#3b4252',
                '#181a1f'
              )
            }
            className="flex items-center space-x-2 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition group active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
              C3
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">Air Compressor</div>
              <div className="text-[10px] text-slate-400">Relief Valve Venting</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
