"""把自架字型裁到「本站實際用到的字」，輸出一包 public/fonts/zoo-sans-<雜湊>.woff2（Noto Sans TC 可變字型，SIL OFL 1.1）。
來源：tools/web-design 的字型快取（webdesign.fonts，第一次會自動下載原始字型）。所以文字隨時可以加，重跑就補字，不會卡缺字。
用字來源：html／js／css／json 全部文字（不含 pixi）＋ 注音符號。會同時改 style.css 的 FONTS:BEGIN～END 與 index.html 的 preload。
用法：python scripts/build-font.py [--check]    --check 只看有沒有缺字（缺字時退出碼 1）
重跑後要升 ?v=N（index.html 的 style.css 連結）。需要：pip install fonttools brotli"""
import hashlib
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT.parent.parent / "tools" / "web-design"))
from webdesign import fonts  # noqa: E402

PUB = ROOT / "public"
FONTS = PUB / "fonts"
CSS = PUB / "css" / "style.css"
EMOJI = re.compile("[←-⯿〰〽㊗㊙\U0001f000-\U0001faff️‍⃣]")
FONT_BLOCK = re.compile(r"(FONTS:BEGIN.*?\*/)(.*?)(/\*\s*FONTS:END)", re.S)
PRELOAD = re.compile(r'(<link rel="preload" as="font" type="font/woff2" href=")[^"]+(")')


def needed() -> set:
    t = ""
    for ext in ("html", "js", "css", "json"):
        for p in PUB.rglob(f"*.{ext}"):
            if p.name != "pixi.min.js":
                t += p.read_text(encoding="utf-8")
    t += "".join(chr(c) for c in range(0x20, 0x7F)) + "".join(chr(c) for c in range(0x3105, 0x312A)) + "ˊˇˋ˙"
    return {c for c in t if ord(c) >= 0x20 and not EMOJI.match(c)}


def ranges(cps) -> str:
    cps = sorted(cps)
    parts, start = [], cps[0]
    for prev, cur in zip(cps, cps[1:] + [None]):
        if cur != prev + 1:
            parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
            start = cur
    return ",".join(parts)


def main() -> int:
    need = needed()
    cmap = set(TTFont(fonts._source("sans")).getBestCmap())
    skipped = sorted(c for c in need if ord(c) not in cmap)  # 原始字型本身就沒有的字（會退回系統字型）
    use = sorted(c for c in need if ord(c) in cmap)
    if "--check" in sys.argv:
        have = set()
        for f in FONTS.glob("zoo-sans-*.woff2"):
            have |= set(TTFont(f).getBestCmap())
        miss = sorted(c for c in use if ord(c) not in have)
        print(f"字型 {len(list(FONTS.glob('zoo-sans-*.woff2')))} 包；本站用 {len(need)} 字；缺 {len(miss)} 字 {''.join(miss)}；原始字型也沒有 {len(skipped)} 字 {''.join(skipped)}")
        return 1 if miss else 0
    data = fonts.subset_woff2("sans", "".join(use))
    name = f"zoo-sans-{hashlib.sha1(data).hexdigest()[:8]}.woff2"
    for old in FONTS.glob("zoo-sans-*.woff2"):
        old.unlink()
    (FONTS / name).write_bytes(data)
    css = CSS.read_text(encoding="utf-8")
    m = FONT_BLOCK.search(css)
    face = f'@font-face{{font-family:"ZooSans";src:url("/fonts/{name}") format("woff2");font-weight:400 800;font-display:swap;unicode-range:{ranges(ord(c) for c in use)}}}'
    CSS.write_text(css[:m.start(2)] + "\n" + face + "\n" + css[m.end(2):], encoding="utf-8", newline="\n")
    idx = PUB / "index.html"
    idx.write_text(PRELOAD.sub(lambda mm: mm.group(1) + f"/fonts/{name}" + mm.group(2), idx.read_text(encoding="utf-8")), encoding="utf-8", newline="\n")
    print(f"1 包 {len(data) // 1024} KB，用 {len(use)} 字；{name}；原始字型沒有的字：{''.join(skipped) or '無'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
