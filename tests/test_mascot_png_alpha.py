"""待ちのシルエットに使う PNG は端が透過している。白べただと四角になる。"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "apps" / "web" / "public" / "brand"


def _silhouette_sources() -> list[Path]:
    paths = [BRAND / "logo.png"]
    for path in BRAND.rglob("*.png"):
        if "loading" in path.name or path.name in {"face.png", "face_sm.png", "idle.png"}:
            paths.append(path)
    return sorted(set(paths))


def test_silhouette_png_corners_are_transparent() -> None:
    failures: list[str] = []
    sources = _silhouette_sources()
    assert sources, "シルエット用 PNG が見つかりません"
    for path in sources:
        with Image.open(path) as image:
            relative = path.relative_to(ROOT).as_posix()
            if image.mode != "RGBA":
                failures.append(f"{relative} mode={image.mode}")
                continue
            width, height = image.size
            for point in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
                alpha = image.getpixel(point)[3]
                if alpha != 0:
                    failures.append(f"{relative} corner {point} alpha={alpha}")
                    break
    assert failures == [], failures
