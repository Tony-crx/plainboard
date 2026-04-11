#!/bin/bash

# ===== CONFIG =====
IGNORE_DIRS=("node_modules" "dist" "build")
IGNORE_EXTS=("log" "tmp")

TARGET="${1:-.}"
TOTAL_LINES=0
TOTAL_WORDS=0
TOTAL_CHARS=0

# Estimasi token (kasar: 1 token ≈ 4 chars)
estimate_tokens() {
  echo $(( $1 / 4 ))
}

contains() {
  local item="$1"
  shift
  for e in "$@"; do
    [[ "$e" == "$item" ]] && return 0
  done
  return 1
}

count_file() {
  local file="$1"
  local ext="${file##*.}"

  # skip extension
  if contains "$ext" "${IGNORE_EXTS[@]}"; then
    return
  fi

  if [[ -f "$file" ]]; then
    read -r lines words chars < <(wc -l -w -c < "$file")

    TOTAL_LINES=$((TOTAL_LINES + lines))
    TOTAL_WORDS=$((TOTAL_WORDS + words))
    TOTAL_CHARS=$((TOTAL_CHARS + chars))
  fi
}

# ===== MAIN =====

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[INFO] Using git tracked files (.gitignore respected)"

  while IFS= read -r file; do
    count_file "$file"
  done < <(git ls-files "$TARGET")
else
  echo "[INFO] Not a git repo, fallback to find"

  while IFS= read -r -d '' file; do
    count_file "$file"
  done < <(find "$TARGET" -type f \
    $(printf "! -path %s/* " "${IGNORE_DIRS[@]}") \
    -print0)
fi

TOKENS=$(estimate_tokens "$TOTAL_CHARS")

echo "=============================="
echo "📊 Code Statistics"
echo "=============================="
echo "Lines   : $TOTAL_LINES"
echo "Words   : $TOTAL_WORDS"
echo "Chars   : $TOTAL_CHARS"
echo "Tokens~ : $TOKENS (approx)"
echo "=============================="