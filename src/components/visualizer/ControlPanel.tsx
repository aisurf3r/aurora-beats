import { useState } from 'react';
import { MODES, PALETTE_NAMES, type PaletteName } from '@/lib/renderModes';
import { Mic, Upload, Monitor, Shuffle, Eye, EyeOff, X, ChevronDown, ChevronUp, Github } from 'lucide-react';

interface ControlPanelProps {
  currentMode: number;
  setCurrentMode: (m: number) => void;
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
  sensitivity: number;
  setSensitivity: (s: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  randomMode: boolean;
  setRandomMode: (r: boolean) => void;
  sourceName: string;
  onLoadFile: () => void;
  onLoadMic: () => void;
  onLoadTab: () => void;
  onStop: () => void;
  isActive: boolean;
}

export function ControlPanel({
  currentMode, setCurrentMode, palette, setPalette,
  sensitivity, setSensitivity, speed, setSpeed,
  randomMode, setRandomMode, sourceName,
  onLoadFile, onLoadMic, onLoadTab, onStop, isActive,
}: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed top-4 right-4 z-50 glass p-2 neon-box transition-all hover:scale-110"
        title="Show Controls"
      >
        <Eye className="w-5 h-5 text-primary" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 glass neon-box w-72 max-h-[90vh] overflow-y-auto transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <h3 className="font-display text-xs tracking-widest text-primary uppercase">Controls</h3>
        <div className="flex gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={() => setHidden(true)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-4">
          {/* Audio Source */}
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-1.5 block">Audio Source</label>
            {sourceName && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-primary truncate flex-1">{sourceName}</span>
                <button onClick={onStop} className="text-destructive hover:text-destructive/80"><X className="w-3 h-3" /></button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={onLoadFile} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Upload className="w-4 h-4" />
                <span className="text-[9px] font-display">FILE</span>
              </button>
              <button onClick={onLoadMic} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Mic className="w-4 h-4" />
                <span className="text-[9px] font-display">MIC</span>
              </button>
              <button onClick={onLoadTab} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Monitor className="w-4 h-4" />
                <span className="text-[9px] font-display">TAB</span>
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-1.5 block">Visualization Mode</label>
            <div className="grid grid-cols-2 gap-1">
              {MODES.map((mode, i) => (
                <button
                  key={mode.name}
                  onClick={() => setCurrentMode(i)}
                  className={`text-left p-2 rounded-lg text-[10px] transition-all ${
                    currentMode === i
                      ? 'bg-primary/20 text-primary border border-primary/40 neon-box'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
                  }`}
                >
                  <span className="mr-1">{mode.icon}</span>
                  {mode.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRandomMode(!randomMode)}
              className={`w-full mt-1.5 flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-display tracking-wider transition-all ${
                randomMode
                  ? 'bg-secondary/20 text-secondary border border-secondary/40'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 border border-transparent'
              }`}
            >
              <Shuffle className="w-3 h-3" />
              RANDOM MODE {randomMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Palette */}
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-1.5 block">Color Palette</label>
            <div className="grid grid-cols-5 gap-1">
              {PALETTE_NAMES.map(p => (
                <button
                  key={p}
                  onClick={() => setPalette(p)}
                  className={`p-1.5 rounded-lg text-[7px] font-display tracking-wider capitalize transition-all truncate text-center ${
                    palette === p
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">Sensitivity</label>
                <span className="text-[10px] text-primary">{sensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0.2" max="3" step="0.1"
                value={sensitivity}
                onChange={e => setSensitivity(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">Speed</label>
                <span className="text-[10px] text-primary">{speed.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0.2" max="3" step="0.1"
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Beat indicator */}
          {isActive && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-[10px] text-muted-foreground font-display tracking-wider">LISTENING</span>
            </div>
          )}

          {/* GitHub link */}
          <div className="flex justify-end pt-1">
            <a
              href="https://github.com/aisurf3r/Music-Visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
