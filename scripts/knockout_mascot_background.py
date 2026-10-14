#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ブランド PNG の端につながった白背景を透過にする。

待ち画面は画像のアルファをマスクに使う。背景が不透明だと四角になる。
再実行しても、四隅が既に透過なら触らない。

実行: python scripts/knockout_mascot_background.py
依存: numpy / scipy（このスクリプトだけ。アプリ実行時は不要）
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "apps" / "web" / "public" / "brand"
# 端の白〜生成時の薄い円（純白からの差）。クリームの毛は残す
EDGE_TOL = 36
# 透過の隣だけ、もう一段薄い縁を落とす
FRINGE_TOL = 64


def _border_median(rgb: np.ndarray) -> np.ndarray:
    border = np.concatenate(
        [rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]],
        axis=0,
    )
    return np.median(border, axis=0)


def _edge_background(near: np.ndarray) -> np.ndarray:
    labeled, _count = ndimage.label(near)
    border_ids = np.unique(
        np.concatenate(
            [
                labeled[0, :],
                labeled[-1, :],
                labeled[:, 0],
                labeled[:, -1],
            ]
        )
    )
    border_ids = border_ids[border_ids != 0]
    if border_ids.size == 0:
        return np.zeros(near.shape, dtype=bool)
    return np.isin(labeled, border_ids)


def knockout(path: Path) -> str:
    image = Image.open(path)
    if image.mode == "RGBA":
        width, height = image.size
        corners = (
            image.getpixel((0, 0))[3],
            image.getpixel((width - 1, 0))[3],
            image.getpixel((0, height - 1))[3],
            image.getpixel((width - 1, height - 1))[3],
        )
        if all(alpha == 0 for alpha in corners):
            image.close()
            return "skip"
    rgb_image = image.convert("RGB")
    image.close()
    rgb = np.asarray(rgb_image, dtype=np.int16)
    bg = _border_median(rgb)
    dist = np.abs(rgb - bg).sum(axis=2)
    background = _edge_background(dist <= EDGE_TOL)
    alpha = np.where(background, 0, 255).astype(np.uint8)
    fringe = (dist <= FRINGE_TOL) & ~background
    neighbor = ndimage.binary_dilation(background) & fringe
    span = max(FRINGE_TOL - EDGE_TOL, 1)
    faded = (255 * (dist - EDGE_TOL) / span).clip(0, 255).astype(np.uint8)
    alpha = np.where(neighbor, faded, alpha)
    out = np.dstack([rgb.astype(np.uint8), alpha])
    Image.fromarray(out, "RGBA").save(path, "PNG", optimize=True)
    opaque = float((alpha == 255).mean())
    if opaque < 0.02 or opaque > 0.9:
        return f"check opaque={opaque:.3f}"
    return "ok"


def main() -> None:
    paths = sorted(BRAND.rglob("*.png"))
    if not paths:
        raise SystemExit(f"PNG がありません: {BRAND}")
    for path in paths:
        status = knockout(path)
        print(f"{status}\t{path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
