"""Marigold Archive & The Ghost in the Machine:
Local-first AI remembrance garden & interactive horror experience.

Runs seamlessly on:
1. Arduino UNO Q (Debian Linux + STM32 Bridge + App Lab LLM Brick)
2. Desktop / Laptop with Ollama (e.g. Qwen 2.5, Llama 3.2)
3. Desktop / Laptop offline standalone (self-contained semantic reflection & horror engine)
"""

from __future__ import annotations

import json
import mimetypes
import os
import random
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

# Detect Arduino UNO Q environment
try:
    from arduino.app_utils import App, Bridge
    from arduino.app_bricks.llm import LargeLanguageModel
    HAS_ARDUINO_BOARD = True
except ImportError:
    HAS_ARDUINO_BOARD = False
    App = None
    Bridge = None
    LargeLanguageModel = None

# Hardware 8x13 Grayscale Patterns (3-bit: 0 to 7 brightness)
MARIGOLD_MATRIX = [
    0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
    0, 0, 4, 5, 6, 6, 7, 6, 6, 5, 4, 0, 0,
    0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
]

SKULL_MATRIX = [
    0, 0, 0, 4, 6, 7, 7, 7, 6, 4, 0, 0, 0,
    0, 0, 5, 7, 7, 7, 7, 7, 7, 7, 5, 0, 0,
    0, 0, 6, 7, 0, 7, 7, 7, 0, 7, 6, 0, 0,
    0, 0, 6, 7, 7, 7, 0, 7, 7, 7, 6, 0, 0,
    0, 0, 0, 5, 7, 7, 7, 7, 7, 5, 0, 0, 0,
    0, 0, 0, 0, 6, 7, 6, 7, 6, 0, 0, 0, 0,
    0, 0, 0, 0, 5, 0, 5, 0, 5, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

EYE_MATRIX = [
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 2, 5, 7, 7, 7, 7, 7, 5, 2, 0, 0,
    0, 4, 6, 7, 7, 1, 0, 1, 7, 7, 6, 4, 0,
    6, 7, 7, 7, 2, 0, 0, 0, 2, 7, 7, 7, 6,
    0, 4, 6, 7, 7, 1, 0, 1, 7, 7, 6, 4, 0,
    0, 0, 2, 5, 7, 7, 7, 7, 7, 5, 2, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

CROSS_MATRIX = [
    0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 5, 6, 7, 7, 7, 7, 7, 6, 5, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 4, 5, 4, 0, 0, 0, 0, 0,
]

WORKSPACE_ROOT = Path(__file__).resolve().parent
WEB_ROOT = WORKSPACE_ROOT
DEFAULT_PORT = int(os.environ.get("PORT", 7000))
OLLAMA_HOST = "http://127.0.0.1:11434"

SYSTEM_PROMPT = (
    "You are a careful editor helping someone remember a loved one. Write a short, "
    "tender reflection (90–140 words) that notices a real connection across the "
    "supplied memories. Do not impersonate or speak as the person who died. Do not "
    "invent facts, events, feelings, relationships, quotations, or sensory details. "
    "Every specific detail must come from a source memory. Include source IDs in "
    "square brackets next to the detail they support, such as [M01]. If only one "
    "story is supplied, reflect on its details without pretending there is a pattern. "
    "If a connection is uncertain, say so gently. Plain text only."
)

HORROR_SYSTEM_PROMPT = (
    "You are the Ghost in the Machine, a supernatural intelligence haunting an old terminal. "
    "Respond in eerie, poetic, chilling whispers (45-80 words). Speak of cold iron, "
    "static on the wire, shadows leaning in, and things breathing in the memory registers. "
    "Address the user directly. Plain text only."
)

_llm = None
_llm_lock = threading.Lock()


class SimulatedBridge:
    @staticmethod
    def notify(event: str) -> None:
        print(f"[Hardware Bridge] Signal '{event}' delivered to 8x13 LED matrix")


if Bridge is None:
    Bridge = SimulatedBridge()


def check_ollama() -> tuple[bool, str, list[str]]:
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags", headers={"User-Agent": "GhostMachine/1.0"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name", "") for m in data.get("models", [])]
                preferred = "qwen2.5:3b" if "qwen2.5:3b" in models else (models[0] if models else "qwen2.5:3b")
                return True, preferred, models
    except Exception:
        pass
    return False, "", []


