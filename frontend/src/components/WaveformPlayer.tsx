import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Zap, Radio, AlertCircle, MessageSquare } from 'lucide-react';

interface WaveformPlayerProps {
  audioUrl: string;
  vernacularText: string;
  language: string;
  audioSource?: 'pregenerated_cache' | 'dynamic_tts';
  autoPlay?: boolean;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  vernacularText,
  language,
  audioSource = 'pregenerated_cache',
  autoPlay = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Total bars for the waveform visualization
  const NUM_BARS = 32;
  const [barHeights, setBarHeights] = useState<number[]>(
    Array.from({ length: NUM_BARS }, (_, i) => 20 + Math.sin(i * 0.4) * 15 + (i % 3) * 10)
  );

  // Reload audio element whenever audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(null);
    setAutoplayBlocked(false);
    audio.load();
  }, [audioUrl]);

  // Audio setup and listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setAudioError(null);
      if (autoPlay) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Autoplay prevented by browser security policy:', err);
            setIsPlaying(false);
            setAutoplayBlocked(true);
          });
      }
    };

    const handleCanPlay = () => {
      if (audio.duration) setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: any) => {
      console.warn('Audio element error:', audio.error, e);
      setAudioError('Audio format or stream issue. You can click "Speak with Browser Voice" below.');
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay]);

  // Smooth Waveform Animation loop when playing
  useEffect(() => {
    let animId: number;
    let t = 0;

    const animateWaveform = () => {
      if (isPlaying) {
        t += 0.15;
        setBarHeights((prev) =>
          prev.map((_, i) => {
            const wave1 = Math.sin(t + i * 0.35) * 35;
            const wave2 = Math.cos(t * 1.5 + i * 0.2) * 20;
            const base = 25 + Math.abs(wave1 + wave2);
            return Math.min(95, Math.max(15, base));
          })
        );
      }
      animId = requestAnimationFrame(animateWaveform);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(animateWaveform);
    } else {
      // Resting waveform state
      setBarHeights(
        Array.from({ length: NUM_BARS }, (_, i) => 18 + Math.sin(i * 0.3) * 12 + (i % 4) * 8)
      );
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    setAutoplayBlocked(false);

    if (isPlaying) {
      audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn('Manual play failed, falling back to Web Speech API:', e);
          speakAloudFallback();
        });
    }
  };

  // Browser SpeechSynthesis fallback
  const speakAloudFallback = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(vernacularText);
      const langMap: Record<string, string> = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        mr: 'mr-IN',
        en: 'en-IN',
      };
      utterance.lang = langMap[language] || 'en-US';
      utterance.rate = playbackSpeed;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const speeds = [0.85, 1.0, 1.25];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isPlaying ? 'opacity-100' : 'opacity-30'
        }`}
      />

      {/* Hidden audio element with crossOrigin */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
              audioSource === 'pregenerated_cache'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'bg-purple-400/15 text-purple-300 border border-purple-400/30'
            }`}
          >
            {audioSource === 'pregenerated_cache' ? (
              <>
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Zero-Latency Demo MP3</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Dynamic gTTS Synthesized</span>
              </>
            )}
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[11px] uppercase">
            Dialect: {language.toUpperCase()}
          </span>
        </div>

        {/* Live Audio Streaming Signal */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
          <Radio
            className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}
          />
          <span className={isPlaying ? 'text-emerald-400 font-medium' : ''}>
            {isPlaying ? 'VOICE ASSISTANT BROADCASTING' : 'AUDIO READY'}
          </span>
        </div>
      </div>

      {/* Browser Autoplay Notification Banner */}
      {autoplayBlocked && (
        <button
          type="button"
          onClick={togglePlay}
          className="w-full mb-3 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center space-x-2 text-xs font-black shadow-lg shadow-amber-400/20 active:scale-[0.99] transition animate-pulse"
        >
          <Volume2 className="w-4 h-4 fill-slate-950" />
          <span>Tap Here to Start Vernacular Spoken Instructions</span>
        </button>
      )}

      {/* Error or Fallback notification */}
      {audioError && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="truncate">{audioError}</span>
          </div>
          <button
            type="button"
            onClick={speakAloudFallback}
            className="ml-2 px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] uppercase whitespace-nowrap"
          >
            Speak Aloud
          </button>
        </div>
      )}

      {/* Vernacular Spoken Script Preview */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Vernacular Audio Transcript:
          </span>
          <button
            type="button"
            onClick={speakAloudFallback}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 transition"
            title="Read aloud with native voice"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Browser Voice</span>
          </button>
        </div>
        <p className="text-sm font-medium text-amber-200 leading-relaxed font-sans">
          "{vernacularText}"
        </p>
      </div>

      {/* Reactive Animated Audio Waveform Display */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 flex items-center justify-center h-24 overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none" />

        {/* Dynamic Waveform Bars */}
        <div className="flex items-center justify-between w-full h-full max-w-lg px-2 gap-1 z-10">
          {barHeights.map((h, index) => {
            const barProgress = (index / NUM_BARS) * 100;
            const hasPlayed = barProgress <= progressPercent;

            return (
              <div
                key={index}
                className="flex-1 h-full flex items-center justify-center"
              >
                <div
                  style={{ height: `${h}%` }}
                  className={`w-full max-w-[6px] rounded-full transition-all duration-100 ${
                    isPlaying
                      ? hasPlayed
                        ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                      : hasPlayed
                      ? 'bg-amber-500/70'
                      : 'bg-slate-800'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          {/* Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20 active:scale-95 transition"
            title={isPlaying ? 'Pause Vernacular Audio' : 'Play Vernacular Audio'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Replay Button */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true)).catch(speakAloudFallback);
              }
            }}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Volume Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold transition"
            title="Audio Playback Speed"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
