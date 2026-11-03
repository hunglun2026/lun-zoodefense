"""掃簡體字：網站畫面文字（html／js／css）加動物名字資料。有問題離場碼 1。
判斷方式：用 zhconv 逐字轉成繁體，跟原字不同就是簡體字（不手寫字表，避免誤列兩岸共用字）。
「一簡對多繁」但繁體本來合法的字放白名單。需要：pip install zhconv"""
import sys
from pathlib import Path

from zhconv import convert

ROOT = Path(__file__).resolve().parent.parent
ALWAYS_OK = set("准划占栗虱郁台里后干范岩苧")  # 核准、划算、占用、苗栗、虱目魚、濃郁、台、里、后、干、范、岩、苧麻（都是合法繁體）
SKIP = {"pixi.min.js", "zhuyin.json"}  # 第三方原檔、注音對照（含簡體對照用字）不掃

bad = {}
for ext in ("html", "js", "css", "json"):
    for p in (ROOT / "public").rglob(f"*.{ext}"):
        if p.name in SKIP:
            continue
        for ch in set(p.read_text(encoding="utf-8")):
            if "㐀" <= ch <= "鿿" and ch not in ALWAYS_OK and convert(ch, "zh-tw") != ch:
                bad.setdefault(ch, set()).add(p.name)
if bad:
    for ch, files in sorted(bad.items()):
        print("簡體字？", ch, "→", convert(ch, "zh-tw"), sorted(files))
    sys.exit(1)
print("沒有發現簡體字")
