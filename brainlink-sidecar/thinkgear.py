from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

SYNC = 0xAA
EXCODE = 0x55
MAX_PAYLOAD_LENGTH = 169

POOR_SIGNAL = 0x02
ATTENTION = 0x04
MEDITATION = 0x05
BLINK_STRENGTH = 0x16
RAW_EEG = 0x80
ASIC_EEG_POWER = 0x83

EEG_POWER_BANDS = (
    "delta",
    "theta",
    "lowAlpha",
    "highAlpha",
    "lowBeta",
    "highBeta",
    "lowGamma",
    "highGamma",
)


@dataclass(frozen=True)
class ParsedPacket:
    values: dict[str, object]


class ThinkGearParser:
    """Incremental parser for NeuroSky ThinkGear binary packets.

    Packet framing follows the ThinkGear Communications Protocol:

        AA AA PLENGTH PAYLOAD CHECKSUM

    The parser is deliberately independent from Macrotellect's proprietary
    SDK so KNeuron can read the BrainLink Lite through the serial Bluetooth
    link using pyserial only.
    """

    def __init__(self) -> None:
        self._buffer = bytearray()

    def reset(self) -> None:
        self._buffer.clear()

    def feed(self, data: bytes | bytearray | memoryview) -> list[ParsedPacket]:
        if data:
            self._buffer.extend(data)

        packets: list[ParsedPacket] = []

        while True:
            start = self._find_sync()
            if start < 0:
                # Keep one trailing AA in case it is the first sync byte of
                # the next chunk.
                if self._buffer and self._buffer[-1] == SYNC:
                    self._buffer[:] = self._buffer[-1:]
                else:
                    self._buffer.clear()
                break

            if start > 0:
                del self._buffer[:start]

            if len(self._buffer) < 3:
                break

            payload_length = self._buffer[2]

            if payload_length > MAX_PAYLOAD_LENGTH:
                # Invalid frame. Drop one byte and resynchronize instead of
                # trusting the malformed length.
                del self._buffer[0]
                continue

            frame_length = 3 + payload_length + 1
            if len(self._buffer) < frame_length:
                break

            payload = bytes(self._buffer[3 : 3 + payload_length])
            checksum = self._buffer[3 + payload_length]

            if self._checksum_is_valid(payload, checksum):
                values = self._parse_payload(payload)
                packets.append(ParsedPacket(values=values))
                del self._buffer[:frame_length]
                continue

            # Corrupted frame: discard the first sync byte only, then scan
            # again. This recovers quickly from a dropped byte.
            del self._buffer[0]

        return packets

    def _find_sync(self) -> int:
        limit = len(self._buffer) - 1
        for index in range(max(0, limit)):
            if self._buffer[index] == SYNC and self._buffer[index + 1] == SYNC:
                return index
        return -1

    @staticmethod
    def _checksum_is_valid(payload: bytes, checksum: int) -> bool:
        expected = (~(sum(payload) & 0xFF)) & 0xFF
        return checksum == expected

    def _parse_payload(self, payload: bytes) -> dict[str, object]:
        values: dict[str, object] = {}
        index = 0

        while index < len(payload):
            extended_code_level = 0
            while index < len(payload) and payload[index] == EXCODE:
                extended_code_level += 1
                index += 1

            if index >= len(payload):
                break

            code = payload[index]
            index += 1

            if code < 0x80:
                if index >= len(payload):
                    break
                value_bytes = payload[index : index + 1]
                index += 1
            else:
                if index >= len(payload):
                    break
                value_length = payload[index]
                index += 1
                if index + value_length > len(payload):
                    break
                value_bytes = payload[index : index + value_length]
                index += value_length

            # KNeuron currently consumes only standard (EXCODE level 0)
            # ThinkGear rows. Unknown/extended rows are safely ignored.
            if extended_code_level != 0:
                continue

            self._decode_row(code, value_bytes, values)

        return values

    @staticmethod
    def _decode_row(code: int, value_bytes: bytes, values: dict[str, object]) -> None:
        if code == POOR_SIGNAL and len(value_bytes) == 1:
            values["poorSignalLevel"] = int(value_bytes[0])
            return

        if code == ATTENTION and len(value_bytes) == 1:
            values["attention"] = int(value_bytes[0])
            return

        if code == MEDITATION and len(value_bytes) == 1:
            values["meditation"] = int(value_bytes[0])
            return

        if code == BLINK_STRENGTH and len(value_bytes) == 1:
            values["blinkStrength"] = int(value_bytes[0])
            return

        if code == RAW_EEG and len(value_bytes) == 2:
            values["rawEeg"] = int.from_bytes(value_bytes, byteorder="big", signed=True)
            return

        if code == ASIC_EEG_POWER and len(value_bytes) == 24:
            powers: dict[str, int] = {}
            for band_index, band_name in enumerate(EEG_POWER_BANDS):
                start = band_index * 3
                powers[band_name] = int.from_bytes(
                    value_bytes[start : start + 3],
                    byteorder="big",
                    signed=False,
                )
            values["eegPower"] = powers


def build_packet(payload: Iterable[int]) -> bytes:
    """Small helper used by the parser self-tests."""

    payload_bytes = bytes(payload)
    if len(payload_bytes) > MAX_PAYLOAD_LENGTH:
        raise ValueError("ThinkGear payload is too long.")

    checksum = (~(sum(payload_bytes) & 0xFF)) & 0xFF
    return bytes((SYNC, SYNC, len(payload_bytes))) + payload_bytes + bytes((checksum,))
