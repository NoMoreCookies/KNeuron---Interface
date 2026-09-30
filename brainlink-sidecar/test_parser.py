from __future__ import annotations

import unittest

from thinkgear import build_packet, ThinkGearParser


class ThinkGearParserTests(unittest.TestCase):
    def test_parses_esense_packet(self) -> None:
        # Equivalent to the standard ThinkGear example shape:
        # poor signal + attention + meditation.
        packet = build_packet(
            [
                0x02,
                0x20,
                0x04,
                0x12,
                0x05,
                0x60,
            ]
        )

        parsed = ThinkGearParser().feed(packet)

        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0].values["poorSignalLevel"], 32)
        self.assertEqual(parsed[0].values["attention"], 18)
        self.assertEqual(parsed[0].values["meditation"], 96)

    def test_parses_raw_signed_value(self) -> None:
        packet = build_packet([0x80, 0x02, 0xFF, 0x9C])  # -100
        parsed = ThinkGearParser().feed(packet)
        self.assertEqual(parsed[0].values["rawEeg"], -100)

    def test_parses_eeg_power(self) -> None:
        power_bytes = []
        for value in range(1, 9):
            power_bytes.extend(value.to_bytes(3, byteorder="big"))

        packet = build_packet([0x83, 0x18, *power_bytes])
        parsed = ThinkGearParser().feed(packet)
        power = parsed[0].values["eegPower"]

        self.assertEqual(power["delta"], 1)
        self.assertEqual(power["highGamma"], 8)

    def test_recovers_after_noise(self) -> None:
        packet = build_packet([0x04, 77])
        parser = ThinkGearParser()

        first = parser.feed(b"\x01\x02\x03\xAA")
        second = parser.feed(packet)

        self.assertEqual(first, [])
        self.assertEqual(second[0].values["attention"], 77)


if __name__ == "__main__":
    unittest.main()
