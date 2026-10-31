"""UNO Q app server: local story reflection, static UI, and MCU lantern pulse."""

from __future__ import annotations

import json
import mimetypes
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

# Hardware & App Lab Bridge
try:
    from arduino.app_utils import App, Bridge
    from arduino.app_bricks.llm import LargeLanguageModel
    HAS_ARDUINO_BOARD = True
except ImportError:
    HAS_ARDUINO_BOARD = False
    App = None
    Bridge = None
    LargeLanguageModel = None

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

APP_ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = APP_ROOT / "web"
HTTP_PORT = 7000
MODEL_NAME = "App Lab local LLM Brick"
OLLAMA_HOST = "http://127.0.0.1:11434"

_llm = None
_llm_lock = threading.Lock()

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


class SimulatedBridge:
    @staticmethod
    def notify(event: str) -> None:
        print(f"[Bridge Pulse] '{event}' triggered on LED Matrix.")


if Bridge is None:
    Bridge = SimulatedBridge()


def check_ollama() -> tuple[bool, str]:
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags")
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name", "") for m in data.get("models", [])]
                return True, (models[0] if models else "qwen2.5:3b")
    except Exception:
        pass
    return False, ""


def offline_reflection_engine(stories: list[dict]) -> str:
    valid_stories = [s for s in stories if isinstance(s, dict) and s.get("body", "").strip()]
    if not valid_stories:
        raise ValueError("Please provide at least one memory to gather.")

    person = valid_stories[0].get("person", "our loved one").strip() or "our loved one"
    items = [{"id": s.get("id", "M01"), "title": s.get("title", "").strip(), "body": s.get("body", "").strip()} for s in valid_stories]

    if len(items) == 1:
        s0 = items[0]
        return (
            f"Holding this single memory close [{s0['id']}], we remember {person} through {s0['title'].lower() or 'this moment'}. "
            f"The details remain clear: {s0['body'].rstrip('.')}. "
            f"Rather than searching for patterns where there is only one quiet memory, we keep this story intact as its own light [{s0['id']}]."
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
            f"These two moments [{first['id']}, {second['id']}] hold open the door to what stayed true. "
            f"Tended with care, their warmth continues to bloom."
        )
    return synthesis


def make_reflection(stories: list[dict]) -> tuple[str, str]:
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
            return reflection, MODEL_NAME

    ollama_ok, ollama_model = check_ollama()
    if ollama_ok:
        try:
            req_data = json.dumps({
                "model": ollama_model, "stream": False,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
            }).encode("utf-8")
            req = urllib.request.Request(f"{OLLAMA_HOST}/api/chat", data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=40.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data.get("message", {}).get("content", "").strip()
                if content:
                    return content, f"Ollama ({ollama_model})"
        except Exception:
            pass

    return offline_reflection_engine(stories), "Marigold Local Inference Engine"


class Handler(BaseHTTPRequestHandler):
    server_version = "MarigoldUNOQ/1.0"

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
            ollama_ok, ollama_model = check_ollama()
            self.send_json(200, {
                "board": HAS_ARDUINO_BOARD,
                "model": MODEL_NAME if HAS_ARDUINO_BOARD else (ollama_model if ollama_ok else "Local Engine"),
                "inference": "on-device" if HAS_ARDUINO_BOARD else ("local-ollama" if ollama_ok else "local-offline"),
                "matrix": MARIGOLD_MATRIX,
            })
            return

        relative = "index.html" if path in ("", "/") else path.lstrip("/")
        target = (WEB_ROOT / relative).resolve()
        if WEB_ROOT.resolve() not in target.parents and target != WEB_ROOT.resolve():
            self.send_json(403, {"error": "Invalid path."})
            return
        if not target.is_file():
            self.send_json(404, {"error": "Not found."})
            return
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_bytes(200, target.read_bytes(), f"{content_type}; charset=utf-8")

    def do_POST(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/lantern/test":
            Bridge.notify("memory_gathered")
            self.send_json(200, {"status": "pulsed", "matrix": MARIGOLD_MATRIX})
            return

        if path != "/api/reflection":
            self.send_json(404, {"error": "Not found."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 60_000:
                raise ValueError("Request must be under 60 KB.")
            payload = json.loads(self.rfile.read(length))
            reflection, model_used = make_reflection(payload.get("stories", []))
            try:
                Bridge.notify("memory_gathered")
            except Exception as exc:
                print(f"[lantern] MCU pulse error: {exc}")
            self.send_json(200, {
                "reflection": reflection,
                "model": model_used,
                "hardware": "UNO Q 8x13 LED matrix",
                "matrix": MARIGOLD_MATRIX,
            })
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})
        except Exception as exc:
            print(f"[reflection] {exc}")
            self.send_json(503, {"error": f"Local reflection unavailable: {exc}"})

    def log_message(self, fmt: str, *args) -> None:
        print("[web] " + (fmt % args))


def start_web_server() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", HTTP_PORT), Handler)
    print(f"[marigold] Web application running at http://localhost:{HTTP_PORT}")
    server.serve_forever()


if __name__ == "__main__":
    if HAS_ARDUINO_BOARD and App is not None:
        threading.Thread(target=start_web_server, name="marigold-web", daemon=True).start()
        App.run()
    else:
        start_web_server()
