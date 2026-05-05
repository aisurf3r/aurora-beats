<p align="center">
  <h1 align="center">🌌 Aurora Beats Music Visualizer</h1>
  <p align="center">
    <strong>An ultra-immersive, real-time music visualizer running 100% in the browser</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#modes">Visual Modes</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#controls">Controls</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</p>

---
<img width="1883" height="866" alt="{58704D77-4C76-4427-A3E6-3204FBEEDD2E}" src="https://github.com/user-attachments/assets/8acdc836-89f0-4f68-bab4-83e8186c7620" />
<img width="1639" height="858" alt="{33F73859-2980-471E-B8C8-BE2AAF698F47}" src="https://github.com/user-attachments/assets/9352b444-36d9-402a-a691-49e0a8392047" />
<img width="1630" height="985" alt="{1B1276DF-2679-4ED5-8520-B8C65A3565A4}" src="https://github.com/user-attachments/assets/de892185-2e25-4f69-9248-e773d75f3561" />


## ✨ Features

- 🎵 **Real-time audio analysis** using the Web Audio API (`AnalyserNode`, FFT)
- 🎤 **Multiple audio sources**: local files (MP3/WAV/FLAC), microphone, or browser tab capture
- 🎨 **10 color palettes**: Cyber, Aurora, Fire, Ocean, Rainbow, Synthwave, Toxic, Sunset, Ice, Galaxy
- 🔄 **Random Mode**: auto-cycles between visual scenes every 30–60 seconds
- 🥁 **Beat detection**: visual effects react to bass hits, mids, and highs in real-time
- 📱 **Responsive**: works on desktop and mobile devices
- 🖥️ **Fullscreen support** with one-click toggle
- 🎛️ **Glassmorphic control panel** with adjustable sensitivity and speed
- 🌙 **Demo mode**: animated visuals even without audio input

## 🎆 Visual Modes <a name="modes"></a>

| # | Mode | Description |
|---|------|-------------|
| 1 | 📊 **Frequency Bars** | Radial frequency bars with mirror reflections and neon glow |
| 2 | 🔮 **Kaleidoscope** | Symmetric geometric patterns that rotate and pulse with beats |
| 3 | ✨ **Particle Galaxy** | Hundreds of reactive particles forming constellations |
| 4 | 💧 **Liquid Blob** | Organic fluid shapes that deform and flow with the audio |
| 5 | 🌀 **Tunnel** | Infinite 3D tunnel with hexagonal rings advancing to the beat |
| 6 | 🌌 **Aurora Borealis** | Flowing curtains of light with shimmer particles on beats |
| 7 | 🎛️ **Equalizer** | 64-band equalizer bars with rounded caps, mirror reflections, and floating peak dots |
| 8 | 🌀 **Spiral Vortex** | Hypnotic spiral arms with frequency-reactive wobble |
| 9 | 🔵 **Neon Sphere** | Wireframe geometries with neon colors reacting to frequency bands |
| 10| 💥 **Shockwave** | Expanding shockwave rings triggered by beat peaks |

## 🚀 Getting Started <a name="getting-started"></a>

### Prerequisites

- Node.js 18+ and npm/bun

### Installation

```bash
# Clone the repository
git clone https://github.com/aisurf3r/Music-Visualizer.git
cd Music-Visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Usage

1. Click **"Start Visualizer"** on the landing page
2. Choose an audio source:
   - **FILE** — Upload an MP3, WAV, or FLAC file
   - **MIC** — Use your microphone as input
   - **TAB** — Capture audio from another browser tab
3. Select a visual mode and color palette from the control panel
4. Adjust **Sensitivity** and **Speed** to your liking
5. Toggle **Random Mode** to auto-cycle between scenes

> 💡 **Tip**: The visualizer runs in demo mode with simulated audio data when no source is connected — great for previewing modes!

## 🎛️ Controls <a name="controls"></a>

| Control | Description |
|---------|-------------|
| **Mode Selector** | Switch between 8 visual modes |
| **Random Mode** | Auto-switch modes every 30–60 seconds |
| **Color Palette** | Choose from 10 psychedelic color themes |
| **Sensitivity** | How strongly visuals react to audio (0.2–3.0) |
| **Speed** | Animation speed multiplier (0.2–3.0) |
| **Fullscreen** | Toggle fullscreen mode (bottom-right button) |
| **Hide/Show Panel** | Collapse or hide the control panel |

## 🛠️ Tech Stack <a name="tech-stack"></a>

- **React 18** + **TypeScript** — UI framework
- **Vite 5** — Build tool with HMR
- **Tailwind CSS v3** — Utility-first styling with custom design tokens
- **Web Audio API** — Real-time audio analysis (AnalyserNode, FFT)
- **Canvas 2D** — High-performance rendering with `requestAnimationFrame`
- **Lucide React** — Beautiful icon set

## 📁 Project Structure

```
src/
├── components/
│   ├── visualizer/
│   │   └── ControlPanel.tsx    # Glassmorphic controls overlay
│   └── ui/                     # Reusable UI components (shadcn/ui)
├── hooks/
│   └── useAudioAnalyzer.ts     # Web Audio API hook with beat detection
├── lib/
│   └── renderModes.ts          # All 8 visual modes + color system
├── pages/
│   ├── Index.tsx               # Landing page
│   └── Visualizer.tsx          # Main visualizer canvas + loop
└── index.css                   # Design tokens & custom animations
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by Aisurf3r and pasion for 🎵 
</p>
