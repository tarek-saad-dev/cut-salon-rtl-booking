"""Regenerate static hero assets with Pillow 10.2 (python3 + Pillow required)."""
from pathlib import Path
from PIL import Image

for name, widths in [("hero", (1280, 1920)), ("hero_vertical", (480, 960))]:
    image = Image.open(f"public/{name}.png").convert("RGB")
    print(name, image.size)
    for width in widths:
        width = min(width, image.width)
        resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        path = Path(f"public/{name}-{width}.webp")
        resized.save(path, "WEBP", quality=82, method=6)
        print(path, path.stat().st_size)
