import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface RegionalVoicePlayerProps {
  audioUrl?: string | null;
  durationSec?: number;
  languageCode: string;
  policyTitle?: string;
}

export function RegionalVoicePlayer({
  audioUrl,
  durationSec = 0,
  languageCode,
}: RegionalVoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="surface p-4 sm:p-5 space-y-3">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-pill bg-paper-3 text-ink">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">
              Vernacular neural audio explainer
            </h4>
            <p className="font-body text-xs text-muted">
              Synthesized in language code {languageCode}
            </p>
          </div>
        </div>

        {/* Speed buttons */}
        <div className="flex items-center gap-1">
          <span className="font-body text-xs text-muted mr-1">Speed:</span>
          {[0.8, 1, 1.2, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setPlaybackRate(rate)}
              className={`rounded-pill px-2 py-0.5 font-mono text-[11px] transition-colors ${
                playbackRate === rate
                  ? 'bg-ink text-paper-2 font-semibold'
                  : 'border border-rule bg-paper-2 text-muted hover:text-ink hover:bg-paper-3'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Player transport and progress */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="btn-primary min-h-[38px] w-9 h-9 p-0 rounded-pill"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />
          )}
        </button>

        <span className="font-mono text-xs text-muted w-10 text-right">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-accent h-1.5 bg-rule rounded-pill cursor-pointer"
          aria-label="Seek audio timeline"
        />

        <span className="font-mono text-xs text-muted w-10">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

export default RegionalVoicePlayer;
