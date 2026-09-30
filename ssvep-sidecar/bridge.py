"""KNeuron SSVEP classifier sidecar.

stdin/stdout protocol:
  request:  {"id":"...", "command":"classify", "payload":{...}}
  response: {"type":"response","id":"...","ok":true,"result":{...}}

stdout is protocol-only. Diagnostics go to stderr.
"""

from __future__ import annotations

import json
import sys
from typing import Any

import numpy as np

from fbcca import fbcca_predict

PROTOCOL_VERSION = 1


def emit(message: dict[str, Any]) -> None:
    sys.stdout.write(
        json.dumps(
            message,
            separators=(",", ":"),
            allow_nan=False,
        )
        + "\n"
    )
    sys.stdout.flush()


def respond_ok(
    request_id: str,
    result: Any,
) -> None:
    emit(
        {
            "type": "response",
            "id": request_id,
            "ok": True,
            "result": result,
        }
    )


def respond_error(
    request_id: str,
    error: Exception,
) -> None:
    emit(
        {
            "type": "response",
            "id": request_id,
            "ok": False,
            "error": str(error),
        }
    )


def classify(payload: dict[str, Any]) -> dict[str, Any]:
    eeg = np.asarray(
        payload.get("eeg"),
        dtype=np.float64,
    )

    fs = float(
        payload.get("sampleRateHz")
    )

    frequencies = [
        float(value)
        for value in payload.get(
            "frequencies",
            [],
        )
    ]

    if len(frequencies) != 4:
        raise ValueError(
            "TaaLON classifier expects exactly four target frequencies."
        )

    winner_hz, scores = fbcca_predict(
        eeg=eeg,
        target_frequencies=frequencies,
        fs=fs,
    )

    return {
        "winnerHz": float(winner_hz),
        "scores": {
            str(float(frequency)): float(score)
            for frequency, score in zip(
                frequencies,
                scores,
            )
        },
        "sampleRateHz": fs,
        "channelCount": int(
            eeg.shape[0]
        ),
        "sampleCount": int(
            eeg.shape[1]
        ),
    }


def handle(
    request: dict[str, Any],
) -> bool:
    request_id = str(
        request.get("id", "")
    )

    command = str(
        request.get("command", "")
    )

    payload = (
        request.get("payload")
        or {}
    )

    try:
        if command == "ping":
            respond_ok(
                request_id,
                {
                    "protocolVersion":
                        PROTOCOL_VERSION,
                },
            )

        elif command == "classify":
            respond_ok(
                request_id,
                classify(payload),
            )

        elif command == "shutdown":
            respond_ok(
                request_id,
                {
                    "shutdown": True,
                },
            )
            return False

        else:
            raise RuntimeError(
                f'Unknown SSVEP command "{command}".'
            )

    except Exception as exc:
        respond_error(
            request_id,
            exc,
        )

    return True


def main() -> None:
    emit(
        {
            "type": "ready",
            "protocolVersion":
                PROTOCOL_VERSION,
        }
    )

    for raw_line in sys.stdin:
        line = raw_line.strip()

        if not line:
            continue

        try:
            request = json.loads(
                line
            )

            if not isinstance(
                request,
                dict,
            ):
                raise ValueError(
                    "Protocol request must be a JSON object."
                )

        except Exception as exc:
            print(
                f"Invalid protocol input: {exc}",
                file=sys.stderr,
                flush=True,
            )
            continue

        if not handle(request):
            break


if __name__ == "__main__":
    main()
