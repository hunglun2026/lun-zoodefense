// 產生 public/data/animals.json（守護戰出題用的瘦身動物清單）並複製要用的縮圖。
// 資料來源：動物探險家公開 API（臺北市立動物園開放資料）；類別判斷沿用 lun-zoo 的 data.js（只在建置時讀，不放進本站）。
// 只留「有縮圖、名字沒有疑慮」的動物，欄位只有出題要用的。
// 用法：node scripts/build-animals.mjs [--api 網址]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZOO = join(ROOT, "..", "lun-zoo", "public");
const argApi = process.argv.indexOf("--api");
const API = argApi > 0 ? process.argv[argApi + 1] : "https://zoo.hunglun.com/api/animals";

const win = {};
vm.runInNewContext(readFileSync(join(ZOO, "js", "data.js"), "utf8"), { window: win, document: {}, localStorage: {}, fetch: () => {}, Image: class {} });
const Z = win.Zoo;

const res = await fetch(API, { headers: { "User-Agent": "Mozilla/5.0 lun-zoodefense build-animals" } });
if (!res.ok) throw new Error("API 失敗 " + res.status);
const raw = (await res.json()).animals;
const hasThumb = new Set(JSON.parse(readFileSync(join(ZOO, "js", "thumbs.json"), "utf8")));

const out = [];
for (const a of raw) {
  a.pics = a.pics || [];
  a.voices = a.voices || [];
  Z.enrich(a);
  if (a.name_suspect || !hasThumb.has(a.id)) continue;
  out.push({ id: a.id, name_ch: a.nameClean, group: a.group, group_name: a.groupInfo.name, hint: a.groupInfo.hint, emoji: a.groupInfo.emoji });
}
out.sort((x, y) => x.id.localeCompare(y.id));
mkdirSync(join(ROOT, "public", "data"), { recursive: true });
writeFileSync(join(ROOT, "public", "data", "animals.json"), JSON.stringify({ animals: out }), "utf8");

// 縮圖：複製要用的，清掉不用的
const dst = join(ROOT, "public", "img", "thumbs");
mkdirSync(dst, { recursive: true });
const keep = new Set(out.map((a) => a.id + ".webp"));
for (const f of readdirSync(dst)) if (!keep.has(f)) unlinkSync(join(dst, f));
let n = 0;
for (const f of keep) { const s = join(ZOO, "img", "thumbs", f); if (existsSync(s)) { copyFileSync(s, join(dst, f)); n++; } }
console.log(`動物 ${out.length} 種（共 ${raw.length} 筆資料）、縮圖 ${n} 張 → public/data/animals.json`);