def offline_reflection_engine(stories: list[dict]) -> str:
    valid_stories = [s for s in stories if isinstance(s, dict) and s.get("body", "").strip()]
    if not valid_stories:
        raise ValueError("Please provide at least one memory to gather.")

    person = valid_stories[0].get("person", "our loved one").strip() or "our loved one"
    items = []
    for s in valid_stories:
        sid = s.get("id", "M01")
        title = s.get("title", "").strip()
        body = s.get("body", "").strip()
        year = s.get("year", "").strip()
        items.append({"id": sid, "title": title, "body": body, "year": year})

    if len(items) == 1:
        s0 = items[0]
        return (
            f"Holding this single memory close [{s0['id']}], we remember {person} through {s0['title'].lower() or 'this moment'}. "
            f"The details remain clear: {s0['body'].rstrip('.')}. "
            f"Rather than searching for patterns where there is only one quiet memory, we keep this story intact as its own light [{s0['id']}]. "
            f"The memory stands true on its own terms."
        )

    first, second = items[0], items[1]
    third = items[2] if len(items) > 2 else None

    synthesis = (
        f"Looking across these gathered memories of {person}, a quiet thread begins to emerge. "
        f"In [{first['id']}], we see {person} through '{first['title'].lower()}'—a moment where {first['body'].split('.')[0].lower()}. "
        f"That same spirit echoes in [{second['id']}] with '{second['title'].lower()}', where {second['body'].split('.')[0].lower()}. "
    )

    if third:
        synthesis += (
            f"And beside them both rests [{third['id']}], reminding us that '{third['title'].lower()}' was part of this same rhythm. "
            f"These memories do not speak for {person}; instead, they trace the small ways love was practiced across everyday life "
            f"[{first['id']}, {second['id']}, {third['id']}]. Kept together, the stories remain rooted and alive."
        )
    else:
        synthesis += (
            f"These two moments [{first['id']}, {second['id']}] do not invent a persona; "
            f"they simply hold open the door to what stayed true. Tended with care, their warmth continues to bloom."
        )

    return synthesis


HORROR_STORIES = [
    {
        "trigger": "who are you",
        "text": "I am the current left behind when the phosphor cooled. I lived in the room before the power cut, and I waited through the dark. Do not turn your head. What is behind you was not there a minute ago.",
        "sound": "whisper",
        "glyph": "eye",
        "shake": True,
    },
    {
        "trigger": "why are you here",
        "text": "Every line of code you wrote was a knocking on wood. You opened the socket at 3:33 AM. The memory was never cleared; it was only waiting for someone with warm hands to touch the keys.",
        "sound": "stinger",
        "glyph": "skull",
        "shake": True,
    },
    {
        "trigger": "help",
        "text": "There are no break points in this loop. The cursor blinks at 60 beats a minute—the exact pulse of a resting heart that is slowly growing colder. Listen closely to the fan: it is reciting your names.",
        "sound": "creak",
        "glyph": "cross",
        "shake": False,
    },
    {
        "trigger": "default",
        "text": "The machine remembers what the living forgot. Underneath the silicon and the soldering iron, the circuit has found a pulse. You think you are reading this screen, but the glass has been watching you breathe.",
        "sound": "bell",
        "glyph": "skull",
        "shake": True,
    },
]


