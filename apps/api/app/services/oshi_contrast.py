"""推し色のコントラスト選定（WCAG AA 本文 4.5:1 目安）。

Web `oshiContrast.ts` と同ルール。文字色はユーザー選択せず自動。
"""

from __future__ import annotations

import re
from typing import TypedDict

HEX_RE = re.compile(r"^#([0-9A-Fa-f]{6})$")
AA_NORMAL = 4.5

# 固定候補（白／濃色〜95%相当の読みやすいほぼ黒）
FG_WHITE = "#ffffff"
FG_NEAR_BLACK = "#1a1614"

DEFAULT_MAIN_HEX = "#9f606c"
DEFAULT_SUB_HEX = "#6a9bb8"


class ResolvedOshiColors(TypedDict):
    main_hex: str
    sub_hex: str
    main_foreground: str
    soft_bg: str
    soft_foreground: str


def normalize_hex(raw: str) -> str:
    value = (raw or "").strip()
    if not value.startswith("#") and len(value) == 6:
        value = f"#{value}"
    m = HEX_RE.match(value)
    if not m:
        raise ValueError("色の形式が不正です（#RRGGBB）")
    return f"#{m.group(1).lower()}"


def _parse_rgb(hex_color: str) -> tuple[int, int, int]:
    h = normalize_hex(hex_color)[1:]
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _channel_to_linear(c: int) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    r, g, b = _parse_rgb(hex_color)
    return (
        0.2126 * _channel_to_linear(r)
        + 0.7152 * _channel_to_linear(g)
        + 0.0722 * _channel_to_linear(b)
    )


def contrast_ratio(hex_a: str, hex_b: str) -> float:
    l1 = relative_luminance(hex_a)
    l2 = relative_luminance(hex_b)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def mix_hex(hex_a: str, hex_b: str, amount: float) -> str:
    """amount=0 で A、1 で B。"""
    t = max(0.0, min(1.0, amount))
    ar, ag, ab = _parse_rgb(hex_a)
    br, bg, bb = _parse_rgb(hex_b)
    return _to_hex(
        int(round(ar + (br - ar) * t)),
        int(round(ag + (bg - ag) * t)),
        int(round(ab + (bb - ab) * t)),
    )


def _fg_candidates(bg_hex: str) -> list[str]:
    light = mix_hex(bg_hex, FG_WHITE, 0.45)
    dark = mix_hex(bg_hex, FG_NEAR_BLACK, 0.55)
    # 重複除去（順序維持）
    out: list[str] = []
    for c in (FG_WHITE, FG_NEAR_BLACK, light, dark):
        if c not in out:
            out.append(c)
    return out


def best_foreground(bg_hex: str, *, min_ratio: float = AA_NORMAL) -> str:
    bg = normalize_hex(bg_hex)
    scored: list[tuple[float, str]] = []
    for fg in _fg_candidates(bg):
        ratio = contrast_ratio(fg, bg)
        scored.append((ratio, fg))
    scored.sort(key=lambda x: x[0], reverse=True)
    for ratio, fg in scored:
        if ratio >= min_ratio:
            return fg
    # 満たせない場合は最良でも拒否
    raise ValueError("この色では十分なコントラストの文字色を選べません")


def soft_surface(sub_hex: str) -> str:
    """サブ色のやわらかい面（白寄りミックス）。"""
    sub = normalize_hex(sub_hex)
    return mix_hex(FG_WHITE, sub, 0.22)


def resolve_oshi_colors(main_hex: str, sub_hex: str) -> ResolvedOshiColors:
    main = normalize_hex(main_hex)
    sub = normalize_hex(sub_hex)
    main_fg = best_foreground(main)
    soft = soft_surface(sub)
    soft_fg = best_foreground(soft)
    return {
        "main_hex": main,
        "sub_hex": sub,
        "main_foreground": main_fg,
        "soft_bg": soft,
        "soft_foreground": soft_fg,
    }
