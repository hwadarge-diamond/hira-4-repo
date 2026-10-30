# ⚡ RUN AND RUN // 3D Cyberpunk Endless Runner

> A complete, high-octane 3D endless runner built for modern desktop and mobile browsers with **Three.js**, post-processing neon bloom (**UnrealBloomPass**), and 100% synthesized procedural audio using the **Web Audio API**.

---

## 🎮 Game Overview & Lore
In the hyper-electrified sprawl of Neo-Tokyo 2099, the sky is choked with holographic data streams and rogue surveillance drones. You pilot an experimental cyber-operative equipped with quantum morphing armor. Pursued by the relentless **Hunter Apex Mech-Drone**, your objective is simple: **RUN AND RUN**. Evade laser barriers, shift forms on the fly, invert gravity to sprint across neon ceilings, and trigger neural overclocking to bend time itself.

---

## 🚀 Signature Features ("What Makes It Different")

1. **🔄 Gravity Inversion Pads**:
   - Collect or trigger glowing quantum pads (`[F]` / `[G]`) to sprint upside down on the ceiling! The camera smoothly rotates 180°, and the tracks generate mirrored obstacle patterns.
2. **🧬 Shape-Shift Forms (One-Key Morphing)**:
   - **⚡ Runner (Cyber-Ninja)**: Balanced form with slide and jump agility.
   - **🛸 Drone (Aero-Glider)**: Hovercraft form that automatically glides over low lasers and electro-grids.
   - **🔮 Orb (Quantum Gyro)**: Ultra-compact rolling sphere that rolls under high overhead gantries and pipes without needing to slide.
3. **⏱️ Neural Overclock (Bullet Time)**:
   - Fill your energy gauge with coins and near-miss dodges. Hold `[SHIFT]` (or tap the **TIME** button on mobile) to enter bullet-time: the world slows to 0.35x speed while your reflexes stay sharp, weaving through hyper-dense obstacle clusters with chromatic ghost trails.
4. **🌐 Dynamic Environmental Zones**:
   - **Neon Metropolis**: High-speed core sector.
   - **🧲 Magnet Flux Zone**: Coins gravitationally accelerate directly to the player with electromagnetic arcs.
   - **🪐 Zero-G Void Zone**: Sub-zero low-gravity physics allowing floaty lunar jumps.
   - **👾 Cyber-Glitch Zone**: Teleporting obstacles that flicker and phase across lanes with 0.5s warning indicators.
5. **🧠 Adaptive AI Director ("Neural Nexus")**:
   - Analyzes real-time player reaction times, combo streaks, and dodges. Dynamically tightens obstacle density and rewards skilled runs with adrenaline rushes, while granting brief breathing rooms if you recover from a stumble.
6. **🚨 Pursuing Boss ("Hunter Apex")**:
   - A hovering predatory drone trails behind you. If you make a mistake or hit an obstacle with a shield, the Hunter surges forward and sirens blare! A second mistake while the Hunter is close captures you—replacing cheap instant deaths with a tense two-hit pursuit mechanic.
7. **👻 Translucent Ghost Replay**:
   - Races against a glowing holographic replay clone of your personal best run in real time!
8. **📅 Daily Challenge**:
   - A seeded procedural track generated identically for all players worldwide based on today's calendar date, complete with a separate daily leaderboard.

---

## 🕹️ Controls

### Desktop Keyboard
| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Move Left** | `A` | `◄ Left Arrow` |
| **Move Right** | `D` | `► Right Arrow` |
| **Jump** | `W` / `Space` | `▲ Up Arrow` |
| **Slide / Fast Drop** | `S` | `▼ Down Arrow` |
| **Flip Gravity** | `F` | `G` |
| **Runner Form** | `1` | `Q` / `E` (cycle) |
| **Drone Form** | `2` | `Q` / `E` (cycle) |
| **Orb Form** | `3` | `Q` / `E` (cycle) |
| **Neural Overclock** | `Shift` (Hold) | Space (Hold when charged) |
| **Pause / Resume** | `P` | `Escape` |

