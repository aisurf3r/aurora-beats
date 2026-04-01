import { useCallback, useRef, useState } from 'react';

export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bass: number;
  mids: number;
  highs: number;
  energy: number;
  isBeat: boolean;
}

const FFT_SIZE = 2048;

export function useAudioAnalyzer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<AudioNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const prevEnergyRef = useRef(0);
  const beatCooldownRef = useRef(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.82;
    }
    return { ctx: ctxRef.current, analyser: analyserRef.current! };
  }, []);

  const cleanup = useCallback(() => {
    srcRef.current?.disconnect();
    srcRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    analyserRef.current?.disconnect();
  }, []);

  const loadFile = useCallback(async (file: File) => {
    cleanup();
    const { ctx, analyser } = getCtx();
    analyser.connect(ctx.destination);

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = URL.createObjectURL(file);
    audio.loop = true;
    audioRef.current = audio;

    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    srcRef.current = src;

    await ctx.resume();
    await audio.play();
    setIsActive(true);
    setSourceName(file.name);
  }, [cleanup, getCtx]);

  const loadMic = useCallback(async () => {
    cleanup();
    const { ctx, analyser } = getCtx();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    srcRef.current = src;

    await ctx.resume();
    setIsActive(true);
    setSourceName('Microphone');
  }, [cleanup, getCtx]);

  const loadTab = useCallback(async () => {
    cleanup();
    const { ctx, analyser } = getCtx();

    const stream = await (navigator.mediaDevices as any).getDisplayMedia({ audio: true, video: true });
    stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
    streamRef.current = stream;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    srcRef.current = src;

    await ctx.resume();
    setIsActive(true);
    setSourceName('Tab Audio');
  }, [cleanup, getCtx]);

  const getData = useCallback((): AudioData | null => {
    const analyser = analyserRef.current;
    if (!analyser) return null;

    const len = analyser.frequencyBinCount;
    const freq = new Uint8Array(len);
    const time = new Uint8Array(len);
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(time);

    const bEnd = Math.floor(len * 0.08);
    const mEnd = Math.floor(len * 0.45);
    let bS = 0, mS = 0, hS = 0;
    for (let i = 0; i < bEnd; i++) bS += freq[i];
    for (let i = bEnd; i < mEnd; i++) mS += freq[i];
    for (let i = mEnd; i < len; i++) hS += freq[i];

    const bass = bEnd > 0 ? bS / bEnd / 255 : 0;
    const mids = (mEnd - bEnd) > 0 ? mS / (mEnd - bEnd) / 255 : 0;
    const highs = (len - mEnd) > 0 ? hS / (len - mEnd) / 255 : 0;
    const energy = (bass * 2.5 + mids * 1.2 + highs * 0.8) / 4.5;

    beatCooldownRef.current = Math.max(0, beatCooldownRef.current - 1);
    const isBeat = energy > prevEnergyRef.current * 1.35 && bass > 0.4 && beatCooldownRef.current === 0;
    if (isBeat) beatCooldownRef.current = 8;
    prevEnergyRef.current = energy * 0.65 + prevEnergyRef.current * 0.35;

    return { frequencyData: freq, timeDomainData: time, bass, mids, highs, energy, isBeat };
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsActive(false);
    setSourceName('');
  }, [cleanup]);

  return { loadFile, loadMic, loadTab, getData, isActive, sourceName, stop };
}
