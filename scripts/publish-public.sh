#!/usr/bin/env bash
# 從 lun-plant 的 publish-public.sh 改來（zoodefense 沒有 src、tests、data，是純靜態站）。
# 把網站資料夾的「公開部分」同步到 project.yaml 的「發布repo」（白名單複製、掃機密、推 main），由 GitHub Actions 部署。
# 不公開：進度.md、學習筆記.md、.prod.secrets。
# 用法：bash scripts/publish-public.sh "commit 訊息"
# 憑證：steve0802\gh-tokens.txt 的「<憑證名稱>-workflow」那把（能推 .github/workflows）。repo 要先建好。
set -euo pipefail
MSG="${1:-更新}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
conf() { grep "^$1:" "$SRC/project.yaml" | head -1 | sed -E "s/^$1:[[:space:]]*//; s/[[:space:]]+#.*$//" | tr -d '\r'; }
REPO="$(conf 發布repo)"
KEY="$(conf 憑證名稱)"
[ -n "$REPO" ] && [ -n "$KEY" ] || { echo "project.yaml 缺「發布repo」或「憑證名稱」"; exit 1; }
STG="$(mktemp -d)"
trap 'rm -rf "$STG"' EXIT
PAT="$(grep "^${KEY}-workflow=" /d/ClaudeOnly/steve0802/gh-tokens.txt | cut -d= -f2- | tr -d '\r\n ')"
B64="$(printf 'x-access-token:%s' "$PAT" | base64 -w0)"
GIT_AUTH=(-c "http.https://github.com/.extraheader=AUTHORIZATION: basic $B64")

git "${GIT_AUTH[@]}" clone -q "https://github.com/$REPO.git" "$STG/repo"
cd "$STG/repo"
git ls-files | xargs -r rm -f
cd "$SRC"
cp -r public .github package.json package-lock.json wrangler.jsonc project.yaml .gitignore "$STG/repo/"
[ -f README.md ] && cp README.md "$STG/repo/"
mkdir -p "$STG/repo/scripts"
cp scripts/*.sh scripts/*.ts scripts/*.mjs scripts/*.py "$STG/repo/scripts/"
cp -r scripts/e2e "$STG/repo/scripts/" 2>/dev/null || true
find "$STG/repo" -name __pycache__ -prune -exec rm -rf {} +

# 掃機密：本專案密鑰、Cloudflare／GitHub token
python -X utf8 - "$STG/repo" "$SRC" <<'PYEOF'
import json,os,re,sys
root,src=sys.argv[1],sys.argv[2]
vals=[]
p=os.path.join(src,'.prod.secrets')
if os.path.exists(p): vals+=list(json.load(open(p,encoding='utf-8')).values())
for f in ('cf-tokens.txt','gh-tokens.txt'):
    for l in open(os.path.join(r'D:\ClaudeOnly\steve0802',f),encoding='utf-8'):
        if '=' in l and not l.startswith('#'): vals.append(l.split('=',1)[1].strip())
vals=[v for v in vals if len(v)>=12]
hit=0
for d,_,fs in os.walk(root):
    if '.git' in d.split(os.sep): continue
    for fn in fs:
        if fn.endswith(('.webp','.woff2','.png','.jpg')): continue
        q=os.path.join(d,fn); t=open(q,encoding='utf-8',errors='ignore').read()
        if any(v in t for v in vals) or re.search('(' + 'gh' + 'p_|github' + '_pat_)',t): print('機密命中',q); hit+=1
print('機密掃描：命中',hit); sys.exit(1 if hit else 0)
PYEOF

cd "$STG/repo"
git config user.name "${REPO%%/*}"; git config user.email "${REPO%%/*}@gmail.com"
git add -A
if git diff --cached --quiet; then echo "沒有變更，不推送"; exit 0; fi
git commit -q -m "$MSG"
git "${GIT_AUTH[@]}" push -q origin HEAD:main
echo "已推送 $REPO：$(git rev-parse --short HEAD) $MSG"
