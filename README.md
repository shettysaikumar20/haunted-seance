# Marigold Archive

**Keep the story. Let it bloom.**

Marigold Archive is a local-first remembrance garden for family stories, built for the Hacktoberfest Open-Source AI Challenge: Week 4, **“Ghost in the Machine”**. 

A person writes and curates the memories; an open-weight model running entirely on their own device notices quiet connections across the stories and weaves a short, tender reflection. Every reflection strictly cites source story IDs (`[M01]`, `[M02]`), refuses to hallucinate facts, and **never impersonates the person being remembered**.

When run on the **Arduino UNO Q**, the Qualcomm Linux side runs the model, and the STM32 microcontroller illuminates a golden marigold (*cempasúchil*) on the built-in 8×13 LED matrix for 2.6 seconds over Arduino Bridge RPC—a physical memory lantern for the moment of remembrance.

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
3. **Standalone / Offline:** Uses the embedded local reflection engine with the authentic 8×13 LED matrix simulator—100% offline with zero cloud access, no API keys, and no network requests.

---

## Key Features

- **Story Seeds:** Plant memories with title, person, year, and personal recollection.
- **Local AI Reflection:** Generates tender 90–140 word reflections discovering connections across memories without impersonation.
- **Interactive 8×13 LED Matrix Lantern:** Real-time simulation of the Arduino UNO Q's 104-LED display, featuring 3-bit grayscale brightness and the exact marigold bloom animation (`sketch.ino`).
- **Data Sovereignty & Privacy:** All memories stay in `localStorage`. One-click JSON export and import. No cookies, no accounts, no analytics, no external CDNs.
- **Día de los Muertos & Halloween Theme:** Honors oral histories and memories carried forward in the spirit of remembrance.

---

## Arduino UNO Q Hardware Setup

The App Lab project lives in [`uno_q_app`](uno_q_app/README.md). The UNO Q 4 GB runs Debian and has Arduino App Lab pre-installed for standalone use; it also supports PC-connected development with the App Lab desktop app.

1. Power the board with a 5 V / 3 A USB-C supply. For standalone mode, connect a monitor, keyboard, and mouse through a powered USB-C hub and connect to your private Wi-Fi.
2. Open Arduino App Lab and import the `uno_q_app` folder. The app manifest includes the local LLM Brick and port 7000; its sketch uses Bridge RPC (`Arduino_RouterBridge.h`) to draw the marigold on the MCU's LED matrix.
3. In the LLM Brick's **AI Models** tab, download a compact model offered for the UNO Q.
4. Run the app and navigate to `http://<board-address>:7000`.

---

## Challenge Fit & Details

- **Challenge:** Hacktoberfest Open-Source AI Challenge: Week 4 (“Ghost in the Machine”)
- **Theme Interpretation:** A living remembrance garden honoring ancestors in the spirit of Día de los Muertos—replacing uncanny AI personas with genuine human storytelling and local open-weight models.
- **Open AI Tech:** Local open-weight models running on-device (Ollama / App Lab LLM Brick / embedded local engine).
- **Partner Category:** Arduino Category (Arduino UNO Q Qualcomm QRB2210 Linux + STM32U585 MCU + 8×13 LED Matrix).
- **Required Tag:** `hf26challenge`

---

## License

MIT. See [LICENSE](LICENSE).