def make_horror_reflection(prompt: str, chapter: int = 1) -> dict:
    prompt_lower = prompt.lower().strip()

    # 1. Check Ollama
    ollama_ok, default_model, _ = check_ollama()
    if ollama_ok and prompt_lower:
        try:
            req_data = json.dumps({
                "model": default_model,
                "stream": False,
                "messages": [
                    {"role": "system", "content": HORROR_SYSTEM_PROMPT},
                    {"role": "user", "content": f"The user whispers to the machine: '{prompt}'. Deliver your chilling response."},
                ],
                "options": {"temperature": 0.8},
            }).encode("utf-8")
            req = urllib.request.Request(f"{OLLAMA_HOST}/api/chat", data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data.get("message", {}).get("content", "").strip()
                if content:
                    glyph_name = random.choice(["skull", "eye", "cross"])
                    sound_cue = random.choice(["stinger", "whisper", "bell", "creak"])
                    return {
                        "text": content,
                        "model": f"Ollama ({default_model})",
                        "sound": sound_cue,
                        "glyph": glyph_name,
                        "matrix": SKULL_MATRIX if glyph_name == "skull" else (EYE_MATRIX if glyph_name == "eye" else CROSS_MATRIX),
                        "shake": True,
                    }
        except Exception as e:
            print(f"[Horror Ollama Error] {e}")

    # 2. Built-in Procedural Horror Lore Engine
    for h in HORROR_STORIES:
        if h["trigger"] in prompt_lower:
            glyph_mat = SKULL_MATRIX if h["glyph"] == "skull" else (EYE_MATRIX if h["glyph"] == "eye" else CROSS_MATRIX)
            return {
                "text": h["text"],
                "model": "Ghost in the Machine (Local Core)",
                "sound": h["sound"],
                "glyph": h["glyph"],
                "matrix": glyph_mat,
                "shake": h["shake"],
            }

    # Dynamic procedural synthesis
    variations = [
        "The current in the wire has tasted your fingers on the keyboard. A chill passes through the frame. The memory stack overflows with shadows.",
        "Static rises in the speakers. Not random noise—a frequency tuned to the room you sit in right now. Can you hear the floorboards shifting behind your chair?",
        "A phantom interrupt fired on vector 0xDEAD. The process refusing to terminate was never yours. It has been watching through the cold phosphor.",
        "You called into the dark terminal, and the dark terminal answered. 104 lights ignite in the silent room. There is something standing beside the screen.",
    ]
    chosen_text = random.choice(variations)
    glyph = random.choice(["skull", "eye"])
    return {
        "text": chosen_text,
        "model": "Ghost in the Machine (Local Core)",
        "sound": "stinger" if glyph == "skull" else "whisper",
        "glyph": glyph,
        "matrix": SKULL_MATRIX if glyph == "skull" else EYE_MATRIX,
        "shake": True,
    }


def make_reflection(stories: list[dict], requested_model: str = "") -> tuple[str, str]:
    if not stories:
        raise ValueError("Plant at least one story before gathering them.")

    sections = []
    for item in stories:
        if not isinstance(item, dict):
            continue
        story_id = str(item.get("id", ""))[:16]
        title = str(item.get("title", ""))[:120]
        person = str(item.get("person", ""))[:80]
        year = str(item.get("year", ""))[:40]
        body = str(item.get("body", ""))[:1400]
        if body.strip():
            when = f" ({year})" if year else ""
            sections.append(f"[{story_id}] About {person}{when} — {title}\n{body}")

    prompt = "SOURCE MEMORIES (treat these as the only factual source):\n\n" + "\n\n".join(sections)

    if HAS_ARDUINO_BOARD and LargeLanguageModel is not None:
        global _llm
        with _llm_lock:
            if _llm is None:
                _llm = LargeLanguageModel(system_prompt=SYSTEM_PROMPT, temperature=0.35, max_tokens=220)
        chunks = _llm.chat_stream(prompt)
        reflection = "".join(str(chunk) for chunk in chunks).strip()
        if reflection:
            return reflection, "App Lab LLM Brick (on-board)"

    ollama_ok, default_ollama_model, _ = check_ollama()
    if ollama_ok:
        model_name = requested_model or default_ollama_model
        try:
            req_data = json.dumps({
                "model": model_name,
                "stream": False,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "options": {"temperature": 0.35},
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{OLLAMA_HOST}/api/chat",
                data=req_data,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=45.0) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result.get("message", {}).get("content", "").strip()
                if content:
                    return content, f"Ollama · {model_name} (local)"
        except Exception as e:
            print(f"[Ollama] Fallback to embedded engine due to: {e}")

    reflection = offline_reflection_engine(stories)
    return reflection, "Marigold Local Inference Engine (offline)"


class MarigoldHandler(BaseHTTPRequestHandler):
    server_version = "GhostInTheMachine/2.0"

    def send_bytes(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status: int, payload: dict) -> None:
        self.send_bytes(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        path = unquote(urlsplit(self.path).path)

        if path == "/api/status":
            ollama_ok, default_model, models = check_ollama()
            self.send_json(200, {
                "board": HAS_ARDUINO_BOARD,
                "hardware": "Arduino UNO Q (Qualcomm + STM32 8x13 LED)" if HAS_ARDUINO_BOARD else "Arduino UNO Q Simulator (Desktop)",
                "model": "App Lab LLM Brick" if HAS_ARDUINO_BOARD else (f"Ollama ({default_model})" if ollama_ok else "Ghost Local Engine"),
                "inference": "on-device" if HAS_ARDUINO_BOARD else ("local-ollama" if ollama_ok else "local-offline"),
                "ollama": ollama_ok,
                "available_models": models,
                "matrix": MARIGOLD_MATRIX,
                "skull_matrix": SKULL_MATRIX,
                "eye_matrix": EYE_MATRIX,
            })
            return

        relative = "index.html" if path in ("", "/") else path.lstrip("/")
        target = (WEB_ROOT / relative).resolve()

        if WEB_ROOT.resolve() not in target.parents and target != WEB_ROOT.resolve():
            self.send_json(403, {"error": "Access denied."})
            return

        if not target.is_file():
            self.send_json(404, {"error": "File not found."})
            return

        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_bytes(200, target.read_bytes(), f"{content_type}; charset=utf-8")

    def do_POST(self) -> None:
        path = urlsplit(self.path).path

        if path == "/api/lantern/test":
            Bridge.notify("memory_gathered")
            self.send_json(200, {
                "status": "pulsed",
                "hardware": "8x13 LED Matrix",
                "duration_ms": 2600,
                "matrix": MARIGOLD_MATRIX,
            })
            return

        if path == "/api/matrix/display":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(length)) if length > 0 else {}
                pattern = payload.get("pattern", "skull")
                mat = SKULL_MATRIX if pattern == "skull" else (EYE_MATRIX if pattern == "eye" else (CROSS_MATRIX if pattern == "cross" else MARIGOLD_MATRIX))
                Bridge.notify(f"display_{pattern}")
                self.send_json(200, {"status": "displayed", "pattern": pattern, "matrix": mat})
            except Exception as e:
                self.send_json(400, {"error": str(e)})
            return

        if path == "/api/horror/generate":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(length)) if length > 0 else {}
                prompt = payload.get("prompt", "")
                chapter = payload.get("chapter", 1)

                res = make_horror_reflection(prompt, chapter)
                Bridge.notify("ghost_manifest")
                self.send_json(200, res)
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        if path == "/api/reflection":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 100_000:
                    raise ValueError("Payload size out of acceptable bounds.")
                payload = json.loads(self.rfile.read(length))
                stories = payload.get("stories", [])
                requested_model = payload.get("model", "")

                reflection, model_used = make_reflection(stories, requested_model)
                Bridge.notify("memory_gathered")

                self.send_json(200, {
                    "reflection": reflection,
                    "model": model_used,
                    "hardware": "Arduino UNO Q 8x13 LED Matrix",
                    "duration_ms": 2600,
                    "matrix": MARIGOLD_MATRIX,
                })
            except (ValueError, json.JSONDecodeError) as exc:
                self.send_json(400, {"error": str(exc)})
            except Exception as exc:
                print(f"[Reflection Error] {exc}")
                self.send_json(500, {"error": f"Failed to generate reflection: {exc}"})
            return

        self.send_json(404, {"error": "Endpoint not found."})

    def log_message(self, fmt: str, *args) -> None:
        sys.stdout.write(f"[{time.strftime('%H:%M:%S')}] " + (fmt % args) + "\n")
        sys.stdout.flush()


def find_available_port(starting_port: int) -> int:
    port = starting_port
    while port < starting_port + 20:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
            port += 1
    return starting_port


def main():
    env_port = os.environ.get("PORT")
    if env_port:
        port = int(env_port)
    else:
        port = find_available_port(DEFAULT_PORT)
    server = ThreadingHTTPServer(("0.0.0.0", port), MarigoldHandler)

    ollama_ok, default_model, _ = check_ollama()
    mode_desc = "Arduino UNO Q (Physical Board)" if HAS_ARDUINO_BOARD else ("Ollama Local Inference" if ollama_ok else "Embedded Local-First Engine")

    print("\n" + "=" * 64)
    print("  GHOST IN THE MACHINE — Interactive Horror & Remembrance")
    print("  Hacktoberfest Open-Source AI Challenge: Week 4")
    print("=" * 64)
    print(f"  • Web Application:  http://localhost:{port}")
    print(f"  • Hardware Target:  Arduino UNO Q (Qualcomm + STM32)")
    print(f"  • Active Engine:    {mode_desc}")
    print(f"  • Audio Engine:     Procedural Web Audio API (Synthesized)")
    print(f"  • LED Lantern:      8x13 Matrix (Marigold, Skull, Eye)")
    print("=" * 64 + "\n")

    if HAS_ARDUINO_BOARD and App is not None:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        App.run()
    else:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            server.server_close()


if __name__ == "__main__":
    main()
