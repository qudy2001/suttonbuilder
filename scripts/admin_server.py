#!/usr/bin/env python3

from __future__ import annotations

import cgi
import json
import mimetypes
import os
import re
import sys
import tempfile
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ADMIN_DIR = PROJECT_ROOT / "admin"
CONTENT_PATH = PROJECT_ROOT / "assets" / "data" / "site-content.json"
UPLOAD_DIR = PROJECT_ROOT / "assets" / "uploads"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized or "image"


def ensure_inside_root(path: Path) -> bool:
    try:
        path.resolve().relative_to(PROJECT_ROOT.resolve())
        return True
    except ValueError:
        return False


class AdminHandler(BaseHTTPRequestHandler):
    server_version = "BuilderAdmin/1.0"

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/":
            self.serve_file(ADMIN_DIR / "index.html", "text/html; charset=utf-8")
            return

        if path == "/admin.css":
            self.serve_file(ADMIN_DIR / "admin.css", "text/css; charset=utf-8")
            return

        if path == "/admin.js":
            self.serve_file(ADMIN_DIR / "admin.js", "application/javascript; charset=utf-8")
            return

        if path == "/api/content":
            self.handle_get_content()
            return

        if path == "/api/health":
            self.respond_json({"ok": True, "contentPath": str(CONTENT_PATH.relative_to(PROJECT_ROOT))})
            return

        if path.startswith("/assets/"):
            self.handle_static_asset(path)
            return

        self.send_error(404, "Not found")

    def do_PUT(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path == "/api/content":
            self.handle_put_content()
            return

        self.send_error(404, "Not found")

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path == "/api/upload":
            self.handle_upload()
            return

        self.send_error(404, "Not found")

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

    def respond_json(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def respond_text(self, message: str, status: int) -> None:
        body = message.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, file_path: Path, content_type: str | None = None) -> None:
        if not file_path.exists() or not file_path.is_file() or not ensure_inside_root(file_path):
            self.send_error(404, "File not found")
            return

        data = file_path.read_bytes()
        guessed_type, _ = mimetypes.guess_type(str(file_path))

        self.send_response(200)
        self.send_header("Content-Type", content_type or guessed_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_static_asset(self, raw_path: str) -> None:
        file_path = PROJECT_ROOT / unquote(raw_path.lstrip("/"))

        if not ensure_inside_root(file_path):
            self.send_error(403, "Forbidden")
            return

        self.serve_file(file_path)

    def handle_get_content(self) -> None:
        if not CONTENT_PATH.exists():
            self.respond_text("Content file does not exist.", 500)
            return

        try:
            payload = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            self.respond_text(f"Content file is invalid JSON: {exc}", 500)
            return

        self.respond_json(payload)

    def handle_put_content(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            self.respond_text(f"Invalid JSON payload: {exc}", 400)
            return

        if not isinstance(payload, dict):
            self.respond_text("Content payload must be a JSON object.", 400)
            return

        CONTENT_PATH.parent.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=CONTENT_PATH.parent, delete=False) as temp_file:
            json.dump(payload, temp_file, indent=2)
            temp_file.write("\n")
            temp_name = temp_file.name

        os.replace(temp_name, CONTENT_PATH)
        self.respond_json({"ok": True})

    def handle_upload(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0") or "0")

        if content_length <= 0:
            self.respond_text("Upload request did not include a file.", 400)
            return

        if content_length > MAX_UPLOAD_BYTES + 1024 * 1024:
            self.respond_text("Image is too large. Maximum upload size is 20 MB.", 413)
            return

        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers.get("Content-Type", ""),
                "CONTENT_LENGTH": str(content_length),
            },
            keep_blank_values=True,
        )

        if "file" not in form:
            self.respond_text("No file field was included in the upload.", 400)
            return

        file_field = form["file"]

        if not getattr(file_field, "file", None):
            self.respond_text("Upload field did not contain a file.", 400)
            return

        filename = Path(file_field.filename or "image").name
        extension = Path(filename).suffix.lower()
        content_type = file_field.type or ""

        if content_type and not content_type.startswith("image/"):
            self.respond_text("Only image uploads are supported.", 400)
            return

        if extension not in ALLOWED_IMAGE_EXTENSIONS:
            guessed_extension = mimetypes.guess_extension(content_type) or ".jpg"
            extension = guessed_extension if guessed_extension in ALLOWED_IMAGE_EXTENSIONS else ".jpg"

        data = file_field.file.read(MAX_UPLOAD_BYTES + 1)

        if not data:
            self.respond_text("The uploaded image was empty.", 400)
            return

        if len(data) > MAX_UPLOAD_BYTES:
            self.respond_text("Image is too large. Maximum upload size is 20 MB.", 413)
            return

        safe_stem = slugify(Path(filename).stem)
        unique_name = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}-{safe_stem}{extension}"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        destination = UPLOAD_DIR / unique_name
        destination.write_bytes(data)

        self.respond_json({"ok": True, "path": f"assets/uploads/{unique_name}"}, status=201)


def main() -> int:
    if len(sys.argv) != 3:
      print("Usage: admin_server.py <host> <port>", file=sys.stderr)
      return 1

    host = sys.argv[1]
    port = int(sys.argv[2])

    server = ThreadingHTTPServer((host, port), AdminHandler)
    print(f"Admin server running on http://{host}:{port}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
