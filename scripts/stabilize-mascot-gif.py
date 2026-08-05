#!/usr/bin/env python3
"""Build the stabilized animated mascot GIF from the original source."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageSequence

SOURCE = Path("assets/mascot-logo-source.gif")
OUTPUT = Path("assets/mascot-logo.gif")

# Offsets found by alpha-mask correlation against frame 0.
# They cancel the source GIF's horizontal jumps while preserving its animation.
FRAME_X_OFFSETS = (0, -4, -46, -6, 0, -2, 0)


def shifted_frame(frame: Image.Image, reference: Image.Image, dx: int) -> Image.Image:
    width, height = frame.size
    result = Image.new("RGBA", frame.size, (0, 0, 0, 0))

    src_left = max(0, -dx)
    src_right = min(width, width - dx)
    dest_left = max(0, dx)

    if src_right > src_left:
        crop = frame.crop((src_left, 0, src_right, height))
        result.alpha_composite(crop, (dest_left, 0))

    # The extreme source frame is clipped at the right canvas edge.
    # Restore only the newly exposed strip from the stable reference frame.
    if dx < 0:
        edge = width + dx
        result.alpha_composite(reference.crop((edge, 0, width, height)), (edge, 0))
    elif dx > 0:
        result.alpha_composite(reference.crop((0, 0, dx, height)), (0, 0))

    return result


def main() -> None:
    source = Image.open(SOURCE)
    frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]

    if len(frames) != len(FRAME_X_OFFSETS):
        raise SystemExit(
            f"Expected {len(FRAME_X_OFFSETS)} frames, found {len(frames)} in {SOURCE}"
        )

    size = frames[0].size
    if size != (320, 540):
        raise SystemExit(f"Expected a 320x540 source GIF, found {size}")

    durations = [
        frame.info.get("duration", source.info.get("duration", 100))
        for frame in ImageSequence.Iterator(source)
    ]
    reference = frames[0]
    stabilized = [
        shifted_frame(frame, reference, dx)
        for frame, dx in zip(frames, FRAME_X_OFFSETS, strict=True)
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    stabilized[0].save(
        OUTPUT,
        save_all=True,
        append_images=stabilized[1:],
        duration=durations,
        loop=source.info.get("loop", 0),
        disposal=2,
        optimize=False,
        transparency=0,
    )


if __name__ == "__main__":
    main()
