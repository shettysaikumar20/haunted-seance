# Ghost in the Machine & Marigold Archive

**Keep the story. Awaken the machine.**

An interactive horror and remembrance experience built for the Hacktoberfest Open-Source AI Challenge: Week 4, **“Ghost in the Machine”**. 

The project features two interconnected modes honoring Halloween & Día de los Muertos:
1. **The Haunted Seance Terminal:** A spooky, possessed terminal experience with procedural Web Audio soundscapes, volumetric fog particles, jumpscare camera shockwaves, and an offline horror lore engine.
2. **The Remembrance Garden (Marigold Archive):** A private, local-first garden where a person curates memories, and an open-weight model offers a gentle reflection citing source IDs (`[M01]`, `[M02]`) without ever impersonating the deceased person.
3. **Arduino UNO Q 8×13 LED Matrix:** Physical hardware integration with Qualcomm Linux + STM32U585 MCU over Bridge RPC, illuminating physical glyphs (Skull, Eye, Cross, and Marigold).

---

## Deploy to GitHub & Render (Free Hosting)

Detailed instructions are available in **[DEPLOY.md](DEPLOY.md)**.

### Quick Push to GitHub
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

### 1-Click Deploy on Render ([render.com](https://dashboard.render.com))
1. In Render, click **"New +"** $\rightarrow$ **"Blueprint"**.
2. Select your repository.
3. Render reads [`render.yaml`](render.yaml) and provisions the service automatically!

*(You can also deploy as a free **Static Site** on Render or **GitHub Pages**; all procedural audio, canvas fog, and local engines are built with zero external dependencies and work 100% in client-side static mode).*

---

## Quick Start (Run Locally)

The server runs on standard Python 3 with zero external package dependencies:

```powershell
python server.py
```

Open **[http://localhost:7000](http://localhost:7000)** in your browser.

The server automatically detects your environment:
1. **On Arduino UNO Q:** Connects to Arduino App Lab local LLM Brick and sends Bridge RPC signals to the physical STM32 microcontroller.
2. **On Desktop / Laptop with Ollama:** Queries your local open-weight model (e.g. `qwen2.5:3b`, `llama3.2`) at `http://127.0.0.1:11434`.
3. **Standalone / Offline / Cloud:** Uses the embedded local engine with the authentic 8×13 LED matrix simulator and real-time Web Audio API synthesizer.

---

## Key Features

- **Procedural Web Audio Engine:** Synthesizes low-frequency dread drones, creeping heartbeats (syncable BPM), whispering formants, death bells, creaks, and jumpscare stingers natively in the browser with 0 external audio files.
- **Dynamic Visuals:** Volumetric particle fog canvas, CRT scanlines, camera shockwaves, and flickering candlelight.
- **Seance Terminal:** Interactive prompt and response with typewriter pacing.
- **Interactive 8×13 LED Matrix:** Real-time simulation of the Arduino UNO Q's 104-LED matrix with 3-bit grayscale levels (Skull, Eye, Cross, and Marigold).
- **Data Sovereignty & Privacy:** All memories stay in `localStorage`. One-click JSON export and import. No cookies, no accounts, no analytics, no external CDNs.

---

## Challenge Fit & Details

- **Challenge:** Hacktoberfest Open-Source AI Challenge: Week 4 (“Ghost in the Machine”)
- **Theme Interpretation:** A dual interpretation honoring Día de los Muertos and Halloween—blending eerie horror terminal folklore with heartfelt human remembrance.
- **Open AI Tech:** Local open-weight models running on-device (Ollama / App Lab LLM Brick / embedded local engine).
- **Partner Category:** Arduino Category (Arduino UNO Q Qualcomm QRB2210 Linux + STM32U585 MCU + 8×13 LED Matrix).
- **Required Tag:** `hf26challenge`

---

## License

MIT. See [LICENSE](LICENSE).
