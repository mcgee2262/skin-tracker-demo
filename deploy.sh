#!/bin/bash
# Build the demo and publish it to the gh-pages branch (GitHub Pages serves that branch).
set -e
cd "$(dirname "$0")"
npm run build
TMP=$(mktemp -d)
cp -R dist/. "$TMP"/
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -qm "Deploy demo"
git push -f "$(cd - >/dev/null && git remote get-url origin)" gh-pages
echo "Live at https://mcgee2262.github.io/skin-tracker-demo/"
