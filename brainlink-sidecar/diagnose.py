from __future__ import annotations

import json
import queue
import subprocess
import threading
from pathlib import Path


def main() -> int:
    exe = Path(__file__).parent / "dist" / "brainlink-bridge.exe"
    if not exe.exists():
        print("Build the sidecar first with build.ps1.")
        return 1

    process = subprocess.Popen(
        [str(exe)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    assert process.stdin is not None
    assert process.stdout is not None

    lines: queue.Queue[str] = queue.Queue()

    def read_stdout() -> None:
        for line in process.stdout:
            lines.put(line.strip())

    threading.Thread(target=read_stdout, daemon=True).start()

    def send(request_id: str, command: str, payload=None) -> None:
        process.stdin.write(
            json.dumps(
                {
                    "id": request_id,
                    "command": command,
                    "payload": payload or {},
                }
            )
            + "\n"
        )
        process.stdin.flush()

    try:
        print(lines.get(timeout=3))

        send("1", "scan")
        print(lines.get(timeout=5))

        send("2", "connect")

        saw_metrics = False
        for _ in range(20):
            try:
                line = lines.get(timeout=1)
            except queue.Empty:
                continue

            print(line)
            if '"type":"metrics"' in line or '"type": "metrics"' in line:
                saw_metrics = True
                break

        if not saw_metrics:
            print(
                "No metrics received within the diagnostic window. "
                "Check pairing, COM ports, and whether another phone/app owns the headset."
            )
            return 2

        return 0
    finally:
        try:
            send("3", "shutdown")
        except Exception:
            pass
        try:
            process.wait(timeout=2)
        except Exception:
            process.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
