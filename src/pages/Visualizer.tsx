import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { MODES, type PaletteName } from '@/lib/renderModes';
import { ControlPanel } from '@/components/visualizer/ControlPanel';
import { Maximize, Minimize } from 'lucide-react';

const Visualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadFile, loadMic, loadTab, getData, isActive, sourceName, stop } = useAudioAnalyzer();

  const [currentMode, setCurrentMode] = useState(5);
  const [palette, setPalette] = useState<PaletteName>('cyber');
  const [sensitivity, setSensitivity] = useState(1.2);
  const [speed, setSpeed] = useState(1.0);
  const [randomMode, setRandomMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for animation loop (avoid re-creating loop on state changes)
  const stateRef = useRef({ currentMode, palette, sensitivity, speed });
  useEffect(() => {
    stateRef.current = { currentMode, palette, sensitivity, speed };
  }, [currentMode, palette, sensitivity, speed]);

  // Random mode switching
  useEffect(() => {
    if (!randomMode) return;
    const interval = setInterval(() => {
      setCurrentMode(prev => {
        let next = prev;
        while (next === prev) next = Math.floor(Math.random() * MODES.length);
        return next;
      });
    }, 30000 + Math.random() * 30000);
    return () => clearInterval(interval);
  }, [randomMode]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animId: number;

    const animate = () => {
      const { currentMode: mode, palette: pal, sensitivity: sens, speed: spd } = stateRef.current;
      time += 0.016 * spd;

      const data = getData();
      if (data) {
        MODES[mode].render(ctx, data, canvas.width, canvas.height, time, pal, sens);
      } else {
        // Demo mode: generate fake data
        const freq = new Uint8Array(1024);
        const td = new Uint8Array(1024);
        for (let i = 0; i < 1024; i++) {
          freq[i] = Math.floor((Math.sin(time * 2 + i * 0.05) * 0.5 + 0.5) * 100 + Math.random() * 30);
          td[i] = Math.floor(128 + Math.sin(time * 3 + i * 0.1) * 40);
        }
        const demoData = {
          frequencyData: freq,
          timeDomainData: td,
          bass: Math.sin(time * 1.5) * 0.3 + 0.3,
          mids: Math.sin(time * 2.1) * 0.2 + 0.3,
          highs: Math.sin(time * 3.2) * 0.15 + 0.2,
          energy: Math.sin(time * 1.8) * 0.2 + 0.3,
          isBeat: Math.sin(time * 4) > 0.95,
        };
        MODES[mode].render(ctx, demoData, canvas.width, canvas.height, time, pal, sens);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [getData]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // File input handler
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadFile(file);
  }, [loadFile]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,.opus,.mp4,.webm,.3gp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Mode name indicator */}
      <div className="fixed bottom-4 left-4 z-40 glass px-4 py-2 pointer-events-none">
        <span className="font-display text-[10px] tracking-[0.2em] text-primary/70 uppercase">
          {MODES[currentMode].icon} {MODES[currentMode].name}
        </span>
      </div>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 z-40 glass p-2 neon-box transition-all hover:scale-110"
      >
        {isFullscreen ? (
          <Minimize className="w-4 h-4 text-primary" />
        ) : (
          <Maximize className="w-4 h-4 text-primary" />
        )}
      </button>

      {/* Control Panel */}
      <ControlPanel
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
        palette={palette}
        setPalette={setPalette}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        speed={speed}
        setSpeed={setSpeed}
        randomMode={randomMode}
        setRandomMode={setRandomMode}
        sourceName={sourceName}
        onLoadFile={() => fileInputRef.current?.click()}
        onLoadMic={loadMic}
        onLoadTab={loadTab}
        onStop={stop}
        isActive={isActive}
      />
    </div>
  );
};

export default Visualizer;