### Mobile Touch Controls
- **Swipe Left / Right**: Dash between lanes
- **Swipe Up**: Jump
- **Swipe Down**: Slide / Fast Drop
- **On-Screen Buttons**: Dedicated ergonomic touch buttons for **JUMP**, **SLIDE**, **TIME** (Overclock), and **FORM SWITCHING** (⚡ / 🛸 / 🔮).

---

## 🛠️ Tech Stack & Architecture

- **3D Engine**: Three.js (r160) loaded via modern ES Module `<script type="importmap">`.
- **Post-Processing**: `EffectComposer`, `RenderPass`, and `UnrealBloomPass` for cyberpunk neon glow and emissive reflections.
- **Audio Synthesis**: 100% procedural **Web Audio API** engine in [`js/audio.js`](file:///c:/Users/hwada/OneDrive/Desktop/hira%204%20repo/js/audio.js):
  - Procedural 16-step synthwave music sequencer (kick, snare, 16th hats, rolling bassline, cyberpunk arpeggio).
  - Dynamic lowpass filter sweep and pitch warp during Neural Overclock bullet-time.
  - Procedural sound effects (jump, slide, lane dash, form transform, gravity flip, coin streak chimes, shield break, explosion impacts).
  - Zero external `.mp3` or `.wav` dependencies required.
- **Performance & Object Pooling**:
  - Zero garbage collection stutter: chunks, obstacles, coins, and particle bursts are recycled using fixed pools.
  - Low-quality / Bloom toggle in settings for mobile and battery-saver performance.
- **State & Saves**: Persistent `localStorage` save system for best score, daily challenge scores, bit currency, skin unlocks, and ghost replay recordings.

---

## 📁 Project Structure

```text
├── index.html           # Main HTML5 game layout & HUD elements
├── style.css            # Cyberpunk glassmorphic styling, Orbitron typography & animations
├── run_game.bat         # 1-Click Windows launcher script
├── README.md            # Comprehensive documentation & guide
└── js/
    ├── game.js          # Master game engine, AI Director, Hunter drone & loops
    ├── player.js        # 3D player models, animations, physics & form morphs
    ├── world.js         # Procedural endless track, parallax skyscrapers & billboards
    ├── obstacles.js     # Collision detection, form passes & near-miss triggers
    ├── powerups.js      # Coins, Gravity Pads, Shields, Magnets, Jetpacks
    ├── ui.js            # HUD, Cyber Garage shop, directive missions & modals
    └── audio.js         # Procedural Web Audio API synthesizer
```

---

## 🚀 How to Run & Deploy

### Option 1: 1-Click Windows Launch
Double-click [`run_game.bat`](file:///c:/Users/hwada/OneDrive/Desktop/hira%204%20repo/run_game.bat) in the project folder. It will automatically launch the local web server and open your default browser to `http://localhost:8000/index.html`.

### Option 2: Local Python / Node Server
In terminal:
```bash
# Using Python
python -m http.server 8000 --bind 127.0.0.1

# Or using Node.js
npx serve .
```
Then navigate to `http://localhost:8000/index.html` in Chrome, Firefox, Edge, or Safari.

### Option 3: Deploy to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Repository Settings** > **Pages**.
3. Under **Build and deployment**, select **Source: Deploy from a branch** and choose `main` / `/ (root)`.
4. Your game will be live globally on `https://<username>.github.io/<repo-name>/`.

---

## 💡 Future Upgrade Ideas
1. **Multiplayer Async Ghost Battles**: Stream and race against friends' ghost replays via lightweight WebRTC or Supabase websockets.
2. **Cyber Mech Boss Encounters**: Introduce boss phases where the Hunter Drone transforms and launches homing missiles that must be parried or dodged.
3. **Procedural Synthwave Track Radio**: Generate randomized melody seeds and chord progressions for infinite cyberpunk background tracks.
4. **Dynamic Weather Events**: Acid rain storms with lightning flashes, sandstorm dust devils in Solarpunk circuit, and aurora borealis in the Ice server farm.
