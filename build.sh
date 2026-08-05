#!/usr/bin/env bash
# Artifact용 원본(head 태그 없음)을 GitHub Pages용 독립 HTML로 감싼다.
#   사용법: ./build.sh [원본경로]
set -euo pipefail

SRC="${1:-$HOME/Library/Caches/gads-sim-source.html}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS="$OUT_DIR/docs"

[ -f "$SRC" ] || { echo "원본을 찾을 수 없습니다: $SRC" >&2; exit 1; }

mkdir -p "$DOCS"

# <style> 블록이 끝나는 줄을 찾아 head / body 로 자른다
SPLIT=$(grep -n '^</style>$' "$SRC" | head -1 | cut -d: -f1)
[ -n "$SPLIT" ] || { echo "</style> 경계를 찾지 못했습니다." >&2; exit 1; }

{
  cat <<'HEAD'
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Google Ads 검색 캠페인 실습 시뮬레이터 — 브랜드 정보를 입력하고 캠페인을 게재하면 30일치 성과가 시뮬레이션되고 진단과 CSV 보고서가 나옵니다.">
<meta name="robots" content="noindex">
HEAD
  sed -n "1,${SPLIT}p" "$SRC"
  echo '</head>'
  echo '<body>'
  sed -n "$((SPLIT+1)),\$p" "$SRC"
  echo '</body>'
  echo '</html>'
} > "$DOCS/index.html"

touch "$DOCS/.nojekyll"

echo "생성: $DOCS/index.html  ($(wc -c < "$DOCS/index.html" | tr -d ' ') bytes)"
echo "생성: $DOCS/.nojekyll"
