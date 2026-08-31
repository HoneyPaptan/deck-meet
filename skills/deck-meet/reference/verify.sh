#!/usr/bin/env bash
set -u

file="${1:-}"
fails=0

pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1"; fails=$((fails + 1)); }

check_zero() {
  local label="$1" pattern="$2"
  if grep -v 'data:font/woff2;base64,' "$file" | grep -qP "$pattern"; then
    fail "$label"
    grep -v 'data:font/woff2;base64,' "$file" | grep -nP "$pattern" | head -5
  else
    pass "$label"
  fi
}

check_has() {
  local label="$1" pattern="$2"
  if grep -qF -e "$pattern" "$file"; then
    pass "$label"
  else
    fail "$label"
  fi
}

if [ -z "$file" ] || [ ! -s "$file" ]; then
  echo "usage: verify.sh <deck.html>"
  exit 2
fi

check_zero "no unfilled {{slots}}" '\{\{'
check_zero "no surviving data-example blocks" 'data-example'
check_zero "no TODO or TBD or lorem" 'TODO|TBD|[Ll]orem ipsum'
check_zero "no img or iframe tags" '<img[ >]|<iframe[ >]'
check_zero "no emoji" '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]'
check_zero "no dash characters in text" '\x{2013}|\x{2014}'
check_zero "no hex colors outside theme block" '^(?!.*--).*#[0-9a-fA-F]{3,8}\b'

externals=$(grep -oP '(src|href)="https?://[^"]+' "$file" || true)
if [ -n "$externals" ]; then
  fail "no external resources, deck is fully offline"
  echo "$externals" | head -5
else
  pass "no external resources, deck is fully offline"
fi

check_has "fonts embedded as data URIs" "data:font/woff2;base64,"
check_has "theme.css embedded" "--dm-theme-v1"
check_has "base.css embedded" "--dm-base-v1"
check_has "runtime.js embedded" "dm-runtime-v1"
check_has "toolbar present" 'class="toolbar"'
check_has "print styles present" "@media print"

h1s=$(grep -c '<h1' "$file")
[ "$h1s" -eq 1 ] && pass "exactly one h1" || fail "exactly one h1 (found $h1s)"

slides=$(grep -c 'class="slide' "$file")
[ "$slides" -ge 3 ] && pass "at least 3 slides ($slides)" || fail "at least 3 slides (found $slides)"

svgs=$(grep -c '<svg' "$file")
labelled=$(grep -c '<svg[^>]*role="img"[^>]*aria-label' "$file")
[ "$svgs" -eq "$labelled" ] && pass "every svg has role and aria-label ($svgs)" || fail "every svg has role and aria-label ($labelled of $svgs)"

figures=$(grep -c '<figure' "$file")
captions=$(grep -c '<figcaption' "$file")
[ "$figures" -eq "$captions" ] && pass "every figure captioned ($figures)" || fail "every figure captioned ($captions of $figures)"

sections=$(grep -c '<section class="slide' "$file")
arias=$(grep -c '<section class="slide[^>]*aria-label' "$file")
[ "$sections" -eq "$arias" ] && pass "every slide has aria-label" || fail "every slide has aria-label ($arias of $sections)"

if [ "$svgs" -gt 0 ]; then
  motion=$(grep -cE 'class="[^"]*(packet|flow|draw|pulse|pop)' "$file")
  [ "$motion" -ge 1 ] && pass "motion primitives present ($motion)" || fail "svgs present but zero motion primitives"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "ALL CHECKS PASS"
  exit 0
else
  echo "$fails CHECK(S) FAILED"
  exit 1
fi
