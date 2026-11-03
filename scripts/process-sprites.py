"""把 Gemini 生的角色圖（純白底）處理成遊戲用的透明小圖。
做法：從四邊往內，把「接近白色且與邊界相連」的像素變透明（角色有深色描邊，內部的白毛不會被吃掉），
邊緣做一點羽化，裁到內容外框，補成正方形，縮成 256px 的 webp。
用法：python scripts/process-sprites.py <原圖資料夾> [輸出資料夾]    預設輸出 public/img/sprites
原圖檔名：tower_<塔代號>.png、enemy_<敵人代號>.png"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "public" / "img" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 256
THRESH = 236  # 三個色版都大於這個值才算背景白


def process(p: Path) -> Path:
    im = Image.open(p).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    bg = (a[..., 0] > THRESH) & (a[..., 1] > THRESH) & (a[..., 2] > THRESH)
    h, w = bg.shape
    seen = np.zeros_like(bg)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    alpha = Image.fromarray(np.where(seen, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 0 if v < 40 else (255 if v > 215 else v))
    rgba = im.convert("RGBA"); rgba.putalpha(alpha)
    box = rgba.getbbox()
    rgba = rgba.crop(box)
    s = max(rgba.size); pad = round(s * 0.04)
    sq = Image.new("RGBA", (s + pad * 2, s + pad * 2), (0, 0, 0, 0))
    sq.paste(rgba, ((sq.width - rgba.width) // 2, (sq.height - rgba.height) // 2))
    sq = sq.resize((SIZE, SIZE), Image.LANCZOS)
    out = OUT / (p.stem.replace("trial_", "") + ".webp")
    sq.save(out, "WEBP", quality=85, method=6)
    return out


for f in sorted(SRC.glob("*.png")):
    o = process(f)
    print(f"{f.name} -> {o.name} {o.stat().st_size // 1024} KB")
