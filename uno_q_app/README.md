# Marigold Archive on Arduino UNO Q

This is the App Lab package for the Marigold Archive project. It runs the open-weight reflection model through Arduino App Lab's local LLM Brick on the UNO Q's Linux side. When a reflection is ready, Linux sends an RPC notification to the STM32 sketch, which displays a marigold glyph on the built-in 8×13 LED matrix as a physical memory-lantern cue.

## Set up the board environment

The UNO Q 4 GB model runs Debian Linux and has Arduino App Lab pre-installed for standalone use. The shortest path from this Windows workspace is PC-connected mode: install [Arduino App Lab](https://www.arduino.cc/en/software/), connect the UNO Q with a USB-C data cable, import this `uno_q_app` folder, and run it on the connected board. For standalone mode, copy the folder onto the UNO Q first, then import it in the board's pre-installed App Lab.

1. Power the board with a USB-C supply rated for 5 V / 3 A.
2. For standalone use, connect a monitor, keyboard, and mouse through a powered USB-C hub, then connect the board to your private Wi-Fi. App Lab is pre-installed.
3. Import this `uno_q_app` folder as an Arduino App. In PC-connected mode, App Lab on Windows reads the folder in this workspace and deploys it to the USB- or network-connected board. In standalone mode, first copy the folder onto the board.
4. In this app's **Bricks** panel, add/enable **Large Language Model (`arduino:llm`)**. In its **AI Models** tab, download a compact model offered for the UNO Q 4 GB configuration. The model download needs internet the first time; inference after that is local.
5. Click **Run** in App Lab. The Python console prints the board address. Open `http://<board-address>:7000` from the board's browser or a device on the same private network.

App Lab starts the Python web server, provisions the LLM Brick, and flashes the STM32 sketch together. The `app.yaml`, `python/main.py`, and `sketch/` files are the App Lab app structure. The browser UI is bundled in `web/`.

## Hardware behavior

The UNO Q's Linux-side model writes the reflection. After a successful response, the backend notifies the STM32 side over Arduino Bridge RPC. The MCU draws a marigold glyph on the built-in LED matrix for 2.6 seconds, then clears it. The glyph is a tangible acknowledgement that a story reflection was gathered; no memory text is sent to the MCU.

The stories remain in the visiting browser's local storage. When the browser is on the UNO Q monitor, this is the board's local browser profile. When opening the UI from another device, its story text travels over the same LAN to the board for local inference; use this mode only on a trusted private network because the local web server has no account or TLS layer. The app does not call a cloud model.

## If the UNO Q is not available

The project's root `index.html` can run on a laptop with `python -m http.server 8000` and Ollama running locally. That path calls `http://localhost:11434/api/chat`; the App Lab package instead uses the on-board LLM Brick. The two paths share the same UI and prompt safeguards.
