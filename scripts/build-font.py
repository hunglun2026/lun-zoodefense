"""把自架字型裁到「本站實際用到的字」。來源是目前 public/fonts 裡的字型包（從 lun-zoo 複製來的 Noto Sans TC 子集，SIL OFL 1.1）。
做法：每一包只留本站用到的字，空的包整個拿掉，檔名帶內容雜湊，重寫 style.css 的 FONTS:BEGIN～END 與 index.html 的 preload。
用字來源：html／js／css 全部文字（不含 pixi）＋ data/animals.json ＋ zhuyin.json ＋ 注音符號。
用法：python scripts/build-font.py [--check]    需要：pip install fonttools brotli
重跑後要升 ?v=N（index.html 的 style.css 連結）。"""
import hashlib
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
FONTS = PUB / "fonts"
CSS = PUB / "css" / "style.css"
EMOJI = re.compile("[←-⯿〰〽㊗㊙\U0001f000-\U0001faff️‍⃣]")


def needed() -> set:
    t = ""
    for ext in ("html", "js", "css", "json"):
        for p in PUB.rglob(f"*.{ext}"):
            if p.name not in ("pixi.min.js",):
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
    need = {ord(c) for c in needed()}
    packs = sorted(FONTS.glob("zoo-sans-*.woff2"))
    have = {}
    for p in packs:
        have[p] = set(TTFont(p).getBestCmap())
    if "--check" in sys.argv:
        allc = set().union(*have.values())
        miss = sorted(need - allc)
        print(f"字型 {len(packs)} 包；本站用 {len(need)} 字；缺 {len(miss)} 字 {''.join(map(chr, miss))}")
        return 1 if miss else 0
    css = CSS.read_text(encoding="utf-8")
    m = re.search(r"(FONTS:BEGIN.*?\*/)(.*?)(/\*\s*FONTS:END)", css, re.S)
    head = re.search(r"@font-face\{([^}]*)\}", m.group(2)).group(1)
    family = re.search(r'font-family:("[^"]+")', head).group(1)
    weight = re.search(r"font-weight:([^;]+);", head).group(1)
    outs, used = [], set()
    for i, p in enumerate(packs):
        keep = (have[p] & need) - used
        used |= keep
        if not keep:
            continue
        font = TTFont(p)
        opt = subset.Options(); opt.flavor = "woff2"; opt.layout_features = ["*"]; opt.notdef_outline = True
        sub = subset.Subsetter(opt); sub.populate(unicodes=sorted(keep)); sub.subset(font)
        tmp = FONTS / f"_tmp{i}.woff2"; font.flavor = "woff2"; font.save(tmp)
        h = hashlib.sha1(tmp.read_bytes()).hexdigest()[:8]
        outs.append((tmp, h, sorted(keep)))
    for p in packs:
        p.unlink()
    faces, first = [], None
    for n, (tmp, h, keep) in enumerate(outs):
        name = f"zoo-sans-{n}-{h}.woff2"
        tmp.rename(FONTS / name)
        first = first or name
        faces.append(f'@font-face{{font-family:{family};src:url("/fonts/{name}") format("woff2");font-weight:{weight};font-display:swap;unicode-range:{ranges(keep)}}}')
    css = css[:m.start(2)] + "\n" + "\n".join(faces) + "\n" + css[m.end(2):]
    CSS.write_text(css, encoding="utf-8", newline="\n")
    idx = PUB / "index.html"
    html = re.sub(r'(<link rel="preload" as="font" type="font/woff2" href=")[^"]+(")', rf"\g<1>/fonts/{first}\g<2>", idx.read_text(encoding="utf-8"))
    idx.write_text(html, encoding="utf-8", newline="\n")
    total = sum((FONTS / f"zoo-sans-{n}-{h}.woff2").stat().st_size for n, (_, h, _) in enumerate(outs))
    print(f"{len(outs)} 包，共 {total // 1024} KB，用 {len(used)} 字；首包 {first}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
