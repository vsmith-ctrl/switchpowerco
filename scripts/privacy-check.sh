#!/usr/bin/env bash
# Fails if the site starts doing something privacy.html says it does not.
# Run locally with: bash scripts/privacy-check.sh
set -u
cd "$(dirname "$0")/.."

fail=0
bad() { echo "FAIL: $1"; fail=1; }

pages=$(ls *.html)
code="$pages $(ls *.js *.css)"

# 1. No request to any other origin. The SVG namespace in charts.js and flow.js
#    is an identifier handed to createElementNS, never fetched.
hits=$(grep -nE '(src|href|srcset|action|poster|data)=["'"'"']?(https?:)?//|url\(["'"'"']?(https?:)?//|@import' $code \
  | grep -vE '(src|href)="https://switchpowerco\.com/' || true)
[ -n "$hits" ] && bad "reference to another origin:"$'\n'"$hits"

# 2. Nothing that collects, stores or sends data from the browser.
hits=$(grep -niE '<form|<input|<textarea|<select|<iframe|<embed|<object|document\.cookie|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|fetch\(|WebSocket|EventSource|navigator\.(geolocation|getBattery|mediaDevices)|serviceWorker' $code || true)
[ -n "$hits" ] && bad "something that collects or sends data:"$'\n'"$hits"

# 3. Every page links the privacy page.
for p in $pages; do
  grep -q 'href="privacy.html"' "$p" || bad "$p does not link privacy.html"
done

# 4. The privacy page keeps the disclosures California's online privacy law
#    (CalOPPA) requires, and has been reviewed within the last year.
for phrase in "Do Not Track" "Global Privacy Control" "If this page changes" "We do not sell personal information" "Last updated"; do
  grep -q "$phrase" privacy.html || bad "privacy.html is missing \"$phrase\""
done
updated=$(grep -oE 'Last updated [0-9]{1,2} [A-Z][a-z]+ [0-9]{4}' privacy.html | sed 's/Last updated //')
if [ -n "$updated" ]; then
  age=$(( ( $(date +%s) - $(date -d "$updated" +%s) ) / 86400 ))
  [ "$age" -gt 365 ] && bad "privacy.html was last updated $updated, more than a year ago. Review it and bump the date."
else
  bad "privacy.html has no readable \"Last updated D Month YYYY\" date"
fi

[ "$fail" -eq 0 ] && echo "Privacy check passed."
exit "$fail"
