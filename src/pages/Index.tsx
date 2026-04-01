import { useNavigate } from 'react-router-dom';
import { Play, Waves } from 'lucide-react';

const FloatingOrb = ({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) => (
  <div
    className="absolute rounded-full opacity-20 animate-float"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      animationDelay: `${delay}s`,
      background: `radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)`,
    }}
  />
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Animated background orbs */}
      <FloatingOrb delay={0} size={300} x="10%" y="20%" />
      <FloatingOrb delay={2} size={200} x="70%" y="10%" />
      <FloatingOrb delay={4} size={250} x="50%" y="60%" />
      <FloatingOrb delay={1} size={180} x="80%" y="70%" />
      <FloatingOrb delay={3} size={150} x="20%" y="80%" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Waves className="w-10 h-10 text-primary animate-glow-pulse" />
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-3 neon-glow text-primary">
          AURORA
        </h1>
        <p className="font-display text-lg md:text-xl tracking-[0.3em] text-muted-foreground mb-2">
          VISUALIZER
        </p>
        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-12">
          Immersive audio-reactive visual experience. Upload music, use your mic, or capture tab audio.
        </p>

        <button
          onClick={() => navigate('/visualizer')}
          className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-display text-sm tracking-widest uppercase transition-all duration-300 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/60 neon-box hover:scale-105"
        >
          <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
          Start Visualizer

          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-2xl border border-primary/20" style={{ animation: 'pulse-ring 3s ease-out infinite' }} />
          <span className="absolute inset-0 rounded-2xl border border-primary/10" style={{ animation: 'pulse-ring 3s ease-out infinite 1s' }} />
        </button>

        <div className="mt-16 flex items-center gap-6 text-[10px] font-display tracking-[0.2em] text-muted-foreground/40 uppercase">
          <span>8 Visual Modes</span>
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span>Beat Detection</span>
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span>Real-time</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
